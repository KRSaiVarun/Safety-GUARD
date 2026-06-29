"""
Safety-GUARD Notification Proxy — Twilio WhatsApp + Socket.IO GPS relay
"""
import asyncio
import logging
import os
import sys

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(message)s',
    stream=sys.stdout,
    force=True,
)
log = logging.getLogger('NOTIFY')

# ─── Twilio config ────────────────────────────────────────────────────────────
TWILIO_SANDBOX_FROM = '+14155238886'

TWILIO_SID   = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
EMERGENCY_TO = os.getenv('EMERGENCY_CONTACT_PHONE', '')
PORT         = int(os.getenv('NOTIFY_PORT', '8000'))

_raw_from = os.getenv('TWILIO_WHATSAPP_NUMBER', '').strip()


def _normalise(number: str) -> str:
    n = number.strip()
    if n.startswith('whatsapp:'):
        n = n[len('whatsapp:'):]
    n = n.strip()
    if not n.startswith('+'):
        n = '+' + n
    return 'whatsapp:' + n


def _looks_like_twilio_sender(raw: str) -> bool:
    n = raw.strip().lstrip('whatsapp:').strip()
    if not n.startswith('+'):
        return False
    digits = n[1:]
    if digits == '14155238886':
        return True
    if len(digits) < 10:
        return False
    return True


if _raw_from and _looks_like_twilio_sender(_raw_from):
    FROM_WA = _normalise(_raw_from)
    log.info('[CONFIG] Twilio FROM (custom): %s', FROM_WA)
else:
    if _raw_from:
        log.warning(
            '[CONFIG] TWILIO_WHATSAPP_NUMBER="%s" is not a valid Twilio WhatsApp sender. '
            'Falling back to sandbox: %s.',
            _raw_from, TWILIO_SANDBOX_FROM
        )
    FROM_WA = _normalise(TWILIO_SANDBOX_FROM)

if EMERGENCY_TO:
    TO_WA = _normalise(EMERGENCY_TO)
    log.info('[CONFIG] Emergency TO: %s', TO_WA)
else:
    TO_WA = ''
    log.warning('[CONFIG] EMERGENCY_CONTACT_PHONE not set — alerts need phone per request.')

log.info('[CONFIG] Twilio SID configured: %s', bool(TWILIO_SID))

# ─── Socket.IO server ─────────────────────────────────────────────────────────
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False,
)


@sio.event
async def connect(sid, environ, auth=None):
    log.info('[SOCKET] Client connected: %s', sid)


@sio.event
async def disconnect(sid):
    log.info('[SOCKET] Client disconnected: %s', sid)


@sio.on('join-room')
async def handle_join_room(sid, room):
    await sio.enter_room(sid, room)
    log.info('[SOCKET] %s joined room: %s', sid, room)


@sio.on('LOCATION_UPDATED')
async def handle_location_updated(sid, data):
    lat = data.get('lat') or data.get('latitude')
    lng = data.get('lng') or data.get('longitude')
    log.info('[GPS] Relay lat=%.5f lng=%.5f → dashboard room', lat or 0, lng or 0)
    await sio.emit('LOCATION_UPDATED', data, room='dashboard', skip_sid=sid)


@sio.on('EMERGENCY_TRIGGERED')
async def handle_emergency_triggered(sid, data):
    log.info('[SOCKET] Emergency triggered: session=%s', data.get('sessionId'))
    await sio.emit('EMERGENCY_TRIGGERED', data, room='dashboard')


@sio.on('SESSION_ENDED')
async def handle_session_ended(sid, data):
    log.info('[SOCKET] Session ended: session=%s', data.get('sessionId'))
    await sio.emit('SESSION_ENDED', data, room='dashboard')


# ─── FastAPI app ──────────────────────────────────────────────────────────────
_app = FastAPI(title='Safety-GUARD Notification Proxy')
_app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)


class AlertRequest(BaseModel):
    latitude:  Optional[float] = None
    longitude: Optional[float] = None
    phone:     Optional[str]   = None
    trigger:   Optional[str]   = 'PANIC BUTTON'


class SafeRequest(BaseModel):
    phone: Optional[str] = None


