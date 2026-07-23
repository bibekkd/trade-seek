from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.session import get_session
from app.models import BacktestRun
from app.main import app
from app.services.market_data import DataProviderDisabledError, MarketDataCandle


@pytest.fixture
def client_with_sqlite(sqlite_engine) -> Iterator[TestClient]:
    Base.metadata.create_all(sqlite_engine)

    def override_get_session() -> Iterator[Session]:
        with Session(sqlite_engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(sqlite_engine)


def test_create_backtest_queues_run(client_with_sqlite, monkeypatch) -> None:
    monkeypatch.setattr("app.api.backtests.enqueue_backtest", lambda _backtest_id: None)
    response = client_with_sqlite.post("/backtests", json=_backtest_payload())

    assert response.status_code == 200
    created = response.json()
    assert created["status"] == "queued"
    assert created["engine"] == "vectorbt"
    assert created["symbol"] == "RELIANCE"
    assert created["strategy_type"] == "moving_average_crossover"
    assert created["provider"] == "fixture"
    assert created["metrics"] is None


def test_create_backtest_accepts_fyers_provider(client_with_sqlite, monkeypatch) -> None:
    monkeypatch.setattr("app.api.backtests.enqueue_backtest", lambda _backtest_id: None)
    monkeypatch.setattr("app.api.backtests.FyersHistoricalAdapter", _FakeFyersHistoricalAdapter)

    response = client_with_sqlite.post(
        "/backtests",
        json=_backtest_payload(symbol="SBIN", provider="fyers"),
    )

    assert response.status_code == 200
    created = response.json()
    assert created["status"] == "queued"
    assert created["symbol"] == "SBIN"
    assert created["provider"] == "fyers"


def test_create_backtest_rejects_fyers_when_no_candles(client_with_sqlite, monkeypatch) -> None:
    monkeypatch.setattr("app.api.backtests.enqueue_backtest", lambda _backtest_id: None)
    monkeypatch.setattr("app.api.backtests.FyersHistoricalAdapter", _EmptyFyersHistoricalAdapter)

    response = client_with_sqlite.post(
        "/backtests",
        json=_backtest_payload(symbol="HDFCBANK", provider="fyers"),
    )

    assert response.status_code == 422
    assert "No FYERS candles found for HDFCBANK" in response.json()["detail"]


def test_create_backtest_rejects_fyers_when_strategy_needs_more_candles(client_with_sqlite, monkeypatch) -> None:
    monkeypatch.setattr("app.api.backtests.enqueue_backtest", lambda _backtest_id: None)
    monkeypatch.setattr("app.api.backtests.FyersHistoricalAdapter", _FakeFyersHistoricalAdapter)
    payload = _backtest_payload(symbol="HDFCBANK", provider="fyers")
    payload["strategy"]["parameters"]["short_window"] = 5
    payload["strategy"]["parameters"]["long_window"] = 10

    response = client_with_sqlite.post("/backtests", json=payload)

    assert response.status_code == 422
    assert "requires at least 22" in response.json()["detail"]


def test_create_backtest_uses_cached_candles_when_fyers_auth_fails(client_with_sqlite, monkeypatch) -> None:
    monkeypatch.setattr("app.api.backtests.enqueue_backtest", lambda _backtest_id: None)
    monkeypatch.setattr("app.api.backtests.FyersHistoricalAdapter", _FakeFyersHistoricalAdapter)

    preload_response = client_with_sqlite.post(
        "/backtests",
        json=_backtest_payload(symbol="ICICIBANK", provider="fyers"),
    )
    assert preload_response.status_code == 200

    monkeypatch.setattr("app.api.backtests.FyersHistoricalAdapter", _AuthFailingFyersHistoricalAdapter)
    cached_response = client_with_sqlite.post(
        "/backtests",
        json=_backtest_payload(symbol="ICICIBANK", provider="fyers"),
    )

    assert cached_response.status_code == 200
    assert cached_response.json()["status"] == "queued"


def test_worker_completes_queued_backtest(client_with_sqlite, sqlite_engine, monkeypatch) -> None:
    monkeypatch.setattr("app.api.backtests.enqueue_backtest", lambda _backtest_id: None)
    monkeypatch.setattr(
        "app.tasks.backtests.SessionLocal",
        sessionmaker(bind=sqlite_engine, autoflush=False, autocommit=False),
    )

    response = client_with_sqlite.post("/backtests", json=_backtest_payload())
    created = response.json()

    from app.tasks.backtests import run_backtest_task

    run_backtest_task.apply(args=[created["id"]]).get()

    fetch_response = client_with_sqlite.get(f"/backtests/{created['id']}")

    assert fetch_response.status_code == 200
    fetched = fetch_response.json()
    assert fetched["status"] == "completed"
    assert fetched["id"] == created["id"]
    assert fetched["metrics"]["primary_window"] == "out_of_sample"
    assert fetched["metrics"]["out_of_sample"]["number_of_trades"] >= 0
    assert len(fetched["equity_curve"]) == 14
    assert fetched["trades"] is not None


def test_worker_completes_rsi_backtest_with_cost_metrics(client_with_sqlite, sqlite_engine, monkeypatch) -> None:
    monkeypatch.setattr("app.api.backtests.enqueue_backtest", lambda _backtest_id: None)
    monkeypatch.setattr(
        "app.tasks.backtests.SessionLocal",
        sessionmaker(bind=sqlite_engine, autoflush=False, autocommit=False),
    )

    payload = _backtest_payload()
    payload["strategy"] = {
        "strategy_type": "rsi_mean_reversion",
        "parameters": {
            "lookback_window": 3,
            "oversold_threshold": 35,
            "overbought_threshold": 65,
            "initial_cash": "100000",
            "train_fraction": 0.5,
            "fee_bps": "5",
            "slippage_bps": "10",
            "position_size_fraction": 0.75,
        },
    }
    response = client_with_sqlite.post("/backtests", json=payload)
    created = response.json()

    from app.tasks.backtests import run_backtest_task

    run_backtest_task.apply(args=[created["id"]]).get()

    fetch_response = client_with_sqlite.get(f"/backtests/{created['id']}")

    assert fetch_response.status_code == 200
    fetched = fetch_response.json()
    assert fetched["status"] == "completed"
    assert fetched["strategy_type"] == "rsi_mean_reversion"
    assert fetched["metrics"]["strategy_type"] == "rsi_mean_reversion"
    assert fetched["metrics"]["execution"]["fee_bps"] == 5.0
    assert fetched["metrics"]["data_quality"]["observations"] == 14


def test_worker_loads_fyers_candles(client_with_sqlite, sqlite_engine, monkeypatch) -> None:
    monkeypatch.setattr("app.api.backtests.enqueue_backtest", lambda _backtest_id: None)
    monkeypatch.setattr(
        "app.tasks.backtests.SessionLocal",
        sessionmaker(bind=sqlite_engine, autoflush=False, autocommit=False),
    )
    monkeypatch.setattr("app.api.backtests.FyersHistoricalAdapter", _FakeFyersHistoricalAdapter)
    monkeypatch.setattr("app.tasks.backtests.FyersHistoricalAdapter", _FakeFyersHistoricalAdapter)

    response = client_with_sqlite.post(
        "/backtests",
        json=_backtest_payload(symbol="SBIN", provider="fyers"),
    )
    created = response.json()

    from app.tasks.backtests import run_backtest_task

    run_backtest_task.apply(args=[created["id"]]).get()

    fetch_response = client_with_sqlite.get(f"/backtests/{created['id']}")

    assert fetch_response.status_code == 200
    fetched = fetch_response.json()
    assert fetched["status"] == "completed"
    assert fetched["provider"] == "fyers"
    assert len(fetched["equity_curve"]) == 14


def test_worker_falls_back_to_cached_fyers_candles(client_with_sqlite, sqlite_engine, monkeypatch) -> None:
    monkeypatch.setattr("app.api.backtests.enqueue_backtest", lambda _backtest_id: None)
    monkeypatch.setattr(
        "app.tasks.backtests.SessionLocal",
        sessionmaker(bind=sqlite_engine, autoflush=False, autocommit=False),
    )
    monkeypatch.setattr("app.api.backtests.FyersHistoricalAdapter", _FakeFyersHistoricalAdapter)
    monkeypatch.setattr("app.tasks.backtests.FyersHistoricalAdapter", _EmptyFyersHistoricalAdapter)

    response = client_with_sqlite.post(
        "/backtests",
        json=_backtest_payload(symbol="HDFCBANK", provider="fyers"),
    )
    created = response.json()

    from app.tasks.backtests import run_backtest_task

    run_backtest_task.apply(args=[created["id"]]).get()

    fetch_response = client_with_sqlite.get(f"/backtests/{created['id']}")

    assert fetch_response.status_code == 200
    fetched = fetch_response.json()
    assert fetched["status"] == "completed"
    assert fetched["symbol"] == "HDFCBANK"
    assert fetched["provider"] == "fyers"
    assert len(fetched["equity_curve"]) == 14


def test_worker_falls_back_to_cached_fyers_candles_when_auth_fails(client_with_sqlite, sqlite_engine, monkeypatch) -> None:
    monkeypatch.setattr("app.api.backtests.enqueue_backtest", lambda _backtest_id: None)
    monkeypatch.setattr(
        "app.tasks.backtests.SessionLocal",
        sessionmaker(bind=sqlite_engine, autoflush=False, autocommit=False),
    )
    monkeypatch.setattr("app.api.backtests.FyersHistoricalAdapter", _FakeFyersHistoricalAdapter)
    monkeypatch.setattr("app.tasks.backtests.FyersHistoricalAdapter", _AuthFailingFyersHistoricalAdapter)

    response = client_with_sqlite.post(
        "/backtests",
        json=_backtest_payload(symbol="ICICIBANK", provider="fyers"),
    )
    created = response.json()

    from app.tasks.backtests import run_backtest_task

    run_backtest_task.apply(args=[created["id"]]).get()

    fetch_response = client_with_sqlite.get(f"/backtests/{created['id']}")

    assert fetch_response.status_code == 200
    fetched = fetch_response.json()
    assert fetched["status"] == "completed"
    assert fetched["symbol"] == "ICICIBANK"
    assert fetched["error_message"] is None


def test_worker_marks_failed_backtest(client_with_sqlite, sqlite_engine, monkeypatch) -> None:
    monkeypatch.setattr("app.api.backtests.enqueue_backtest", lambda _backtest_id: None)
    monkeypatch.setattr(
        "app.tasks.backtests.SessionLocal",
        sessionmaker(bind=sqlite_engine, autoflush=False, autocommit=False),
    )

    response = client_with_sqlite.post("/backtests", json=_backtest_payload(symbol="TCS"))
    created = response.json()

    from app.tasks.backtests import run_backtest_task

    with pytest.raises(Exception, match="candles are required"):
        run_backtest_task.apply(args=[created["id"]]).get(propagate=True)

    with Session(sqlite_engine) as session:
        failed_runs = list(session.query(BacktestRun).all())

    assert len(failed_runs) == 1
    assert failed_runs[0].status == "failed"
    assert "candles are required" in failed_runs[0].error_message
    assert failed_runs[0].completed_at is not None


def test_get_backtest_returns_404_for_unknown_id(client_with_sqlite) -> None:
    response = client_with_sqlite.get(f"/backtests/{uuid4()}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Backtest not found"


def _backtest_payload(symbol: str = "RELIANCE", provider: str = "fixture") -> dict:
    return {
        "symbol": symbol,
        "exchange": "NSE",
        "timeframe": "1d",
        "provider": provider,
        "start_at": "2024-01-01T00:00:00Z",
        "end_at": "2024-01-18T23:59:59Z",
        "strategy": {
            "strategy_type": "moving_average_crossover",
            "parameters": {
                "short_window": 2,
                "long_window": 3,
                "initial_cash": "100000",
                "train_fraction": 0.5,
            },
        },
    }


class _FakeFyersHistoricalAdapter:
    def __init__(self, **kwargs) -> None:
        pass

    def get_candles(self, *, symbol, exchange, timeframe, start, end):
        start_at = datetime(2024, 1, 1, tzinfo=UTC)
        closes = [
            "10",
            "9",
            "8",
            "9",
            "10",
            "12",
            "14",
            "13",
            "12",
            "11",
            "12",
            "13",
            "14",
            "15",
        ]
        return [
            MarketDataCandle(
                symbol=symbol,
                exchange=exchange,
                timeframe=timeframe,
                timestamp=start_at + timedelta(days=index),
                open=Decimal(close),
                high=Decimal(close),
                low=Decimal(close),
                close=Decimal(close),
                volume=Decimal("1000"),
                source="fyers",
            )
            for index, close in enumerate(closes)
        ]


class _EmptyFyersHistoricalAdapter:
    def __init__(self, **kwargs) -> None:
        pass

    def get_candles(self, *, symbol, exchange, timeframe, start, end):
        return []


class _AuthFailingFyersHistoricalAdapter:
    def __init__(self, **kwargs) -> None:
        pass

    def get_candles(self, *, symbol, exchange, timeframe, start, end):
        raise DataProviderDisabledError(
            'fyers history request failed: {"code":-16,"message":"Could not authenticate the user","s":"error"}'
        )
