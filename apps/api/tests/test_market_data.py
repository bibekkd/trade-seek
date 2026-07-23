from datetime import UTC, date, datetime
from decimal import Decimal
import json
from urllib.parse import parse_qs, urlparse

import pytest
from sqlalchemy.orm import Session

from app.db.base import Base
from app.services.market_data import (
    CsvFixtureMarketDataAdapter,
    DataProviderDisabledError,
    FyersHistoricalAdapter,
    NseBhavcopyDailyAdapter,
    get_candles_by_symbol,
    import_market_data,
    list_imported_instruments,
)


@pytest.fixture
def sqlite_session(sqlite_engine):
    Base.metadata.create_all(sqlite_engine)
    with Session(sqlite_engine) as session:
        yield session
    Base.metadata.drop_all(sqlite_engine)


def test_fixture_adapter_lists_instruments_and_filters_candles() -> None:
    adapter = CsvFixtureMarketDataAdapter()

    instruments = adapter.list_instruments()
    candles = adapter.get_candles(
        symbol="reliance",
        start=date(2024, 1, 2),
        end=date(2024, 1, 2),
    )

    assert [instrument.symbol for instrument in instruments] == ["RELIANCE", "TCS", "INFY"]
    assert len(candles) == 1
    assert candles[0].symbol == "RELIANCE"
    assert candles[0].close == Decimal("2612.35")


def test_nse_bhavcopy_adapter_parses_daily_equity_rows(tmp_path) -> None:
    bhavcopy_path = tmp_path / "bhavcopy.csv"
    bhavcopy_path.write_text(
        "SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,TOTTRDQTY,TIMESTAMP,ISIN\n"
        "RELIANCE,EQ,2500.00,2550.00,2490.00,2540.00,1000000,01-Jan-2024,INE002A01018\n"
        "RELIANCE,BE,2500.00,2550.00,2490.00,2540.00,1000000,01-Jan-2024,INE002A01018\n",
    )
    adapter = NseBhavcopyDailyAdapter(bhavcopy_path)

    instruments = adapter.list_instruments()
    candles = adapter.get_candles(symbol="RELIANCE")

    assert len(instruments) == 1
    assert instruments[0].symbol == "RELIANCE"
    assert len(candles) == 1
    assert candles[0].timestamp == datetime(2024, 1, 1, tzinfo=UTC)
    assert candles[0].source == "nse_bhavcopy"


def test_disabled_provider_raises_clear_error() -> None:
    adapter = FyersHistoricalAdapter()

    with pytest.raises(DataProviderDisabledError, match="FYERS_APP_ID, FYERS_ACCESS_TOKEN"):
        adapter.get_candles(symbol="RELIANCE")


def test_fyers_adapter_lists_nse_equity_instruments() -> None:
    adapter = FyersHistoricalAdapter(opener=_fake_urlopen_for_symbol_master)

    instruments = adapter.list_instruments()

    assert len(instruments) == 1
    assert instruments[0].symbol == "SBIN"
    assert instruments[0].exchange == "NSE"
    assert instruments[0].name == "STATE BANK OF INDIA"
    assert instruments[0].isin == "INE062A01020"


def test_fyers_adapter_fetches_historical_candles() -> None:
    seen_requests = []

    def fake_urlopen(request, timeout=15.0):
        seen_requests.append(request)
        return _FakeResponse(
            json.dumps(
                {
                    "s": "ok",
                    "candles": [
                        [1704153600, 600.5, 610.0, 599.0, 608.25, 1000000],
                    ],
                }
            ).encode("utf-8")
        )

    adapter = FyersHistoricalAdapter(
        app_id="APPID-100",
        access_token="token",
        opener=fake_urlopen,
    )

    candles = adapter.get_candles(
        symbol="SBIN",
        timeframe="1d",
        start=date(2024, 1, 2),
        end=date(2024, 1, 2),
    )

    request = seen_requests[0]
    payload = parse_qs(urlparse(request.full_url).query)
    assert request.full_url.startswith("https://api-t1.fyers.in/data/history?")
    assert request.headers["Authorization"] == "APPID-100:token"
    assert payload == {
        "symbol": ["NSE:SBIN-EQ"],
        "resolution": ["D"],
        "date_format": ["1"],
        "range_from": ["2024-01-02"],
        "range_to": ["2024-01-02"],
        "cont_flag": ["1"],
    }
    assert len(candles) == 1
    assert candles[0].symbol == "SBIN"
    assert candles[0].close == Decimal("608.25")
    assert candles[0].source == "fyers"


def test_import_market_data_loads_instruments_and_candles(sqlite_session) -> None:
    adapter = CsvFixtureMarketDataAdapter()

    instrument_count, candle_count = import_market_data(adapter, sqlite_session)

    instruments = list_imported_instruments(sqlite_session)
    candles = get_candles_by_symbol(
        sqlite_session,
        symbol="RELIANCE",
        start=datetime(2024, 1, 2, tzinfo=UTC),
        end=datetime(2024, 1, 3, tzinfo=UTC),
    )

    assert instrument_count == 3
    assert candle_count == 20
    assert [instrument.symbol for instrument in instruments] == ["INFY", "RELIANCE", "TCS"]
    assert [candle.close for candle in candles] == [Decimal("2612.350000"), Decimal("2628.450000")]


def test_import_market_data_is_idempotent(sqlite_session) -> None:
    adapter = CsvFixtureMarketDataAdapter()

    import_market_data(adapter, sqlite_session)
    import_market_data(adapter, sqlite_session)

    assert len(list_imported_instruments(sqlite_session)) == 3
    assert len(get_candles_by_symbol(sqlite_session, symbol="RELIANCE")) == 14


class _FakeResponse:
    def __init__(self, body: bytes) -> None:
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback) -> None:
        return None

    def read(self) -> bytes:
        return self.body


def _fake_urlopen_for_symbol_master(url, timeout=15.0):
    body = (
        "10100000003045,STATE BANK OF INDIA,0,1,0.05,INE062A01020,"
        "0915-1530|1815-1915:,2026-07-15,,NSE:SBIN-EQ,10,10,3045,"
        "SBIN,3045,-1.0,XX,10100000003045,None,1,2.0\n"
        "1010000000XYZ,NIFTY OPTION,0,1,0.05,,0915-1530:,2026-07-15,,"
        "NSE:NIFTY26JUL24000CE,10,10,1,NIFTY,1,24000.0,CE,1,None,1,2.0\n"
    )
    return _FakeResponse(body.encode("utf-8"))
