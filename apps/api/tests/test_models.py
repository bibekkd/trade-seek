from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from pydantic import ValidationError
from sqlalchemy import inspect

from app.db.base import Base
from app.models import (
    AIRequestLog,
    BacktestResult,
    BacktestRun,
    DevUser,
    Instrument,
    OhlcvCandle,
    ResearchRun,
    StrategyDefinition,
)
from app.schemas.models import (
    BacktestRunCreate,
    InstrumentCreate,
    OhlcvCandleCreate,
)


def test_core_tables_are_registered() -> None:
    assert {
        DevUser.__tablename__,
        Instrument.__tablename__,
        OhlcvCandle.__tablename__,
        StrategyDefinition.__tablename__,
        BacktestRun.__tablename__,
        BacktestResult.__tablename__,
        AIRequestLog.__tablename__,
        ResearchRun.__tablename__,
    } == {
        "dev_users",
        "instruments",
        "ohlcv_candles",
        "strategy_definitions",
        "backtest_runs",
        "backtest_results",
        "ai_request_logs",
        "research_runs",
    }
    assert "ix_ohlcv_instrument_timeframe_timestamp" in {
        index.name for index in Base.metadata.tables["ohlcv_candles"].indexes
    }


def test_instrument_validation_normalizes_symbol_and_currency() -> None:
    instrument = InstrumentCreate(
        symbol="reliance",
        exchange="NSE",
        name="Reliance Industries",
        currency="inr",
    )

    assert instrument.symbol == "RELIANCE"
    assert instrument.currency == "INR"


def test_instrument_validation_rejects_non_inr_currency() -> None:
    with pytest.raises(ValidationError):
        InstrumentCreate(
            symbol="AAPL",
            exchange="NSE",
            name="Apple",
            currency="USD",
        )


def test_ohlcv_validation_rejects_invalid_price_range() -> None:
    with pytest.raises(ValidationError):
        OhlcvCandleCreate(
            timeframe="1d",
            timestamp=datetime.now(UTC),
            open=Decimal("100"),
            high=Decimal("90"),
            low=Decimal("95"),
            close=Decimal("98"),
            volume=Decimal("1000"),
            source="fixture",
        )


def test_backtest_run_validation_rejects_invalid_date_range() -> None:
    start_at = datetime.now(UTC)

    with pytest.raises(ValidationError):
        BacktestRunCreate(
            timeframe="1d",
            start_at=start_at,
            end_at=start_at - timedelta(days=1),
        )


def test_metadata_can_create_and_drop_all_tables(sqlite_engine) -> None:
    Base.metadata.create_all(sqlite_engine)

    inspector = inspect(sqlite_engine)
    assert "instruments" in inspector.get_table_names()
    assert "ohlcv_candles" in inspector.get_table_names()

    Base.metadata.drop_all(sqlite_engine)

    inspector = inspect(sqlite_engine)
    assert inspector.get_table_names() == []
