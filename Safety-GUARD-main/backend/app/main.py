"""Main FastAPI application with Socket.IO integration."""
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Annotated, Optional, cast
import socketio  # type: ignore[import]
import logging
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db, get_db
from app.events.broadcaster import EventBroadcaster
from app.events import socketio_handler

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=settings.cors_origins,
    ping_timeout=60,
    ping_interval=25,
)

broadcaster: Optional[EventBroadcaster] = None

INVALID_USER_ID_DETAIL = "Invalid user_id"
INVALID_SESSION_ID_DETAIL = "Invalid session_id"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    logger.info("Starting Safety-GUARD backend...")

    # Ensure SQLAlchemy models are imported before creating tables
    try:
        from app import models  # noqa: F401
        init_db()
        logger.info("Database initialized")
    except Exception:
        logger.exception("Database initialization failed")
        raise

    # Initialize event broadcaster
    import app.events.broadcaster as broadcaster_module
    global broadcaster
    broadcaster = EventBroadcaster(sio)
    broadcaster_module.broadcaster = broadcaster
    logger.info("Event broadcaster initialized")

    yield

    logger.info("Shutting down Safety-GUARD backend...")


# Create FastAPI app
app = FastAPI(
    title="Safety-GUARD Emergency Response API",
    description="AI-powered real-time emergency response system",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, app)


# ===========================
# SOCKET.IO EVENT HANDLERS
# ===========================

@sio.on('connect')
async def on_connect(sid, environ):
    """Handle client connection."""
    logger.info(f"Client connected: {sid}")
    await sio.emit('connection:established', {
        'message': 'Connected to Safety-GUARD backend',
        'timestamp': None
    }, to=sid)


@sio.on('disconnect')
def on_disconnect(sid):
    """Handle client disconnection."""
    logger.info(f"Client disconnected: {sid}")


@sio.on('session:join')
async def on_session_join(sid, data):
    """Join emergency session room."""
    session_id = data.get('session_id')
    user_id = data.get('user_id')

    if not session_id:
        await sio.emit('error', {'message': 'session_id required'}, to=sid)
        return

    room = f"session_{session_id}"
    sio.enter_room(sid, room)

    logger.info(f"Client {sid} joined session {session_id} as user {user_id}")

    await sio.emit('session:joined', {
        'session_id': session_id,
        'room': room,
        'message': f'Joined session {session_id}'
    }, to=sid)


@sio.on('location:submit')
async def on_location_submit(sid, data):
    """Receive real-time location update."""
    session_id = data.get('session_id')
    user_id = data.get('user_id')
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    if not all([session_id, user_id, latitude, longitude]):
        await sio.emit('error', {'message': 'Missing location data'}, to=sid)
        return

    # Process via HTTP endpoint (see API routes)
    logger.debug(f"Location received from {sid} (user_id={user_id}): {latitude}, {longitude}")


@sio.on('passcode:submit')
async def on_passcode_submit(sid, data):
    """Receive passcode submission."""
    session_id = data.get('session_id')
    passcode = data.get('passcode')

    if not all([session_id, passcode]):
        await sio.emit('error', {'message': 'session_id and passcode required'}, to=sid)
        return

    # Process via HTTP endpoint (see API routes)
    logger.info(f"Passcode submitted for session {session_id}")


# ===========================
# HTTP API ROUTES
# ===========================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Safety-GUARD Emergency Response API",
        "version": "1.0.0"
    }


DbSession = Annotated[Session, Depends(get_db)]

@app.post(
    "/api/v1/emergency/activate",
    responses={
        400: {"description": "Invalid request"},
        404: {"description": "Session not found"}
    }
)
async def activate_emergency(
    user_id: str,
    db: DbSession
):
    """Activate emergency session."""
    from app.services.emergency_manager import EmergencySessionManager

    try:
        from uuid import UUID
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=INVALID_USER_ID_DETAIL)

    session = EmergencySessionManager.create_session(db, user_uuid)

    return {
        "session_id": str(session.id),
        "passcode": session.passcode,
        "timeout_seconds": settings.emergency_timeout_seconds,
        "status": session.status.value
    }


@app.post(
    "/api/v1/emergency/submit-location",
    responses={
        400: {"description": "Invalid request"},
        404: {"description": "Session not found"}
    }
)
async def submit_location(
    session_id: str,
    user_id: str,
    latitude: float,
    longitude: float,
    accuracy: Optional[float] = None,
    db: DbSession
):
    """Submit real-time location."""
    from app.services.gps_tracking import GPSTrackingService
    from uuid import UUID

    try:
        session_uuid = UUID(session_id)
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid IDs")

    location = GPSTrackingService.record_location(
        db, session_uuid, user_uuid,
        latitude, longitude, accuracy
    )

    # Broadcast location update via Socket.IO
    if broadcaster:
        await broadcaster.broadcast_location_update(
            session_id, latitude, longitude, accuracy
        )

    return {
        "location_id": str(location.id),
        "recorded_at": location.created_at.isoformat()
    }


