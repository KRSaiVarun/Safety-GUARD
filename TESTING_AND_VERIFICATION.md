# Testing Safety-GUARD - Email Rate Limit Fix & Testing Guide

## Email Rate Limit Issue ⏳

**What happened:** You tried signing up multiple times with `krsaivarun@gmail.com`, so Supabase blocked that email temporarily.

**Solution:** Wait 1 hour OR use a different email address

### Quick Test Email Addresses

Use one of these for testing (or create your own):

```
test1@example.com
test2@example.com
testuser@gmail.com
varun.test@gmail.com
```

Or create a temporary email: https://temp-mail.org

---

## Step 1: Create Test Account ✅

1. Go to: https://safety-guard-kr-varun.netlify.app
2. Click **Register**
3. Use different email (if previous one has rate limit):
   ```
   Full Name: Varun
   Email: test+varun@gmail.com (or different address)
   Phone: 7618266736
   Password: 00000000 (or any 8+ char password)
   ```
4. Click **Create Account**
5. You should be logged in automatically

---

## Step 2: Test Emergency Feature 🚨

1. Click **Emergency** button (or go to `/emergency` page)
2. You should see:
   - ✅ Session ID appears
   - ✅ 6-digit Passcode displayed
   - ✅ 10-second countdown timer
   - ✅ Location tracking starts (check browser permissions)

3. **Test 1 - Correct Passcode:**
   - Enter the passcode shown
   - Click "Verify"
   - Should say: "Emergency cancelled - safe!"

4. **Test 2 - Wrong Passcode:**
   - Click Emergency again
   - Enter WRONG passcode
   - System should trigger alert
   - Check Render logs for: "ALERT_TRIGGERED"

---

## Step 3: Check Backend Logs 📊

1. Go to: https://dashboard.render.com
2. Click your Web Service (`safety-guard-api`)
3. Go to **Logs** tab
4. You should see:

   ```
   Starting Safety-GUARD backend...
   Database initialized
   Event broadcaster initialized
   ```

5. When you trigger emergency, logs should show:
   ```
   POST /api/v1/emergency/activate
   Location update received
   ALERT_TRIGGERED
   ```

---

## Step 4: Test Dashboard 📍

1. Go to `/dashboard?session_id=YOUR_SESSION_ID` in another tab
2. Replace `YOUR_SESSION_ID` with the one from emergency page
3. Dashboard should show:
   - ✅ Live location on map
   - ✅ Threat level indicator
   - ✅ Location history
   - ✅ Real-time updates

---

## Step 5: Test Socket.IO Real-Time Sync 🔄

1. Open two browser tabs:
   - Tab 1: Emergency page
   - Tab 2: Dashboard
2. In Tab 1:
   - Submit location (browser will ask permission)
   - Dashboard in Tab 2 should update in real-time
   - ✅ Indicates Socket.IO is working!

---

## Common Issues & Fixes

### Email Rate Limit

**Problem:** "email rate limit exceeded"
**Fix:**

- Wait 1 hour, OR
- Use different email address

### Location Permission Denied

**Problem:** GPS not updating
**Fix:**

- Browser prompts for permission → Click "Allow"
- Or check browser settings → Allow location

### Cannot Access Backend

**Problem:** Cannot reach API endpoints
**Fix:**

- Check Render dashboard → Web Service → Logs
- Verify all environment variables are set
- Restart service: Settings → Restart Service

### Dashboard Not Updating

**Problem:** Socket.IO not connecting
**Fix:**

- Check CORS_ORIGINS in Render environment variables
- Verify frontend API_BASE_URL is correct
- Check browser console (F12) for errors

### Database Error

**Problem:** "Connection refused" in logs
**Fix:**

- Check PostgreSQL is "Available" in Render
- Verify DATABASE_URL is correct
- Wait a few seconds and reload page

---

## Full Testing Workflow

```
1. Signup with test email ✅
   └─ Check: Dashboard loads

2. Trigger Emergency ✅
   └─ Check: Session ID & Passcode appear

3. Test Passcode ✅
   └─ Check: Either cancels or triggers alert

4. Check Logs ✅
   └─ Check: Backend events recorded

5. Test Dashboard ✅
   └─ Check: Live location updates

6. Test Real-Time Sync ✅
   └─ Check: Two tabs update together
```

---

## Performance Metrics to Check

**Good Signs:**

- ✅ Frontend loads in < 2 seconds
- ✅ Emergency page appears immediately
- ✅ Location updates every 10 seconds
- ✅ Dashboard updates in real-time (< 1 second)
- ✅ No errors in browser console
- ✅ Backend logs show clean operation

**Bad Signs:**

- ❌ Frontend takes > 5 seconds to load
- ❌ Console shows red errors
- ❌ Location not updating
- ❌ Dashboard doesn't refresh
- ❌ Backend logs show errors

---

## What Each Component Should Do

| Component             | Expected Behavior             |
| --------------------- | ----------------------------- |
| **Signup**            | Creates account, logs you in  |
| **Emergency Page**    | Shows passcode, starts timer  |
| **Passcode Verify**   | Correct = safe, Wrong = alert |
| **Location Tracking** | Sends GPS every 10 seconds    |
| **Dashboard**         | Shows real-time location      |
| **Alert System**      | Sends to emergency contacts   |
| **Backend Logs**      | Shows all events clearly      |

---

## Success Checklist ✅

- [ ] Can signup/login
- [ ] Emergency page loads
- [ ] Passcode displays
- [ ] Location tracking works
- [ ] Passcode verify works
- [ ] Dashboard shows location
- [ ] Real-time updates work
- [ ] No console errors
- [ ] Backend logs look good
- [ ] End-to-end flow works

---

## After Testing

If everything works:

1. ✅ Deployment is successful!
2. 📊 You can now monitor via Render logs
3. 🚀 System is production-ready
4. 📱 Share the Netlify URL with users

If something doesn't work:

1. Check the "Issues & Fixes" section above
2. Look at Render logs for error messages
3. Check browser console (F12) for frontend errors
4. See DEPLOYMENT_CHECKLIST.md for troubleshooting

---

## Next Steps

**If all tests pass:**

- Share Netlify URL: https://safety-guard-kr-varun.netlify.app
- Monitor Render logs for issues
- Set up alerts on Render dashboard

**If issues found:**

- Fix issues using the guide above
- Redeploy if code changed: `git push`
- Restart service if config changed: Render Settings → Restart

---

**You're live! Test it out and let me know if you hit any issues.** 🎉
