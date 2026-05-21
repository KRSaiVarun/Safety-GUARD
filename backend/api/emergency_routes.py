from fastapi import APIRouter, Request
from pydantic import BaseModel
from backend.services.emergency_service import create_emergency_session, resolve_emergency_session, get_active_sessions
from backend.services.webhook_service import handle_twilio_status

router = APIRouter()


class StartPayload(BaseModel):
    session_id: str
    user_id: str


class ResolvePayload(BaseModel):
    session_id: str
    resolution_reason: str | None = None


@router.post('/start')
def start(payload: StartPayload, request: Request):
    return create_emergency_session(payload.session_id, payload.user_id, sio=request.app.state.sio)


@router.post('/resolve')
def resolve(payload: ResolvePayload, request: Request):
    return resolve_emergency_session(payload.session_id, payload.resolution_reason, sio=request.app.state.sio)


@router.post('/twilio/status')
async def twilio_status(request: Request):
    form = await request.form()
    message_sid = form.get('MessageSid')
    message_status = form.get('MessageStatus')
    recipient = form.get('To')
    error_message = form.get('ErrorMessage')

    return handle_twilio_status(
        message_sid=message_sid,
        message_status=message_status,
        recipient=recipient,
        error_message=error_message,
        sio=request.app.state.sio,
    )


@router.get('/active')
def active():
    return get_active_sessions()
