import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from socketio import AsyncServer
from socketio.asgi import ASGIApp

from backend.websocket import events as socket_events
from backend.websocket.socket_server import create_socket_server
from backend.services.notification_service import NotificationService
from backend.database import db_config
from backend.api import emergency_routes as emergency_api

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/safety_guard')

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO server (centralized)
socket_server = create_socket_server(app=app)
sio = socket_server.get_server()
socket_app = socket_server.get_asgi_app()


@app.on_event("startup")
async def startup():
    db_config.init_db(DATABASE_URL)
    notifier = NotificationService()
    socket_events.init_socket_handlers(sio, notifier)
    # expose objects for API routers
    app.state.sio = sio
    app.state.notifier = notifier

# include API routers
app.include_router(emergency_api.router, prefix="/api/emergency")


@app.get("/health")
async def health():
    return {"status": "ok", "socketio": True}


@app.get('/socket-test')
async def socket_test():
    """Emit sample events for frontend verification."""
    try:
        # sample location update
        await sio.emit('LOCATION_UPDATED', {
            'userId': 'test-user', 'sessionId': 'test-session', 'latitude': 12.9716, 'longitude': 77.5946, 'speed': 0.5, 'battery': 88, 'timestamp': None
        }, room='dashboard')
        await sio.emit('EMERGENCY_TRIGGERED', {
            'sessionId': 'test-session', 'userId': 'test-user', 'location': {'lat': 12.9716, 'lng': 77.5946}, 'timestamp': None
        }, room='dashboard')
        await sio.emit('ALERT_SENT', {'contact': '+10000000000', 'timestamp': None}, room='dashboard')
        return {'status': 'ok', 'emitted': True}
    except Exception as e:
        return {'status': 'error', 'error': str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host='0.0.0.0', port=int(os.getenv('PORT', 8000)))
