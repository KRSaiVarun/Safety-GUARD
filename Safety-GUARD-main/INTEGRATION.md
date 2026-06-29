# Frontend-Backend Integration Guide

This guide shows how to integrate the existing React frontend with the new FastAPI + Socket.IO backend.

## Backend Server Setup

### 1. Start PostgreSQL & Redis (Local Development)

```bash
cd backend
docker-compose up -d
```

Verify:

```bash
docker-compose logs postgres redis
```

### 2. Install & Run Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:socket_app --host 0.0.0.0 --port 8000 --reload
```

Backend will be at: `http://localhost:8000`

Test: `curl http://localhost:8000/health`

## Frontend Integration

Update the React frontend to use the new backend APIs and Socket.IO.

### 1. Install Socket.IO Client

```bash
cd src
npm install socket.io-client
```

### 2. Create Backend API Client

Create `src/lib/api.ts`:

```typescript
import axios from "axios";
import { io, Socket } from "socket.io-client";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// HTTP Client
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Socket.IO Client
let socket: Socket | null = null;

export function connectSocket(sessionId: string, userId: string) {
  socket = io(API_BASE_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);

    // Join session room
    socket?.emit("session:join", {
      session_id: sessionId,
      user_id: userId,
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Emergency API Calls
export const emergencyApi = {
  activate: async (userId: string) => {
    return apiClient.post("/emergency/activate", null, {
      params: { user_id: userId },
    });
  },

  submitLocation: async (
    sessionId: string,
    userId: string,
    lat: number,
    lng: number,
  ) => {
    return apiClient.post("/emergency/submit-location", null, {
      params: {
        session_id: sessionId,
        user_id: userId,
        latitude: lat,
        longitude: lng,
      },
    });
  },

  verifyPasscode: async (sessionId: string, passcode: string) => {
    return apiClient.post("/emergency/verify-passcode", null, {
      params: {
        session_id: sessionId,
        passcode,
      },
    });
  },

  sendAlert: async (sessionId: string) => {
    return apiClient.post("/emergency/send-alert", null, {
      params: { session_id: sessionId },
    });
  },

  getSession: async (sessionId: string) => {
    return apiClient.get(`/emergency/${sessionId}`);
  },

  getLocations: async (sessionId: string, limit: number = 100) => {
    return apiClient.get(`/emergency/${sessionId}/locations`, {
      params: { limit },
    });
  },

  getAnalysis: async (sessionId: string) => {
    return apiClient.get(`/emergency/${sessionId}/analysis`);
  },
};
```

### 3. Update Emergency Page

Update `src/pages/EmergencyPage.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { emergencyApi, connectSocket, getSocket, disconnectSocket } from '@/lib/api'

export default function EmergencyPage() {
  const { user } = useAuthStore()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [passcode, setPasscode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Activate emergency on mount
    activateEmergency()
  }, [])

  const activateEmergency = async () => {
    if (!user?.id) return
    setIsLoading(true)

    try {
      const response = await emergencyApi.activate(user.id)
      const sid = response.data.session_id
      setSessionId(sid)

      // Connect Socket.IO
      connectSocket(sid, user.id)

      // Start GPS tracking
      startGPSTracking(sid)

      // Auto-trigger alert after timeout
      setTimeout(() => {
        triggerAlert(sid)
      }, response.data.timeout_seconds * 1000)

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to activate emergency')
    } finally {
      setIsLoading(false)
    }
  }

  const startGPSTracking = (sid: string) => {
    if (!user?.id) return

    navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords

        try {
          // Send to backend
          await emergencyApi.submitLocation(sid, user.id, latitude, longitude)

          // Emit via Socket.IO for real-time dashboard
          const socket = getSocket()
          socket?.emit('location:submit', {
            session_id: sid,
            user_id: user.id,
            latitude,
            longitude,
            accuracy
          })
        } catch (err) {
          console.error('Location submit error:', err)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    )
  }

  const handlePasscodeSubmit = async () => {
    if (!sessionId) return

    try {
      const response = await emergencyApi.verifyPasscode(sessionId, passcode)

      if (response.data.success) {
        // Safe - dismiss emergency
        setError('')
        disconnectSocket()
        // Redirect to safe page
      } else {
        // Wrong passcode - trigger alert
        triggerAlert(sessionId)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed')
    }
  }

  const triggerAlert = async (sid: string) => {
    try {
      await emergencyApi.sendAlert(sid)
    } catch (err: any) {
      console.error('Alert error:', err)
    }
  }

  return (
    <div>
      {/* Emergency UI here */}
      <h1>Emergency Mode</h1>
      {sessionId && <p>Session: {sessionId}</p>}

      <input
        type="password"
        placeholder="Enter passcode"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        minLength={6}
      />
      <button onClick={handlePasscodeSubmit} disabled={isLoading || !passcode}>
        Verify
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
```

### 4. Create Dashboard Component

