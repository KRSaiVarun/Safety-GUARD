"""
Pre-deployment verification script for Safety-GUARD backend.
Run this before pushing to GitHub to catch any issues.
"""

import os
import sys
import json
from pathlib import Path


def check_file_exists(path: str, description: str) -> bool:
    """Check if a file exists."""
    if Path(path).exists():
        print(f"✅ {description}: {path}")
        return True
    else:
        print(f"❌ {description}: {path} NOT FOUND")
        return False


def check_directory_exists(path: str, description: str) -> bool:
    """Check if a directory exists."""
    if Path(path).exists() and Path(path).is_dir():
        print(f"✅ {description}: {path}/")
        return True
    else:
        print(f"❌ {description}: {path}/ NOT FOUND")
        return False


def check_import(module_name: str) -> bool:
    """Check if a Python module can be imported."""
    try:
        __import__(module_name)
        print(f"✅ Python module: {module_name}")
        return True
    except ImportError as e:
        print(f"❌ Python module: {module_name} - {e}")
        return False


def check_requirements():
    """Verify all dependencies are installed."""
    print("\n📦 Checking Python dependencies...")

    required = [
        'fastapi',
        'uvicorn',
        'sqlalchemy',
        'pydantic',
        'socketio',
        'psycopg2',
        'redis',
        'twilio'
    ]

    all_ok = True
    for pkg in required:
        if not check_import(pkg):
            all_ok = False

    return all_ok


def check_structure():
    """Verify project structure."""
    print("\n📁 Checking project structure...")

    checks = [
        ("backend/requirements.txt", "requirements.txt"),
        ("backend/Procfile", "Procfile"),
        ("backend/.env", ".env file"),
        ("backend/app/main.py", "FastAPI app"),
        ("backend/app/config.py", "Configuration"),
        ("backend/app/models/__init__.py", "Database models"),
        ("backend/app/database/__init__.py", "Database setup"),
        ("backend/app/services/emergency_manager.py", "Emergency service"),
        ("backend/app/services/gps_tracking.py", "GPS service"),
        ("backend/app/services/notifications.py", "Notifications service"),
        ("backend/app/ai/threat_detection.py", "AI threat detection"),
        ("backend/app/events/broadcaster.py", "Socket.IO broadcaster"),
    ]

    all_ok = True
    for path, desc in checks:
        if not check_file_exists(path, desc):
            all_ok = False

    return all_ok


def check_env_file():
    """Check .env file has required variables."""
    print("\n🔐 Checking .env configuration...")

    env_path = Path("backend/.env")
    if not env_path.exists():
        print("❌ .env file not found")
        return False

    env_content = env_path.read_text()

    required_vars = [
        'DATABASE_URL',
        'REDIS_URL',
        'ENVIRONMENT',
        'DEBUG',
        'SUPABASE_URL',
    ]

    all_ok = True
    for var in required_vars:
        if var in env_content:
            print(f"✅ {var} is configured")
        else:
            print(f"❌ {var} is missing")
            all_ok = False

    return all_ok


def check_python_syntax():
    """Check Python files for syntax errors."""
    print("\n🐍 Checking Python syntax...")

    import py_compile

    python_files = [
        "backend/app/main.py",
        "backend/app/config.py",
        "backend/app/models/__init__.py",
        "backend/app/database/__init__.py",
        "backend/app/services/emergency_manager.py",
        "backend/app/services/gps_tracking.py",
        "backend/app/services/notifications.py",
        "backend/app/ai/threat_detection.py",
        "backend/app/events/broadcaster.py",
    ]

    all_ok = True
    for file_path in python_files:
        try:
            py_compile.compile(file_path, doraise=True)
            print(f"✅ {file_path}")
        except py_compile.PyCompileError as e:
            print(f"❌ {file_path}: {e}")
            all_ok = False

    return all_ok


def generate_secret_key():
    """Generate a random SECRET_KEY."""
    print("\n🔑 Generating SECRET_KEY...")

    import secrets
    secret_key = secrets.token_urlsafe(32)
    print(f"\nGenerated SECRET_KEY (use this in Render environment):")
    print(f"  {secret_key}")
    print("\nCopy this value to Render dashboard → Environment Variables → SECRET_KEY")

    return secret_key


def main():
    """Run all checks."""
    print("=" * 60)
    print("Safety-GUARD Backend - Pre-Deployment Verification")
    print("=" * 60)

    # Change to project root
    os.chdir(Path(__file__).parent)

    results = []

    # Run all checks
    results.append(("Project Structure", check_structure()))
    results.append((".env Configuration", check_env_file()))
    results.append(("Python Syntax", check_python_syntax()))

    # Print summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)

    all_passed = True
    for check_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{check_name}: {status}")
        if not passed:
            all_passed = False

    # Generate secret key
    print("\n" + "=" * 60)
    secret_key = generate_secret_key()
    print("=" * 60)

    # Final message
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL CHECKS PASSED - Ready for deployment!")
        print("\n📝 Next steps:")
        print("1. Push code to GitHub")
        print("2. Create Render account")
        print("3. Set up PostgreSQL and Redis")
        print("4. Create Web Service")
        print("5. Add environment variables (including SECRET_KEY above)")
        print("\nSee DEPLOYMENT_CHECKLIST.md for detailed steps")
    else:
        print("❌ Some checks failed - see errors above")
        print("\n🔧 Fix the issues and run this script again")
        sys.exit(1)

    print("=" * 60)


if __name__ == "__main__":
    main()
