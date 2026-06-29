"""Geofence management and boundary detection service."""
import logging
from typing import Optional, List, Dict, Tuple
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from shapely.geometry import Point, Polygon, shape
from sqlalchemy import desc

from app.models import Geofence, GeofenceEvent, GeofenceType
from app.database import SessionLocal

logger = logging.getLogger(__name__)


def parse_geojson_polygon(coordinates: Dict) -> Polygon:
    """
    Parse GeoJSON polygon to Shapely Polygon.

    GeoJSON format: {"type": "Polygon", "coordinates": [[[lon, lat], ...]]}
    """
    if isinstance(coordinates, dict) and coordinates.get("type") == "Polygon":
        geom = shape(coordinates)
        if isinstance(geom, Polygon):
            return geom
    elif isinstance(coordinates, list) and len(coordinates) > 0:
        # Direct coordinate list: [[[lon, lat], ...]]
        return Polygon(coordinates[0])

    raise ValueError(f"Invalid polygon coordinates: {coordinates}")


def point_in_polygon(latitude: float, longitude: float, polygon: Polygon) -> bool:
    """
    Check if a point (lat, lon) is inside a polygon.
    Uses Shapely Point.within() for efficient containment.
    """
    point = Point(longitude, latitude)  # Note: Shapely uses (lon, lat)
    return point.within(polygon)


def get_geofence(geofence_id: UUID, db: Session) -> Optional[Geofence]:
    """Retrieve a geofence by ID."""
    return db.query(Geofence).filter(Geofence.id == geofence_id).first()


def list_geofences(
    db: Session,
    filter_type: Optional[GeofenceType] = None,
    active_only: bool = True
) -> List[Geofence]:
    """
    List all geofences.

    Args:
        db: Database session
        filter_type: Filter by SAFE or UNSAFE (None = all)
        active_only: Only return active geofences
    """
    query = db.query(Geofence)

    if active_only:
        query = query.filter(Geofence.is_active == True)

    if filter_type:
        query = query.filter(Geofence.type == filter_type)

    return query.all()


def create_geofence(
    name: str,
    type: GeofenceType,
    polygon_coordinates: Dict,
    description: Optional[str] = None,
    db: Optional[Session] = None
) -> Geofence:
    """
    Create a new geofence.

    Args:
        name: Geofence name (e.g., "Police Station", "Safe Zone A")
        type: SAFE or UNSAFE
        polygon_coordinates: GeoJSON polygon {"type": "Polygon", "coordinates": [...]}
        description: Optional description
        db: Database session (creates temporary if None)
    """
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False

    try:
        # Validate polygon
        try:
            parse_geojson_polygon(polygon_coordinates)
        except ValueError as e:
            logger.error(f"Invalid polygon for geofence {name}: {e}")
            raise

        geofence = Geofence(
            name=name,
            type=type,
            polygon_coordinates=polygon_coordinates,
            description=description,
            is_active=True
        )

        db.add(geofence)
        db.commit()
        db.refresh(geofence)

        logger.info(f"Created geofence: {name} ({type})")
        return geofence
    finally:
        if should_close:
            db.close()


def update_geofence(
    geofence_id: UUID,
    updates: Dict,
    db: Session
) -> Optional[Geofence]:
    """Update a geofence."""
    geofence = db.query(Geofence).filter(Geofence.id == geofence_id).first()

    if not geofence:
        logger.warning(f"Geofence not found: {geofence_id}")
        return None

    # Validate polygon if updating coordinates
    if "polygon_coordinates" in updates:
        try:
            parse_geojson_polygon(updates["polygon_coordinates"])
        except ValueError as e:
            logger.error(f"Invalid polygon update for geofence {geofence_id}: {e}")
            raise

    for key, value in updates.items():
        if hasattr(geofence, key):
            setattr(geofence, key, value)

    geofence.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(geofence)

    logger.info(f"Updated geofence: {geofence_id}")
    return geofence


def delete_geofence(geofence_id: UUID, db: Session) -> bool:
    """Soft delete a geofence (mark inactive)."""
    geofence = db.query(Geofence).filter(Geofence.id == geofence_id).first()

    if not geofence:
        logger.warning(f"Geofence not found: {geofence_id}")
        return False

    geofence.is_active = False
    geofence.updated_at = datetime.utcnow()
    db.commit()

    logger.info(f"Deleted geofence: {geofence_id}")
    return True


def detect_geofence_breach(
    session_id: UUID,
    latitude: float,
    longitude: float,
    db: Session
) -> Tuple[List[Geofence], List[Geofence]]:
    """
    Detect geofence entries and exits for a location.

    Returns:
        (entered_geofences, exited_geofences)
    """
    entered = []
    exited = []

    # Get all active geofences
    geofences = list_geofences(db, active_only=True)

    if not geofences:
        return [], []

    try:
        # Check current location against each geofence
        for geofence in geofences:
            polygon = parse_geojson_polygon(geofence.polygon_coordinates)
            is_inside = point_in_polygon(latitude, longitude, polygon)

            # Get most recent event for this session/geofence
            last_event = db.query(GeofenceEvent).filter(
                GeofenceEvent.session_id == session_id,
                GeofenceEvent.geofence_id == geofence.id
            ).order_by(desc(GeofenceEvent.created_at)).first()

            was_inside = last_event and last_event.event_type == "ENTER"

            # Detect state transitions
            if is_inside and not was_inside:
                entered.append(geofence)
            elif not is_inside and was_inside:
                exited.append(geofence)

    except Exception as e:
        logger.error(f"Error detecting geofence breach for session {session_id}: {e}")
        return [], []

    return entered, exited


def create_geofence_event(
    session_id: UUID,
    geofence_id: UUID,
    event_type: str,
    latitude: float,
    longitude: float,
    risk_score: Optional[float] = None,
    db: Optional[Session] = None
) -> Optional[GeofenceEvent]:
    """
    Record a geofence event (ENTER, EXIT, BREACH).

    Args:
        session_id: Emergency session ID
        geofence_id: Geofence ID
        event_type: ENTER, EXIT, or BREACH
        latitude: User latitude
        longitude: User longitude
        risk_score: Current risk score at time of event
        db: Database session
    """
    if db is None:
        db = SessionLocal()
        should_close = True
    else:
        should_close = False

    try:
        geofence = db.query(Geofence).filter(Geofence.id == geofence_id).first()
        if not geofence:
            logger.warning(f"Geofence not found: {geofence_id}")
            return None

        event = GeofenceEvent(
            session_id=session_id,
            geofence_id=geofence_id,
            event_type=event_type,
            geofence_name=geofence.name,
            geofence_type=geofence.type,
            latitude=latitude,
            longitude=longitude,
            risk_score_at_event=risk_score
        )

        db.add(event)
        db.commit()
        db.refresh(event)

        logger.info(
            f"Created geofence event: {event_type} for {geofence.name} "
            f"(session: {session_id}, risk: {risk_score})"
        )
        return event
    finally:
        if should_close:
            db.close()


def get_geofence_events(
    session_id: UUID,
    db: Session,
    limit: int = 100
) -> List[GeofenceEvent]:
    """Get recent geofence events for a session."""
    return db.query(GeofenceEvent).filter(
        GeofenceEvent.session_id == session_id
    ).order_by(desc(GeofenceEvent.created_at)).limit(limit).all()
