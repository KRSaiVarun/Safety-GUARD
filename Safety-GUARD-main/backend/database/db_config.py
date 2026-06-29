from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.models import Base

engine = None
SessionLocal = None


def init_db(database_url: str):
    global engine, SessionLocal
    engine = create_engine(database_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
