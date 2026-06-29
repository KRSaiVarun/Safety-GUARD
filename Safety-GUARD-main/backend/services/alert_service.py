import uuid
from backend.database.db_config import SessionLocal
from backend.database import models
from backend.services.emergency_state_machine import EmergencyStateMachine
from typing import Optional, Any


class AlertService:
    ALERT_STATUS_TRANSITIONS = {
        'QUEUED': ['PROCESSING', 'FAILED'],
        'PROCESSING': ['SENT', 'FAILED'],
        'SENT': ['DELIVERED', 'READ', 'FAILED'],
        'DELIVERED': ['READ'],
        'READ': [],
        'FAILED': [],
    }

    def __init__(self, sio: Any = None, db=None):
        self.sio = sio
        self.db = db or SessionLocal()

    def find_alert_by_provider_sid(self, sid: str):
        return self.db.query(models.Alert).filter(models.Alert.provider_message_id == sid).first()

    def find_latest_alert_for_recipient(self, session_id: str, recipient: str):
        return self.db.query(models.Alert).filter(
            models.Alert.session_id == session_id,
            models.Alert.recipient_phone == recipient,
        ).order_by(models.Alert.id.desc()).first()

    def _normalize_uuid(self, value):
        if isinstance(value, str):
            try:
                return uuid.UUID(value)
            except ValueError:
                return value
        return value

    def create_alert(self, session_id: str, recipient: str, status: str = 'QUEUED'):
        normalized_session_id = self._normalize_uuid(session_id)
        alert = models.Alert(session_id=normalized_session_id, recipient_phone=recipient, status=status)
        self.db.add(alert)
        self.db.commit()
        return alert

    def _validate_alert_transition(self, current_status: str, next_status: str):
        if current_status == next_status:
            return True
        allowed = self.ALERT_STATUS_TRANSITIONS.get(current_status, [])
        return next_status in allowed

    def update_alert_status(self, alert_obj, status: str, resp: Optional[Any] = None):
        if not alert_obj:
            return
        if not self._validate_alert_transition(alert_obj.status, status):
            raise ValueError(f'Invalid alert transition {alert_obj.status} -> {status}')
        alert_obj.status = status
        if resp is not None:
            alert_obj.provider_message_id = getattr(resp, 'sid', None)
        self.db.add(alert_obj)
        self.db.commit()

    def persist_delivery_log(self, session_id: str, alert_id: Optional[int], message_sid: Optional[str], delivery_status: str, recipient: str, error_message: Optional[str] = None, retry_count: int = 0):
        normalized_session_id = self._normalize_uuid(session_id)
        log = models.AlertDeliveryLog(
            session_id=normalized_session_id,
            alert_id=alert_id,
            provider_message_id=message_sid,
            delivery_status=delivery_status,
            provider='twilio',
            recipient=recipient,
            error_message=error_message,
            retry_count=retry_count,
        )
        self.db.add(log)
        self.db.commit()
        return log

    def emit_alert_event(self, event_name: str, payload: dict):
        if self.sio:
            self.sio.emit(event_name, payload, room='dashboard')

    def map_twilio_status(self, message_status: Optional[str]):
        status = message_status.upper() if message_status else 'UNKNOWN'
        if status == 'DELIVERED':
            return status, 'ALERT_DELIVERED', 'ALERT_DELIVERED'
        if status in ['FAILED', 'UNDELIVERED', 'SENDING_FAILED']:
            return status, 'ALERT_FAILED', 'ALERT_FAILED'
        if status == 'READ':
            return status, 'ALERT_READ', 'ALERT_READ'
        return status, None, 'ALERT_STATUS'

    def transition_session_state(self, session_id: str, new_state: str):
        try:
            normalized_session_id = self._normalize_uuid(session_id)
            sm = EmergencyStateMachine(sio=self.sio, notifier=None)
            session_obj = self.db.query(models.EmergencySession).filter(models.EmergencySession.id == normalized_session_id).first()
            if session_obj and session_obj.status != new_state:
                sm.transition(session_obj, new_state, self.db)
        except Exception:
            pass

    def update_alert_delivery_status(self, message_sid: Optional[str], message_status: Optional[str], recipient: Optional[str], error_message: Optional[str]):
        alert = None
        if message_sid:
            alert = self.find_alert_by_provider_sid(message_sid)
        if not alert and recipient:
            # try to find latest by recipient across sessions
            alert = self.db.query(models.Alert).filter(models.Alert.recipient_phone == recipient).order_by(models.Alert.id.desc()).first()

        if not alert:
            return {'received': True, 'status': 'unknown'}

        status, desired_state, event_name = self.map_twilio_status(message_status)
        if status not in ['UNKNOWN', None]:
            self.update_alert_status(alert, status)
        else:
            self.db.add(alert)
            self.db.commit()

        self.persist_delivery_log(
            session_id=alert.session_id,
            alert_id=alert.id,
            message_sid=message_sid,
            delivery_status=status,
            recipient=recipient or alert.recipient_phone,
            error_message=error_message,
        )

        self.emit_alert_event(event_name, {
            'session_id': str(alert.session_id),
            'recipient': recipient or alert.recipient_phone,
            'status': status,
            'error_message': error_message,
            'message_sid': message_sid,
        })

        if desired_state:
            self.transition_session_state(str(alert.session_id), desired_state)

        return {'received': True, 'status': status}


def update_alert_delivery_status(message_sid: Optional[str], message_status: Optional[str], recipient: Optional[str], error_message: Optional[str], sio=None):
    svc = AlertService(sio=sio)
    return svc.update_alert_delivery_status(message_sid, message_status, recipient, error_message)
