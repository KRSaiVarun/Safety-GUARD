# 🚀 FINAL DEPLOYMENT - EXACT STEPS

## What You Have ✅

- **GitHub Repo:** https://github.com/KRSaiVarun/Safety-GUARD
- **PostgreSQL:** Connected on Render (dpg-d84sai9kh4rs73ddqhb0-a)
- **Supabase:** Ready (sb_publishable_gJqxl0tUIyoDzt-sw734tw_Dzes2SnQ)

## What You Need to Do

### STEP 1: Check/Create Redis on Render (5 min)

**If you DON'T have Redis yet:**

1. Go to https://dashboard.render.com
2. Click **New +** → **Redis**
3. Name: `safety-guard-redis`
4. Region: `Oregon` (same as PostgreSQL)
5. Click **Create Redis**
6. **Wait 2-3 minutes**

**Once Redis is ready:**

- Go to Redis → **Info** tab
- Copy **Internal Redis URL** (looks like: `redis://default:PASSWORD@redis-xxxxx.onrender.com:6379`)
- **Save this value**

---

### STEP 2: Generate SECRET_KEY (1 min)

Run in PowerShell:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Copy the output** - you'll use this in Step 3

---

### STEP 3: Create Web Service on Render (10 min)

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Click **Connect repository**
4. Select `KRSaiVarun/Safety-GUARD`
5. Click **Connect**

**Configure:**

- **Name:** `safety-guard-api`
- **Environment:** Python 3.11
- **Root Directory:** `.` (default)
- **Build Command:** `pip install -r backend/requirements.txt`
- **Start Command:** (leave blank)
- **Plan:** Free

6. Click **Create Web Service**

**⏳ Wait for build to complete** (you'll see "Live" status)

---

### STEP 4: Add Environment Variables (5 min)

Once your Web Service shows "Live":

1. Click the Web Service
2. Go to **Environment** tab
3. Click **Add Environment Variable** for each:

#### Copy-Paste These Exact Values:

```
DATABASE_URL
postgresql://safety_guard_user:bgDI3bi8jtsAapacuVpwHXnrG6KEzRz4@dpg-d84sai9kh4rs73ddqhb0-a.oregon-postgres.render.com/safety_guard

REDIS_URL
(paste your Redis URL from Step 1)

ENVIRONMENT
production

DEBUG
False

SECRET_KEY
(paste your key from Step 2)

FRONTEND_URL
https://safety-guard-kr-varun.netlify.app

CORS_ORIGINS
["https://safety-guard-kr-varun.netlify.app"]

SUPABASE_URL
https://nmyoxgcxvokiribbdyzf.supabase.co

SUPABASE_ANON_KEY
sb_publishable_gJqxl0tUIyoDzt-sw734tw_Dzes2SnQ

EMERGENCY_CONTACT_NUMBERS
["+918548878488", "+918618266736"]

EMERGENCY_TIMEOUT_SECONDS
10

AI_THREAT_THRESHOLD
0.7
```

4. Click **Save** after adding all variables

---

### STEP 5: Verify Deployment (3 min)

1. Go to **Logs** tab
2. Look for these messages:

   ```
   Starting Safety-GUARD backend...
   Database initialized
   Event broadcaster initialized
   ```

3. Your app URL appears at the top (like: `https://safety-guard-api-xxxxx.onrender.com`)

4. Test it:
   ```bash
   curl https://safety-guard-api-xxxxx.onrender.com/health
   ```
   Should return status 200 with "healthy"

---

### STEP 6: Update Frontend (5 min)

1. Edit `src/.env` in your React project:

   ```
   VITE_API_BASE_URL=https://safety-guard-api-xxxxx.onrender.com
   ```

   (Use your actual URL from Step 5)

2. Commit and push:

   ```bash
   cd c:\Abhi\Safety-Guard
   git add src/.env
   git commit -m "Update API URL to production"
   git push
   ```

3. Netlify auto-deploys automatically (1-2 minutes)

---

### STEP 7: Test Everything (5 min)

1. Open: https://safety-guard-kr-varun.netlify.app
2. Go to Emergency page
3. Click "Activate Emergency"
4. You should see:
   - ✅ Session ID appears
   - ✅ Passcode displayed
   - ✅ Countdown starts
5. Open Render logs → should see location updates
6. ✅ **You're live!**

---

## Summary Table

| What          | Where   | What to Do          |
| ------------- | ------- | ------------------- |
| PostgreSQL    | Render  | ✅ Already created  |
| Redis         | Render  | ⏳ Create if needed |
| Web Service   | Render  | ⏳ Create in Step 3 |
| Env Variables | Render  | ⏳ Add in Step 4    |
| Frontend      | Netlify | ⏳ Update in Step 6 |

---

## Your URLs

After Step 7:

```
🔹 Backend API: https://safety-guard-api-[name].onrender.com
🔹 Health Check: https://safety-guard-api-[name].onrender.com/health
🔹 Frontend: https://safety-guard-kr-varun.netlify.app
🔹 PostgreSQL: (Render internal)
🔹 Redis: (Render internal)
```

---

## If Something Goes Wrong

**Build Failed**

- Click **Logs** → read error message
- Usually: missing requirements.txt or syntax error
- See DEPLOYMENT_CHECKLIST.md for fixes

**Service Won't Start**

- Check **Environment** tab → all vars set?
- Check DATABASE_URL and REDIS_URL are correct
- Restart service: Settings → Restart Service

**Can't Connect from Frontend**

- Is CORS_ORIGINS correct?
- Is frontend API_BASE_URL correct?
- Check browser console for errors

---

## ⏱️ Timeline

- Steps 1-2: 10 minutes
- Step 3: 10 minutes (waiting for build)
- Step 4: 5 minutes
- Step 5: 3 minutes
- Step 6: 5 minutes
- Step 7: 5 minutes

**Total: ~40 minutes to go live** 🎉

---

**Ready? Let's go! Start with Step 1 above.** ✨
