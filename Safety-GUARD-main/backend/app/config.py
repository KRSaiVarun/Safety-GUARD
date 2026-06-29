"""Application configuration from environment variables."""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings."""

    # Database
    database_url: str = "postgresql://user:password@localhost:5432/safety_guard"
    redis_url: str = "redis://localhost:6379"

    # API Keys
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    whatsapp_business_phone_id: str = ""
    whatsapp_access_token: str = ""

    # Supabase
    supabase_url: str = "https://nmyoxgcxvokiribbdyzf.supabase.co"
    supabase_anon_key: str = ""

    # Frontend
    frontend_url: str = "http://localhost:5173"
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Emergency Config
    emergency_contact_numbers: List[str] = ["+918548878488", "+918618266736"]
    emergency_timeout_seconds: int = 10
    gps_update_interval_seconds: int = 10
    alert_repeat_interval_seconds: int = 20

    # AI Config
    ai_threat_threshold: float = 0.7
    inactivity_threshold_minutes: int = 5

    # Server
    secret_key: str = "your-secret-key-change-in-production"
    debug: bool = False
    environment: str = "development"

    class Config:
        """Load from .env file."""
        env_file = ".env"
        case_sensitive = False


settings = Settings()
