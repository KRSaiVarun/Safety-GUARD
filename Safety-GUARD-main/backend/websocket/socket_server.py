"""Socket.IO ASGI server helper for Safety-GUARD backend.

Creates AsyncServer + ASGIApp and exposes helper emit/join functions.
"""
from typing import Any, Dict, Optional
import logging
import os
from socketio import AsyncServer
from socketio.asgi import ASGIApp

logger = logging.getLogger(__name__)


class SocketServer:
    def __init__(self, app=None):
        # Allow all origins for dashboard; change in prod
        self.sio = AsyncServer(async_mode='asgi', cors_allowed_origins='*', logger=False, engineio_logger=False)
        # Combine with FastAPI app
        self.app = app
        self.asgi_app = ASGIApp(self.sio, other_asgi_app=app)

    def get_server(self) -> AsyncServer:
        return self.sio

    def get_asgi_app(self) -> ASGIApp:
        return self.asgi_app

    # High-level emits
    async def emit_location(self, payload: Dict[str, Any], room: Optional[str] = 'dashboard'):
        """Emit LOCATION_UPDATED to a room."""
        await self.sio.emit('LOCATION_UPDATED', payload, room=room)

    async def emit_emergency_triggered(self, payload: Dict[str, Any], room: Optional[str] = 'dashboard'):
        await self.sio.emit('EMERGENCY_TRIGGERED', payload, room=room)

    async def emit_emergency_resolved(self, payload: Dict[str, Any], room: Optional[str] = 'dashboard'):
        await self.sio.emit('EMERGENCY_RESOLVED', payload, room=room)

    async def emit_alert_sent(self, payload: Dict[str, Any], room: Optional[str] = 'dashboard'):
        await self.sio.emit('ALERT_SENT', payload, room=room)

    async def emit_alert_delivered(self, payload: Dict[str, Any], room: Optional[str] = 'dashboard'):
        await self.sio.emit('ALERT_DELIVERED', payload, room=room)

    async def emit_alert_failed(self, payload: Dict[str, Any], room: Optional[str] = 'dashboard'):
        await self.sio.emit('ALERT_FAILED', payload, room=room)

    async def emit_risk_scored(self, payload: Dict[str, Any], room: Optional[str] = 'dashboard'):
        await self.sio.emit('RISK_SCORED', payload, room=room)

    async def emit_user_online(self, user_id: str, room: Optional[str] = 'dashboard'):
        await self.sio.emit('USER_ONLINE', {'userId': user_id}, room=room)

    async def emit_user_offline(self, user_id: str, room: Optional[str] = 'dashboard'):
        await self.sio.emit('USER_OFFLINE', {'userId': user_id}, room=room)


_server: Optional[SocketServer] = None


def create_socket_server(app=None) -> SocketServer:
    global _server
    if _server is None:
        _server = SocketServer(app=app)
        logger.info('SocketServer created')
    return _server


def get_socket_server() -> SocketServer:
    if _server is None:
        raise RuntimeError('Socket server not initialized')
    return _server
