"""
Safety-GUARD Notification Proxy — Twilio WhatsApp
Minimal FastAPI server, no database required.
Sends WhatsApp messages via Twilio with live GPS coordinates.
"""
import asyncio
import logging
import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [ALERT] %(message)s',
    stream=sys.stdout,
    force=True,
)
log = logging.getLogger('ALERT_ENGINE')

# ─── Twilio config ────────────────────────────────────────────────────────────
TWILIO_SID   = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_FROM  = os.getenv('TWILIO_WHATSAPP_NUMBER', '+14155238886')
EMERGENCY_TO = os.getenv('EMERGENCY_CONTACT_PHONE', '918618266736')
PORT         = int(os.getenv('NOTIFY_PORT', '8000'))


def _wa(number: str) -> str:
    n = number.strip()
    if not n.startswith('whatsapp:'):
        if not n.startswith('+'):
            n = '+' + n
        n = 'whatsapp:' + n
    return n


FROM_WA = _wa(TWILIO_FROM)
TO_WA   = _wa(EMERGENCY_TO)

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title='Safety-GUARD Notification Proxy')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)


class AlertRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    trigger: Optional[str] = 'PANIC BUTTON'


class SafeRequest(BaseModel):
    phone: Optional[str] = None


@app.get('/health')
def health():
    configured = bool(TWILIO_SID and TWILIO_TOKEN)
    log.info('Health check — twilio_configured=%s  from=%s  to=%s', configured, FROM_WA, TO_WA)
    return {
        'status':            'ok',
        'twilio_configured': configured,
        'from':              FROM_WA,
        'to':                TO_WA,
    }


@app.post('/alert/whatsapp')
async def send_whatsapp(req: AlertRequest):
    if not TWILIO_SID or not TWILIO_TOKEN:
        log.error('❌ Twilio credentials missing')
        return {'ok': False, 'error': 'Twilio credentials not configured', 'sid': None}

    latitude  = req.latitude
    longitude = req.longitude
    trigger   = (req.trigger or 'PANIC BUTTON').upper()

    if latitude is not None and longitude is not None:
        maps_link = f'https://www.google.com/maps?q={latitude},{longitude}'
        log.info('📍 GPS coordinates received: lat=%s  lng=%s', latitude, longitude)
    else:
        maps_link = 'https://www.google.com/maps'
        log.warning('⚠️  No GPS coordinates in request — using fallback link')

    message_body = (
        f'🚨 WOMEN SAFETY PROTOCOL ACTIVATED 🚨\n\n'
        f'🚨 Emergency triggered via: {trigger}\n\n'
        f'📍 LIVE LOCATION:\n{maps_link}\n\n'
        f'📡 Real-time GPS tracking enabled.\n'
        f'Please respond immediately or contact authorities.\n\n'
        f'— Women Safety Protocol'
    )

    to_number = _wa(req.phone) if req.phone else TO_WA

    log.info('📤 Sending WhatsApp  from=%s  to=%s  maps=%s', FROM_WA, to_number, maps_link)

    try:
        from twilio.rest import Client
        client = Client(TWILIO_SID, TWILIO_TOKEN)

        msg = await asyncio.to_thread(
            client.messages.create,
            body=message_body,
            from_=FROM_WA,
            to=to_number,
        )

        log.info('✅ WhatsApp sent  sid=%s  status=%s', msg.sid, msg.status)
        return {
            'ok':       True,
            'sid':      msg.sid,
            'status':   msg.status,
            'maps_link': maps_link,
        }

    except Exception as exc:
        log.exception('❌ Twilio error: %s', exc)
        return {'ok': False, 'error': str(exc), 'sid': None}


@app.post('/alert/safe')
async def send_safe(req: SafeRequest):
    if not TWILIO_SID or not TWILIO_TOKEN:
        return {'ok': False, 'error': 'Twilio credentials not configured', 'sid': None}

    message_body = (
        '✅ USER MARKED SAFE\n\n'
        'The emergency has been resolved.\n'
        'Tracking session closed.\n\n'
        '— Women Safety Protocol'
    )

    to_number = _wa(req.phone) if req.phone else TO_WA
    log.info('📤 Sending SAFE notification  to=%s', to_number)

    try:
        from twilio.rest import Client
        client = Client(TWILIO_SID, TWILIO_TOKEN)

        msg = await asyncio.to_thread(
            client.messages.create,
            body=message_body,
            from_=FROM_WA,
            to=to_number,
        )

        log.info('✅ Safe notification sent  sid=%s', msg.sid)
        return {'ok': True, 'sid': msg.sid, 'status': msg.status}

    except Exception as exc:
        log.exception('❌ Twilio error (safe): %s', exc)
        return {'ok': False, 'error': str(exc), 'sid': None}


if __name__ == '__main__':
    import uvicorn
    log.info('🚀 Starting Safety-GUARD notification proxy on port %d', PORT)
    log.info('   FROM: %s', FROM_WA)
    log.info('   TO:   %s', TO_WA)
    uvicorn.run('notify:app', host='0.0.0.0', port=PORT, reload=False)
