"""Socket.IO Event Broadcasting System."""
from socketio import AsyncServer
from typing import Any, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class EventBroadcaster:
    """Broadcasts Socket.IO events to connected clients."""

    def __init__(self, sio: AsyncServer):
        """Initialize with Socket.IO server."""
        self.sio = sio
        self.active_sessions = {}  # session_id -> {room, timestamp, ...}

    async def broadcast_emergency_triggered(
        self,
        session_id: str,
        user_id: str,
        location: dict,
        threat_score: float
    ) -> None:
        """Broadcast emergency triggered event."""
        event_data = {
            "session_id": session_id,
            "user_id": user_id,
            "location": location,
            "threat_score": threat_score,
            "timestamp": None,  # Handled by client
            "event_type": "EMERGENCY_TRIGGERED"
        }

        await self.sio.emit(
            "emergency:triggered",
            event_data,
            room=f"session_{session_id}",
            skip_sid=None
        )

        logger.info(f"Broadcast: EMERGENCY_TRIGGERED for session {session_id}")

    async def broadcast_location_update(
        self,
        session_id: str,
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None,
        threat_score: float = 0.0
    ) -> None:
        """Broadcast real-time location update."""
        event_data = {
            "session_id": session_id,
            "latitude": latitude,
            "longitude": longitude,
            "accuracy": accuracy,
            "threat_score": threat_score,
            "event_type": "LOCATION_UPDATED"
        }

        await self.sio.emit(
            "location:updated",
            event_data,
            room=f"session_{session_id}",
            skip_sid=None
        )

        logger.debug(f"Broadcast: LOCATION_UPDATED for session {session_id}")

    async def broadcast_threat_detected(
        self,
        session_id: str,
        threat_type: str,
        threat_score: float,
        description: str,
        recommendations: list
    ) -> None:
        """Broadcast threat detection event."""
        event_data = {
            "session_id": session_id,
            "threat_type": threat_type,
            "threat_score": threat_score,
            "threat_level": self._score_to_level(threat_score),
            "description": description,
            "recommendations": recommendations,
            "event_type": "THREAT_DETECTED"
        }

        await self.sio.emit(
            "threat:detected",
            event_data,
            room=f"session_{session_id}",
            skip_sid=None
        )

        logger.warning(f"Broadcast: THREAT_DETECTED {threat_type} for session {session_id}")

    async def broadcast_alert_sent(
        self,
        session_id: str,
        recipients: list,
        location_link: str
    ) -> None:
        """Broadcast alert sent event."""
        event_data = {
            "session_id": session_id,
            "recipients_count": len(recipients),
            "location_link": location_link,
            "event_type": "ALERT_SENT"
        }

        await self.sio.emit(
            "alert:sent",
            event_data,
            room=f"session_{session_id}",
            skip_sid=None
        )

        logger.info(f"Broadcast: ALERT_SENT to {len(recipients)} recipients for session {session_id}")

    async def broadcast_status_changed(
        self,
        session_id: str,
        new_status: str,
        old_status: str
    ) -> None:
        """Broadcast session status change."""
        event_data = {
            "session_id": session_id,
            "old_status": old_status,
            "new_status": new_status,
            "event_type": "STATUS_CHANGED"
        }

        await self.sio.emit(
            "session:status_changed",
            event_data,
            room=f"session_{session_id}",
            skip_sid=None
        )

        logger.info(f"Broadcast: STATUS_CHANGED {old_status} → {new_status} for session {session_id}")

    async def broadcast_session_resolved(
        self,
        session_id: str,
        resolution_reason: str
    ) -> None:
        """Broadcast session resolved event."""
        event_data = {
            "session_id": session_id,
            "resolution_reason": resolution_reason,
            "event_type": "SESSION_RESOLVED"
        }

        await self.sio.emit(
            "session:resolved",
            event_data,
            room=f"session_{session_id}",
            skip_sid=None
        )

        logger.info(f"Broadcast: SESSION_RESOLVED for {session_id}")

    async def broadcast_geofence_enter(
        self,
        session_id: str,
        user_id: str,
        geofence_id: str,
        geofence_name: str,
        geofence_type: str
    ) -> None:
        """Broadcast user entered geofence event."""
        event_data = {
            "session_id": session_id,
            "user_id": user_id,
            "geofence_id": geofence_id,
            "geofence_name": geofence_name,
            "geofence_type": geofence_type,
            "event_type": "GEOFENCE_ENTER"
        }

        await self.sio.emit(
            "geofence:enter",
            event_data,
            room=f"session_{session_id}",
            skip_sid=None
        )

        logger.info(f"Broadcast: GEOFENCE_ENTER {geofence_name} for session {session_id}")

    async def broadcast_geofence_exit(
        self,
        session_id: str,
        user_id: str,
        geofence_id: str,
        geofence_name: str,
        geofence_type: str
    ) -> None:
        """Broadcast user exited geofence event."""
        event_data = {
            "session_id": session_id,
            "user_id": user_id,
            "geofence_id": geofence_id,
            "geofence_name": geofence_name,
            "geofence_type": geofence_type,
            "event_type": "GEOFENCE_EXIT"
        }

        await self.sio.emit(
            "geofence:exit",
            event_data,
            room=f"session_{session_id}",
            skip_sid=None
        )

        logger.info(f"Broadcast: GEOFENCE_EXIT {geofence_name} for session {session_id}")

    async def broadcast_geofence_breach(
        self,
        session_id: str,
        user_id: str,
        geofence_id: str,
        geofence_name: str,
        risk_score: float
    ) -> None:
        """Broadcast unsafe zone breach event (UNSAFE geofence entry)."""
        event_data = {
            "session_id": session_id,
            "user_id": user_id,
            "geofence_id": geofence_id,
            "geofence_name": geofence_name,
            "risk_score": risk_score,
            "risk_level": self._score_to_level(risk_score),
            "event_type": "GEOFENCE_BREACH"
        }

        await self.sio.emit(
            "geofence:breach",
            event_data,
            room=f"session_{session_id}",
            skip_sid=None
        )

        logger.warning(f"Broadcast: GEOFENCE_BREACH {geofence_name} for session {session_id} (risk: {risk_score})")

    async def broadcast_risk_score_changed(
        self,
        session_id: str,
        user_id: str,
        score: float,
        level: str,
        factors: dict,
        recommendation: str
    ) -> None:
        """Broadcast risk score update event."""
        event_data = {
            "session_id": session_id,
            "user_id": user_id,
            "score": score,
            "level": level,
            "factors": factors,
            "recommendation": recommendation,
            "event_type": "RISK_SCORE_CHANGED"
        }

        await self.sio.emit(
            "risk:score_changed",
            event_data,
            room=f"session_{session_id}",
            skip_sid=None
        )

        logger.info(f"Broadcast: RISK_SCORE_CHANGED {level} ({score}) for session {session_id}")

    def _score_to_level(self, score: float) -> str:
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


# Global broadcaster instance (initialized in main.py)
broadcaster = None
