# Render Deployment Checklist

## Step 1: Push to GitHub ✅

If you haven't already, push your code to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Safety-GUARD backend - production ready"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/Safety-GUARD.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 2: Create Render Account ✅

1. Go to https://render.com
2. Sign up with GitHub (recommended - easier linking)
3. Verify email

## Step 3: Create PostgreSQL Database

1. **In Render Dashboard:**
   - Click "New +" button
   - Select "PostgreSQL"
   - Give it a name: `safety-guard-postgres`
   - Region: Choose closest to your users
   - PostgreSQL Version: 15
   - Click "Create Database"

2. **Wait for database to initialize** (takes ~2 minutes)

3. **Copy connection string** from database page
   - You'll use this in environment variables

## Step 4: Create Redis Cache

1. **In Render Dashboard:**
   - Click "New +" button
   - Select "Redis"
   - Give it a name: `safety-guard-redis`
   - Region: Same as PostgreSQL
   - Click "Create Redis"

2. **Wait for Redis to initialize**

3. **Copy Redis URL** from the dashboard
   - Format: `redis://default:PASSWORD@HOST:PORT`

## Step 5: Deploy Backend Web Service

1. **In Render Dashboard:**
   - Click "New +" button
   - Select "Web Service"
   - Connect your GitHub repo
   - Choose `Safety-GUARD` repo

2. **Configure Web Service:**
   - **Name:** `safety-guard-api`
   - **Region:** Same as database
   - **Runtime:** Python 3.11
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** Leave blank (Render reads Procfile)
   - **Plan:** Free (or Starter for production)

3. **Deploy** - Click "Create Web Service"

## Step 6: Set Environment Variables

After web service is created:

1. Go to **Environment** tab in web service settings

2. Add these variables:

```
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=<generate-a-random-secret-key-here>

DATABASE_URL=<paste-postgres-connection-string>
REDIS_URL=<paste-redis-url>

FRONTEND_URL=https://safety-guard-kr-varun.netlify.app
CORS_ORIGINS=["https://safety-guard-kr-varun.netlify.app"]

TWILIO_ACCOUNT_SID=<your-twilio-sid-if-you-have-it>
TWILIO_AUTH_TOKEN=<your-twilio-token-if-you-have-it>
TWILIO_PHONE_NUMBER=<your-twilio-number-if-you-have-it>

SUPABASE_URL=https://nmyoxgcxvokiribbdyzf.supabase.co
SUPABASE_ANON_KEY=sb_publishable_gJqxl0tUIyoDzt-sw734tw_Dzes2SnQ

EMERGENCY_CONTACT_NUMBERS=["+918548878488", "+918618266736"]
EMERGENCY_TIMEOUT_SECONDS=10
AI_THREAT_THRESHOLD=0.7
```

3. Click "Save"

## Step 7: Verify Deployment

1. **Wait for build to complete** (check Logs tab)
   - You should see: "Build successful"
   - Then: "Service is live"

2. **Test the backend:**

   ```bash
   # Replace with your Render URL (shown in dashboard)
   curl https://your-safety-guard-api.render.com/health
   ```

3. **Expected response:**
   ```json
   {
     "status": "healthy",
     "service": "Safety-GUARD Emergency Response API",
     "version": "1.0.0"
   }
   ```

## Step 8: Update Frontend

Once backend is live on Render:

1. Update frontend `.env`:

   ```
   VITE_API_BASE_URL=https://your-safety-guard-api.render.com
   ```

2. Redeploy frontend to Netlify

3. Test the complete flow

## Important Notes

- **Procfile** tells Render how to start the app
- **Root directory** should be `.` (Render finds Procfile)
- **Build logs** available in Render dashboard - check if deployment fails
- **Database connection** might take a few seconds first time
- **Free tier** goes to sleep after 15 min of inactivity (paid plans don't)

## Troubleshooting

### "Build failed" error

- Check build logs in Render dashboard
- Make sure `requirements.txt` is in `backend/` folder
- Verify Python syntax with: `python -m py_compile backend/app/main.py`

### "H13 error" or service won't start

- Check environment variables are set
- Verify DATABASE_URL and REDIS_URL
- Check logs: Render → Logs tab

### Cannot connect to database

- Make sure PostgreSQL service is running
- Check connection string in .env matches DATABASE_URL
- Try connecting from local machine: `psql <DATABASE_URL>`

### Socket.IO not connecting from frontend

- Check CORS_ORIGINS includes your frontend URL
- Verify frontend API_BASE_URL is correct
- Check browser console for WebSocket errors

## Next Steps After Deployment

1. ✅ Backend deployed to Render
2. 📝 Update frontend .env with backend URL
3. 🚀 Redeploy frontend to Netlify
4. 🧪 Test end-to-end emergency flow
5. 📊 Monitor Render dashboard for issues

---

**Estimated time:** 15-20 minutes

**Support:**

- Render Docs: https://render.com/docs
- Python FastAPI: https://fastapi.tiangolo.com
- Socket.IO: https://socket.io/docs
