# Backend Deployment Guide

Production deployment of Safety-GUARD backend to Railway, Render, or Fly.io.

## Pre-Deployment Checklist

- [ ] Database migrations tested locally
- [ ] All environment variables configured
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] CORS origins updated
- [ ] Twilio credentials configured (if using SMS)
- [ ] Rate limiting configured
- [ ] Health checks working

## Deployment Options

### Option 1: Railway (Recommended)

Railway provides PostgreSQL, Redis, and hosting in one platform.

#### Setup

1. **Create Railway Account**
   - https://railway.app
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "GitHub repo"
   - Connect Safety-GUARD repo
   - Select `backend` as root directory

3. **Add Services**

   ```bash
   # In Railway dashboard:
   # - Add PostgreSQL
   # - Add Redis
   ```

4. **Configure Environment Variables**

   ```bash
   # In Railway Variables tab:
   ENVIRONMENT=production
   DEBUG=False
   SECRET_KEY=<generate-long-random-key>
   DATABASE_URL=<railway-postgres-url>
   REDIS_URL=<railway-redis-url>
   FRONTEND_URL=https://safety-guard-kr-varun.netlify.app
   CORS_ORIGINS=["https://safety-guard-kr-varun.netlify.app"]
   TWILIO_ACCOUNT_SID=<your-twilio-sid>
   TWILIO_AUTH_TOKEN=<your-twilio-token>
   TWILIO_PHONE_NUMBER=<your-twilio-number>
   ```

5. **Deploy**
   - Push to main branch
   - Railway auto-deploys
   - Monitor deployment in dashboard

#### Connect Frontend

Update `src/.env`:

```
VITE_API_BASE_URL=https://your-railway-backend-url.railway.app
```

### Option 2: Render

#### Setup

1. **Create Render Account**
   - https://render.com
   - Sign in with GitHub

2. **Create PostgreSQL**
   - Dashboard → New → PostgreSQL
   - Note connection string

3. **Create Redis**
   - Dashboard → New → Redis
   - Note connection URL

4. **Deploy Web Service**
   - Dashboard → New → Web Service
   - Connect GitHub repo
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn app.main:socket_app --host 0.0.0.0 --port 8000`
   - Set environment variables (same as Railway)

5. **Monitor**
   - Check logs for errors
   - Verify health endpoint

### Option 3: Fly.io

#### Setup

1. **Install Fly CLI**

   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**

   ```bash
   flyctl auth login
   ```

3. **Create App**

   ```bash
   cd backend
   flyctl launch
   # Follow prompts
   # Select PostgreSQL: yes
   # Select Redis: yes
   ```

4. **Set Environment Variables**

   ```bash
   flyctl secrets set DATABASE_URL=<postgres-url>
   flyctl secrets set REDIS_URL=<redis-url>
   flyctl secrets set ENVIRONMENT=production
   # ... set all other vars
   ```

5. **Deploy**
   ```bash
   flyctl deploy
   ```

### Option 4: Docker + Heroku

#### Create Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:socket_app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Deploy to Heroku

```bash
# Login
heroku login

# Create app
heroku create safety-guard-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis
heroku addons:create heroku-redis:premium-0

# Set env vars
heroku config:set ENVIRONMENT=production
heroku config:set DEBUG=False
# ... set all vars

# Deploy
git push heroku main
```

## Post-Deployment

### 1. Verify Deployment

```bash
curl https://your-backend-url.com/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "Safety-GUARD Emergency Response API",
  "version": "1.0.0"
}
```

### 2. Check Database

```bash
# Connect to production database
psql <your-prod-database-url>

# List tables
\dt

# Check users table
SELECT COUNT(*) FROM users;
```

### 3. Monitor Logs

```bash
# Railway
railway logs

# Render
# Dashboard → Service → Logs

# Fly
flyctl logs

# Heroku
heroku logs --tail
```

### 4. Test API Endpoints

```bash
# Activate emergency
curl -X POST "https://your-backend.com/api/v1/emergency/activate?user_id=test-user-123"

# Get health
curl https://your-backend.com/health
```

### 5. Configure Frontend

Update frontend `.env` with production backend URL:

```bash
VITE_API_BASE_URL=https://your-backend-url.com
```

Redeploy frontend to Netlify.

## Monitoring & Maintenance

### 1. Set Up Logging

Add to `app/main.py`:

```python
import logging
from pythonjsonlogger import jsonlogger

# JSON logging for production
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger = logging.getLogger()
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)
```

### 2. Monitor Database Performance

```sql
-- Check slow queries
SELECT query, calls, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Set Up Alerts

**Railway:**

- Dashboard → Alerts
- Configure CPU, memory, response time alerts

**Render:**

- Dashboard → Alerts
- Configure email notifications

**Fly:**

```bash
flyctl alerts add
```

### 4. Database Backups

**Railway:**

- Auto-backups enabled
- Check in Data tab

**Render:**

- Automatic daily backups
- Download from dashboard

**Fly:**

```bash
# Create backup
flyctl postgres backup create

# List backups
flyctl postgres backup list

# Restore
flyctl postgres restore <backup-id>
```

## Scaling

### Horizontal Scaling

**Railway:**

- Increase Memory under Settings
- Auto-scaling available

**Render:**

- Upgrade plan tier
- Multiple instances available

**Fly:**

```bash
# Scale to 3 instances
flyctl scale count 3

# Scale by size
flyctl scale vm shared-cpu-4x
```

### Database Scaling

**PostgreSQL:**

- Upgrade to larger instance
- Enable read replicas for read-heavy operations

**Redis:**

- Upgrade to larger instance
- Consider Redis Cluster for high availability

## Troubleshooting

### Backend not responding

```bash
# Check service status
flyctl status  # Fly.io
heroku ps      # Heroku

# Check recent logs
flyctl logs --limit 100

# Redeploy
flyctl deploy  # Fly.io
git push heroku main  # Heroku
```

### Database connection errors

```python
# Check connection string
import os
print(os.environ['DATABASE_URL'])

# Test connection
psql <connection-string>
```

### Socket.IO not connecting

- Check CORS_ORIGINS in env vars
- Verify frontend URL is in CORS list
- Check WebSocket support in load balancer

### Memory issues

```bash
# Check memory usage
top

# Optimize database queries
# Check slow_log in PostgreSQL

# Increase memory allocation
# Via hosting platform dashboard
```

## Cost Optimization

1. **Use shared CPU instances** (cheaper than dedicated)
2. **Right-size database** (don't over-provision)
3. **Enable CDN** for static assets
4. **Archive old logs** to S3
5. **Set up auto-scaling** to handle peaks

## Security Checklist

- [ ] Enable HTTPS (auto with all platforms)
- [ ] Set strong SECRET_KEY
- [ ] Rotate API keys regularly
- [ ] Enable database encryption
- [ ] Configure WAF rules
- [ ] Set up DDoS protection
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Next Steps

1. Choose deployment platform
2. Follow platform-specific setup
3. Test all endpoints post-deployment
4. Set up monitoring and alerts
5. Configure frontend to use production API
6. Monitor logs for errors
7. Plan scaling strategy

---

For production support: See platform documentation

- Railway: https://docs.railway.app
- Render: https://render.com/docs
- Fly.io: https://fly.io/docs
