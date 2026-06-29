"""AI Risk Engine for dynamic threat scoring."""
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models import EmergencySession, RiskHistory, GeofenceEvent, GeofenceType
from app.database import SessionLocal

logger = logging.getLogger(__name__)


# Risk level thresholds
RISK_LEVELS = {
    (0, 30): "LOW",
    (31, 60): "MEDIUM",
    (61, 80): "HIGH",
    (81, 100): "CRITICAL"
}


def score_to_level(score: float) -> str:
    """Convert numeric score (0-100) to risk level."""
    for (min_score, max_score), level in RISK_LEVELS.items():
        if min_score <= score <= max_score:
            return level
    return "CRITICAL"


def calculate_time_of_day_factor() -> float:
    """
    Factor 1: Time of day (0-25 points)
    Higher risk during night hours (22:00 - 06:00)
    """
    hour = datetime.now().hour

    # 22:00 - 06:00 is high-risk period
    if hour >= 22 or hour < 6:
        return 25.0  # Maximum risk during night
    elif hour >= 20 or hour < 8:
        return 15.0  # Medium risk during evening/early morning
    else:
        return 5.0  # Low risk during day


def calculate_unsafe_area_factor(session_id: UUID, db: Session) -> float:
    """
    Factor 2: Unsafe area (0-25 points)
    Check if user is currently in an UNSAFE geofence
    """
    # Get most recent geofence ENTER event for this session
    last_enter = db.query(GeofenceEvent).filter(
        GeofenceEvent.session_id == session_id,
        GeofenceEvent.event_type == "ENTER"
    ).order_by(desc(GeofenceEvent.created_at)).first()

    if last_enter and last_enter.geofence_type == GeofenceType.UNSAFE:
        return 25.0  # Max risk if in unsafe zone

    return 0.0


def calculate_inactivity_factor(session_id: UUID, db: Session) -> float:
    """
    Factor 3: User inactivity (0-15 points)
    No location updates for >5 minutes = high risk
    """
    session = db.query(EmergencySession).filter(
        EmergencySession.id == session_id
    ).first()

    if not session or not session.last_location:
        return 15.0  # Max inactivity risk if no location

    # Check when last location was received
    last_location_time = session.updated_at
    time_since_update = datetime.utcnow() - last_location_time

    if time_since_update > timedelta(minutes=5):
        return 15.0
    elif time_since_update > timedelta(minutes=3):
        return 10.0
    elif time_since_update > timedelta(minutes=1):
        return 5.0
    else:
        return 0.0


def calculate_emergency_frequency_factor(session_id: UUID, db: Session) -> float:
    """
    Factor 4: Emergency frequency (0-15 points)
    Multiple emergencies in 24h = higher risk
    """
    user = db.query(EmergencySession).filter(
        EmergencySession.id == session_id
    ).first()

    if not user:
        return 0.0

    # Count active sessions for this user in last 24h
    last_24h = datetime.utcnow() - timedelta(hours=24)
    emergency_count = db.query(EmergencySession).filter(
        EmergencySession.user_id == user.user_id,
        EmergencySession.activated_at >= last_24h
    ).count()

    if emergency_count >= 3:
        return 15.0  # Pattern of repeated emergencies
    elif emergency_count >= 2:
        return 10.0
    elif emergency_count >= 1:
        return 5.0
    else:
        return 0.0


def calculate_battery_level_factor(session: EmergencySession) -> float:
    """
    Factor 5: Battery level (0-10 points)
    Get battery from last location metadata
    """
    if not session.last_location:
        return 5.0  # Unknown battery = medium risk

    battery = session.last_location.get("battery")

    if battery is None:
        return 5.0

    # Convert to 0-100 if needed
    if battery > 100:
        battery = min(battery, 100)

    if battery < 10:
        return 10.0  # Critical: <10%
    elif battery < 20:
        return 8.0   # Warning: <20%
    elif battery < 50:
        return 3.0   # Low: <50%
    else:
        return 0.0


def calculate_network_status_factor(session: EmergencySession) -> float:
    """
    Factor 6: Network status (0-10 points)
    Track from session metadata if connection is stable
    """
    if not session.session_metadata:
        return 5.0  # Unknown = medium risk

    # Check if network is reported as unstable
    network_status = session.session_metadata.get("network_status", "unknown")
    last_connection_time = session.session_metadata.get("last_connection_time")

    if network_status == "disconnected":
        return 10.0  # No connection = max risk

    if last_connection_time:
        try:
            last_conn = datetime.fromisoformat(last_connection_time)
            time_disconnected = datetime.utcnow() - last_conn

            if time_disconnected > timedelta(minutes=3):
                return 10.0
            elif time_disconnected > timedelta(minutes=1):
                return 5.0
        except:
            pass

    return 0.0


