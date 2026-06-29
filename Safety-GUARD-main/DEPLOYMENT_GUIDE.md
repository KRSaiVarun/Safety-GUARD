# Deployment Step-by-Step Guide

## Overview

This guide covers deploying Safety-Guard to production using:

- **Frontend**: Netlify or Vercel
- **Backend**: Render.com
- **Database**: Neon PostgreSQL
- **Cache**: Upstash Redis
- **CI/CD**: GitHub Actions

## Prerequisites

1. GitHub account with repository access
2. Netlify/Vercel account
3. Render.com account
4. Neon.tech account (or Render PostgreSQL)
5. Upstash.com account (or Render Redis)
6. Twilio account (optional, for SMS)
7. Supabase account (optional, for auth)

---

## Phase 1: Set Up External Services

### 1.1 Create PostgreSQL Database (Neon)

```bash
# Visit: https://neon.tech
# 1. Sign up / Login
# 2. Create new project
# 3. Copy connection string
# Format: postgresql://user:password@region.neon.tech/dbname
```

**Save:** `DATABASE_URL` in secure location

### 1.2 Create Redis (Upstash)

```bash
# Visit: https://upstash.com
# 1. Sign up / Login
# 2. Create new Redis database
# 3. Copy connection URL
# Format: redis://default:password@host:port
```

**Save:** `REDIS_URL` in secure location

### 1.3 Generate Security Keys

```bash
# Generate SECRET_KEY
python3 << 'EOF'
import secrets
print("SECRET_KEY=" + secrets.token_urlsafe(32))
EOF

# Generate JWT_SECRET_KEY
python3 << 'EOF'
import secrets
print("JWT_SECRET_KEY=" + secrets.token_urlsafe(32))
EOF
```

**Save:** Both keys in secure location

### 1.4 Optional: Setup Twilio

```bash
# Visit: https://twilio.com
# 1. Sign up / Create account
# 2. Verify phone number
# 3. Get Account SID and Auth Token
# 4. Get a Twilio phone number
# 5. Enable WhatsApp sandbox
```

---

## Phase 2: Deploy Backend (Render.com)

### 2.1 Create Render Account

Visit: https://render.com

### 2.2 Connect GitHub Repository

1. Dashboard → New → Web Service
2. Connect your GitHub repository
3. Select `Safety-GUARD` repository

### 2.3 Configure Web Service

**Basic Settings:**

- Name: `safety-guard-backend`
- Runtime: Python 3.11
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn backend.main:socket_app --host 0.0.0.0 --port $PORT`
- Root Directory: `backend`
- Plan: Starter (upgrade if needed)

**Advanced Settings:**

- Auto-Deploy: ON
- Health Check Path: `/health`
- Health Check Protocol: HTTP

### 2.4 Add Environment Variables

In Render Dashboard → service → Environment:

```
DATABASE_URL=<from Neon>
REDIS_URL=<from Upstash>
CELERY_BROKER_URL=<same as REDIS_URL>
CELERY_RESULT_BACKEND=<same as REDIS_URL>
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=<generated key>
JWT_SECRET_KEY=<generated key>
FRONTEND_URL=https://safety-guard-kr-varun.netlify.app
CORS_ORIGINS=https://safety-guard-kr-varun.netlify.app
TWILIO_ACCOUNT_SID=<your SID if using>
TWILIO_AUTH_TOKEN=<your token if using>
TWILIO_PHONE_NUMBER=<your number if using>
SUPABASE_URL=<your URL if using>
SUPABASE_ANON_KEY=<your key if using>
SUPABASE_SERVICE_ROLE_KEY=<your key if using>
```

### 2.5 Deploy

- Click "Create Web Service"
- Render will automatically deploy
- Monitor deployment logs

**Save:** Backend URL (e.g., `https://safety-guard-backend.onrender.com`)

### 2.6 Create Celery Worker

1. Dashboard → New → Background Worker
2. Use same repository
3. Name: `safety-guard-celery-worker`
4. Root Directory: `backend`
5. Start Command: `celery -A backend.celery_app.celery worker --loglevel=info`
6. Add same environment variables as web service
7. Click "Create Background Worker"

### 2.7 Create Celery Beat (Optional)

For scheduled tasks:

1. Dashboard → New → Background Worker
2. Name: `safety-guard-celery-beat`
3. Start Command: `celery -A backend.celery_app.celery beat --loglevel=info`
4. Add same environment variables
5. Click "Create Background Worker"

---

## Phase 3: Deploy Frontend (Netlify)

### 3.1 Connect GitHub to Netlify

Visit: https://app.netlify.com

1. Login / Sign up
2. Click "New site from Git"
3. Select GitHub
4. Choose `Safety-GUARD` repository

### 3.2 Configure Build Settings

**Build Settings:**

- Base directory: (leave empty)
- Build command: `npm run build`
- Publish directory: `dist`

### 3.3 Add Environment Variables

In Netlify → Site settings → Build & deploy → Environment:

