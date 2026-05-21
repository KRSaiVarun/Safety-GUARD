from datetime import datetime, timezone
from fastapi import HTTPException
from backend.database.db_config import SessionLocal
from backend.database import models
from backend.services.emergency_state_machine import EmergencyStateMachine


def _utcnow():
    return datetime.now(timezone.utc)


def create_emergency_session(session_id: str, user_id: str, sio=None):
    db = SessionLocal()
    try:
        exists = db.query(models.EmergencySession).filter(models.EmergencySession.id == session_id).first()
        if exists:
            raise HTTPException(status_code=400, detail='session exists')

        sess = models.EmergencySession(
            id=session_id,
            user_id=user_id,
            status='MONITORING',
            started_at=_utcnow(),
        )
        db.add(sess)
        db.commit()

        log = models.EmergencyLog(
            session_id=session_id,
            event_type='SESSION_STARTED',
            description='Started via API',
        )
        db.add(log)
        db.commit()

        if sio:
            sio.emit(
                'SESSION_STARTED',
                {
                    'session_id': session_id,
                    'user_id': user_id,
                    'timestamp': _utcnow().isoformat(),
                },
                room='dashboard',
            )

        return {'session_id': session_id}
    finally:
        db.close()


def resolve_emergency_session(session_id: str, resolution_reason: str | None, sio=None):
    db = SessionLocal()
    try:
        sess = db.query(models.EmergencySession).filter(models.EmergencySession.id == session_id).first()
        if not sess:
            raise HTTPException(status_code=404, detail='session not found')

        sm = EmergencyStateMachine(sio=sio, notifier=None)
        sm.transition(sess, 'RESOLVED', db)

        sess.resolved_at = _utcnow()
        sess.resolution_reason = resolution_reason
        db.add(sess)
        db.commit()

        return {'session_id': session_id, 'status': 'resolved'}
    finally:
        db.close()


def get_active_sessions():
    db = SessionLocal()
    try:
        rows = db.query(models.EmergencySession).filter(models.EmergencySession.status != 'RESOLVED').all()
        return [
            {
                'session_id': str(r.id),
                'user_id': str(r.user_id),
                'status': r.status,
                'risk_score': r.risk_score,
            }
            for r in rows
        ]
    finally:
        db.close()