def calculate_risk(
    session_id: UUID,
    db: Session
) -> Dict:
    """
    Calculate overall risk score using 6 factors.

    Returns:
        {
            "score": 0-100,
            "level": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
            "factors": {
                "time_of_day": 0-25,
                "unsafe_area": 0-25,
                "inactivity": 0-15,
                "emergency_frequency": 0-15,
                "battery_level": 0-10,
                "network_status": 0-10
            },
            "recommendation": str
        }
    """
    session = db.query(EmergencySession).filter(
        EmergencySession.id == session_id
    ).first()

    if not session:
        logger.warning(f"Session not found: {session_id}")
        return {
            "score": 0,
            "level": "LOW",
            "factors": {},
            "recommendation": "Session not found"
        }

    try:
        # Calculate each factor
        time_factor = calculate_time_of_day_factor()
        unsafe_area_factor = calculate_unsafe_area_factor(session_id, db)
        inactivity_factor = calculate_inactivity_factor(session_id, db)
        frequency_factor = calculate_emergency_frequency_factor(session_id, db)
        battery_factor = calculate_battery_level_factor(session)
        network_factor = calculate_network_status_factor(session)

        # Sum all factors (max 100)
        total_score = min(
            time_factor + unsafe_area_factor + inactivity_factor +
            frequency_factor + battery_factor + network_factor,
            100.0
        )

        level = score_to_level(total_score)
        recommendation = generate_recommendation(
            score=total_score,
            level=level,
            in_unsafe_area=unsafe_area_factor > 0,
            battery_low=battery_factor > 5,
            inactive=inactivity_factor > 5,
            network_issues=network_factor > 5
        )

        factors = {
            "time_of_day": round(time_factor, 2),
            "unsafe_area": round(unsafe_area_factor, 2),
            "inactivity": round(inactivity_factor, 2),
            "emergency_frequency": round(frequency_factor, 2),
            "battery_level": round(battery_factor, 2),
            "network_status": round(network_factor, 2)
        }

        logger.debug(
            f"Risk calculated for session {session_id}: "
            f"score={total_score}, level={level}, factors={factors}"
        )

        return {
            "score": round(total_score, 2),
            "level": level,
            "factors": factors,
            "recommendation": recommendation
        }

    except Exception as e:
        logger.error(f"Error calculating risk for session {session_id}: {e}")
        return {
            "score": 50,
            "level": "MEDIUM",
            "factors": {},
            "recommendation": f"Risk calculation error: {str(e)}"
        }


def generate_recommendation(
    score: float,
    level: str,
    in_unsafe_area: bool = False,
    battery_low: bool = False,
    inactive: bool = False,
    network_issues: bool = False
) -> str:
    """Generate AI recommendation based on risk factors."""

    if level == "CRITICAL":
        if in_unsafe_area:
            return "⚠️ CRITICAL: User in unsafe zone. Immediate response recommended."
        if battery_low:
            return "⚠️ CRITICAL: Battery critically low. Device may lose connection soon."
        if inactive:
            return "⚠️ CRITICAL: No location updates. Possible emergency."
        return "⚠️ CRITICAL RISK: Immediate response required."

    elif level == "HIGH":
        reasons = []
        if in_unsafe_area:
            reasons.append("unsafe zone")
        if battery_low:
            reasons.append("low battery")
        if network_issues:
            reasons.append("network issues")

        if reasons:
            return f"🔴 HIGH RISK due to {', '.join(reasons)}. Monitor closely."
        return "🔴 HIGH RISK: Recommend increased monitoring."

    elif level == "MEDIUM":
        reasons = []
        if in_unsafe_area:
            reasons.append("in reported unsafe area")
        if inactive:
            reasons.append("recent inactivity")

        if reasons:
            return f"🟡 MEDIUM RISK: User {', '.join(reasons)}."
        return "🟡 MEDIUM RISK: Standard monitoring active."

    else:  # LOW
        return "🟢 LOW RISK: User appears safe."


def record_risk_history(
    session_id: UUID,
    risk_data: Dict,
    db: Session
) -> Optional[RiskHistory]:
    """Record risk score in history for trend tracking."""
    try:
        history = RiskHistory(
            session_id=session_id,
            score=risk_data["score"],
            level=risk_data["level"],
            time_of_day_factor=risk_data["factors"].get("time_of_day", 0.0),
            unsafe_area_factor=risk_data["factors"].get("unsafe_area", 0.0),
            inactivity_factor=risk_data["factors"].get("inactivity", 0.0),
            emergency_frequency_factor=risk_data["factors"].get("emergency_frequency", 0.0),
            battery_level_factor=risk_data["factors"].get("battery_level", 0.0),
            network_status_factor=risk_data["factors"].get("network_status", 0.0),
            recommendation=risk_data.get("recommendation")
        )

        db.add(history)
        db.commit()
        db.refresh(history)

        return history
    except Exception as e:
        logger.error(f"Error recording risk history for session {session_id}: {e}")
        return None


def get_risk_history(
    session_id: UUID,
    db: Session,
    limit: int = 100
) -> List[RiskHistory]:
    """Get risk score history for trend analysis."""
    return db.query(RiskHistory).filter(
        RiskHistory.session_id == session_id
    ).order_by(desc(RiskHistory.created_at)).limit(limit).all()
