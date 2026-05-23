# Exposed Credentials Response Procedure

## ⚠️ CRITICAL: Immediate Actions (First 30 Minutes)

### 1. Revoke Exposed Credentials

```bash
# Stop all services to prevent further exposure
# Database
- Change PostgreSQL password immediately
- Revoke old password from all applications

# Redis
- Change Redis password
- Revoke old authentication

# Twilio
- Regenerate Account SID and Auth Token in Twilio Console
- Revoke old tokens from all services

# Supabase
- Generate new API keys
- Revoke old keys

# Other APIs
- Regenerate all exposed API keys
```

### 2. Remove from Git History

```bash
# If credentials were committed
git filter-branch --tree-filter 'rm -f .env' HEAD
git filter-branch --tree-filter 'rm -f .env.local' HEAD

# Force push (ONLY IF NOT PUBLIC YET)
git push -f --all
git push -f --tags
```

### 3. Scan for Accidental Commits

```bash
# Install git-secrets
brew install git-secrets  # macOS
sudo apt-get install git-secrets  # Linux

# Scan repository
git secrets --scan

# Prevent future leaks
git secrets --install
git secrets --register-aws
```

---

## 📋 Credential Rotation Checklist

### Database (PostgreSQL - Neon or Render)

- [ ] Generate new strong password (min 16 chars, mixed case, numbers, symbols)
- [ ] Update password in database console
- [ ] Test connection with new password
- [ ] Update `DATABASE_URL` in:
  - [ ] `.env` (local development)
  - [ ] Render dashboard → Environment Variables
  - [ ] GitHub Secrets (if used in CI/CD)
  - [ ] Netlify/Vercel dashboard
- [ ] Verify backend connects successfully
- [ ] Run migrations if needed
- [ ] Monitor for connection errors

### Redis (Upstash)

- [ ] Generate new authentication password
- [ ] Update in Upstash console
- [ ] Update `REDIS_URL` in:
  - [ ] `.env`
  - [ ] Render dashboard
  - [ ] All services using Redis
- [ ] Verify Celery workers can connect
- [ ] Test message queue functionality
- [ ] Clear old connection pools

### API Keys (Twilio)

- [ ] Log into Twilio Console
- [ ] Navigate to Account → Security → API Keys
- [ ] Delete old API Key
- [ ] Create new API Key
- [ ] Copy new credentials
- [ ] Update in:
  - [ ] `.env`
  - [ ] Render dashboard
  - [ ] GitHub Secrets
- [ ] Test SMS/WhatsApp sending
- [ ] Monitor API usage for anomalies

### Supabase Keys

- [ ] Log into Supabase Dashboard
- [ ] Project Settings → API
- [ ] Rotate `anon` key
- [ ] Rotate `service_role` key
- [ ] Update in:
  - [ ] `frontend/.env`
  - [ ] `backend/.env`
  - [ ] Netlify environment
  - [ ] Render environment
- [ ] Verify authentication still works
- [ ] Test file uploads/downloads

### Security Secrets (SECRET_KEY, JWT_SECRET_KEY)

Generate new secure values:

```bash
# Generate new SECRET_KEY
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"

# Generate new JWT_SECRET_KEY
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"
```

- [ ] Update in `.env`
- [ ] Update in Render dashboard
- [ ] Restart all backend services
- [ ] Note: Existing JWT tokens will be invalidated
- [ ] Users may need to re-login

---

## 🔍 Verify Credentials Are Removed

### Check for Patterns in Code

```bash
# Search for common credential patterns
grep -r "password=" backend/ --include="*.py"
grep -r "API_KEY" frontend/ --include="*.tsx"
grep -r "secret" . --include="*.env*"

# Use truffleHog to scan for secrets
pip install truffleHog
truffleHog filesystem . --json
```

### Audit Public Repositories

1. Go to GitHub repository
2. Check "Insights" → "Security & analysis"
3. Review any detected secrets
4. Check commit history for exposed credentials
5. Use GitHub's secret scanning feature

---

## 📊 Verification Steps

After rotating all credentials:

### Backend Connectivity

```bash
# Test database
cd backend
python -c "from app.database import db_config; db_config.init_db()"

# Test Redis
python -c "import redis; r = redis.from_url('${REDIS_URL}'); print(r.ping())"

# Test Twilio
python -c "from twilio.rest import Client; c = Client(); print('OK')"
```

### Frontend Connectivity

```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_API_URL

# Test API connection
curl https://your-backend.onrender.com/health
```

### Service Status

```bash
# Check Render services
curl https://api.render.com/v1/services -H "Authorization: Bearer YOUR_API_KEY"

# Check Netlify deploy
netlify status
```

---

## 📢 Communication

### Notify Team

- [ ] Slack announcement: "Database credentials rotated as of [TIME]"
- [ ] Update deployment docs
- [ ] Brief team on new procedures
- [ ] Document incident timeline

### External Services

- [ ] Notify Render support (if needed)
- [ ] Notify Supabase support (if needed)
- [ ] Update Twilio webhook documentation

---

## 🔐 Prevent Future Exposure

### Pre-Commit Hooks

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
git secrets --pre_commit_hook || exit 1
```

### Environment Setup

Create setup script `scripts/setup-dev.sh`:

```bash
#!/bin/bash

# Copy env template
cp .env.example .env
cp frontend/.env.example frontend/.env.local

# Install git hooks
git secrets --install

echo "✅ Development environment ready!"
echo "⚠️  Remember: Never commit .env files!"
```

### GitHub Branch Protection

1. Go to Settings → Branches
2. Add rule for `main`
3. Require:
   - [ ] Pull request reviews before merging
   - [ ] Dismiss stale review approvals
   - [ ] Require status checks to pass
   - [ ] Require branches to be up to date

### Code Review Checklist

When reviewing PRs, verify:

- [ ] No `.env` files committed
- [ ] No hardcoded secrets in code
- [ ] No API keys in strings
- [ ] No database passwords in logs
- [ ] Environment variables used correctly

---

## 📚 Reference: Secure Practices

### Secret Generation

```python
# Python
import secrets
import os

# Generate random token
token = secrets.token_urlsafe(32)

# Generate secure password
password = secrets.choice('!@#$%^&*') + ''.join([
    secrets.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')
    for _ in range(15)
])
```

### Environment Variable Access

```python
# Correct: Using os.getenv with defaults
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://localhost/dev')

# Correct: Using python-dotenv
from dotenv import load_dotenv
load_dotenv()
SECRET_KEY = os.getenv('SECRET_KEY')

# WRONG: Hardcoding secrets
PASSWORD = "my-secret-password"  # ❌ NEVER DO THIS
```

### Files to Never Commit

```gitignore
.env
.env.local
.env.*.local
.env.production.local
*.key
*.pem
credentials/
secrets/
oauth_token
```

---

**Last Rotation:** [Update when credentials are rotated]
**Next Recommended Review:** [3 months from rotation date]
**Owner:** Security Team