@_app.get('/health')
def health():
    configured = bool(TWILIO_SID and TWILIO_TOKEN)
    log.info('[HEALTH] twilio_configured=%s  from=%s  to=%s', configured, FROM_WA, TO_WA)
    return {
        'status':            'ok',
        'twilio_configured': configured,
        'socket_io':         True,
        'from':              FROM_WA,
        'to':                TO_WA,
    }


@_app.post('/alert/whatsapp')
async def send_whatsapp(req: AlertRequest):
    if not TWILIO_SID or not TWILIO_TOKEN:
        log.error('[TWILIO] Credentials missing')
        return {'ok': False, 'error': 'Twilio credentials not configured', 'sid': None}

    latitude  = req.latitude
    longitude = req.longitude
    trigger   = (req.trigger or 'PANIC BUTTON').upper()

    if latitude is not None and longitude is not None:
        maps_link = f'https://www.google.com/maps?q={latitude},{longitude}'
        log.info('[GPS] lat=%s  lng=%s', latitude, longitude)
    else:
        maps_link = 'https://www.google.com/maps'
        log.warning('[GPS] No coordinates — using fallback link')

    message_body = (
        f'🚨 WOMEN SAFETY PROTOCOL ACTIVATED 🚨\n\n'
        f'🚨 Emergency triggered via: {trigger}\n\n'
        f'📍 LIVE LOCATION:\n{maps_link}\n\n'
        f'📡 Real-time GPS tracking enabled.\n'
        f'Please respond immediately or contact authorities.\n\n'
        f'— Women Safety Protocol'
    )

    if req.phone:
        to_number = _normalise(req.phone)
    elif TO_WA:
        to_number = TO_WA
    else:
        log.error('[TWILIO] No destination phone number')
        return {'ok': False, 'error': 'No emergency contact phone configured', 'sid': None}

    log.info('[TWILIO] Sending  from=%s  to=%s', FROM_WA, to_number)

    try:
        from twilio.rest import Client
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        msg = await asyncio.to_thread(
            client.messages.create,
            body=message_body,
            from_=FROM_WA,
            to=to_number,
        )
        log.info('[TWILIO] ✅ Sent  sid=%s  status=%s', msg.sid, msg.status)
        return {'ok': True, 'sid': msg.sid, 'status': msg.status, 'maps_link': maps_link}

    except Exception as exc:
        err = str(exc)
        log.error('[TWILIO] ❌ Failed: %s', err)
        if '63007' in err:
            hint = (
                f'Twilio error 63007 — FROM address {FROM_WA} is not a valid WhatsApp sender. '
                'Set TWILIO_WHATSAPP_NUMBER=+14155238886 for sandbox or your approved number.'
            )
            return {'ok': False, 'error': hint, 'sid': None}
        return {'ok': False, 'error': err, 'sid': None}


@_app.post('/alert/safe')
async def send_safe(req: SafeRequest):
    if not TWILIO_SID or not TWILIO_TOKEN:
        return {'ok': False, 'error': 'Twilio credentials not configured', 'sid': None}

    message_body = (
        '✅ USER MARKED SAFE\n\n'
        'The emergency has been resolved.\n'
        'Tracking session closed.\n\n'
        '— Women Safety Protocol'
    )

    if req.phone:
        to_number = _normalise(req.phone)
    elif TO_WA:
        to_number = TO_WA
    else:
        return {'ok': False, 'error': 'No emergency contact phone configured', 'sid': None}

    log.info('[TWILIO] Sending SAFE notification  to=%s', to_number)

    try:
        from twilio.rest import Client
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        msg = await asyncio.to_thread(
            client.messages.create,
            body=message_body,
            from_=FROM_WA,
            to=to_number,
        )
        log.info('[TWILIO] ✅ Safe sent  sid=%s', msg.sid)
        return {'ok': True, 'sid': msg.sid, 'status': msg.status}

    except Exception as exc:
        log.error('[TWILIO] ❌ Safe failed: %s', exc)
        return {'ok': False, 'error': str(exc), 'sid': None}


# ─── Combined ASGI: Socket.IO wraps FastAPI ───────────────────────────────────
# Workflow command: python -m uvicorn backend.notify:app --host 0.0.0.0 --port 8000
app = socketio.ASGIApp(sio, other_asgi_app=_app)


if __name__ == '__main__':
    import uvicorn
    log.info('🚀 Starting Safety-GUARD notify + Socket.IO on port %d', PORT)
    uvicorn.run('notify:app', host='0.0.0.0', port=PORT, reload=False)
