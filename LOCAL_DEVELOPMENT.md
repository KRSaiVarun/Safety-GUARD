# Local Development Setup Guide

## Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.11+
- PostgreSQL 14+ (or use Docker)
- Redis (or use Docker)

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/KRSaiVarun/Safety-GUARD.git
cd Safety-GUARD
```

### 2. Setup Frontend

```bash
# Copy environment template
cp frontend/.env.example frontend/.env.local

# Edit with your local values
code frontend/.env.local

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend will be available at http://localhost:5173
```

### 3. Setup Backend

```bash
# Create Python virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate  # Windows

# Copy environment template
cp .env.example .env

# Edit with your local values
code .env

# Install dependencies
pip install -r backend/requirements.txt

# Run database migrations (if needed)
alembic upgrade head

# Start backend server
cd backend
uvicorn main:socket_app --reload --host 0.0.0.0 --port 8000
# Backend will be available at http://localhost:8000
```

### 4. Setup Redis & PostgreSQL (Using Docker)

```bash
# Start services
docker-compose up -d

# Verify
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Start Celery (Background Jobs)

In a new terminal:

```bash
source venv/bin/activate

cd backend
celery -A celery_app.celery worker --loglevel=info
```

### 6. Start Celery Beat (Scheduled Tasks)

In another new terminal:

```bash
source venv/bin/activate

cd backend
celery -A celery_app.celery beat --loglevel=info
```

## Environment Variables Reference

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key
```

### Backend (.env)

```env
# Database (use docker-compose.yml for local PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/safety_guard

# Redis (use docker-compose.yml for local Redis)
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Security
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-change-in-production

# Environment
ENVIRONMENT=development
DEBUG=True
PORT=8000

# Frontend URL
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# API Keys (optional for local dev)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

### Redis Connection Issues

```bash
# Check Redis is running
docker-compose ps

# Test connection
redis-cli ping

# View logs
docker-compose logs redis
```

### Module Not Found Errors

```bash
# Ensure virtual environment is activated
which python  # Should be venv/bin/python

# Reinstall dependencies
pip install -r backend/requirements.txt

# Check Python path
python -c "import sys; print(sys.path)"
```

## Development Workflow

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest backend/tests/ -v

# Run with coverage
pytest backend/tests/ --cov=backend
```

### Code Formatting

```bash
# Install formatter
pip install black flake8

# Format code
black backend/

# Lint
flake8 backend/
```

### Type Checking

```bash
# Install mypy
pip install mypy

# Type check
mypy backend/
```

### Frontend Linting

```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## Database Migrations

```bash
# Create migration
cd backend
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Useful Commands

```bash
# View real-time logs
docker-compose logs -f backend

# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d safety_guard

# Access Redis CLI
docker-compose exec redis redis-cli

# Stop all services
docker-compose down

# Clean up everything
docker-compose down -v
```

## VS Code Debugging

### Backend (Python)

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["backend.main:socket_app", "--reload"],
      "jinja": true,
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/safety_guard",
        "REDIS_URL": "redis://localhost:6379/0"
      }
    }
  ]
}
```

### Frontend (JavaScript)

Built-in VS Code Chrome debugging works with Vite:

1. Press `F5` to start debugging
2. Frontend will open in Chrome with DevTools

## Next Steps

1. Configure your IDE
2. Set up pre-commit hooks
3. Read `SECURITY_AND_DEPLOYMENT.md`
4. Review project architecture
5. Start contributing!

---

**Need Help?** Check the main README.md or create an issue on GitHub.
