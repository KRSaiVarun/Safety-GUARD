# Deployment Setup - Final Steps

## Your Database Connection

✅ PostgreSQL connected to Render:

```
Host: dpg-d84sai9kh4rs73ddqhb0-a.oregon-postgres.render.com
User: safety_guard_user
Database: safety_guard
Password: bgDI3bi8jtsAapacuVpwHXnrG6KEzRz4
```

## Database URL Format

Use this in Render environment variables:

```
DATABASE_URL=postgresql://safety_guard_user:bgDI3bi8jtsAapacuVpwHXnrG6KEzRz4@dpg-d84sai9kh4rs73ddqhb0-a.oregon-postgres.render.com/safety_guard
```

---

## Action Items

### 1. Get Your Redis URL

1. Go to Render dashboard → Redis instance
2. Click **Info** tab
3. Copy **Internal Redis URL** (looks like: `redis://default:password@host:6379`)
4. Paste it where needed below

### 2. Generate SECRET_KEY

Run this command to generate a secure key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Save the output for step 3.

### 3. Create Web Service on Render

1. **In Render Dashboard:** Click **New +** → **Web Service**
2. **Connect GitHub:**
   - Select your `KRSaiVarun/Safety-GUARD` repo
   - Connect it
3. **Configure:**
   - **Name:** `safety-guard-api`
   - **Environment:** Python 3.11
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** Leave blank (uses Procfile)
   - **Plan:** Free or Starter
4. **Create Service** and wait for deployment

### 4. Add Environment Variables

Once Web Service is created, go to **Environment** tab and add:

```
# Database
DATABASE_URL=postgresql://safety_guard_user:bgDI3bi8jtsAapacuVpwHXnrG6KEzRz4@dpg-d84sai9kh4rs73ddqhb0-a.oregon-postgres.render.com/safety_guard

# Redis (from your Redis Info tab)
REDIS_URL=redis://default:PASSWORD@HOST:6379

# Server
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=<paste-your-generated-key-here>

# Frontend
FRONTEND_URL=https://safety-guard-kr-varun.netlify.app
CORS_ORIGINS=["https://safety-guard-kr-varun.netlify.app"]

# Supabase
SUPABASE_URL=https://nmyoxgcxvokiribbdyzf.supabase.co
SUPABASE_ANON_KEY=sb_publishable_gJqxl0tUIyoDzt-sw734tw_Dzes2SnQ

# Emergency
EMERGENCY_CONTACT_NUMBERS=["+918548878488", "+918618266736"]
EMERGENCY_TIMEOUT_SECONDS=10
AI_THREAT_THRESHOLD=0.7
```

### 5. Initialize Database

After Web Service is running (shows "Live"):

1. Go to **Logs** tab
2. Look for: `"Database initialized"`
3. If not there, go to **Shell** tab and run:
   ```bash
   python -c "from app.database import init_db; init_db()"
   ```

### 6. Test Backend

```bash
curl https://your-app-name.onrender.com/health
```

Should return:

```json
{
  "status": "healthy",
  "service": "Safety-GUARD Emergency Response API",
  "version": "1.0.0"
}
```

### 7. Update Frontend

1. Update `src/.env`:

   ```
   VITE_API_BASE_URL=https://your-app-name.onrender.com
   ```

2. Commit and push to GitHub:

   ```bash
   git add src/.env
   git commit -m "Update backend URL to production"
   git push
   ```

3. Netlify auto-deploys (1-2 minutes)

---

## Quick Checklist

- [ ] Redis URL obtained from Render
- [ ] SECRET_KEY generated
- [ ] Web Service created on Render
- [ ] All environment variables set
- [ ] Database initialized (check logs)
- [ ] Health endpoint returns 200
- [ ] Frontend updated with API URL
- [ ] Frontend redeployed to Netlify
- [ ] End-to-end test complete

---

## Your Live URLs (After Deployment)

```
Backend API: https://safety-guard-api-[random].onrender.com
Health: https://safety-guard-api-[random].onrender.com/health
Frontend: https://safety-guard-kr-varun.netlify.app
```

---

## Troubleshooting

**Build failed?**

- Check Logs tab for error
- Verify `requirements.txt` is in `backend/` folder

**Service won't start?**

- Missing environment variables
- Check DATABASE_URL and REDIS_URL are set correctly

**Can't connect?**

- Verify CORS_ORIGINS includes Netlify URL
- Check frontend has correct API_BASE_URL

---

**You're ready! Follow the steps above and you'll be live!** 🚀
