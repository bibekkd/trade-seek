from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def make_alembic_config(database_url: str) -> Config:
    config = Config("apps/api/alembic.ini")
    config.set_main_option("script_location", "apps/api/alembic")
    config.set_main_option("sqlalchemy.url", database_url)
    return config


def test_migration_upgrade_and_downgrade(tmp_path, monkeypatch) -> None:
    database_path = tmp_path / "migration-test.sqlite"
    database_url = f"sqlite:///{database_path}"
    monkeypatch.delenv("DATABASE_URL", raising=False)

    config = make_alembic_config(database_url)

    command.upgrade(config, "head")

    engine = create_engine(database_url)
    inspector = inspect(engine)
    assert {
        "dev_users",
        "instruments",
        "ohlcv_candles",
        "strategy_definitions",
        "backtest_runs",
        "backtest_results",
        "ai_request_logs",
        "research_runs",
    }.issubset(set(inspector.get_table_names()))

    command.downgrade(config, "base")

    inspector = inspect(engine)
    assert set(inspector.get_table_names()) == {"alembic_version"}
