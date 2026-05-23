# Security & Deployment Guide for Safety-Guard

## 🔐 Security Best Practices

### 1. Credentials Management

**NEVER commit credentials.** Always use:

- `.env` files (local development) - **DO NOT COMMIT**
- Environment variables (production deployments)
- Secret management services (HashiCorp Vault, AWS Secrets Manager, etc.)

### 2. Environment Setup

#### Development

```bash
# Copy templates
cp .env.example .env
cp frontend/.env.example frontend/.env.local

# Edit with your local values
# .env is in .gitignore - safe to commit
```

#### Production

Set environment variables in your deployment platform:

- **Render Dashboard** → Environment Variables
- **Netlify Dashboard** → Site settings → Build & deploy
- **Vercel Dashboard** → Settings → Environment Variables

### 3. Required Secrets (Rotate these immediately)

- `SECRET_KEY` - Generate: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- `JWT_SECRET_KEY` - Generate: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- Database password - Use strong, unique passwords
- Twilio credentials - Rotate periodically
- Supabase keys - Keep separate for frontend and backend

### 4. Credential Rotation Checklist

After exposing credentials:

- [ ] PostgreSQL password rotated
- [ ] Redis password rotated
- [ ] Twilio Account SID & Auth Token regenerated
- [ ] Supabase API keys regenerated
- [ ] GitHub secrets updated
- [ ] Render environment variables updated
- [ ] Netlify/Vercel environment variables updated
- [ ] Git history cleaned (if pushed publicly)

```bash
# Remove file from history (if accidentally committed)
git rm --cached .env
git commit --amend --no-edit
git push -f
```

---

## 🚀 Deployment Architecture

### Recommended Stack

| Component     | Service                  | Config                   |
| ------------- | ------------------------ | ------------------------ |
| Frontend      | Vercel / Netlify         | Auto-deploy from GitHub  |
| Backend API   | Render Web Service       | Python 3.11 runtime      |
| Celery Worker | Render Background Worker | Continuous job processor |
| Celery Beat   | Render Background Worker | Scheduled tasks          |
| Database      | Neon / Render PostgreSQL | Managed PostgreSQL       |
| Cache/Queue   | Upstash Redis            | Managed Redis            |
| CI/CD         | GitHub Actions           | Auto-test & deploy       |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Netlify)                  │
│  https://safety-guard-kr-varun.netlify.app             │
└─────────────────────────────────────────────────────────┘
           │
           ├─── WebSocket ───┐
           └─── HTTPS ───────┤
                             │
                   ┌─────────▼──────────────────┐
                   │  Backend (Render)          │
                   │ - FastAPI + Socket.IO      │
                   │ - REST API                 │
                   │ - WebSocket Server         │
                   └──────────┬──────────────────┘
                   │          │
         ┌─────────▼──┐       │
         │ PostgreSQL │       │
         │ (Neon)     │       │
         └────────────┘       │
                              │
                   ┌──────────▼─────────┐
                   │   Redis (Upstash)  │
                   │ - Message Queue    │
                   │ - Caching          │
                   └────────────────────┘
                              │
           ┌──────────────────┘
           │
    ┌──────▼──────────────────────┐
    │  Celery Workers (Render)     │
    │ - Background Jobs            │
    │ - AI Analysis                │
    │ - Notifications              │
    └──────────────────────────────┘
           │
    ┌──────▼──────────┐
    │  External APIs  │
    │ - Twilio        │
    │ - Supabase      │
    │ - Google Maps   │
    └─────────────────┘
