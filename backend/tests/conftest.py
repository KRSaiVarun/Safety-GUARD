import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.models import Base


class MockSocketIO:
    def __init__(self):
        self.emitted = []

    def emit(self, event_name, payload, room=None):
        self.emitted.append((event_name, payload, room))


@pytest.fixture
def engine():
    engine = create_engine('sqlite:///:memory:', echo=False, future=True)
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture
def db_session(engine):
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    with Session() as session:
        yield session


@pytest.fixture
def mock_sio():
    return MockSocketIO()
