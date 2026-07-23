import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

from app.core.config import settings


@pytest.fixture(autouse=True)
def force_mock_llm_for_tests(monkeypatch):
    monkeypatch.setattr(settings, "llm_mode", "mock")


@pytest.fixture
def sqlite_engine():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    try:
        yield engine
    finally:
        engine.dispose()