```
VITE_API_URL=https://safety-guard-backend.onrender.com
VITE_SOCKET_URL=https://safety-guard-backend.onrender.com
VITE_SUPABASE_URL=<your URL if using>
VITE_SUPABASE_ANON_KEY=<your key if using>
VITE_GOOGLE_MAPS_API_KEY=<your key if using>
```

### 3.4 Deploy

- Click "Deploy site"
- Netlify will build and deploy automatically
- Site will be available at assigned URL

### 3.5 Configure Custom Domain (Optional)

1. Site settings → Domain management
2. Add custom domain: `safety-guard-kr-varun.netlify.app`
3. Configure DNS if needed

---

## Phase 4: Database Setup

### 4.1 Run Migrations

```bash
# Option 1: From local machine
cd backend
alembic upgrade head

# Option 2: Via SSH/Render Shell (if available)
```

### 4.2 Verify Database

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

---

## Phase 5: Post-Deployment Verification

### 5.1 Health Checks

```bash
# Backend
curl https://safety-guard-backend.onrender.com/health
# Should return: {"status":"ok"}

# Frontend
curl https://safety-guard-kr-varun.netlify.app
# Should return HTML
```

### 5.2 WebSocket Connection

Open browser console at frontend URL:

```javascript
// Should connect without errors
const socket = io("https://safety-guard-backend.onrender.com");
socket.on("connect", () => console.log("Connected!"));
```

### 5.3 Database Connection

```bash
# From backend shell
python -c "from backend.database import db_config; db_config.init_db()"
```

### 5.4 Celery Workers

Check Render dashboard:

- Celery Worker service should be "Live"
- Celery Beat service should be "Live"

### 5.5 API Endpoints

Test key endpoints:

```bash
# Create emergency alert
curl -X POST https://safety-guard-backend.onrender.com/api/emergency/alert \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","location":"..."}'

# Get alert status
curl https://safety-guard-backend.onrender.com/api/emergency/alert/test
```

---

## Phase 6: Configure Webhooks (Optional)

### 6.1 Twilio Status Callback

1. Log into Twilio Console
2. Messaging → Services → Select your service
3. Set Status Callback URL:
   ```
   https://safety-guard-backend.onrender.com/api/emergency/twilio/status
   ```
4. Test the connection

---

## Phase 7: Monitor & Maintain

### 7.1 Set Up Monitoring

**Render Dashboard:**

- Monitor CPU, Memory, Network
- View logs in real-time
- Configure restart rules

**Error Tracking (Optional):**

```bash
# Add Sentry
pip install sentry-sdk
# Configure in backend/main.py
```

### 7.2 Backup Strategy

**PostgreSQL:**

- Neon provides automatic backups
- Configure retention period in Neon dashboard

**Application Code:**

- GitHub is your backup
- Tag releases for easy rollback

### 7.3 Regular Checks

Schedule:

- [ ] Weekly: Check logs for errors
- [ ] Monthly: Review performance metrics
- [ ] Quarterly: Rotate secrets
- [ ] Annually: Review and update dependencies

---

## Troubleshooting

### Backend won't start

```bash
# Check logs
# Render Dashboard → service → Logs

# Common issues:
# - Database not accessible: Check DATABASE_URL
# - Missing environment variables: Check all required vars
# - Port already in use: Render should handle this
```

### WebSocket not connecting

```bash
# Check CORS_ORIGINS matches frontend URL
# Check FRONTEND_URL is set
# Check Socket.IO is initialized in main.py
```

### Celery tasks not running

```bash
# Check Celery worker is running (status = "Live")
# Check REDIS_URL is valid
# Check CELERY_BROKER_URL points to same Redis
```

### Database connection fails

```bash
# Test connection locally
psql $DATABASE_URL

# Check firewall allows Render IPs
# In Neon: Check IP whitelist
```

### Frontend shows 404

```bash
# Check build succeeded (Netlify logs)
# Check build command: npm run build
# Check publish directory: dist
```

---

## Rollback Procedure

If something goes wrong:

### Rollback Backend

```bash
# Render Dashboard → service → Deploys
# Click previous successful deploy
# Click "Rollback"
```

### Rollback Frontend

```bash
# Netlify → Deploys
# Click previous successful build
# Click "Publish deploy"
```

---

## Performance Tuning

### Redis

```bash
# Monitor usage
redis-cli --stat

# Clear cache if needed
redis-cli FLUSHALL  # WARNING: Clears all data
```

### Database

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM emergencies WHERE created_at > NOW() - INTERVAL '7 days';
```

### Backend

Monitor in Render:

- Increase worker count if needed
- Upgrade plan if CPU/Memory insufficient

---

## Next Steps

1. ✅ Database backups configured
2. ✅ Monitoring set up
3. ✅ Error tracking enabled (optional)
4. ✅ SSL certificates verified
5. ✅ Custom domain configured (optional)
6. ✅ Team invited to Render/Netlify
7. ✅ Documentation updated

---

**Deployment Date:** **\*\***\_**\*\***
**Deployed By:** **\*\***\_**\*\***
**Version:** **\*\***\_**\*\***

For issues, contact the development team or check logs in respective dashboards.