@app.post(
    "/api/v1/emergency/verify-passcode",
    responses={
        400: {"description": "Invalid request"},
        404: {"description": "Session not found"}
    }
)
async def verify_passcode(
    session_id: str,
    passcode: str,
    db: DbSession
):
    """Verify passcode."""
    from app.services.emergency_manager import EmergencySessionManager
    from uuid import UUID

    try:
        session_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=INVALID_SESSION_ID_DETAIL)

    is_correct, session = EmergencySessionManager.verify_passcode(
        db, session_uuid, passcode
    )

    if is_correct:
        # Broadcast session resolved
        if broadcaster:
            await broadcaster.broadcast_session_resolved(
                session_id, "passcode_verified"
            )

        return {
            "success": True,
            "message": "Emergency cancelled - passcode correct",
            "status": session.status.value
        }
    else:
        # Broadcast emergency triggered
        if broadcaster:
            user_id_value = str(session.user_id)
            location_data = cast(dict, session.last_location or {})
            threat_score_value = cast(float, session.ai_threat_score or 0.0)

            await broadcaster.broadcast_emergency_triggered(
                session_id,
                user_id_value,
                location_data,
                threat_score_value
            )

        return {
            "success": False,
            "message": "Wrong passcode - emergency alert triggered",
            "status": session.status.value,
            "attempts": session.passcode_attempts
        }


@app.post(
    "/api/v1/emergency/send-alert",
    responses={
        400: {"description": "Invalid request"},
        404: {"description": "Session not found"}
    }
)
async def send_alert(
    session_id: str,
    db: DbSession
):
    """Trigger emergency alert."""
    from app.services.emergency_manager import EmergencySessionManager
    from app.services.notifications import notification_service
    from app.services.gps_tracking import GPSTrackingService
    from uuid import UUID

    try:
        session_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=INVALID_SESSION_ID_DETAIL)

    # Get session
    from app.models import EmergencySession
    session = db.query(EmergencySession).filter(
        EmergencySession.id == session_uuid
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Generate location link
    if session.last_location:
        location_link = GPSTrackingService.generate_maps_link(
            session.last_location["lat"],
            session.last_location["lng"]
        )
    else:
        location_link = "Location unavailable"

    # Send alerts
    alerts = await notification_service.send_emergency_alert(
        db, session_uuid,
        settings.emergency_contact_numbers,
        location_link
    )

    # Broadcast alert sent
    if broadcaster:
        await broadcaster.broadcast_alert_sent(
            session_id,
            settings.emergency_contact_numbers,
            location_link
        )

    return {
        "alerts_sent": len(alerts),
        "location_link": location_link
    }


@app.get(
    "/api/v1/emergency/{session_id}",
    responses={
        400: {"description": "Invalid request"},
        404: {"description": "Session not found"}
    }
)
async def get_session(
    session_id: str,
    db: DbSession
):
    """Get emergency session details."""
    from app.models import EmergencySession
    from uuid import UUID

    try:
        session_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=INVALID_SESSION_ID_DETAIL)

    session = db.query(EmergencySession).filter(
        EmergencySession.id == session_uuid
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": str(session.id),
        "status": session.status.value,
        "is_active": session.is_active,
        "danger_detected": session.danger_detected,
        "alert_sent": session.alert_sent,
        "threat_score": session.ai_threat_score,
        "location_count": session.location_count,
        "last_location": session.last_location,
        "activated_at": session.activated_at.isoformat() if session.activated_at else None,
        "alert_sent_at": session.alert_sent_at.isoformat() if session.alert_sent_at else None
    }


@app.get(
    "/api/v1/emergency/{session_id}/locations",
    responses={
        400: {"description": "Invalid request"},
        404: {"description": "Session not found"}
    }
)
async def get_location_history(
    session_id: str,
    limit: int = 100,
    db: DbSession
):
    """Get location history."""
    from app.services.gps_tracking import GPSTrackingService
    from uuid import UUID

    try:
        session_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail=INVALID_SESSION_ID_DETAIL)

    locations = GPSTrackingService.get_location_history(db, session_uuid, limit)

    return {
        "session_id": session_id,
        "locations": [
            {
                "id": str(loc.id),
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "accuracy": loc.accuracy,
                "timestamp": loc.created_at.isoformat()
            }
            for loc in locations
        ],
        "count": len(locations)
    }


@app.get(
    "/api/v1/emergency/{session_id}/analysis",
    responses={
        400: {"description": "Invalid request"},
        404: {"description": "Session not found"}
    }
)
async def get_threat_analysis(
    session_id: str,
    db: DbSession
):
    """Get AI threat analysis."""
    from app.ai.threat_detection import AIThreatDetectionEngine
    from uuid import UUID

    try:
        session_uuid = UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session_id")

    analysis = AIThreatDetectionEngine.analyze_session(db, session_uuid)
    return analysis


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:socket_app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
