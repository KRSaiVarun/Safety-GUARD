# Render + Netlify Deployment Guide

This repository is now packaged for production deployment with:

- **Render** for the backend service
- **Netlify** for the frontend

## What is included

- `render.yaml` at repository root
  - Configures the backend service root as `backend`
  - Uses `pip install -r requirements.txt` to build
  - Starts with `uvicorn app.main:socket_app --host 0.0.0.0 --port $PORT`
  - Uses `/health` as the health check path
- `backend/Procfile`
  - Also supports Render if the start command is omitted
- `netlify.toml`
  - Builds the frontend with `npm run build`
  - Publishes the `dist` directory
  - Redirects all SPA routes to `/index.html`

## Backend deployment (Render)

### 1. Create Render service

- Go to Render dashboard
- Click **New +** → **Web Service**
- Connect your GitHub repo and choose the `Safety-GUARD` repository
- Use the default branch: `main`
- Set the service root to `backend` (Render will read `render.yaml`)
- Choose **Python 3.11** or later
- Build command: `pip install -r requirements.txt`
- Start command: Render will use `render.yaml` or `Procfile`

### 2. Add environment variables

Set these env vars in the Render service settings:

- `DATABASE_URL`
- `REDIS_URL`
- `ENVIRONMENT=production`
- `DEBUG=False`
- `SECRET_KEY=<generate-a-random-secret-key>`
- `FRONTEND_URL=https://<your-netlify-site>.netlify.app`
- `CORS_ORIGINS=["https://<your-netlify-site>.netlify.app"]`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Optional update if you use WhatsApp:

- `WHATSAPP_BUSINESS_PHONE_ID`
- `WHATSAPP_ACCESS_TOKEN`

### 3. Verify backend deployment

After deploy, test:

```bash
curl https://<your-render-service>.onrender.com/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "Safety-GUARD Emergency Response API",
  "version": "1.0.0"
}
```

## Frontend deployment (Netlify)

The frontend is already configured via `netlify.toml`.

### 1. Connect repository

- Go to Netlify dashboard
- Click **New site from Git**
- Connect the same repository
- Choose the `main` branch

### 2. Build settings

- Build command: `npm run build`
- Publish directory: `dist`

### 3. Add environment variables

In Netlify site settings, set:

- `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`

### 4. Deploy site

- Trigger a deploy in Netlify
- Confirm the build completes successfully

## End-to-end validation

1. Visit your Netlify site URL
2. Confirm the app loads without CORS errors
3. Confirm the backend health check is reachable from the frontend origin
4. Trigger an emergency activation flow and verify Socket.IO connects

## Notes

- The backend `render.yaml` is compatible with Render's modern service definitions.
- The frontend `netlify.toml` is already set up for a production SPA.
- The backend `backend/.env.example` includes example values for all runtime variables.
