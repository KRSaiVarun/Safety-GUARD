---
name: SafetyGUARD GPS & Socket.IO
description: Real-time GPS tracking architecture — Socket.IO setup, TacticalMap fix, locationStore emit pattern.
---

## Socket.IO backend pattern
python-socketio was in requirements.txt but NOT installed (pip install required separately).
Use `socketio.ASGIApp(sio, other_asgi_app=_app)` wrapping FastAPI, exposed as `app` so uvicorn command stays the same.
Rooms: user devices emit LOCATION_UPDATED → backend broadcasts to 'dashboard' room → admin views receive.

## TacticalMap timing bug (fixed)
Original bug: `let L = null; import('leaflet').then(m => { L = m })` at module level.
Update useEffect checked `if (!L) return` and bailed silently when Leaflet hadn't resolved yet.
Fix: `await import('leaflet')` INSIDE the update effect — eliminates race condition entirely.
Also: wait up to 2s for mapInstRef.current to be ready (avoids mounting-order issues).

## locationStore socket pattern
Use lazy socket import (`getSocket()` returns cached singleton) to avoid circular deps.
`addLocation()` emits LOCATION_UPDATED after updating Zustand state.
`injectLocation()` is the admin-side receiver — updates store without re-emitting.
`stopTracking()` emits SESSION_ENDED before clearing state.

## Admin dashboard socket subscription
Both DashboardPage AND AdminLiveTrackingPage join 'dashboard' room and listen for LOCATION_UPDATED.
Both call `injectLocation()` to update the shared Zustand locationStore.
TacticalMap is prop-driven: callers must pass `locations={trail} current={loc}`.

## Vite proxy for Socket.IO
```js
'/socket.io': { target: 'http://localhost:8000', changeOrigin: true, ws: true }
```
Socket client connects to `'/'` (same origin) — vite proxy routes WebSocket upgrades to port 8000.
