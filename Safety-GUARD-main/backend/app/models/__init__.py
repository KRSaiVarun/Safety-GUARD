"""SQLAlchemy models for emergency response system."""
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, JSON, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base
from datetime import datetime
import uuid
import enum

EMERGENCY_SESSIONS_ID = "emergency_sessions.id"


class EmergencyStatus(str, enum.Enum):
    """Emergency session status states."""
    IDLE = "idle"
    MONITORING = "monitoring"
    RISK_DETECTED = "risk_detected"
    ALERT_TRIGGERED = "alert_triggered"
    LIVE_TRACKING = "live_tracking"
    ACTIVE_RESPONSE = "active_response"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"


class User(Base):
    """User model for emergency system."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    name = Column(String)
    password_hash = Column(String)
    emergency_contacts = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    emergency_sessions = relationship("EmergencySession", back_populates="user")
    locations = relationship("LiveLocation", back_populates="user")


class EmergencySession(Base):
    """Emergency session model."""
    __tablename__ = "emergency_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    status = Column(Enum(EmergencyStatus), default=EmergencyStatus.MONITORING, index=True)

    # Timing
    activated_at = Column(DateTime, default=datetime.utcnow)
    alert_sent_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    # Emergency metadata
    passcode = Column(String)
    passcode_attempts = Column(Integer, default=0)
    passcode_correct = Column(Boolean, default=False)

    # Location tracking
    last_location = Column(JSON)
    location_count = Column(Integer, default=0)

    # Emergency metrics
    ai_threat_score = Column(Float, default=0.0)
    alerts_sent_count = Column(Integer, default=0)
    messages_sent = Column(JSON, default=[])

    # Flags
    is_active = Column(Boolean, default=True)
    danger_detected = Column(Boolean, default=False)
    alert_sent = Column(Boolean, default=False)

    # Metadata
    session_metadata = Column('metadata', JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Indexes for performance
    __table_args__ = (
        Index('idx_user_active', 'user_id', 'is_active'),
        Index('idx_status_time', 'status', 'activated_at'),
    )

    # Relationships
    user = relationship("User", back_populates="emergency_sessions")
    alerts = relationship("EmergencyAlert", back_populates="session")
    locations = relationship("LiveLocation", back_populates="session")


class LiveLocation(Base):
    """Real-time location tracking."""
    __tablename__ = "live_locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey(EMERGENCY_SESSIONS_ID), index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)

    latitude = Column(Float)
    longitude = Column(Float)
    accuracy = Column(Float, nullable=True)
    altitude = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)

    # AI Analysis
    is_anomalous = Column(Boolean, default=False)
    movement_speed_kmh = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Indexes
    __table_args__ = (
        Index('idx_session_time', 'session_id', 'created_at'),
        Index('idx_user_time', 'user_id', 'created_at'),
    )

    # Relationships
    session = relationship("EmergencySession", back_populates="locations")
    user = relationship("User", back_populates="locations")


class EmergencyAlert(Base):
    """Emergency alert records."""
    __tablename__ = "emergency_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey(EMERGENCY_SESSIONS_ID), index=True)

    alert_type = Column(String)  # SMS, WHATSAPP, EMAIL, VOICE
    recipient_number = Column(String)
    message_content = Column(String)
    location_link = Column(String, nullable=True)

    is_sent = Column(Boolean, default=False)
    send_attempts = Column(Integer, default=0)
    last_attempt_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)

    response_status = Column(String, nullable=True)  # DELIVERED, FAILED, BOUNCED, etc.
    error_message = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    session = relationship("EmergencySession", back_populates="alerts")


class AIThreatEvent(Base):
    """AI threat detection events."""
    __tablename__ = "ai_threat_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey(EMERGENCY_SESSIONS_ID), index=True)

    threat_type = Column(String)  # INACTIVITY, ABNORMAL_MOVEMENT, UNSAFE_ZONE, etc.
    threat_score = Column(Float)  # 0.0 to 1.0
    confidence = Column(Float)  # Model confidence
    description = Column(String)

    # Context
    location = Column(JSON, nullable=True)
    event_metadata = Column('metadata', JSONB, default={})

    created_at = Column(DateTime, default=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index('idx_session_threat', 'session_id', 'threat_score'),
    )


class EmergencyLog(Base):
    """Audit log for all emergency events."""
    __tablename__ = "emergency_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey(EMERGENCY_SESSIONS_ID), index=True)

    event_type = Column(String)  # ACTIVATED, PASSCODE_SUBMITTED, ALERT_SENT, LOCATION_UPDATE, etc.
    event_data = Column(JSONB, default={})
    severity = Column(String)  # INFO, WARNING, CRITICAL

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Indexes
    __table_args__ = (
        Index('idx_session_event', 'session_id', 'event_type'),
    )


class GeofenceType(str, enum.Enum):
    """Geofence zone type."""
    SAFE = "safe"
    UNSAFE = "unsafe"


class Geofence(Base):
    """Geographic fence boundaries for threat detection."""
    __tablename__ = "geofences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True)
    type = Column(Enum(GeofenceType), index=True)  # SAFE or UNSAFE

    # GeoJSON polygon: {"type": "Polygon", "coordinates": [[[lon, lat], ...]]}
    polygon_coordinates = Column(JSONB)

    # Metadata
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index('idx_type_active', 'type', 'is_active'),
    )


class GeofenceEvent(Base):
    """Geofence boundary crossing events."""
    __tablename__ = "geofence_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey(EMERGENCY_SESSIONS_ID), index=True)
    geofence_id = Column(UUID(as_uuid=True), ForeignKey("geofences.id"), index=True)

    # Event details
    event_type = Column(String)  # ENTER, EXIT, BREACH
    geofence_name = Column(String)
    geofence_type = Column(Enum(GeofenceType))

    # Location context
    latitude = Column(Float)
    longitude = Column(Float)

    # Risk context
    risk_score_at_event = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Indexes
    __table_args__ = (
        Index('idx_session_geofence_time', 'session_id', 'geofence_id', 'created_at'),
        Index('idx_event_type_time', 'event_type', 'created_at'),
    )


class RiskHistory(Base):
    """Historical risk scores for trend analysis."""
    __tablename__ = "risk_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey(EMERGENCY_SESSIONS_ID), index=True)

    # Risk score
    score = Column(Float)  # 0-100
    level = Column(String)  # LOW, MEDIUM, HIGH, CRITICAL

    # Factor breakdown
    time_of_day_factor = Column(Float, default=0.0)  # 0-25
    unsafe_area_factor = Column(Float, default=0.0)  # 0-25
    inactivity_factor = Column(Float, default=0.0)  # 0-15
    emergency_frequency_factor = Column(Float, default=0.0)  # 0-15
    battery_level_factor = Column(Float, default=0.0)  # 0-10
    network_status_factor = Column(Float, default=0.0)  # 0-10

    # Recommendation
    recommendation = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Indexes
    __table_args__ = (
        Index('idx_session_risk_time', 'session_id', 'created_at'),
        Index('idx_level_time', 'level', 'created_at'),
    )
