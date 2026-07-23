from collections.abc import Iterator
from datetime import UTC, date, datetime
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import get_session
from app.main import app
from app.services.market_data import (
    DataProviderDisabledError,
    MarketDataCandle,
    MarketDataInstrument,
    upsert_candles_for_instrument,
)


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


def test_list_instruments_defaults_to_fixture_provider() -> None:
    client = TestClient(app)

    response = client.get("/instruments")

    assert response.status_code == 200
    assert [instrument["symbol"] for instrument in response.json()] == ["RELIANCE", "TCS", "INFY"]


def test_list_candles_returns_fixture_rows_for_symbol_and_date_range() -> None:
    client = TestClient(app)

    response = client.get(
        "/market-data/candles",
        params={
            "symbol": "reliance",
            "start": "2024-01-02",
            "end": "2024-01-02",
        },
    )

    assert response.status_code == 200
    candles = response.json()
    assert len(candles) == 1
    assert candles[0]["symbol"] == "RELIANCE"
    assert candles[0]["close"] == "2612.35"


def test_list_candles_returns_clean_error_for_missing_symbol() -> None:
    client = TestClient(app)

    response = client.get("/market-data/candles", params={"symbol": "UNKNOWN"})

    assert response.status_code == 404
    assert response.json()["detail"] == "No candles found for UNKNOWN"


def test_broker_provider_returns_disabled_error_when_no_cache(client_with_sqlite, monkeypatch) -> None:
    monkeypatch.setattr("app.api.market_data.settings.fyers_access_token", None)

    response = client_with_sqlite.get(
        "/market-data/candles",
        params={"symbol": "RELIANCE", "provider": "fyers"},
    )

    assert response.status_code == 503
    assert "FYERS_ACCESS_TOKEN" in response.json()["detail"]


def test_quotes_fall_back_to_historical_candles_when_fyers_quotes_are_missing(
    client_with_sqlite,
    monkeypatch,
) -> None:
    monkeypatch.setattr("app.api.market_data.FyersHistoricalAdapter", _HistoryOnlyFyersAdapter)

    response = client_with_sqlite.get(
        "/market-data/quotes",
        params={"symbols": "RELIANCE,HDFCBANK", "provider": "fyers"},
    )

    assert response.status_code == 200
    quotes = response.json()
    assert [quote["symbol"] for quote in quotes] == ["RELIANCE", "HDFCBANK"]
    assert quotes[0]["last"] == "105.00"
    assert quotes[0]["previous_close"] == "100.00"
    assert quotes[0]["change"] == "5.00"
    assert quotes[0]["change_pct"] == "5.00"


def test_quotes_fall_back_to_cached_candles_when_fyers_is_unavailable(
    client_with_sqlite,
    sqlite_engine,
    monkeypatch,
) -> None:
    with Session(sqlite_engine) as session:
        upsert_candles_for_instrument(
            session,
            instrument=MarketDataInstrument(symbol="SBIN", exchange="NSE", name="State Bank of India"),
            candles=[
                _candle("SBIN", "2026-07-16", "600.00"),
                _candle("SBIN", "2026-07-17", "618.00"),
            ],
        )
        session.commit()
    monkeypatch.setattr("app.api.market_data.FyersHistoricalAdapter", _UnavailableFyersAdapter)

    response = client_with_sqlite.get(
        "/market-data/quotes",
        params={"symbols": "SBIN,AXISBANK", "provider": "fyers"},
    )

    assert response.status_code == 200
    quotes = response.json()
    assert [quote["symbol"] for quote in quotes] == ["SBIN"]
    assert quotes[0]["last"] == "618.000000"
    assert quotes[0]["previous_close"] == "600.000000"


class _HistoryOnlyFyersAdapter:
    provider_name = "fyers"

    def __init__(self, **_kwargs) -> None:
        pass

    def get_quotes(self, *, symbols: list[str], exchange: str = "NSE"):
        return []

    def get_candles(
        self,
        *,
        symbol: str,
        exchange: str = "NSE",
        timeframe: str = "1d",
        start: date | None = None,
        end: date | None = None,
    ) -> list[MarketDataCandle]:
        return [
            _candle(symbol, "2026-07-16", "100.00"),
            _candle(symbol, "2026-07-17", "105.00"),
        ]


class _UnavailableFyersAdapter(_HistoryOnlyFyersAdapter):
    def get_candles(
        self,
        *,
        symbol: str,
        exchange: str = "NSE",
        timeframe: str = "1d",
        start: date | None = None,
        end: date | None = None,
    ) -> list[MarketDataCandle]:
        raise DataProviderDisabledError("fyers historical data requires FYERS_ACCESS_TOKEN")


def _candle(symbol: str, day: str, close: str) -> MarketDataCandle:
    close_decimal = Decimal(close)
    return MarketDataCandle(
        symbol=symbol,
        exchange="NSE",
        timeframe="1d",
        timestamp=datetime.fromisoformat(day).replace(tzinfo=UTC),
        open=close_decimal,
        high=close_decimal,
        low=close_decimal,
        close=close_decimal,
        volume=Decimal("1000"),
        source="fyers",
    )