```

---

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] All environment variables set in production
- [ ] Database migrations run
- [ ] SSL certificate enabled
- [ ] CORS configured correctly
- [ ] Secrets rotated
- [ ] Backup created

### Frontend (Netlify/Vercel)

- [ ] Connect GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Set environment variables:
  - `VITE_API_URL`
  - `VITE_SOCKET_URL`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Backend (Render)

- [ ] Create web service
- [ ] Set runtime: Python 3.11
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `uvicorn backend.main:socket_app --host 0.0.0.0 --port $PORT`
- [ ] Set environment variables (use render.yaml or dashboard)
- [ ] Enable auto-deploy
- [ ] Set health check: `/health`

### Celery Worker (Render)

- [ ] Create background worker service
- [ ] Set runtime: Python 3.11
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `celery -A backend.celery_app.celery worker --loglevel=info`
- [ ] Set environment variables (same as backend)

### Celery Beat (Render)

- [ ] Create background worker service
- [ ] Set runtime: Python 3.11
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `celery -A backend.celery_app.celery beat --loglevel=info`
- [ ] Set environment variables (same as backend)

### Database (Neon or Render)

- [ ] Create PostgreSQL database
- [ ] Configure firewall to allow Render IPs
- [ ] Run migrations
- [ ] Create backups
- [ ] Test connection from backend

### Redis (Upstash)

- [ ] Create Redis database
- [ ] Enable authentication
- [ ] Configure firewall
- [ ] Test connection

---

## 🔗 Webhook Configuration

### Twilio Status Callback

In Twilio Console:

1. Go to **Messaging → Services → Your Service**
2. Set Status Callback URL:
   ```
   https://your-backend.onrender.com/api/emergency/twilio/status
   ```
3. Enable: Delivery Status & Opt-In/Opt-Out

### GitHub Actions Deployment Secrets

In GitHub Repository Settings → Secrets:

```
DATABASE_URL=<production-database-url>
REDIS_URL=<production-redis-url>
SECRET_KEY=<generated-secret>
JWT_SECRET_KEY=<generated-secret>
TWILIO_ACCOUNT_SID=<your-sid>
TWILIO_AUTH_TOKEN=<your-token>
SUPABASE_URL=<your-url>
SUPABASE_ANON_KEY=<your-key>
```

---

## 📊 Monitoring & Logging

### Backend Logging

Configure in production:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Error Tracking (Optional - Sentry)

1. Create Sentry project
2. Add to requirements.txt:
   ```
   sentry-sdk==1.40.0
   ```
3. Configure in `backend/main.py`:
   ```python
   import sentry_sdk
   sentry_sdk.init(dsn=os.getenv('SENTRY_DSN'))
   ```

### Uptime Monitoring

Use services like:

- **Uptime Kuma** (free, self-hosted)
- **Pingdom** (commercial)
- **StatusPage.io** (incident management)

---

## 🧪 Testing Before Deployment

```bash
# Run all tests
pytest backend/tests/ -v

# Type check
mypy backend/

# Lint
flake8 backend/

# Build frontend
npm run build

# Start locally
npm run dev  # Frontend
cd backend && uvicorn main:socket_app  # Backend
```

---

## 🛠 Troubleshooting

### Database Connection Issues

```bash
# Test connection
PGPASSWORD=<password> psql -h <host> -U <user> <database>

# Check Render PostgreSQL
render.com → Dashboard → select PostgreSQL instance → "Info" tab
```

### Redis Connection Issues

```bash
# Test connection
redis-cli -h <host> -p <port> -a <password>

# Check Upstash Redis
upstash.com → Select Redis instance → "Logs" tab
```

### WebSocket Issues

```bash
# Enable debug logging
export DEBUG=true
python -m uvicorn backend.main:socket_app --log-level debug
```

---

## 📚 Additional Resources

- [Render Deployment Guide](https://render.com/docs)
- [Netlify Deployment Guide](https://docs.netlify.com)
- [FastAPI Best Practices](https://fastapi.tiangolo.com/deployment/)
- [Celery Best Practices](https://docs.celeryproject.io/en/stable/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-createuser.html)
- [Twilio Webhooks](https://www.twilio.com/docs/messaging/webhooks)

---

**Last Updated:** May 23, 2026
**Maintained By:** Safety-Guard Development Team
