# Safety-GUARD Python Backend

Production-grade AI emergency response backend built with FastAPI, Socket.IO, and PostgreSQL.

## Features

- ✅ Real-time emergency session management
- ✅ Live GPS tracking & location streaming
- ✅ AI threat detection engine
- ✅ Multi-channel alert system (SMS, WhatsApp, Email)
- ✅ Socket.IO event broadcasting
- ✅ Persistent emergency sessions in PostgreSQL
- ✅ Async/await throughout
- ✅ Production-ready error handling

## Tech Stack

- **Framework**: FastAPI
- **Real-time**: Socket.IO
- **Database**: PostgreSQL
- **Cache**: Redis
- **Notifications**: Twilio SMS API
- **Async**: asyncio, aioredis

## Project Structure

```
backend/
├── app/
│   ├── api/              # API routes
│   ├── services/         # Business logic
│   │   ├── emergency_manager.py
│   │   ├── gps_tracking.py
│   │   └── notifications.py
│   ├── models/          # SQLAlchemy models
│   ├── database/        # Database setup
│   ├── events/          # Socket.IO broadcasting
│   ├── ai/              # Threat detection
│   ├── config.py        # Configuration
│   └── main.py          # FastAPI app
├── docker-compose.yml   # Local dev environment
├── requirements.txt     # Python dependencies
└── README.md
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Setup Database (Local)

Option A: Using Docker Compose

```bash
docker-compose up -d
```

Option B: Using existing PostgreSQL

```bash
# Update .env with your DATABASE_URL
```

### 3. Initialize Database

```bash
python -c "from app.database import init_db; init_db()"
```

### 4. Run Development Server

```bash
uvicorn app.main:socket_app --host 0.0.0.0 --port 8000 --reload
```

Server will be available at: `http://localhost:8000`

### 5. Test Connection

```bash
curl http://localhost:8000/health
```

## API Endpoints

### Emergency Management

#### Activate Emergency

```
POST /api/v1/emergency/activate
Query params: user_id

Response:
{
  "session_id": "uuid",
  "passcode": "123456",
  "timeout_seconds": 10,
  "status": "monitoring"
}
```

#### Submit Location

```
POST /api/v1/emergency/submit-location
Query params: session_id, user_id, latitude, longitude, accuracy (optional)

Response:
{
  "location_id": "uuid",
  "recorded_at": "2024-05-17T12:00:00"
}
```

#### Verify Passcode

```
POST /api/v1/emergency/verify-passcode
Query params: session_id, passcode

Response:
{
  "success": true/false,
  "message": "...",
  "status": "resolved|alert_triggered"
}
```

#### Send Alert

```
POST /api/v1/emergency/send-alert
Query params: session_id

Response:
{
  "alerts_sent": 2,
  "location_link": "https://maps.google.com/..."
}
```

#### Get Session

```
GET /api/v1/emergency/{session_id}

Response:
{
  "id": "uuid",
  "status": "monitoring|alert_triggered|...",
  "is_active": true,
  "danger_detected": false,
  "threat_score": 0.45,
  "last_location": {"lat": 12.9, "lng": 77.5},
  "location_count": 5
}
```

#### Get Location History

```
GET /api/v1/emergency/{session_id}/locations?limit=100

Response:
{
  "session_id": "uuid",
  "locations": [
    {
      "id": "uuid",
      "latitude": 12.9,
      "longitude": 77.5,
      "accuracy": 15.0,
      "timestamp": "2024-05-17T12:00:00"
    }
  ],
  "count": 5
}
```

#### Get Threat Analysis

```
GET /api/v1/emergency/{session_id}/analysis

Response:
{
  "session_id": "uuid",
  "threat_score": 0.65,
  "threat_level": "HIGH",
  "threats": [
    {
      "type": "TIME_ESCALATION",
      "score": 0.5,
      "description": "Emergency active for 30 minutes"
    }
  ],
  "recommendations": [
    "Escalate to senior responder",
    "Activate search protocols"
  ]
}
```

## Socket.IO Events

### Client → Server

- `session:join` - Join emergency session room
- `location:submit` - Submit real-time location
- `passcode:submit` - Submit passcode

### Server → Client

- `emergency:triggered` - Emergency alert triggered
- `location:updated` - Real-time location broadcast
- `threat:detected` - Threat detected by AI
- `alert:sent` - Emergency alert sent
- `session:status_changed` - Session status transitioned
- `session:resolved` - Emergency resolved

## Environment Variables

See `.env.example` for all configuration options.

Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `TWILIO_ACCOUNT_SID` - For SMS alerts
- `EMERGENCY_TIMEOUT_SECONDS` - Timeout before auto-alert (default: 10)
- `AI_THREAT_THRESHOLD` - Auto-trigger threshold (default: 0.7)

## Database Schema

### Users

- id (UUID)
- email, phone, name
- emergency_contacts (JSON)
- created_at, updated_at

### EmergencySessions

- id (UUID)
- user_id (FK)
- status (IDLE, MONITORING, ALERT_TRIGGERED, RESOLVED, etc.)
- passcode, passcode_attempts, passcode_correct
- danger_detected, alert_sent, ai_threat_score
- last_location (JSON)
- activated_at, alert_sent_at, resolved_at

### LiveLocations

- id (UUID)
- session_id (FK), user_id (FK)
- latitude, longitude, accuracy, altitude
- speed, movement_speed_kmh
- created_at

### EmergencyAlerts

- id (UUID)
- session_id (FK)
- alert_type (SMS, WHATSAPP, EMAIL)
- recipient_number, message_content
- is_sent, send_attempts, sent_at

### AIThreatEvents

- id (UUID)
- session_id (FK)
- threat_type, threat_score, confidence
- description, metadata

### EmergencyLogs

- id (UUID)
- session_id (FK)
- event_type, event_data, severity
- created_at

## AI Threat Detection

The system analyzes threats in real-time:

1. **Inactivity Detection** - No location updates
2. **Abnormal Movement** - Unusual speed patterns
3. **Time Escalation** - Longer emergency duration = higher threat

Each threat contributes to overall threat score (0-1). When score exceeds threshold, alerts automatically trigger.

## Deployment

### Railway / Render

1. Set environment variables in dashboard
2. Push to GitHub
3. Auto-deploy on push

### Docker

```bash
docker build -t safety-guard-backend .
docker run -p 8000:8000 safety-guard-backend
```

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app
```

## Monitoring

Access logs and metrics:

- Health: `GET /health`
- Logs: Check container logs
- Database: Use pgAdmin or psql

## Future Enhancements

- [ ] WhatsApp Business API integration
- [ ] Email alerts (SMTP)
- [ ] Voice alerts (Twilio)
- [ ] Advanced ML threat detection
- [ ] Real-time dashboard analytics
- [ ] Panic button detection
- [ ] Geofencing
- [ ] Route replay & analysis

---

Built with ❤️ for women's safety
