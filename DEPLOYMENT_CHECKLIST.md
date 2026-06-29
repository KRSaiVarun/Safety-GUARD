# Final Deployment Checklist for Render

## Pre-Deployment Verification ✅

- [x] Backend code in `backend/` folder
- [x] `Procfile` created with correct start command
- [x] `requirements.txt` has all dependencies
- [x] `app/main.py` initializes database on startup
- [x] Socket.IO configured correctly
- [x] CORS middleware in place
- [x] Environment variables configured

---

## Deployment Steps (In Order)

### 1️⃣ Push Code to GitHub

```bash
cd c:\Abhi\Safety-Guard

# Initialize git if needed
git init

# Add all files
git add .

# Commit
git commit -m "Safety-GUARD backend ready for production"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/Safety-GUARD.git
git branch -M main
git push -u origin main
```

**Verify:** Visit https://github.com/YOUR_USERNAME/Safety-GUARD and see your code

---

### 2️⃣ Create Render Account

1. Go to https://render.com
2. Click "Sign up"
3. Use GitHub account (easier)
4. Authorize Render to access GitHub

**Verify:** You're logged into Render dashboard

---

### 3️⃣ Create PostgreSQL Database

1. In Render dashboard, click **New +**
2. Select **PostgreSQL**
3. Fill in:
   - **Name:** `safety-guard-postgres`
   - **Database:** `safety_guard`
   - **User:** `safety_user` (or let Render auto-generate)
   - **Region:** Choose closest to you
   - **PostgreSQL Version:** 15
4. Click **Create Database**
5. **Wait 2-3 minutes** for initialization

**Verify:** Database shows "Available" status, copy the **Internal Database URL**

---

### 4️⃣ Create Redis Instance

1. Click **New +**
2. Select **Redis**
3. Fill in:
   - **Name:** `safety-guard-redis`
   - **Region:** Same as PostgreSQL
4. Click **Create Redis**
5. **Wait 1-2 minutes**

**Verify:** Redis shows "Available", copy the **Internal Redis URL**

---

### 5️⃣ Create Web Service

1. Click **New +**
2. Select **Web Service**
3. **Connect GitHub:**
   - Click "Connect repository"
   - Find `Safety-GUARD`
   - Click "Connect"
4. Fill in:
   - **Name:** `safety-guard-api`
   - **Environment:** Python 3.11
   - **Region:** Same as database
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** (Leave blank - Render reads Procfile)
   - **Plan:** Free (or Starter for production)
5. Click **Create Web Service**

**Verify:** Service shows "Building..." then "Live" (takes 2-5 minutes)

---

### 6️⃣ Set Environment Variables

1. In Web Service, click **Environment** tab
2. Click **Add Environment Variable** for each:

```
DATABASE_URL = <paste-from-postgresql-info-tab>
REDIS_URL = <paste-from-redis-info-tab>
ENVIRONMENT = production
DEBUG = False
SECRET_KEY = <generate-random-string-32+-chars>
FRONTEND_URL = https://safety-guard-kr-varun.netlify.app
CORS_ORIGINS = ["https://safety-guard-kr-varun.netlify.app"]
SUPABASE_URL = https://nmyoxgcxvokiribbdyzf.supabase.co
SUPABASE_ANON_KEY = sb_publishable_gJqxl0tUIyoDzt-sw734tw_Dzes2SnQ
EMERGENCY_CONTACT_NUMBERS = ["+918548878488", "+918618266736"]
EMERGENCY_TIMEOUT_SECONDS = 10
AI_THREAT_THRESHOLD = 0.7
```

**Important:**

- Copy PostgreSQL URL from PostgreSQL service → Info tab
- Copy Redis URL from Redis service → Info tab
- Generate SECRET_KEY: Use `python -c "import secrets; print(secrets.token_urlsafe(32))"`

3. Click **Save**

**Verify:** All variables appear in Environment tab

---

### 7️⃣ Initialize Database

After deployment, initialize database tables:

**Option A: Via Render Shell (Recommended)**

1. Go to Web Service → **Shell** tab
2. Run:
   ```bash
   python -c "from app.database import init_db; init_db()"
   ```
3. You should see: "Tables created successfully"

**Option B: Check Logs**

1. Go to **Logs** tab
2. Should see: "Database initialized"

**Verify:** No database errors in logs

---

### 8️⃣ Test Backend

