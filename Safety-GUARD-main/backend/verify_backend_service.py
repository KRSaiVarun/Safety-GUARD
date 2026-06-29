import uuid
import json

import requests
import socketio

base = "http://127.0.0.1:8000"
health = requests.get(base + "/health")
print("GET /health ->", health.status_code, health.text)

user_id = "00000000-0000-0000-0000-000000000001"
activate = requests.post(base + "/api/v1/emergency/activate", params={"user_id": user_id})
print("POST /api/v1/emergency/activate ->", activate.status_code, activate.text)

try:
    data = activate.json()
except Exception as exc:
    print("activate json error:", exc)
    raise SystemExit(1)

session_id = data.get("session_id")
print("session_id ->", session_id)
if not session_id:
    raise SystemExit("No session_id returned")

sio = socketio.Client()

@sio.on("session:joined")
def on_session_joined(msg):
    print("session:joined ->", msg)
    sio.disconnect()

@sio.on("connect")
def on_connect():
    print("socket connected")

@sio.on("disconnect")
def on_disconnect():
    print("socket disconnected")

sio.connect(base)
sio.emit("session:join", {"session_id": session_id, "user_id": user_id})
import time
# Allow the event to be received before exiting
time.sleep(5)
sio.disconnect()
