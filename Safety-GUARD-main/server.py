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
    format='%(asctime)s [ALERT] %(message)s',
    stream=sys.stdout,
    force=True,
)
log = logging.getLogger('SAFETY_GUARD')

# ─── Twilio config ────────────────────────────────────────────────────────────
TWILIO_SID   = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_FROM  = os.getenv('TWILIO_WHATSAPP_NUMBER', '+14155238886')
EMERGENCY_TO = os.getenv('EMERGENCY_CONTACT_PHONE', '918618266736')
PORT         = int(os.getenv('PORT', '5000'))
DIST_DIR     = Path(__file__).parent / 'dist'


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
    log.info('Health check — twilio_configured=%s  from=%s  to=%s', configured, FROM_WA, TO_WA)
    return {'status': 'ok', 'twilio_configured': configured, 'from': FROM_WA, 'to': TO_WA}


@app.post('/api/notify/alert/whatsapp')
async def send_whatsapp(req: AlertRequest):
    if not TWILIO_SID or not TWILIO_TOKEN:
        log.error('❌ Twilio credentials missing')
        return {'ok': False, 'error': 'Twilio credentials not configured', 'sid': None}

    latitude  = req.latitude
    longitude = req.longitude
    trigger   = (req.trigger or 'PANIC BUTTON').upper()

    if latitude is not None and longitude is not None:
        maps_link = f'https://www.google.com/maps?q={latitude},{longitude}'
        log.info('📍 GPS: lat=%s  lng=%s', latitude, longitude)
    else:
        maps_link = 'https://www.google.com/maps'
        log.warning('⚠️  No GPS coordinates — using fallback link')

    message_body = (
        f'🚨 WOMEN SAFETY PROTOCOL ACTIVATED 🚨\n\n'
        f'🚨 Emergency triggered via: {trigger}\n\n'
        f'📍 LIVE LOCATION:\n{maps_link}\n\n'
        f'📡 Real-time GPS tracking enabled.\n'
        f'Please respond immediately or contact authorities.\n\n'
        f'— Women Safety Protocol'
    )

    to_number = _wa(req.phone) if req.phone else TO_WA
    log.info('📤 Sending WhatsApp  from=%s  to=%s', FROM_WA, to_number)

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
        return {'ok': True, 'sid': msg.sid, 'status': msg.status, 'maps_link': maps_link}
    except Exception as exc:
        log.exception('❌ Twilio error: %s', exc)
        return {'ok': False, 'error': str(exc), 'sid': None}


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


# ─── Serve React SPA ──────────────────────────────────────────────────────────
# Mount static assets (JS/CSS/images) from dist/assets
if DIST_DIR.exists():
    app.mount('/assets', StaticFiles(directory=str(DIST_DIR / 'assets')), name='assets')

    @app.get('/{full_path:path}')
    async def spa_fallback(request: Request, full_path: str):
        # Serve index.html for all non-API paths (React Router handles routing)
        index = DIST_DIR / 'index.html'
        if index.exists():
            return FileResponse(str(index))
        return {'error': 'dist/index.html not found — run npm run build first'}
else:
    log.warning('⚠️  dist/ directory not found — run npm run build before deploying')

    @app.get('/{full_path:path}')
    async def no_build(full_path: str):
        return {'error': 'dist/ not found. Run: npm run build'}


if __name__ == '__main__':
    import uvicorn
    log.info('🚀 Safety-GUARD starting on port %d', PORT)
    log.info('   Twilio FROM: %s', FROM_WA)
    log.info('   Emergency TO: %s', TO_WA)
    log.info('   Serving dist/: %s', DIST_DIR.exists())
    uvicorn.run('server:app', host='0.0.0.0', port=PORT, reload=False)