```bash
# Test health endpoint (replace with your URL from Render dashboard)
curl https://safety-guard-api-xxxxx.onrender.com/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "Safety-GUARD Emergency Response API",
#   "version": "1.0.0"
# }
```

**Verify:** Get 200 response with healthy status

---

### 9️⃣ Update Frontend

1. In your React project, update `.env`:

   ```
   VITE_API_BASE_URL=https://safety-guard-api-xxxxx.onrender.com
   ```

2. Commit and push to GitHub:

   ```bash
   git add .env
   git commit -m "Update API URL to production backend"
   git push
   ```

3. Netlify auto-deploys (takes 1-2 minutes)

**Verify:** Frontend loads at https://safety-guard-kr-varun.netlify.app

---

### 🔟 End-to-End Test

1. Open frontend: https://safety-guard-kr-varun.netlify.app
2. Go to Emergency page
3. Click "Activate Emergency"
4. You should see: Session ID and Passcode
5. Check Render logs: Should see location updates
6. Open dashboard in another tab
7. Dashboard should show location updates in real-time

**Verify:** All components working together

---

## Success Indicators ✅

- [x] Backend deployed to Render (Live status)
- [x] Database initialized (no errors in logs)
- [x] `/health` endpoint returns healthy
- [x] Frontend can reach backend API
- [x] Socket.IO connects successfully
- [x] Real-time updates working

---

## Troubleshooting

### Build Failed

**Problem:** Red "Build failed" in dashboard
**Solution:**

1. Click **Logs** tab to see error
2. Common causes:
   - Missing `requirements.txt` in `backend/`
   - Python syntax error in code
   - Missing import

### Service Won't Start

**Problem:** "Service exited with code 1"
**Solution:**

1. Check Logs for error message
2. Usually missing environment variables
3. Verify DATABASE_URL and REDIS_URL are set

### Cannot Connect to Database

**Problem:** "Connection refused" in logs
**Solution:**

1. Check DATABASE_URL is copied correctly
2. Verify PostgreSQL service status (should be "Available")
3. Copy internal URL (for Render-to-Render), not external

### Socket.IO Connection Fails

**Problem:** Frontend can't connect to backend
**Solution:**

1. Check CORS_ORIGINS includes frontend URL
2. Verify frontend has correct API URL
3. Check WebSocket connections in browser DevTools

### Logs Say "Module not found"

**Problem:** `ModuleNotFoundError: No module named 'app'`
**Solution:**

1. Backend code must be in `backend/` folder
2. Procfile must be in root or `backend/`
3. Build command should be: `pip install -r backend/requirements.txt`

---

## Post-Deployment

### Monitor Your App

- Logs: https://dashboard.render.com → Logs tab
- Metrics: Monitor CPU, memory usage
- Restart if needed: Dashboard → Settings → Restart Service

### Common Maintenance

```bash
# View recent logs
# In Render: Logs tab shows last 100 lines

# Restart service
# Render dashboard → Settings → Restart Service

# Update code
# Just push to GitHub - auto-redeploys
git push
```

### Scale if Needed

- Go to Web Service → Settings
- Upgrade from Free to Starter plan
- Increase memory/CPU

---

## Your Render URLs

**After deployment, you'll have:**

```
Backend API: https://safety-guard-api-xxxxx.onrender.com
  - Health check: /health
  - Emergency API: /api/v1/emergency/*
  - Socket.IO: / (WebSocket)

PostgreSQL: dpg-xxxxx.onrender.com:5432
Redis: redis-xxxxx.onrender.com:6379

Frontend: https://safety-guard-kr-varun.netlify.app (unchanged)
```

---

## Need Help?

**Render Support:**

- Docs: https://render.com/docs
- Status: https://render.com/status

**Safety-GUARD Documentation:**

- Backend: See `backend/README.md`
- Integration: See `INTEGRATION.md`
- Config: See `RENDER_CONNECTION_SETUP.md`

**FastAPI/Socket.IO:**

- FastAPI: https://fastapi.tiangolo.com
- Socket.IO: https://socket.io/docs

---

**Estimated total time:** 30-45 minutes

**Timeline:**

- Git push: 1 min
- Render signup: 2 min
- Create PostgreSQL: 3 min
- Create Redis: 2 min
- Create Web Service: 2 min
- Environment variables: 5 min
- Database initialization: 2 min
- Testing: 5 min
- Frontend update: 5 min
- **Total: ~30-40 minutes**

You're almost there! 🚀
