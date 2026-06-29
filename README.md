<div align="center">

<h1>🛡️ Safety-GUARD</h1>
<h3>SmartShield – Intelligent Women Safety Protocol</h3>

<p><em>An AI-powered real-time emergency response platform designed to protect women during critical situations.</em></p>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-safety--guard--kr--varun.netlify.app-0d1117?style=for-the-badge&logo=netlify&logoColor=00C7B7)](https://safety-guard-kr-varun.netlify.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)](https://socket.io/)

<br/>

> **MCA 2nd Year Project** · **FKCCI Innovation Challenge** · **Inno Manthan Competition**

</div>

---

https://safety-guard--javasecurebank.replit.app

## 📌 Overview

Women's safety remains a critical global challenge. Existing solutions are reactive — they respond **after** harm has already been done. **Safety-GUARD** changes that.

Safety-GUARD is an **AI-powered, real-time emergency response platform** that combines GPS tracking, intelligent risk assessment, automated WhatsApp alerts, and a tactical command dashboard to provide **proactive, continuous protection**.

When an SOS is triggered, the system instantly captures the user's location, notifies trusted contacts, broadcasts a live incident to a monitoring dashboard, and keeps watch — evaluating risk every few seconds — until the user safely verifies themselves using a secure passcode.

---

## ✨ Key Highlights

| Feature | Description |
|---|---|
| 🆘 **Smart SOS Activation** | One-touch emergency trigger with continuous monitoring |
| 📍 **Real-Time GPS Tracking** | Live location updates sent every few seconds |
| 📲 **WhatsApp Emergency Alerts** | Automated Twilio-powered notifications with Google Maps links |
| 🔄 **Repeated Alert System** | Emergency alerts resent every 30 seconds until safe verification |
| 🔐 **Secure Passcode Verification** | Emergencies can only be stopped with the correct passcode |
| 🤖 **AI Risk Intelligence** | Dynamic risk scoring across 6+ contextual factors |
| 🗺️ **Tactical Command Dashboard** | Multi-user live monitoring with map, feed, and analytics |
| 🚨 **Geofencing Engine** | Detects zone breaches and auto-escalates risk levels |
| 📊 **Incident Timeline** | Full event history, replay, and audit trail |
| 🔔 **Notification Center** | Real-time system and emergency alert feed |
| 📡 **Socket.IO Live Events** | Instant dashboard synchronization across all operators |
| 🧠 **Predictive Threat Analysis** | AI-generated warnings and safety recommendations |
| 📈 **Analytics Dashboard** | Incident metrics, response times, and heatmaps |
| 🌙 **Cyber Security UI** | Dark tactical command-center interface |
| ⚡ **Celery + Redis** | Background task processing and event queue management |
| 🗄️ **PostgreSQL Storage** | Persistent incident, location, and analytics storage |

---

## 🎯 Project Objectives

- **Instant Emergency Response** — Trigger alerts and begin monitoring within seconds of SOS activation
- **Continuous Monitoring** — Track location, risk, and inactivity non-stop until verified safe
- **Threat Prediction** — AI engine scores and forecasts risk before incidents escalate
- **Family Notification** — Automated WhatsApp alerts keep trusted contacts informed in real time
- **Centralized Dashboard** — Operators monitor multiple users from a single command center
- **Data-Driven Safety Analytics** — Incident data drives better policy and resource decisions

---

## 🔄 System Workflow

```
  User Registration
        ↓
  Passcode Setup
        ↓
  SOS Activation ──────────────────────────────┐
        ↓                                       │
  Live GPS Capture                              │
        ↓                                       │
  WhatsApp Alert Sent                           │
        ↓                                       │
  Real-Time Dashboard Broadcast                 │
        ↓                                       │
  AI Risk Evaluation                            │
        ↓                                       │
  Geofence Monitoring                           │
        ↓                                       │
  Continuous Alerts Every 30 Seconds ←──────────┘
        ↓
  Passcode Verification
        ↓
  Incident Closure
        ↓
  Report Generation & Analytics Update
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      SAFETY-GUARD                        │
├──────────────────────┬──────────────────────────────────┤
│   USER INTERFACE     │      TACTICAL DASHBOARD           │
│  ─────────────────   │  ──────────────────────────────  │
│  • SOS Trigger       │  • Live Tracking Map              │
│  • GPS Tracking      │  • Multi-User Active Panel        │
│  • Passcode Entry    │  • Incident Feed                  │
│  • Alert Status      │  • AI Risk Gauge                  │
│  • Risk View         │  • Analytics Dashboard            │
│                      │  • Notification Center            │
├──────────────────────┴──────────────────────────────────┤
│                    FASTAPI BACKEND                        │
│  ──────────────────────────────────────────────────────  │
│   Authentication  │  Emergency Mgmt  │  Session Mgmt    │
│   Notification    │  Geofence Engine │  AI Risk Engine  │
├──────────────────────────────────────────────────────────┤
│              REAL-TIME COMMUNICATION LAYER               │
│      Socket.IO  │  Redis Queue  │  Celery Workers       │
├──────────────────────────────────────────────────────────┤
│                    AI & ANALYTICS LAYER                   │
│   Risk Scoring Engine  │  Geofence Analysis              │
│   Threat Detection     │  Predictive Analytics           │
├──────────────────────────────────────────────────────────┤
│                 COMMUNICATION SERVICES                    │
│   Twilio WhatsApp API  │  Google Maps Integration        │
├──────────────────────────────────────────────────────────┤
│                    POSTGRESQL DATABASE                    │
│  Users │ Sessions │ Locations │ Alerts │ Risk History    │
└──────────────────────────────────────────────────────────┘
```

---

## 🖥️ Dashboard Features

The **Tactical Command Center** is the operational heart of Safety-GUARD, built for operators who need to monitor, react, and coordinate in real time.

| Panel | Description |
|---|---|
| 🗺️ **Live Tracking Map** | Real-time GPS positions for all active users (Leaflet.js) |
| 👥 **Active Users Panel** | Status, risk level, and alert counts per user at a glance |
| 📋 **Incident Feed** | Chronological list of all triggered events and updates |
| 🎯 **AI Risk Gauge** | Visual risk level indicator (LOW / MEDIUM / HIGH / CRITICAL) |
| 📈 **Analytics Dashboard** | Incident trends, response times, area heatmaps |
| 📡 **Emergency Session Monitor** | Full lifecycle view of active SOS sessions |
| 🔔 **Alert Delivery Tracking** | Confirmation status of every WhatsApp alert sent |

---

## 🤖 AI Risk Intelligence

The risk engine continuously evaluates multiple real-world factors and assigns a dynamic score that escalates response priorities.

**Risk Factors Evaluated:**

| Factor | Signal |
|---|---|
| 🌙 Time of Day | Late-night hours increase baseline risk |
| 📍 Unsafe Areas | Zone classification from geofence database |
| 🔕 User Inactivity | No movement detected beyond a threshold |
| 📶 Network Status | Weak or lost connectivity is a warning signal |
| 🔋 Battery Level | Low battery may indicate a compromised situation |
| 📂 Emergency History | Prior incidents increase sensitivity |

**Risk Levels:**

```
  🟢 LOW  →  🟡 MEDIUM  →  🟠 HIGH  →  🔴 CRITICAL
```

Each level triggers progressively more aggressive alerts and escalations on the command dashboard.

---

## 🚧 Geofencing Engine

Safety-GUARD maintains a geospatial database of safe and unsafe zones.

- **Safe Zones** — Home, workplace, known safe areas
- **Unsafe Zones** — Flagged locations based on incident history or manual configuration
- **Entry/Exit Detection** — Automatically detected via GPS coordinates
- **Breach Alerts** — Instant notification to the dashboard when an unsafe zone is entered
- **Automated Risk Escalation** — Risk level upgrades automatically on zone breach

---

## 🗄️ Database Design

| Table | Purpose |
|---|---|
| `users` | Registered users, passcodes, trusted contacts |
| `emergency_sessions` | SOS activations, statuses, timestamps |
| `locations` | Time-stamped GPS coordinates per session |
| `alerts` | WhatsApp alert records and retry counts |
| `alert_delivery_logs` | Delivery status for every alert sent |
| `geofence_events` | Zone entry/exit records |
| `risk_history` | Per-session risk score timeline |

---

## 🛠️ Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React.js + TypeScript | UI framework |
| Vite | Build tooling |
| Zustand | State management |
| Leaflet.js | Interactive mapping |
| Socket.IO Client | Real-time event subscription |

### Backend

| Technology | Purpose |
|---|---|
| FastAPI (Python) | REST API and WebSocket server |
| Socket.IO | Real-time bidirectional events |
| Celery | Background task queue |
| Redis | Message broker and event cache |
| PostgreSQL | Primary relational database |
| SQLAlchemy | ORM and query management |

### AI & Analytics

| Technology | Purpose |
|---|---|
| Python AI Modules | Custom risk scoring logic |
| Geofence Engine | Spatial zone analysis |
| Threat Detection | Anomaly and inactivity detection |
| Predictive Analytics | Trend-based risk forecasting |

### Communication & Deployment

| Technology | Purpose |
|---|---|
| Twilio WhatsApp API | Emergency alert delivery |
| Google Maps | Location link generation |
| Docker | Containerized deployment |
| Render | Backend hosting |
| Netlify | Frontend hosting |

---

## 📁 Project Structure

```
Safety-GUARD/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI route handlers
│   │   ├── core/             # Config, security, settings
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── services/         # Risk engine, geofencing, notifications
│   │   ├── tasks/            # Celery background tasks
│   │   └── main.py           # Application entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Dashboard, SOS, Auth pages
│   │   ├── store/            # Zustand state management
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Installation Guide

### Prerequisites

- Node.js v18+
- Python v3.10+
- PostgreSQL
- Redis
- Docker (optional)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Docker Setup

```bash
docker-compose up --build
```

### Environment Variables

Create a `.env` file in `/backend`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/safetyguard
REDIS_URL=redis://localhost:6379
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=your_whatsapp_number
BACKEND_SOCKET_URL=http://localhost:8000
SECRET_KEY=your_secret_key
```

---

## 📸 Screenshots

> *Screenshots will be added upon live deployment.*

| Screen | Preview |
|---|---|
| 🗺️ Tactical Command Dashboard | `[ Dashboard Screenshot ]` |
| 🆘 SOS Activation Screen | `[ SOS Screen ]` |
| 📍 Live Tracking Map | `[ Tracking Map ]` |
| 🤖 AI Risk Dashboard | `[ Risk Dashboard ]` |
| 🔔 Notification Center | `[ Notification Center ]` |

---

## 🗺️ Roadmap

**Current Release — v1.0**

- ✅ Real-Time GPS Tracking
- ✅ WhatsApp Emergency Alerts via Twilio
- ✅ Secure Passcode Verification
- ✅ AI Risk Intelligence Engine
- ✅ Tactical Command Dashboard
- ✅ Socket.IO Live Events
- ✅ Celery + Redis Background Processing
- ✅ PostgreSQL Incident Storage

**Upcoming — v2.0**

- 🔄 Geofencing Engine (Active Development)
- 🔄 Route Replay System
- 🔄 Incident Heatmaps
- 🔄 Mobile App (Android / iOS)
- 🔄 Voice-Based SOS Activation
- 🔄 Police Station Integration
- 🔄 Emergency Call Automation
- 🔄 Smart Wearable Device Support
- 🔄 AI Route Safety Prediction
- 🔄 Facial Threat Detection
- 🔄 Emergency Drone Response Integration

---

## 🔬 Research Contribution

Safety-GUARD advances research and development in the following domains:

- **Women Safety Technology** — Context-aware emergency systems for vulnerable populations
- **Smart Emergency Response Systems** — Sub-second activation with multi-channel alerting
- **AI-Based Risk Prediction** — Multi-factor real-time risk scoring and threat forecasting
- **Real-Time Monitoring Platforms** — WebSocket-driven dashboards for incident management
- **IoT Safety Ecosystems** — Foundation architecture for wearable and sensor integration

This project was developed and evaluated at **FKCCI Innovation Challenge** and **Inno Manthan**, and is submitted as part of an **MCA Final Year Project** with applied research in intelligent emergency response systems.

---

## 🚀 Future Enhancements

- **Smart Wearable Panic Device** — One-press hardware SOS with Bluetooth sync
- **Voice SOS Activation** — Hands-free emergency triggering via voice command
- **AI Route Safety Prediction** — ML-based safe route recommendations
- **Facial Threat Detection** — Camera-based suspicious activity detection
- **Emergency Call Automation** — Auto-dial emergency contacts and services
- **Offline SMS Fallback** — Emergency alerts via SMS when internet is unavailable
- **Drone-Based Response** — Aerial surveillance on triggered incidents

---

## 👤 Author

**KR Sai Varun**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/krsaivarun)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/krsaivarun)

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please open an issue first to discuss major changes.

---

<div align="center">

*Built with the vision of creating a safer world through intelligent emergency response technology.*

**Safety-GUARD** · SmartShield – Intelligent Women Safety Protocol

</div>
