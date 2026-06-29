# GitHub Secrets Setup for CI/CD

## Purpose

This document explains how to set up GitHub Secrets for automated testing and deployment.

## Why Secrets Matter

Secrets prevent credentials from being exposed in:

- Source code
- GitHub Action logs
- Public repositories
- CI/CD outputs

## Setting Up GitHub Secrets

### 1. Access Repository Settings

1. Go to GitHub repository
2. Click **Settings** (top navigation)
3. Click **Secrets and variables** → **Actions** (left sidebar)

### 2. Add Repository Secrets

Click **New repository secret** for each:

#### Database & Cache Credentials

```
Name: DATABASE_URL
Value: postgresql://user:password@host:5432/dbname
```

```
Name: REDIS_URL
Value: redis://default:password@host:6379
```

#### Security Keys

```
Name: SECRET_KEY
Value: (generated key from setup)
```

```
Name: JWT_SECRET_KEY
Value: (generated key from setup)
```

#### External Services

```
Name: TWILIO_ACCOUNT_SID
Value: (your account SID)
```

```
Name: TWILIO_AUTH_TOKEN
Value: (your auth token)
```

```
Name: SUPABASE_URL
Value: https://your-project.supabase.co
```

```
Name: SUPABASE_ANON_KEY
Value: (your anon key)
```

#### Deployment Credentials

```
Name: NETLIFY_AUTH_TOKEN
Value: (from Netlify)
```

```
Name: NETLIFY_SITE_ID
Value: (from Netlify)
```

```
Name: RENDER_API_KEY
Value: (from Render)
```

### 3. Using Secrets in GitHub Actions

In `.github/workflows/ci.yml`:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run tests
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          REDIS_URL: ${{ secrets.REDIS_URL }}
          SECRET_KEY: ${{ secrets.SECRET_KEY }}
        run: pytest backend/tests/ -v

      - name: Deploy
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        run: npm run deploy
```

## Secrets Vault Template

Create a checklist to track secrets:

```
Database
  [ ] DATABASE_URL
  [ ] DATABASE_USER
  [ ] DATABASE_PASSWORD

Cache
  [ ] REDIS_URL

Security
  [ ] SECRET_KEY
  [ ] JWT_SECRET_KEY

APIs
  [ ] TWILIO_ACCOUNT_SID
  [ ] TWILIO_AUTH_TOKEN
  [ ] SUPABASE_URL
  [ ] SUPABASE_ANON_KEY

Deployment
  [ ] NETLIFY_AUTH_TOKEN
  [ ] NETLIFY_SITE_ID
  [ ] RENDER_API_KEY
```

## Best Practices

### DO:

- ✅ Use GitHub Secrets for all credentials
- ✅ Rotate secrets regularly (quarterly)
- ✅ Use different secrets for dev/prod
- ✅ Document what each secret does
- ✅ Limit access to secrets (branch restrictions)
- ✅ Audit secret usage in logs
- ✅ Use environment-specific secret names

### DON'T:

- ❌ Log secrets in CI output
- ❌ Store secrets in code
- ❌ Commit `.env` files
- ❌ Use same secret for multiple environments
- ❌ Share secrets in chat/email
- ❌ Hardcode sensitive values
- ❌ Leave secrets in logs

## Securing Secrets in Logs

```yaml
# BAD: Leaks secret
- name: Test connection
  run: |
    psql $DATABASE_URL
    echo "Connecting to $DATABASE_URL"  # ❌ LOGS EXPOSED

# GOOD: GitHub masks known secrets
- name: Test connection
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    psql "$DATABASE_URL"  # ✅ AUTOMATICALLY MASKED
    echo "Connected to database"  # ✅ SAFE
```

## Rotating Secrets

When credentials expire or are compromised:

1. Generate new credential (e.g., new API key)
2. Update GitHub Secret value
3. Update deployment platform (Render, Netlify, etc.)
4. Trigger CI/CD pipeline
5. Verify deployment successful
6. Revoke old credential

## Viewing & Auditing Secrets

### See Secret Names (Not Values)

```bash
gh secret list  # Requires GitHub CLI
```

### Audit Secret Usage

1. Repository → Actions → Workflows
2. Click workflow run
3. Click "Set up job" step
4. Check environment variables section
5. GitHub automatically masks actual values

## Integration with Deployment

### Netlify Deployment

```yaml
- name: Deploy to Netlify
  uses: nwtgck/actions-netlify@v2.1.1
  with:
    publish-dir: "./dist"
    production-branch: main
    github-token: ${{ secrets.GITHUB_TOKEN }}
    deploy-message: "CD Deploy from GitHub Actions"
    enable-pull-request-comment: true
    enable-commit-comment: true
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Render Deployment

```yaml
- name: Deploy to Render
  env:
    RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
  run: |
    curl -X POST https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys \
      -H "Authorization: Bearer $RENDER_API_KEY"
```

## Troubleshooting

### Secret not available in job

```yaml
# ❌ WRONG: Secret not passed to job
jobs:
  deploy:
    steps:
      - run: echo $SECRET_KEY  # Not available

# ✅ CORRECT: Pass via env
jobs:
  deploy:
    steps:
      - env:
          SECRET_KEY: ${{ secrets.SECRET_KEY }}
        run: echo "Secret is available"
```

### Secrets showing in logs

If you accidentally logged a secret:

1. Rotate the exposed secret immediately
2. Delete GitHub Actions cache
3. Re-run workflow with new secret

```bash
# Command to clear cache (GitHub CLI)
gh actions-cache delete <cache-key>
```

## Reference

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Using Secrets in Actions](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsenv)
- [Masking Sensitive Values](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#masking-a-value-in-log)
