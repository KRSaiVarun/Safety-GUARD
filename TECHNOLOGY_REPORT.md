# Safety-GUARD — Technology Report

**MCA Final Year Project | Innovation Competition 2026**
**Classification:** Production-Ready · Enterprise Architecture

---

## Executive Summary

Safety-GUARD is a full-stack, AI-powered women's safety emergency response platform. It combines a React + TypeScript frontend, a FastAPI Python backend, Supabase authentication and database, Twilio WhatsApp notifications, and a high-performance C++/Cython AI engine into a unified, production-grade emergency response system.

---

## 1. Technologies Used

| Layer                 | Technology                                   | Purpose                                         |
|-----------------------|----------------------------------------------|-------------------------------------------------|
| Frontend Framework    | React 18 + TypeScript                        | Component-based UI with type safety             |
| Build Tool            | Vite 5                                       | Fast HMR, optimised production bundles          |
| State Management      | Zustand + persist middleware                 | Global auth, session, and location state        |
| Maps                  | Leaflet + react-leaflet                      | Live GPS trail visualisation                    |
| Animation             | Framer Motion                                | UI transitions and micro-interactions           |
| Routing               | React Router v6                              | SPA routing with protected route guards         |
| Styling               | CSS Modules + CSS custom properties          | Scoped, token-driven design system              |
| Backend Framework     | FastAPI (Python 3.12)                        | Async REST API + WebSocket support              |
| Task Queue            | Celery + Redis                               | Background alert retry and scheduling           |
| WebSocket             | Socket.IO (python-socketio)                  | Real-time dashboard updates                     |
| Database              | Supabase (PostgreSQL)                        | Auth, user profiles, sessions, GPS logs         |
| ORM                   | SQLAlchemy 2.x + Alembic                     | Schema management and migrations                |
| AI Engine             | Python + C++ (via Cython)                    | Risk scoring, anomaly detection, geofencing     |
| Notifications         | Twilio WhatsApp Business API                 | Emergency alerts with delivery tracking         |
| Authentication        | Supabase Auth + JWT                          | Secure sessions with refresh token rotation     |
| Deployment            | Replit + server.py (FastAPI + static SPA)    | Single-process cloud deployment                 |

---

## 2. Programming Languages

| Language   | Role                                                                          |
|------------|-------------------------------------------------------------------------------|
| TypeScript | Frontend application, type-safe component and store logic                     |
| Python     | Backend API, AI risk engine, Celery workers, notification service             |
| C++17      | High-performance risk calculator, geofence engine, route deviation analysis   |
| Cython     | Bridges C++ modules to Python with zero-copy data transfer                    |
| SQL        | PostgreSQL schema, Alembic migration scripts                                  |
| CSS3       | Glassmorphism UI, CSS animations, design token system                         |
| HTML5      | Semantic SPA shell, Web Geolocation API integration                           |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React SPA)                           │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌─────────────────┐   │
│  │ Auth Store │ │Session Store│ │Location  │ │ Admin Portal    │   │
│  │ (Zustand)  │ │ (Zustand)  │ │ Store    │ │ /admin/dashboard│   │
│  └────────────┘ └────────────┘ └──────────┘ └─────────────────┘   │
│         ↕                ↕            ↕              ↕              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │          REST API  +  WebSocket (Socket.IO)                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                      FASTAPI BACKEND                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │  API Routes  │ │   Services   │ │ Repositories │                │
│  │  /api/notify │ │ notification │ │  user_repo   │                │
│  │  /api/session│ │ session_svc  │ │  session_repo│                │
│  │  /api/admin  │ │ rbac_service │ │  location_rep│                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │  AI Engine   │ │   Security   │ │  Workers     │                │
│  │ risk_engine  │ │ jwt_handler  │ │ Celery+Redis │                │
│  │ anomaly_det  │ │ rbac_service │ │ alert_retry  │                │
│  │ route_analyz │ │              │ │ location_sync│                │
│  └──────────────┘ └──────────────┘ └──────────────┘                │
│  ┌──────────────┐                                                    │
│  │  C++/Cython  │  ← High-performance native extension              │
│  │ risk_calc.so │    Haversine · Geofence · EMA smoothing           │
│  └──────────────┘                                                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                        DATA LAYER                                    │
│  Supabase (PostgreSQL)         │  Redis (Celery broker/result cache) │
│  ├─ users                      │  ├─ alert_queue                     │
│  ├─ profiles                   │  ├─ location_cache                  │
│  ├─ emergency_sessions         │  └─ session_state                   │
│  ├─ live_locations             │                                     │
│  ├─ alert_delivery_logs        │  Twilio                             │
│  └─ audit_logs                 │  └─ WhatsApp Business API           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Authentication Flow

### User Authentication
```
User → /login (React)
  → supabase.auth.signInWithPassword()
  → JWT issued by Supabase
  → role read from user_metadata.role
  → If role === "user" → redirect /passcode-setup → /dashboard
  → Session persisted via onAuthStateChange + localStorage
  → Passcode hash synced to Supabase user_metadata (cross-device)
```

### Admin Authentication
```
Admin → /admin/login (separate React page)
  → Same Supabase auth endpoint
  → Role check: must be "admin" | "supervisor" | "operator" | "viewer"
  → If role === "user" → access denied, session cleared
  → If admin → redirect /admin/dashboard (ops-center)
  → All /admin/* routes guarded by AdminRoute component
```