Create `src/pages/DashboardPage.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { emergencyApi, connectSocket, getSocket } from '@/lib/api'
import { useSearchParams } from 'react-router-dom'

export default function DashboardPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [session, setSession] = useState<any>(null)
  const [locations, setLocations] = useState<any[]>([])
  const [analysis, setAnalysis] = useState<any>(null)
  const [liveLocation, setLiveLocation] = useState<any>(null)

  useEffect(() => {
    if (!sessionId) return

    // Fetch initial data
    fetchSessionData()

    // Connect to real-time updates
    connectSocket(sessionId, 'admin')
    const socket = getSocket()

    if (socket) {
      // Listen for location updates
      socket.on('location:updated', (data) => {
        setLiveLocation(data)
      })

      // Listen for threat detection
      socket.on('threat:detected', (data) => {
        console.log('Threat detected:', data)
        fetchAnalysis()
      })

      // Listen for status changes
      socket.on('session:status_changed', (data) => {
        fetchSessionData()
      })

      // Listen for alerts
      socket.on('alert:sent', (data) => {
        console.log('Alert sent to', data.recipients_count, 'recipients')
      })
    }

    return () => {
      if (socket) {
        socket.off('location:updated')
        socket.off('threat:detected')
        socket.off('session:status_changed')
        socket.off('alert:sent')
      }
    }
  }, [sessionId])

  const fetchSessionData = async () => {
    if (!sessionId) return

    try {
      const [sessionRes, locationsRes] = await Promise.all([
        emergencyApi.getSession(sessionId),
        emergencyApi.getLocations(sessionId)
      ])

      setSession(sessionRes.data)
      setLocations(locationsRes.data.locations || [])

      fetchAnalysis()
    } catch (err) {
      console.error('Fetch error:', err)
    }
  }

  const fetchAnalysis = async () => {
    if (!sessionId) return

    try {
      const res = await emergencyApi.getAnalysis(sessionId)
      setAnalysis(res.data)
    } catch (err) {
      console.error('Analysis error:', err)
    }
  }

  if (!sessionId) {
    return <div>No session ID provided</div>
  }

  return (
    <div>
      <h1>Emergency Dashboard</h1>

      {session && (
        <div>
          <h2>Session Status: {session.status}</h2>
          <p>Threat Score: {session.threat_score?.toFixed(2)}</p>
          <p>Locations Recorded: {session.location_count}</p>

          {liveLocation && (
            <div>
              <h3>Current Location</h3>
              <p>Lat: {liveLocation.latitude}, Lng: {liveLocation.longitude}</p>
            </div>
          )}

          {analysis && (
            <div>
              <h3>Threat Analysis</h3>
              <p>Level: {analysis.threat_level}</p>
              <ul>
                {analysis.threats?.map((t: any, i: number) => (
                  <li key={i}>{t.type}: {t.description}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### 5. Update .env Variables

Add to `.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

For production:

```
VITE_API_BASE_URL=https://safety-guard-api.herokuapp.com
```

## Environment Variables

Create `.env` in project root:

```bash
# API
VITE_API_BASE_URL=http://localhost:8000

# Supabase
VITE_SUPABASE_URL=https://nmyoxgcxvokiribbdyzf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_gJqxl0tUIyoDzt-sw734tw_Dzes2SnQ
```

## Testing the Integration

1. **Start Backend**

   ```bash
   cd backend
   uvicorn app.main:socket_app --port 8000 --reload
   ```

2. **Start Frontend**

   ```bash
   npm run dev
   ```

3. **Test Flow**
   - Navigate to `/emergency`
   - System activates emergency session
   - Enter wrong passcode → triggers alert
   - Open `/dashboard?session_id=<id>` in another tab
   - Both screens sync in real-time

## Socket.IO Event Flow

```
Emergency Screen                    Backend                   Dashboard
     │                                │                            │
     │─ POST /emergency/activate ─────│                            │
     │◄────── session_id ─────────────│                            │
     │                                │                            │
     │─ emit location:submit ─────────│                            │
     │                                │─ broadcast location:updated ─│
     │                                │                            │
     │─ emit passcode:submit ─────────│                            │
     │  (wrong passcode)              │                            │
     │◄────── ALERT TRIGGERED ────────│                            │
     │                                │─ broadcast threat:detected ──│
     │                                │                            │
     │─ POST /emergency/send-alert ───│                            │
     │                                │─ broadcast alert:sent ──────│
```

## Common Issues

### API not responding

- Check backend is running: `curl http://localhost:8000/health`
- Verify CORS is configured in backend

### Socket.IO connection fails

- Check WebSocket URL in client code
- Verify backend Socket.IO is initialized
- Check browser console for errors

### Location updates not showing

- Check browser geolocation permission
- Verify GPS_UPDATE_INTERVAL is set correctly
- Check network tab for failed POST requests

## Next Steps

1. ✅ Backend created and running locally
2. 📍 Frontend integrated with API client
3. 🔄 Socket.IO real-time sync working
4. 📊 Dashboard showing live data
5. 🚀 Deploy backend to Railway/Render
6. 🌐 Update frontend API URL to production
7. 📱 Test end-to-end emergency flow

---

See [backend/README.md](./backend/README.md) for full API documentation.
