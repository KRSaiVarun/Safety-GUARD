# Safety-GUARD — Minimal runnable upgrade scaffold

This repository contains a minimal, production-oriented scaffold for the Safety-GUARD emergency system: FastAPI + Socket.IO backend, Twilio WhatsApp notifier, simple AI risk scoring, and React frontend pages for SOS and Dashboard.

Quick start (development):

1. Copy `.env.example` to `.env` and fill Twilio creds.

2. Start services with Docker Compose:

```bash
docker-compose up --build
```

3. Open the frontend pages:

- SOS interface: http://localhost:3000/sos
- Dashboard: http://localhost:3000/dashboard

Notes:

- The backend uses Twilio for WhatsApp; set `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` in the environment.
- This scaffold focuses on core pieces requested: notification service, Socket.IO events, basic AI risk scoring, DB models.
- Extend `backend/websocket/events.py` and `backend/services/notification_service.py` to wire into real user/session storage and audits.
<div align="center">

<img src="https://img.shields.io/badge/Safety-GUARD-critical?style=for-the-badge&color=c0392b" alt="Safety-GUARD" height="40"/>

### Women Safety Protocol — Real-Time Emergency Response & Tactical Dashboard

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-REST-092E20?style=flat-square&logo=django&logoColor=white)](https://djangoproject.com)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)]()
[![Stars](https://img.shields.io/github/stars/KRSaiVarun/Safety-GUARD?style=flat-square&color=f59e0b)](https://github.com/KRSaiVarun/Safety-GUARD/stargazers)
[![Issues](https://img.shields.io/github/issues/KRSaiVarun/Safety-GUARD?style=flat-square)](https://github.com/KRSaiVarun/Safety-GUARD/issues)

**[🐛 Report a Bug](https://github.com/KRSaiVarun/Safety-GUARD/issues)** &nbsp;·&nbsp; **[💡 Request a Feature](https://github.com/KRSaiVarun/Safety-GUARD/issues)**

> 🚧 **Live deployment coming soon** — [safety-guard-kr-varun.netlify.app](https://safety-guard--krsai.replit.app/)(https://safety-guard-kr-varun.netlify.app/)

</div>

---

## What is Safety-GUARD?

Safety-GUARD is a real-time women's safety system that combines IoT hardware, AI-driven threat detection, and a tactical command dashboard to deliver rapid emergency response. A single button press — or a voice command — captures the user's GPS location, notifies trusted contacts and authorities via SMS/email, and pins the incident live on a monitoring map.

Built for urban environments and high-risk scenarios, it bridges the gap between personal safety devices and centralized emergency response infrastructure.

---

## Features

|     | Feature                          | Description                                                                  |
| --- | -------------------------------- | ---------------------------------------------------------------------------- |
| 🆘  | **One-Tap SOS**                  | Instant distress alert via app button, panic device, or gesture              |
| 📍  | **Live GPS Tracking**            | Real-time location streaming to emergency contacts and the command dashboard |
| 🎙️  | **Voice Trigger**                | Keyword-activated ("Help", "Guard") hands-free emergency mode                |
| 📲  | **SMS & Email Alerts**           | Automated distress messages with live coordinates to registered contacts     |
| 🔕  | **Silent Mode**                  | Covert activation that alerts authorities without alerting the threat        |
| 🗺️  | **Tactical Dashboard**           | Centralized operator map for live tracking and incident management           |
| 📊  | **Incident Reports**             | Full structured logs of every alert for post-incident review and evidence    |
| 🔐  | **Role-Based Auth**              | Separate access levels for users, guardians, and administrators              |
| 🤖  | **AI Threat Detection** _(Beta)_ | Computer vision module for detecting potential threats in live camera feeds  |
| 📡  | **IoT Integration**              | Compatible with Raspberry Pi / Arduino wearable devices                      |

---

## How It Works

```
User triggers SOS  ──────────────────────────────────────────────────────────┐
  via app / panic button / voice command                                      │
                                                                              ▼
System captures  ────────────────────────────────────────────────────────────┐
  GPS coordinates + timestamp + user profile                                  │
                                                                              ▼
Alerts dispatched  ──────────────────────────────────────────────────────────┐
  SMS + email to emergency contacts and authorities                           │
                                                                              ▼
Dashboard updates  ──────────────────────────────────────────────────────────┐
  Live location pin + incident card on the tactical map                       │
                                                                              ▼
Guardian responds  ──────────────────────────────────────────────────────────┐
  Acknowledges alert and coordinates help                                     │
                                                                              ▼
Incident logged  ────────────────────────────────────────────────────────────┘
  Full report archived for records and evidence
```

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Safety-GUARD System                          │
├─────────────────┬──────────────────────────┬─────────────────────────┤
│    IoT Layer    │    Application Layer      │    Dashboard Layer      │
│                 │                           │                         │
│  Wearable       │  Django REST Backend      │  Tactical Map           │
│  GPS Module     │  Geolocation Engine       │  Live Alert Feed        │
│  Panic Button   │  Notification Service     │  Incident Log           │
│  Camera         │  Auth & User Management   │  Analytics Panel        │
│  Accelerometer  │  AI / CV Module           │  Admin Controls         │
└─────────────────┴──────────────────────────┴─────────────────────────┘
        │                      │                          │
        └──────────────────────┴──────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Database &        │
                    │   Cloud Storage     │
                    └─────────────────────┘
```

---

## Tech Stack

**Backend**

- Python 3.9+ · Django / Flask · SQLite / PostgreSQL
- Twilio / TextLocal (SMS) · SMTP (email)

**Frontend & Dashboard**

- HTML5, CSS3, Bootstrap · JavaScript / jQuery
- Leaflet.js / Google Maps API

**IoT & Hardware**

- Raspberry Pi / Arduino · GPS Module NEO-6M · GSM Module SIM800L
- Push button / accelerometer

**AI / CV Module** _(Beta)_

- OpenCV · TensorFlow / PyTorch

---

## Project Structure

```
Safety-GUARD/
├── backend/
│   ├── api/               # REST API endpoints
│   ├── alerts/            # SMS and email notification logic
│   ├── auth/              # User authentication and role management
│   ├── location/          # GPS tracking service
│   └── models/            # Database models
│
├── dashboard/
│   ├── templates/         # HTML templates
│   ├── static/            # CSS, JS, images
│   └── views/             # Dashboard controllers
│
├── iot/
│   ├── device_firmware/   # Arduino / Raspberry Pi code
│   └── serial_handler/    # Device–server communication
│
├── ai_module/             # Threat detection (beta)
│   ├── model/
│   └── inference.py
│
├── requirements.txt
├── manage.py
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- pip
- Git
- _(Optional)_ Raspberry Pi or Arduino for hardware integration

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/KRSaiVarun/Safety-GUARD.git
cd Safety-GUARD

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your API keys (see Environment Variables below)

# 5. Run database migrations
python manage.py migrate

# 6. Create an admin superuser
python manage.py createsuperuser

# 7. Start the development server
python manage.py runserver
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the following:

```env
SECRET_KEY=your_django_secret_key
DEBUG=True

# Database
DATABASE_URL=sqlite:///db.sqlite3

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

> **Note:** Never commit your `.env` file. It's already in `.gitignore`.

---

## Tactical Dashboard

The command dashboard gives guardians and administrators a live view of all active and historical incidents.

- **Live Map** — Real-time location pins for active SOS alerts with status indicators
- **Alert Feed** — Chronological incoming alerts with user profile cards
- **Incident Log** — Searchable archive of all past incidents with full metadata
- **User Management** — Register and manage users, guardians, and emergency contacts
- **Analytics** — Heatmaps, response-time metrics, and incident frequency charts
- **System Status** — IoT device health, API connectivity, and server uptime

---

## Roadmap

- [ ] **Mobile App** (React Native / Flutter) for Android and iOS
- [ ] **WhatsApp Integration** via WhatsApp Business API
- [ ] **Offline / SMS Fallback** when internet is unavailable
- [ ] **Wearable Band** with dedicated panic button and heart-rate monitor
- [ ] **Route Safety Score** — AI-powered safe-route recommendations
- [ ] **Crowd-Sourced Safety Ratings** — user-reported scores for locations
- [ ] **Police API Integration** — direct alert routing to local stations
- [ ] **Multi-language Support** — Hindi, Tamil, Telugu, and other regional languages
- [ ] **Face Detection** — AI-powered identification in threat scenarios

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for code style guidelines and the PR process.

```bash
# Fork the repository, then:
git checkout -b feature/your-feature-name
git commit -m "Add: your feature description"
git push origin feature/your-feature-name
# Open a pull request
```

---

## License

Licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## Author

**KR Sai Varun**

[![GitHub](https://img.shields.io/badge/GitHub-KRSaiVarun-181717?style=flat-square&logo=github)](https://github.com/KRSaiVarun)

---

<div align="center">

_If this project helped you, please consider giving it a ⭐_

_Built with ❤️ to make the world safer for women._

</div>
