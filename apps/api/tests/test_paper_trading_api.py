from collections.abc import Iterator
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.session import get_session
from app.main import app


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


def test_paper_account_buy_and_sell_flow(client_with_sqlite: TestClient) -> None:
    account_response = client_with_sqlite.post(
        "/paper/accounts",
        json={"name": "MVP paper", "initial_cash": "100000"},
    )
    assert account_response.status_code == 200
    account = account_response.json()

    buy_response = client_with_sqlite.post(
        f"/paper/accounts/{account['id']}/orders",
        json={"symbol": "RELIANCE", "exchange": "NSE", "side": "buy", "quantity": "10", "provider": "fixture"},
    )
    assert buy_response.status_code == 200
    buy_order = buy_response.json()
    assert buy_order["status"] == "filled"
    assert buy_order["filled_price"] is not None

    fetch_response = client_with_sqlite.get(f"/paper/accounts/{account['id']}")
    fetched = fetch_response.json()
    assert Decimal(fetched["cash"]) < Decimal(account["cash"])
    assert fetched["positions"][0]["symbol"] == "RELIANCE"
    assert fetched["positions"][0]["quantity"] == "10.00000000"

    sell_response = client_with_sqlite.post(
        f"/paper/accounts/{account['id']}/orders",
        json={"symbol": "RELIANCE", "exchange": "NSE", "side": "sell", "quantity": "4", "provider": "fixture"},
    )
    assert sell_response.status_code == 200
    assert sell_response.json()["status"] == "filled"


def test_paper_order_rejects_insufficient_cash(client_with_sqlite: TestClient) -> None:
    account = client_with_sqlite.post(
        "/paper/accounts",
        json={"name": "Tiny paper", "initial_cash": "100"},
    ).json()

    response = client_with_sqlite.post(
        f"/paper/accounts/{account['id']}/orders",
        json={"symbol": "RELIANCE", "exchange": "NSE", "side": "buy", "quantity": "10", "provider": "fixture"},
    )

    assert response.status_code == 200
    order = response.json()
    assert order["status"] == "rejected"
    assert order["rejection_reason"] == "Insufficient paper cash"


def test_start_paper_strategy_from_completed_backtest(client_with_sqlite: TestClient, sqlite_engine, monkeypatch) -> None:
    monkeypatch.setattr("app.api.backtests.enqueue_backtest", lambda _backtest_id: None)
    monkeypatch.setattr(
        "app.tasks.backtests.SessionLocal",
        sessionmaker(bind=sqlite_engine, autoflush=False, autocommit=False),
    )
    account = client_with_sqlite.post("/paper/accounts", json={"initial_cash": "100000"}).json()
    backtest = client_with_sqlite.post("/backtests", json=_backtest_payload()).json()

    from app.tasks.backtests import run_backtest_task

    run_backtest_task.apply(args=[backtest["id"]]).get()

    response = client_with_sqlite.post(
        "/paper/strategy-runs",
        json={
            "account_id": account["id"],
            "backtest_run_id": backtest["id"],
            "max_position_value": "25000",
        },
    )

    assert response.status_code == 200
    strategy_run = response.json()
    assert strategy_run["status"] == "active"
    assert strategy_run["backtest_run_id"] == backtest["id"]


def _backtest_payload() -> dict:
    return {
        "symbol": "RELIANCE",
        "exchange": "NSE",
        "timeframe": "1d",
        "provider": "fixture",
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
