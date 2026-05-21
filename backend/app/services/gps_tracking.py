"""GPS Tracking Service - handles real-time location streaming."""
from typing import Optional
from sqlalchemy.orm import Session
from app.models import LiveLocation, EmergencySession
from app.config import settings
from uuid import UUID
from datetime import datetime, timezone
import logging
import math

logger = logging.getLogger(__name__)


class GPSTrackingService:
    """Manages GPS tracking and location analysis."""

    @staticmethod
    def record_location(
        db: Session,
        session_id: UUID,
        user_id: UUID,
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None,
        altitude: Optional[float] = None,
        heading: Optional[float] = None,
        speed: Optional[float] = None
    ) -> LiveLocation:
        """Record new location update."""

        location = LiveLocation(
            session_id=session_id,
            user_id=user_id,
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy,
            altitude=altitude,
            heading=heading,
            speed=speed,
            movement_speed_kmh=speed * 3.6 if speed else None,
        )

        db.add(location)
        db.commit()
        db.refresh(location)

        # Update session location count
        session = db.query(EmergencySession).filter(
            EmergencySession.id == session_id
        ).first()
        if session:
            setattr(session, 'last_location', {
                "lat": latitude,
                "lng": longitude,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            current_count = int(session.location_count or 0)
            setattr(session, 'location_count', current_count + 1)
            db.commit()

        logger.debug(f"Location recorded: {latitude}, {longitude}")
        return location

    @staticmethod
    def get_location_history(
        db: Session,
        session_id: UUID,
        limit: int = 100
    ) -> list[LiveLocation]:
        """Get location history for session."""
        locations = db.query(LiveLocation).filter(
            LiveLocation.session_id == session_id
        ).order_by(LiveLocation.created_at.desc()).limit(limit).all()
        return list(reversed(locations))  # Return in chronological order

    @staticmethod
    def calculate_distance(
        lat1: float, lon1: float,
        lat2: float, lon2: float
    ) -> float:
        """Calculate distance between two coordinates (Haversine formula)."""
        R = 6371  # Earth radius in km

        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)

        a = (math.sin(dlat/2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon/2) ** 2)

        c = 2 * math.asin(math.sqrt(a))
        return R * c

    @staticmethod
    def detect_anomalous_movement(
        db: Session,
        session_id: UUID
    ) -> dict:
        """Detect anomalous movement patterns."""
        locations = db.query(LiveLocation).filter(
            LiveLocation.session_id == session_id
        ).order_by(LiveLocation.created_at.desc()).limit(10).all()

        if len(locations) < 2:
            return {
                "is_anomalous": False,
                "reason": "insufficient_data"
            }

        # Reverse to chronological order
        locations = list(reversed(locations))

        # Calculate speeds
        speeds = []
        for i in range(1, len(locations)):
            prev = locations[i-1]
            curr = locations[i]

            distance = GPSTrackingService.calculate_distance(
                float(prev.latitude), float(prev.longitude),
                float(curr.latitude), float(curr.longitude)
            )

            time_diff = (curr.created_at - prev.created_at).total_seconds() / 3600  # hours

            if time_diff > 0:
                speed = distance / time_diff  # km/h
                speeds.append(speed)

        if not speeds:
            return {"is_anomalous": False, "reason": "no_movement"}

        avg_speed = sum(speeds) / len(speeds)
        max_speed = max(speeds)

        # Anomalies: extremely high speed (possible vehicle theft/kidnapping)
        # or complete stillness (possible unconsciousness)
        is_anomalous = (max_speed > 150 or avg_speed > 100)

        return {
            "is_anomalous": is_anomalous,
            "avg_speed_kmh": avg_speed,
            "max_speed_kmh": max_speed,
            "samples": len(speeds)
        }

    @staticmethod
    def generate_maps_link(latitude: float, longitude: float) -> str:
        """Generate Google Maps link."""
        return f"https://www.google.com/maps/search/?api=1&query={latitude},{longitude}"