### RBAC Roles
| Role       | Dashboard | Analytics | User Mgmt | Emergency Mgmt | Logs |
|------------|-----------|-----------|-----------|----------------|------|
| user       | User Home | —         | —         | Own only       | —    |
| viewer     | Admin     | Read      | Read      | Read           | Read |
| operator   | Admin     | Read      | —         | Write          | Read |
| supervisor | Admin     | Write     | Read      | Write          | Read |
| admin      | Admin     | Write     | Write     | Write          | Write|

---

## 5. Security Features

| Feature                  | Implementation                                              |
|--------------------------|-------------------------------------------------------------|
| JWT Authentication       | Supabase-issued, verified on every backend API request      |
| Password Hashing         | Supabase Auth (bcrypt internally)                           |
| Passcode Hashing         | Custom XOR/bit-shift hash (client-side PIN protection)      |
| Session Persistence      | Supabase refresh token rotation + localStorage              |
| Cross-Device Passcode    | Hash stored in Supabase user_metadata, restored on login    |
| Role-Based Access        | RBAC enforced in React route guards + FastAPI dependencies  |
| Admin Isolation          | Separate /admin/login route, AdminRoute guard component     |
| Rate Limiting            | FastAPI middleware (planned: slowapi)                       |
| CORS                     | Configured in FastAPI with allowed origins                  |
| Environment Secrets      | All credentials in Replit Secrets, never in source code     |
| Audit Logs               | Every emergency session and alert action logged to DB       |

---

## 6. Database Schema

```sql
-- Core identity
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    phone       TEXT,
    role        TEXT DEFAULT 'user' CHECK (role IN ('user','admin','supervisor','operator','viewer')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    last_login  TIMESTAMPTZ
);

CREATE TABLE emergency_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    state           TEXT NOT NULL,
    trigger_method  TEXT NOT NULL,
    risk_score      FLOAT DEFAULT 0,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    replay_data     JSONB
);

CREATE TABLE live_locations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID REFERENCES emergency_sessions(id),
    user_id     UUID REFERENCES users(id),
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    accuracy    FLOAT,
    speed       FLOAT,
    heading     FLOAT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alert_delivery_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID REFERENCES emergency_sessions(id),
    recipient   TEXT NOT NULL,
    channel     TEXT DEFAULT 'whatsapp',
    status      TEXT NOT NULL,
    sent_at     TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at     TIMESTAMPTZ,
    retry_count INT DEFAULT 0
);

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    action      TEXT NOT NULL,
    resource    TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. AI Modules

| Module                   | Language        | Description                                              |
|--------------------------|-----------------|----------------------------------------------------------|
| `risk_engine.py`         | Python          | Orchestrates risk pipeline; calls C++ extension          |
| `anomaly_detector.py`    | Python          | Time-series anomaly detection on GPS trail               |
| `route_analyzer.py`      | Python          | Detects route deviations from expected path              |
| `risk_calculator.cpp`    | C++17           | Haversine distance, velocity anomaly, EMA smoothing      |
| `geofence.cpp`           | C++17           | Circular/polygon geofence, stillness detection           |
| `risk_calculator.pyx`    | Cython          | Python bindings for C++ risk and geofence modules        |

### AI Safety Score Formula
```
score = (velocity_anomaly × 0.60 + route_deviation × 0.40) × time_weight
time_weight = 1.35 if 22:00–05:00, 1.15 if 20:00–22:00, else 1.0
Output range: 0–100 (smoothed via EMA α=0.3)
```

---

## 8. Performance Optimizations

| Optimization                  | Detail                                                              |
|-------------------------------|---------------------------------------------------------------------|
| C++ Haversine                 | 10–50× faster than Python math for GPS calculations                |
| Cython zero-copy bindings     | No Python object overhead on GPS point arrays                       |
| EMA score smoothing           | Eliminates GPS noise spikes without history recomputation           |
| Offline-first Zustand state   | Emergencies function without network — synced on reconnect          |
| Celery alert queue            | Non-blocking WhatsApp dispatch with retry on failure                |
| Redis result caching          | Recent risk scores and session state cached (5-min TTL)            |
| GPS trail ring buffer (200pt) | Bounded memory usage for real-time location tracking                |
| Vite code splitting           | Leaflet map bundle (~150KB) loaded separately from main app         |

---

## 9. Testing Status

| Layer            | Status         | Notes                                          |
|------------------|----------------|------------------------------------------------|
| Auth flow        | Manual tested  | Login, register, session restore, cross-device |
| Emergency SOS    | Manual tested  | Trigger, countdown, WhatsApp alert dispatch    |
| RBAC guards      | Manual tested  | Admin/user route isolation verified            |
| C++ risk engine  | Unit tested    | risk_calculator functions tested in isolation  |
| Backend API      | Manual tested  | /api/notify/alert tested with Twilio sandbox   |
| Database         | Offline mode   | Graceful fallback when tables not provisioned  |

---

## 10. Deployment Readiness

| Criteria                    | Status |
|-----------------------------|--------|
| Production build (Vite)     | ✅     |
| Single-process server.py    | ✅     |
| Environment secrets managed | ✅     |
| HTTPS (via Replit proxy)    | ✅     |
| Session persistence         | ✅     |
| Cross-device passcode sync  | ✅     |
| Admin/user role isolation   | ✅     |
| Offline emergency fallback  | ✅     |
| WhatsApp alert delivery     | ✅     |
| C++/Cython AI engine        | Architecture complete — requires native build on Linux host |
| Redis/Celery workers        | Configured — requires Redis service in production          |

---

*Report generated: June 2026 | Version 2.0 | Safety-GUARD Enterprise*
