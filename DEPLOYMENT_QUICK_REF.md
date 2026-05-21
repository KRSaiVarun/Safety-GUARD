# QUICK REFERENCE CARD

## Your Credentials (DO NOT commit to GitHub)

```
PostgreSQL Database URL:
postgresql://<db_user>:<password>@<host>:5432/<db_name>

GitHub Repository:
https://github.com/KRSaiVarun/Safety-GUARD

Supabase Anon Key:
<sb_publishable_key>

Supabase Service Role Key:
<sb_service_role_key>
```

---

## Environment Variables for Render

Copy these exactly into Render Environment tab:

```
DATABASE_URL=postgresql://<db_user>:<password>@<host>:5432/<db_name>
REDIS_URL=redis://default:<password>@<host>:6379
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=<generated-key>
FRONTEND_URL=https://safety-guard-kr-varun.netlify.app
CORS_ORIGINS=["https://safety-guard-kr-varun.netlify.app"]
SUPABASE_URL=https://nmyoxgcxvokiribbdyzf.supabase.co
SUPABASE_ANON_KEY=<sb_publishable_key>
EMERGENCY_CONTACT_NUMBERS=["+918548878488", "+918618266736"]
EMERGENCY_TIMEOUT_SECONDS=10
AI_THREAT_THRESHOLD=0.7
```

---

## Deployment Checklist

- [ ] Step 1: Create/Check Redis on Render
- [ ] Step 2: Generate SECRET_KEY
- [ ] Step 3: Create Web Service (connect GitHub)
- [ ] Step 4: Add all environment variables
- [ ] Step 5: Verify logs show "healthy"
- [ ] Step 6: Update frontend API_BASE_URL
- [ ] Step 7: Test end-to-end

---

## Emergency Contact Numbers

- +918548878488
- +918618266736

---

## Important Files

Read in this order:

1. **GO_LIVE_NOW.md** ← START HERE (7 simple steps)
2. **FINAL_DEPLOYMENT_STEPS.md** (detailed help)
3. **DEPLOYMENT_CHECKLIST.md** (full details)

---

## Support

- Render Dashboard: https://dashboard.render.com
- Render Docs: https://render.com/docs
- PostgreSQL URL Test: `psql -h dpg-d84sai9kh4rs73ddqhb0-a.oregon-postgres.render.com -U safety_guard_user -d safety_guard`

---

## Your Production Domains

```
Backend: https://safety-guard-api-[name].onrender.com
Frontend: https://safety-guard-kr-varun.netlify.app
```

---

**⏱️ Time to deploy: ~40 minutes**

**Status: READY TO DEPLOY** ✅
