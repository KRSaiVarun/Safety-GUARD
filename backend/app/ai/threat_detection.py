"""AI Threat Detection Engine."""
from sqlalchemy.orm import Session
from app.models import EmergencySession, LiveLocation, AIThreatEvent
from app.config import settings
from app.services.gps_tracking import GPSTrackingService
from uuid import UUID
from datetime import datetime, timedelta, timezone
import logging


def _utcnow():
    return datetime.now(timezone.utc)

logger = logging.getLogger(__name__)


class AIThreatDetectionEngine:
    """AI-powered threat detection and analysis."""

    @staticmethod
    def analyze_session(
        db: Session,
        session_id: UUID
    ) -> dict:
        """Comprehensive threat analysis."""
        session = db.query(EmergencySession).filter(
            EmergencySession.id == session_id
        ).first()

        if not session:
            raise ValueError(f"Session {session_id} not found")

        threats = []
        total_score = 0.0

        # 1. Check for inactivity
        inactivity_threat = AIThreatDetectionEngine._check_inactivity(db, session_id)
        if inactivity_threat:
            threats.append(inactivity_threat)
            total_score += inactivity_threat["score"]

        # 2. Check for anomalous movement
        movement_threat = AIThreatDetectionEngine._check_anomalous_movement(db, session_id)
        if movement_threat:
            threats.append(movement_threat)
            total_score += movement_threat["score"]

        # 3. Time-based escalation (longer emergency = higher threat)
        time_threat = AIThreatDetectionEngine._check_time_escalation(session)
        if time_threat:
            threats.append(time_threat)
            total_score += time_threat["score"]

        # Normalize score to 0-1 range
        threat_score = min(1.0, total_score / 3.0)

        return {
            "session_id": str(session_id),
            "threat_score": threat_score,
            "threat_level": AIThreatDetectionEngine._score_to_level(threat_score),
            "threats": threats,
            "recommendations": AIThreatDetectionEngine._get_recommendations(threats),
            "timestamp": _utcnow().isoformat()
        }

    @staticmethod
    def _check_inactivity(db: Session, session_id: UUID) -> dict | None:
        """Check for inactivity (no location updates)."""
        session = db.query(EmergencySession).filter(
            EmergencySession.id == session_id
        ).first()

        if not session:
            return None

        # Get last location
        last_location = db.query(LiveLocation).filter(
            LiveLocation.session_id == session_id
        ).order_by(LiveLocation.created_at.desc()).first()

        if not last_location:
            return None

        # Check time since last location
        time_since_update = _utcnow() - last_location.created_at
        minutes_inactive = time_since_update.total_seconds() / 60

        if minutes_inactive > settings.inactivity_threshold_minutes:
            score = min(1.0, minutes_inactive / (settings.inactivity_threshold_minutes * 2))

            return {
                "type": "INACTIVITY",
                "description": f"No location update for {minutes_inactive:.1f} minutes",
                "score": score,
                "severity": "HIGH" if score > 0.7 else "MEDIUM"
            }

        return None

    @staticmethod
    def _check_anomalous_movement(db: Session, session_id: UUID) -> dict | None:
        """Check for abnormal movement patterns."""
        analysis = GPSTrackingService.detect_anomalous_movement(db, session_id)

        if analysis.get("is_anomalous"):
            max_speed = analysis.get("max_speed_kmh", 0)

            # Very high speed suggests vehicle-based threat
            if max_speed > 150:
                score = min(1.0, max_speed / 300)
                return {
                    "type": "ABNORMAL_MOVEMENT",
                    "description": f"Extremely high speed detected: {max_speed:.1f} km/h (possible vehicle threat)",
                    "score": score,
                    "severity": "CRITICAL"
                }

        return None

    @staticmethod
    def _check_time_escalation(session: EmergencySession) -> dict | None:
        """Escalate threat based on emergency duration."""
        if not session.activated_at:
            return None

        duration = _utcnow() - session.activated_at
        minutes_elapsed = duration.total_seconds() / 60

        # Threat escalates over time: 0 minutes = 0.0, 60+ minutes = 1.0
        score = min(1.0, minutes_elapsed / 60)

        if score > 0.3:
            return {
                "type": "TIME_ESCALATION",
                "description": f"Emergency active for {minutes_elapsed:.1f} minutes",
                "score": score,
                "severity": "HIGH" if score > 0.7 else "MEDIUM"
            }

        return None

    @staticmethod
    def _score_to_level(score: float) -> str:
        """Convert threat score to threat level."""
        if score >= 0.8:
            return "CRITICAL"
        elif score >= 0.6:
            return "HIGH"
        elif score >= 0.4:
            return "MEDIUM"
        elif score >= 0.2:
            return "LOW"
        else:
            return "MINIMAL"

    @staticmethod
    def _get_recommendations(threats: list[dict]) -> list[str]:
        """Generate recommendations based on detected threats."""
        recommendations = []

        threat_types = {t["type"] for t in threats}

        if "INACTIVITY" in threat_types:
            recommendations.append("Immediate police dispatch recommended")
            recommendations.append("Contact emergency medical services")

        if "ABNORMAL_MOVEMENT" in threat_types:
            recommendations.append("Possible kidnapping or vehicle theft")
            recommendations.append("Activate CCTV review")
            recommendations.append("Notify highway patrol")

        if "TIME_ESCALATION" in threat_types:
            recommendations.append("Escalate to senior responder")
            recommendations.append("Activate search protocols")

        return recommendations if recommendations else ["Continue monitoring"]

    @staticmethod
    def log_threat_event(
        db: Session,
        session_id: UUID,
        threat_type: str,
        threat_score: float,
        description: str,
        location: dict = None
    ) -> AIThreatEvent:
        """Log threat detection event."""
        event = AIThreatEvent(
            session_id=session_id,
            threat_type=threat_type,
            threat_score=threat_score,
            confidence=0.95,
            description=description,
            location=location,
        )

        db.add(event)
        db.commit()

        logger.warning(f"Threat logged: {threat_type} (score: {threat_score:.2f})")
        return event
