"""
Safety-GUARD Production Server
Serves the built React app (dist/) + notification API on a single port.
No separate proxy needed — /api/notify/* routes go to FastAPI, everything
else serves the React SPA's index.html.
"""
import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(message)s',
    stream=sys.stdout,
    force=True,
)
log = logging.getLogger('SAFETY_GUARD')

# ─── Twilio config ────────────────────────────────────────────────────────────
TWILIO_SANDBOX_FROM = '+14155238886'

TWILIO_SID   = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
EMERGENCY_TO = os.getenv('EMERGENCY_CONTACT_PHONE', '')
PORT         = int(os.getenv('PORT', '5000'))
DIST_DIR     = Path(__file__).parent / 'dist'

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
            '[CONFIG] TWILIO_WHATSAPP_NUMBER="%s" is not a valid Twilio WhatsApp sender '
            '(would cause error 63007). Falling back to sandbox: %s',
            _raw_from, TWILIO_SANDBOX_FROM
        )
    FROM_WA = _normalise(TWILIO_SANDBOX_FROM)

TO_WA = _normalise(EMERGENCY_TO) if EMERGENCY_TO else ''

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title='Safety-GUARD')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)


# ─── Pydantic models ──────────────────────────────────────────────────────────
class AlertRequest(BaseModel):
    latitude:  Optional[float] = None
    longitude: Optional[float] = None
    phone:     Optional[str]   = None
    trigger:   Optional[str]   = 'PANIC BUTTON'


class SafeRequest(BaseModel):
    phone: Optional[str] = None


# ─── API routes ───────────────────────────────────────────────────────────────
@app.get('/api/notify/health')
def health():
    configured = bool(TWILIO_SID and TWILIO_TOKEN)
    log.info('[HEALTH] twilio_configured=%s  from=%s  to=%s', configured, FROM_WA, TO_WA)
    return {'status': 'ok', 'twilio_configured': configured, 'from': FROM_WA, 'to': TO_WA}


@app.post('/api/notify/alert/whatsapp')
async def send_whatsapp(req: AlertRequest):
    if not TWILIO_SID or not TWILIO_TOKEN:
        log.error('[TWILIO] ❌ Credentials missing')
        return {'ok': False, 'error': 'Twilio credentials not configured', 'sid': None}

    latitude  = req.latitude
    longitude = req.longitude
    trigger   = (req.trigger or 'PANIC BUTTON').upper()

    if latitude is not None and longitude is not None:
        maps_link = f'https://www.google.com/maps?q={latitude},{longitude}'
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
        return {'ok': False, 'error': 'No emergency contact phone configured', 'sid': None}

    log.info('[TWILIO] Sending WhatsApp  from=%s  to=%s', FROM_WA, to_number)

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
        log.error('[TWILIO] ❌ %s', err)
        if '63007' in err:
            hint = (
                f'Twilio error 63007 — FROM address {FROM_WA} is not a valid WhatsApp sender. '
                'Set TWILIO_WHATSAPP_NUMBER to your approved Twilio WhatsApp number '
                'or +14155238886 for the sandbox.'
            )
            return {'ok': False, 'error': hint, 'sid': None}
        return {'ok': False, 'error': err, 'sid': None}


@app.post('/api/notify/alert/safe')
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


# ─── Serve React SPA ──────────────────────────────────────────────────────────
if DIST_DIR.exists():
    app.mount('/assets', StaticFiles(directory=str(DIST_DIR / 'assets')), name='assets')

    @app.get('/{full_path:path}')
    async def spa_fallback(request: Request, full_path: str):
        index = DIST_DIR / 'index.html'
        if index.exists():
            return FileResponse(str(index))
        return {'error': 'dist/index.html not found — run npm run build first'}
else:
    log.warning('⚠️  dist/ not found — run npm run build before deploying')

    @app.get('/{full_path:path}')
    async def no_build(full_path: str):
        return {'error': 'dist/ not found. Run: npm run build'}


if __name__ == '__main__':
    import uvicorn
    log.info('🚀 Safety-GUARD starting on port %d', PORT)
    log.info('   FROM: %s', FROM_WA)
    log.info('   TO:   %s', TO_WA)
    uvicorn.run('server:app', host='0.0.0.0', port=PORT, reload=False)
