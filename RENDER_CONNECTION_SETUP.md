# Complete Render Deployment Setup Guide

## Getting Your Connection Strings from Render

### Step 1: Find Your PostgreSQL Connection String

1. Go to https://dashboard.render.com
2. Click on your **PostgreSQL database** (e.g., `safety-guard-postgres`)
3. Go to the **Info** tab
4. Copy the **Internal Database URL** (for backend connecting from Render)
   - Format: `postgresql://username:password@hostname:5432/dbname`
   - This is what you need for `DATABASE_URL`

### Step 2: Find Your Redis Connection String

1. In Render dashboard, click on your **Redis** instance
2. Go to the **Info** tab
3. Copy the **Internal Redis URL** (for backend connecting from Render)
   - Format: `redis://default:password@hostname:6379`
   - This is what you need for `REDIS_URL`

### Step 3: Set Environment Variables in Render

1. Go to your **Web Service** (`safety-guard-api`)
2. Click **Environment** tab
3. Click **Add Environment Variable**
4. Add each of these:

#### Database & Cache

```
DATABASE_URL = postgresql://user:pass@host:5432/dbname
REDIS_URL = redis://default:password@hostname:6379
```

#### Server Config

```
ENVIRONMENT = production
DEBUG = False
SECRET_KEY = generate-a-random-key-here-at-least-32-chars
```

#### Frontend (for CORS)

```
FRONTEND_URL = https://safety-guard-kr-varun.netlify.app
CORS_ORIGINS = ["https://safety-guard-kr-varun.netlify.app"]
```

#### Supabase (existing)

```
SUPABASE_URL = https://nmyoxgcxvokiribbdyzf.supabase.co
SUPABASE_ANON_KEY = sb_publishable_gJqxl0tUIyoDzt-sw734tw_Dzes2SnQ
```

#### Emergency Contacts

```
EMERGENCY_CONTACT_NUMBERS = ["+918548878488", "+918618266736"]
EMERGENCY_TIMEOUT_SECONDS = 10
AI_THREAT_THRESHOLD = 0.7
```

#### Twilio (if using SMS - optional)

```
TWILIO_ACCOUNT_SID = (your-twilio-sid-if-you-have-it)
TWILIO_AUTH_TOKEN = (your-twilio-token-if-you-have-it)
TWILIO_PHONE_NUMBER = (your-twilio-number-if-you-have-it)
```

### Step 4: Initialize Database

After deployment, you need to initialize the database:

**Option A: Via Render Shell**

1. In Render dashboard, go to your Web Service
2. Click the **Shell** tab
3. Run:
   ```bash
   python -c "from app.database import init_db; init_db()"
   ```

**Option B: SSH into service** (Paid Render plan required)

```bash
# Connect to your Render app
ssh app@your-app.onrender.com
cd /opt/render/project/src
python -c "from app.database import init_db; init_db()"
```

**Option C: Local initialization** (if you have database access)

```bash
# From your local machine
psql <your-database-url>
# Then database tables are auto-created on first connection via SQLAlchemy
```

### Step 5: Verify Deployment

Once everything is set:

```bash
# Test health endpoint
curl https://your-app.onrender.com/health

# Expected response
{
  "status": "healthy",
  "service": "Safety-GUARD Emergency Response API",
  "version": "1.0.0"
}
```

---

## Quick Reference: What Goes Where

| Variable                    | Where to Get It             | Example                                         |
| --------------------------- | --------------------------- | ----------------------------------------------- |
| `DATABASE_URL`              | Render PostgreSQL Info tab  | `postgresql://...`                              |
| `REDIS_URL`                 | Render Redis Info tab       | `redis://default:...`                           |
| `SECRET_KEY`                | Generate random (32+ chars) | `sk_live_...`                                   |
| `FRONTEND_URL`              | Your Netlify app URL        | `https://safety-guard-kr-varun.netlify.app`     |
| `CORS_ORIGINS`              | Same as FRONTEND_URL        | `["https://safety-guard-kr-varun.netlify.app"]` |
| `SUPABASE_URL`              | From existing setup         | `https://nmyoxgcxvokiribbdyzf.supabase.co`      |
| `SUPABASE_ANON_KEY`         | From existing setup         | `sb_publishable_...`                            |
| `EMERGENCY_CONTACT_NUMBERS` | Your emergency contacts     | `["+918548878488"]`                             |

---

## Common Issues & Fixes

### "Connection refused" error

- Database URL is wrong → Check Render dashboard for correct URL
- Database not running → Check Render PostgreSQL status
- Service trying to connect before DB ready → Add wait logic in main.py

### "Module not found" error

- Missing `requirements.txt` → Verify it's in `backend/` folder
- Dependencies not installed → Check build logs in Render

### Service crashes after deployment

- Check logs: Render dashboard → Web Service → Logs
- Common causes: Missing env vars, database URL invalid, incorrect Python version

### Socket.IO not connecting from frontend

- Check CORS_ORIGINS includes frontend URL
- Check backend URL in frontend `.env`
- Verify WebSocket connections work: Test with `wscat` or browser DevTools

---

## After Deployment

1. ✅ Backend deployed to Render
2. 📝 Update frontend `.env` with backend URL:
   ```
   VITE_API_BASE_URL=https://your-app.onrender.com
   ```
3. 🚀 Redeploy frontend to Netlify
4. 🧪 Test end-to-end emergency flow
5. 📊 Monitor Render logs

---

**Need help?**

- Render docs: https://render.com/docs
- FastAPI: https://fastapi.tiangolo.com
- Check backend logs: Render Dashboard → Logs tab
