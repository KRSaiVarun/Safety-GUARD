from backend.celery_app import celery
from backend.services.notification_service import NotificationService
from backend.services.emergency_state_machine import EmergencyStateMachine
from backend.services.alert_service import AlertService
from backend.database.db_config import SessionLocal
from backend.database import models
import os
from socketio import Client

SOCKET_URL = os.getenv('BACKEND_SOCKET_URL', 'http://backend:8000')
STATUS_CALLBACK_URL = os.getenv('TWILIO_STATUS_CALLBACK_URL', 'http://backend:8000/api/emergency/twilio/status')


def _connect_socket():
    try:
        socket = Client()
        socket.connect(SOCKET_URL)
        return socket
    except Exception:
        return None


def _emit_event(socket, event_name, payload):
    if socket:
        socket.emit(event_name, payload)


def _find_alert_row(session_id, phone, db):
    svc = AlertService(db=db)
    return svc.find_latest_alert_for_recipient(session_id, phone)


def _transition_session_state(session_id, new_state, db, socket):
    try:
        svc = AlertService(sio=socket, db=db)
        svc.transition_session_state(session_id, new_state)
    except Exception:
        db.rollback()


def _persist_delivery_log(session_id, alert_id, message_sid, delivery_status, recipient, db, error_message=None):
    svc = AlertService(db=db)
    svc.persist_delivery_log(session_id=session_id, alert_id=alert_id, message_sid=message_sid, delivery_status=delivery_status, recipient=recipient, error_message=error_message)


def _update_alert_status(alert_row, status, resp, db):
    svc = AlertService(db=db)
    svc.update_alert_status(alert_row, status, resp)


def _send_whatsapp_to_contact(session_id, phone, payload, notifier, socket, db):
    alert_row = _find_alert_row(session_id, phone, db)
    if alert_row:
        _update_alert_status(alert_row, 'PROCESSING', None, db)
        _emit_event(socket, 'ALERT_PROCESSING', {'session_id': session_id, 'recipient': phone})
        _transition_session_state(session_id, 'PROCESSING', db, socket)

    try:
        resp = None
        if notifier.client:
            status_callback = f"{STATUS_CALLBACK_URL}?session_id={session_id}&recipient={phone}"
            resp = notifier.client.messages.create(
                body=(
                    "🚨 SAFETY-GUARD EMERGENCY ALERT 🚨\n\n"
                    f"📍 Live Location:\nhttps://maps.google.com/?q={payload.get('lat')},{payload.get('lng')}\n\n"
                    f"Session ID: {session_id}\n"
                ),
                from_=notifier.from_whatsapp,
                to=f'whatsapp:{phone}',
                status_callback=status_callback,
            )

        if alert_row:
            _update_alert_status(alert_row, 'SENT', resp, db)
            _transition_session_state(session_id, 'ALERT_SENT', db, socket)

        _persist_delivery_log(
            session_id=session_id,
            alert_id=alert_row.id if alert_row else None,
            message_sid=getattr(resp, 'sid', None) if resp else None,
            delivery_status='SENT',
            recipient=phone,
            db=db,
        )

        _emit_event(socket, 'ALERT_SENT', {'session_id': session_id, 'recipient': phone, 'provider': 'twilio'})
        return {'to': phone, 'status': 'SENT', 'sid': getattr(resp, 'sid', None) if resp else None}
    except Exception as exc:
        if alert_row:
            _update_alert_status(alert_row, 'FAILED', None, db)
            _transition_session_state(session_id, 'ALERT_FAILED', db, socket)

        _persist_delivery_log(
            session_id=session_id,
            alert_id=alert_row.id if alert_row else None,
            message_sid=getattr(resp, 'sid', None) if 'resp' in locals() and resp else None,
            delivery_status='FAILED',
            recipient=phone,
            db=db,
            error_message=str(exc),
        )
        _emit_event(socket, 'ALERT_FAILED', {'session_id': session_id, 'recipient': phone, 'error': str(exc)})
        return {'to': phone, 'status': 'FAILED', 'error': str(exc)}


@celery.task(name='backend.tasks.send_whatsapp_alert')
def send_whatsapp_alert_task(payload: dict):
    """Celery task to send WhatsApp alerts via NotificationService.

    payload: {session_id, lat, lng, contacts}
    """
    db = SessionLocal()
    socket = _connect_socket()
    session_id = payload.get('session_id')
    contacts = payload.get('contacts', [])

    notifier = NotificationService()
    results = []
    for phone in contacts:
        results.append(_send_whatsapp_to_contact(session_id, phone, payload, notifier, socket, db))

    try:
        if socket:
            socket.disconnect()
    except Exception:
        pass

    db.close()
    return {'status': 'completed', 'results': results}

