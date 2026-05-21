"""Emergency Session Manager - handles emergency lifecycle."""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models import EmergencySession, EmergencyStatus, User, EmergencyLog
from app.config import settings
from datetime import datetime, timedelta, timezone
from uuid import UUID
import logging
import secrets
import string
from typing import Optional, Dict, Any, cast

logger = logging.getLogger(__name__)


class EmergencySessionManager:
    """Manages emergency session lifecycle and state machine."""

    @staticmethod
    def create_session(db: Session, user_id: UUID) -> EmergencySession:
        """Create new emergency session."""
        # Check for existing active session
        existing = EmergencySessionManager.get_active_session(db, user_id)
        if existing:
            raise ValueError(f"User {user_id} already has active session {existing.id}")

        # Generate secure passcode
        passcode = ''.join(secrets.choice(string.digits) for _ in range(6))

        session = EmergencySession(
            user_id=user_id,
            passcode=passcode,
            status=EmergencyStatus.MONITORING,
            is_active=True,
            danger_detected=False,
            alert_sent=False,
            ai_threat_score=0.0,
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        logger.info(f"Emergency session created: {session.id} for user {user_id}")
        return session

    @staticmethod
    def get_active_session(db: Session, user_id: UUID) -> Optional[EmergencySession]:
        """Get active emergency session for user."""
        session = db.query(EmergencySession).filter(
            EmergencySession.user_id == user_id,
            EmergencySession.is_active == True
        ).order_by(desc(EmergencySession.activated_at)).first()
        return session

    @staticmethod
    def transition_status(
        db: Session,
        session_id: UUID,
        new_status: EmergencyStatus,
        metadata: Optional[Dict[str, Any]] = None
    ) -> EmergencySession:
        """Transition session to new status."""
        session = db.query(EmergencySession).filter(
            EmergencySession.id == session_id
        ).first()

        if not session:
            raise ValueError(f"Session {session_id} not found")

        old_status = session.status

        # Use setattr for SQLAlchemy columns
        setattr(session, 'status', new_status.value)
        setattr(session, 'updated_at', datetime.now(timezone.utc))

        old_status_value = old_status.value if old_status is not None else None

        # Log transition
        log = EmergencyLog(
            session_id=session_id,
            event_type="STATUS_TRANSITION",
            event_data={
                "from": old_status_value,
                "to": new_status.value,
                **(metadata or {})
            },
            severity="WARNING" if new_status in [
                EmergencyStatus.ALERT_TRIGGERED,
                EmergencyStatus.ACTIVE_RESPONSE
            ] else "INFO"
        )
        db.add(log)
        db.commit()
        db.refresh(session)

        logger.info("Session %s transitioned: %s → %s", session_id, old_status_value or 'None', new_status.value)
        return session

    @staticmethod
    def verify_passcode(
        db: Session,
        session_id: UUID,
        provided_passcode: str
    ) -> tuple[bool, EmergencySession]:
        """Verify passcode and return result."""
        session = db.query(EmergencySession).filter(
            EmergencySession.id == session_id
        ).first()

        if not session:
            raise ValueError(f"Session {session_id} not found")

        # Check for max attempts (3 attempts max)
        passcode_attempts = cast(int, session.passcode_attempts) if session.passcode_attempts is not None else 0
        if passcode_attempts >= 3:
            logger.warning("Session %s exceeded max passcode attempts", session_id)
            EmergencySessionManager.trigger_emergency(db, session_id, "max passcode attempts exceeded")
            return False, session

        # Update attempts count
        setattr(session, 'passcode_attempts', passcode_attempts + 1)
        is_correct = provided_passcode == session.passcode

        if is_correct:
            setattr(session, 'passcode_correct', True)
            setattr(session, 'status', EmergencyStatus.RESOLVED.value)
            setattr(session, 'resolved_at', datetime.now(timezone.utc))
            setattr(session, 'is_active', False)

            log = EmergencyLog(
                session_id=session_id,
                event_type="PASSCODE_CORRECT",
                event_data={"attempts": session.passcode_attempts},
                severity="INFO"
            )
        else:
            setattr(session, 'danger_detected', True)
            setattr(session, 'status', EmergencyStatus.ALERT_TRIGGERED.value)

            log = EmergencyLog(
                session_id=session_id,
                event_type="PASSCODE_INCORRECT",
                event_data={"attempts": session.passcode_attempts},
                severity="CRITICAL"
            )

        db.add(log)
        db.commit()
        db.refresh(session)

        return is_correct, session

    @staticmethod
    def trigger_emergency(
        db: Session,
        session_id: UUID,
        reason: str = "timeout"
    ) -> EmergencySession:
        """Trigger emergency alert."""
        session = db.query(EmergencySession).filter(
            EmergencySession.id == session_id
        ).first()

        if not session:
            raise ValueError(f"Session {session_id} not found")

        setattr(session, 'danger_detected', True)
        setattr(session, 'alert_sent', True)
        setattr(session, 'alert_sent_at', datetime.now(timezone.utc))
        setattr(session, 'status', EmergencyStatus.ALERT_TRIGGERED.value)

        log = EmergencyLog(
            session_id=session_id,
            event_type="EMERGENCY_TRIGGERED",
            event_data={"reason": reason},
            severity="CRITICAL"
        )
        db.add(log)
        db.commit()
        db.refresh(session)

        logger.critical(f"Emergency triggered for session {session_id}: {reason}")
        return session

    @staticmethod
    def update_threat_score(
        db: Session,
        session_id: UUID,
        threat_score: float
    ) -> EmergencySession:
        """Update AI threat score."""
        session = db.query(EmergencySession).filter(
            EmergencySession.id == session_id
        ).first()

        if not session:
            raise ValueError(f"Session {session_id} not found")

        setattr(session, 'ai_threat_score', threat_score)

        # Check if alert_sent is False by accessing the actual value
        alert_sent_value = session.alert_sent if hasattr(session, 'alert_sent') else False

        # Auto-trigger if score exceeds threshold
        if threat_score >= settings.ai_threat_threshold and alert_sent_value is False:
            return EmergencySessionManager.trigger_emergency(
                db, session_id, "AI threat score: %.2f" % threat_score
            )

        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def resolve_session(
        db: Session,
        session_id: UUID,
        resolution_reason: str = "manual"
    ) -> EmergencySession:
        """Resolve emergency session."""
        session = db.query(EmergencySession).filter(
            EmergencySession.id == session_id
        ).first()

        if not session:
            raise ValueError(f"Session {session_id} not found")

        setattr(session, 'status', EmergencyStatus.RESOLVED.value)
        setattr(session, 'resolved_at', datetime.now(timezone.utc))
        setattr(session, 'is_active', False)

        log = EmergencyLog(
            session_id=session_id,
            event_type="SESSION_RESOLVED",
            event_data={"reason": resolution_reason},
            severity="INFO"
        )
        db.add(log)
        db.commit()
        db.refresh(session)

        logger.info(f"Session {session_id} resolved: {resolution_reason}")
        return session

    @staticmethod
    def cleanup_expired_sessions(db: Session, timeout_minutes: int = 30) -> int:
        """Auto-resolve sessions exceeding timeout."""
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=timeout_minutes)
        expired = db.query(EmergencySession).filter(
            EmergencySession.is_active == True,
            EmergencySession.updated_at < cutoff,
            EmergencySession.status != EmergencyStatus.RESOLVED.value
        ).all()

        for session in expired:
            session_id_value = cast(UUID, session.id)
            EmergencySessionManager.resolve_session(
                db, session_id_value, "auto-timeout after %sm" % timeout_minutes
            )

        return len(expired)
