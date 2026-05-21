import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from socketio import AsyncServer
from socketio.asgi import ASGIApp

from backend.websocket import events as socket_events
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

# Socket.IO server
sio = AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = ASGIApp(sio, other_asgi_app=app)


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
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host='0.0.0.0', port=int(os.getenv('PORT', 8000)))
