# 🚀 SAFETY-GUARD BACKEND DEPLOYMENT - QUICK START

## Your Deployment Roadmap

You have a **production-ready Python FastAPI backend** with:

- ✅ Real-time Socket.IO communication
- ✅ PostgreSQL database models
- ✅ AI threat detection
- ✅ SMS alert system
- ✅ All dependencies configured

---

## Step 1: Generate Your SECRET_KEY

Run this in PowerShell/Terminal to get a secure key:

```powershell
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
```

**Copy the output** - you'll need this in step 6

---

## Step 2: Push Your Code to GitHub

```bash
cd c:\Abhi\Safety-Guard

git init
git add .
git commit -m "Safety-GUARD backend ready for production"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/Safety-GUARD.git
git branch -M main
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username.

---

## Step 3: Create Render Account

1. Go to **https://render.com**
2. Click **Sign Up**
3. Use GitHub to sign up (easier)
4. Authorize Render

---

## Step 4: Create PostgreSQL Database

1. **In Render Dashboard**, click **New +** → **PostgreSQL**

2. Configure:

   ```
   Name: safety-guard-postgres
   Database: safety_guard
   User: safety_user
   Region: Choose your region (US, EU, etc.)
   PostgreSQL Version: 15
   ```

3. Click **Create Database**

4. **Wait 2-3 minutes** until status is "Available"

5. **Copy the Internal Database URL** - it looks like:
   ```
   postgresql://safety_user:xxxxx@dpg-xxxxx.onrender.com/safety_guard
   ```

---

## Step 5: Create Redis Cache

1. Click **New +** → **Redis**

2. Configure:

   ```
   Name: safety-guard-redis
   Region: Same as PostgreSQL (above)
   ```

3. Click **Create Redis**

4. **Wait 1-2 minutes** until status is "Available"

5. **Copy the Internal Redis URL** - it looks like:
   ```
   redis://default:xxxxx@redis-xxxxx.onrender.com:6379
   ```

---

## Step 6: Deploy Web Service

1. Click **New +** → **Web Service**

2. **Connect GitHub:**
   - Click "Connect repository"
   - Select your `Safety-GUARD` repo
   - Click "Connect"

3. Configure:

   ```
   Name: safety-guard-api
   Environment: Python 3.11
   Build Command: pip install -r backend/requirements.txt
   Start Command: (Leave empty - uses Procfile)
   Region: Same as PostgreSQL
   Plan: Free (or Starter)
   ```

4. Click **Create Web Service**

5. **Watch deployment** - takes 2-5 minutes. You'll see "Building..." then "Live"

---

## Step 7: Add Environment Variables ⚙️

Once deployment is done:

1. Go to your Web Service → **Environment** tab

2. Click **Add Environment Variable** for each:

### Database & Cache

```
DATABASE_URL = (paste from PostgreSQL Info tab)
REDIS_URL = (paste from Redis Info tab)
```

### Server Settings

```
ENVIRONMENT = production
DEBUG = False
SECRET_KEY = (paste the value from Step 1)
```

### Frontend Configuration

```
FRONTEND_URL = https://safety-guard-kr-varun.netlify.app
CORS_ORIGINS = ["https://safety-guard-kr-varun.netlify.app"]
```

### Existing Services

```
SUPABASE_URL = https://nmyoxgcxvokiribbdyzf.supabase.co
SUPABASE_ANON_KEY = sb_publishable_gJqxl0tUIyoDzt-sw734tw_Dzes2SnQ
```

### Emergency Settings

```
EMERGENCY_CONTACT_NUMBERS = ["+918548878488", "+918618266736"]
EMERGENCY_TIMEOUT_SECONDS = 10
AI_THREAT_THRESHOLD = 0.7
```

3. Click **Save**

---

## Step 8: Initialize Database

Your database tables are created automatically when the app starts. But you can verify:

1. Go to your Web Service → **Logs** tab
2. Look for: `"Database initialized"`

This confirms the database is ready.

---

## Step 9: Test the Backend

Once it shows "Live":

```bash
# Replace xxxxx with your Render app name
curl https://safety-guard-api-xxxxx.onrender.com/health

# Should return:
# {
#   "status": "healthy",
#   "service": "Safety-GUARD Emergency Response API",
#   "version": "1.0.0"
# }
```

---

## Step 10: Update Frontend & Deploy

Now connect your React frontend to this backend:

1. Update `src/.env` in your React project:

   ```
   VITE_API_BASE_URL=https://safety-guard-api-xxxxx.onrender.com
   ```

2. Commit and push to GitHub:

   ```bash
   git add src/.env
   git commit -m "Update backend API URL to production"
   git push
   ```

3. Netlify auto-deploys (takes 1-2 minutes)

---

## Step 11: Test Everything Works

1. Open https://safety-guard-kr-varun.netlify.app
2. Go to Emergency page
3. Click "Activate Emergency"
4. Should show: Session ID + Passcode
5. Open another tab and check Render logs
6. Should see real-time updates

✅ **You're live!**

---

## Your Live URLs

After deployment, you'll have:

| Service          | URL                                                  |
| ---------------- | ---------------------------------------------------- |
| **Backend API**  | `https://safety-guard-api-xxxxx.onrender.com`        |
| **Health Check** | `https://safety-guard-api-xxxxx.onrender.com/health` |
| **Frontend**     | `https://safety-guard-kr-varun.netlify.app`          |
| **PostgreSQL**   | (Internal only - from Render Info tab)               |
| **Redis**        | (Internal only - from Render Info tab)               |

---

## Troubleshooting

### Build Failed

- Check **Logs** tab in Render
- Most common: Missing `requirements.txt`

### Service Won't Start

- Missing environment variables
- Copy DATABASE_URL and REDIS_URL from Render Info tabs (not external URLs)

### Can't Connect from Frontend

- Check CORS_ORIGINS includes your Netlify URL
- Verify frontend has correct API_BASE_URL

### Database Connection Error

- Verify PostgreSQL is "Available" (not "Starting")
- Use Internal Database URL, not External

---

## Need Help?

Check these files for more details:

- `DEPLOYMENT_CHECKLIST.md` - Step-by-step with all details
- `RENDER_CONNECTION_SETUP.md` - Connection strings explained
- `backend/README.md` - API documentation
- `INTEGRATION.md` - Frontend integration guide

---

## Timeline

- **Step 1-3:** 5 minutes
- **Step 4:** 5 minutes (wait for DB)
- **Step 5:** 3 minutes (wait for Redis)
- **Step 6:** 5 minutes (wait for Web Service)
- **Step 7:** 5 minutes (set env vars)
- **Step 8:** 1 minute
- **Step 9:** 1 minute (test)
- **Step 10:** 5 minutes (frontend update)
- **Step 11:** 2 minutes (test)

**Total: ~40 minutes**

---

## ✨ You're Ready!

Everything is prepared. Just follow the 11 steps above and your Safety-GUARD backend will be live in production! 🎉

Questions? Check the detailed guides in the repo or Render documentation: https://render.com/docs
