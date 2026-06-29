from typing import Optional
from datetime import datetime
from backend.database import models


class EmergencyStateMachine:
    STATES = [
        'IDLE',
        'MONITORING',
        'RISK_DETECTED',
        'ALERT_QUEUED',
        'PROCESSING',
        'ALERT_SENT',
        'ALERT_DELIVERED',
        'ALERT_READ',
        'LIVE_TRACKING',
        'ACTIVE_RESPONSE',
        'RESOLVED',
    ]

    TRANSITIONS = {
        'IDLE': ['MONITORING'],
        'MONITORING': ['RISK_DETECTED', 'ALERT_QUEUED', 'IDLE'],
        'RISK_DETECTED': ['ALERT_QUEUED', 'LIVE_TRACKING'],
        'ALERT_QUEUED': ['PROCESSING', 'ALERT_SENT', 'LIVE_TRACKING'],
        'PROCESSING': ['ALERT_SENT', 'ALERT_FAILED'],
        'ALERT_SENT': ['ALERT_DELIVERED', 'ALERT_READ', 'LIVE_TRACKING', 'ALERT_FAILED'],
        'ALERT_DELIVERED': ['ALERT_READ', 'LIVE_TRACKING', 'ACTIVE_RESPONSE'],
        'ALERT_READ': ['LIVE_TRACKING', 'ACTIVE_RESPONSE'],
        'LIVE_TRACKING': ['ACTIVE_RESPONSE', 'RESOLVED'],
        'ACTIVE_RESPONSE': ['RESOLVED'],
        'RESOLVED': [],
    }

    def __init__(self, sio=None, notifier=None, db_session=None):
        self.sio = sio
        self.notifier = notifier
        self.db = db_session

    def valid_transition(self, from_state: str, to_state: str) -> bool:
        return to_state in self.TRANSITIONS.get(from_state, [])
    def _validate_transition(self, old_state: str, new_state: str):
        if not self.valid_transition(old_state, new_state) and old_state != new_state:
            raise ValueError(f'Invalid transition {old_state} -> {new_state}')

    def _persist_transition(self, session_obj, new_state: str, db):
        session_obj.status = new_state
        db.add(session_obj)
        db.commit()

    def _log_transition(self, session_obj, old_state: str, new_state: str, db):
        log = models.EmergencyLog(session_id=session_obj.id, event_type='STATE_CHANGE', description=f'{old_state} -> {new_state}')
        db.add(log)
        db.commit()

    def _emit_transition(self, session_obj, old_state: str, new_state: str, emit: bool):
        if emit and self.sio:
            self.sio.emit('SESSION_STATE_CHANGED', {'session_id': str(session_obj.id), 'old_state': old_state, 'new_state': new_state})

    def _handle_side_effects(self, session_obj, new_state: str, db):
        if new_state != 'ALERT_TRIGGERED':
            return

        loc = db.query(models.LiveLocation).filter(models.LiveLocation.session_id == session_obj.id).order_by(models.LiveLocation.timestamp.desc()).first()
        lat = float(loc.latitude) if loc else None
        lng = float(loc.longitude) if loc else None
        contacts = []
        try:
            user = db.query(models.User).filter(models.User.id == session_obj.user_id).first()
            contacts = user.emergency_contacts or []
            if contacts and isinstance(contacts[0], dict):
                contacts = [c.get('phone') for c in contacts]
        except Exception:
            contacts = []

        payload = {'session_id': str(session_obj.id), 'lat': lat, 'lng': lng, 'contacts': contacts}
        try:
            from backend.tasks.notification_tasks import send_whatsapp_alert_task
            send_whatsapp_alert_task.delay(payload)
        except Exception:
            pass

    def transition(self, session_obj, new_state: str, db, emit=True):
        old_state = session_obj.status
        self._validate_transition(old_state, new_state)
        self._persist_transition(session_obj, new_state, db)
        self._log_transition(session_obj, old_state, new_state, db)
        self._emit_transition(session_obj, old_state, new_state, emit)
        self._handle_side_effects(session_obj, new_state, db)
