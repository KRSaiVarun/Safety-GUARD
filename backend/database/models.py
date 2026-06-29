from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    DECIMAL,
    TIMESTAMP,
    Text,
    JSON,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
import uuid
from datetime import datetime

Base = declarative_base()

# Constants
EMERGENCY_SESSION_ID_FK = 'emergency_sessions.id'


class User(Base):
    __tablename__ = 'users'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(255), unique=True)
    emergency_contacts = Column(JSON)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)


class EmergencySession(Base):
    __tablename__ = 'emergency_sessions'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    status = Column(String(50), default='IDLE')
    risk_score = Column(Integer, default=0)
    started_at = Column(TIMESTAMP, default=datetime.utcnow)
    resolved_at = Column(TIMESTAMP, nullable=True)
    resolution_reason = Column(String(100), nullable=True)


class LiveLocation(Base):
    __tablename__ = 'live_locations'
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey(EMERGENCY_SESSION_ID_FK))
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    accuracy = Column(Integer)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)


class EmergencyLog(Base):
    __tablename__ = 'emergency_logs'
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey(EMERGENCY_SESSION_ID_FK))
    event_type = Column(String(50))
    description = Column(Text)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = 'alerts'
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey(EMERGENCY_SESSION_ID_FK))
    recipient_phone = Column(String(20))
    status = Column(String(50))
    provider_message_id = Column(String(100), nullable=True)
    sent_at = Column(TIMESTAMP, default=datetime.utcnow)


class AlertDeliveryLog(Base):
    __tablename__ = 'alert_delivery_logs'
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey(EMERGENCY_SESSION_ID_FK))
    alert_id = Column(BigInteger)
    provider_message_id = Column(String(100), nullable=True)
    delivery_status = Column(String(50))
    provider = Column(String(50))
    recipient = Column(String(50))
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)


class AIEvent(Base):
    __tablename__ = 'ai_events'
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey(EMERGENCY_SESSION_ID_FK))
    event_type = Column(String(50))
    value = Column(DECIMAL(10, 2))
    metadata_json = Column('metadata', JSON)
    timestamp = Column(TIMESTAMP, default=datetime.utcnow)
