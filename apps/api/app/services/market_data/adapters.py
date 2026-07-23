from __future__ import annotations

import csv
import json
import socket
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import UTC, date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_FIXTURE_DIR = Path(__file__).resolve().parents[2] / "fixtures" / "market_data"


class DataProviderDisabledError(RuntimeError):
    """Raised when a real provider is configured but unavailable for the MVP."""


@dataclass(frozen=True)
class MarketDataInstrument:
    symbol: str
    exchange: str
    name: str
    isin: str | None = None
    segment: str = "equity"
    currency: str = "INR"


@dataclass(frozen=True)
class MarketDataCandle:
    symbol: str
    exchange: str
    timeframe: str
    timestamp: datetime
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: Decimal
    source: str


@dataclass(frozen=True)
class MarketDataQuote:
    symbol: str
    exchange: str
    timestamp: datetime
    open: Decimal
    high: Decimal
    low: Decimal
    last: Decimal
    previous_close: Decimal
    change: Decimal
    change_pct: Decimal
    volume: Decimal
    source: str


class MarketDataAdapter(ABC):
    provider_name: str

    @abstractmethod
    def list_instruments(self) -> list[MarketDataInstrument]:
        raise NotImplementedError

    @abstractmethod
    def get_candles(
        self,
        *,
        symbol: str,
        exchange: str = "NSE",
        timeframe: str = "1d",
        start: date | None = None,
        end: date | None = None,
    ) -> list[MarketDataCandle]:
        raise NotImplementedError


class CsvFixtureMarketDataAdapter(MarketDataAdapter):
    provider_name = "fixture_csv"

    def __init__(self, fixture_dir: Path | str = DEFAULT_FIXTURE_DIR) -> None:
        self.fixture_dir = Path(fixture_dir)
        self.instruments_path = self.fixture_dir / "instruments.csv"
        self.candles_path = self.fixture_dir / "candles.csv"

    def list_instruments(self) -> list[MarketDataInstrument]:
        with self.instruments_path.open(newline="") as csv_file:
            return [
                MarketDataInstrument(
                    symbol=row["symbol"].upper(),
                    exchange=row["exchange"].upper(),
                    name=row["name"],
                    isin=row["isin"] or None,
                    segment=row.get("segment") or "equity",
                    currency=(row.get("currency") or "INR").upper(),
                )
                for row in csv.DictReader(csv_file)
            ]

    def get_candles(
        self,
        *,
        symbol: str,
        exchange: str = "NSE",
        timeframe: str = "1d",
        start: date | None = None,
        end: date | None = None,
    ) -> list[MarketDataCandle]:
        requested_symbol = symbol.upper()
        requested_exchange = exchange.upper()
        with self.candles_path.open(newline="") as csv_file:
            candles = [
                _fixture_row_to_candle(row)
                for row in csv.DictReader(csv_file)
                if row["symbol"].upper() == requested_symbol
                and row["exchange"].upper() == requested_exchange
                and row["timeframe"] == timeframe
            ]

        return [
            candle
            for candle in candles
            if _is_inside_date_range(candle.timestamp.date(), start=start, end=end)
        ]


class NseBhavcopyDailyAdapter(MarketDataAdapter):
    provider_name = "nse_bhavcopy"

    def __init__(self, bhavcopy_csv_path: Path | str) -> None:
        self.bhavcopy_csv_path = Path(bhavcopy_csv_path)

    def list_instruments(self) -> list[MarketDataInstrument]:
        instruments: dict[tuple[str, str], MarketDataInstrument] = {}
        with self.bhavcopy_csv_path.open(newline="") as csv_file:
            for row in csv.DictReader(csv_file):
                if row.get("SERIES") != "EQ":
                    continue
                symbol = row["SYMBOL"].upper()
                instruments[("NSE", symbol)] = MarketDataInstrument(
                    symbol=symbol,
                    exchange="NSE",
                    name=symbol,
                    isin=row.get("ISIN") or None,
                )
        return list(instruments.values())

    def get_candles(
        self,
        *,
        symbol: str,
        exchange: str = "NSE",
        timeframe: str = "1d",
        start: date | None = None,
        end: date | None = None,
    ) -> list[MarketDataCandle]:
        if exchange.upper() != "NSE":
            return []
        if timeframe != "1d":
            return []

        requested_symbol = symbol.upper()
        candles: list[MarketDataCandle] = []
        with self.bhavcopy_csv_path.open(newline="") as csv_file:
            for row in csv.DictReader(csv_file):
                if row.get("SERIES") != "EQ" or row["SYMBOL"].upper() != requested_symbol:
                    continue
                candle = _nse_bhavcopy_row_to_candle(row)
                if _is_inside_date_range(candle.timestamp.date(), start=start, end=end):
                    candles.append(candle)
        return candles


class _DisabledBrokerHistoricalAdapter(MarketDataAdapter):
    provider_name = "disabled"

    def list_instruments(self) -> list[MarketDataInstrument]:
        raise DataProviderDisabledError(self._error_message())

    def get_candles(
        self,
        *,
        symbol: str,
        exchange: str = "NSE",
        timeframe: str = "1d",
        start: date | None = None,
        end: date | None = None,
    ) -> list[MarketDataCandle]:
        raise DataProviderDisabledError(self._error_message())

    def _error_message(self) -> str:
        return (
            f"{self.provider_name} historical data is disabled until API credentials "
            "and current provider limits are configured."
        )


class FyersHistoricalAdapter(_DisabledBrokerHistoricalAdapter):
    provider_name = "fyers"

    def __init__(
        self,
        *,
        app_id: str | None = None,
        access_token: str | None = None,
        data_base_url: str = "https://api-t1.fyers.in/data",
        symbol_master_url: str = "https://public.fyers.in/sym_details/NSE_CM.csv",
        request_timeout_seconds: float = 15.0,
        opener: Any = urlopen,
    ) -> None:
        self.app_id = app_id
        self.access_token = access_token
        self.data_base_url = data_base_url.rstrip("/")
        self.symbol_master_url = symbol_master_url
        self.request_timeout_seconds = request_timeout_seconds
        self._opener = opener

    def list_instruments(self) -> list[MarketDataInstrument]:
        try:
            with self._opener(self.symbol_master_url, timeout=self.request_timeout_seconds) as response:
                rows = response.read().decode("utf-8").splitlines()
        except (OSError, HTTPError, URLError) as exc:
            raise DataProviderDisabledError(f"fyers symbol master fetch failed: {exc}") from exc

        instruments: list[MarketDataInstrument] = []
        for row in csv.reader(rows):
            instrument = _fyers_symbol_master_row_to_instrument(row)
            if instrument is not None:
                instruments.append(instrument)
        return instruments

    def get_quotes(self, *, symbols: list[str], exchange: str = "NSE") -> list[MarketDataQuote]:
        self._validate_history_credentials()
        fyers_symbols = [_to_fyers_symbol(symbol=symbol, exchange=exchange) for symbol in symbols]
        response_data = self._get_json("/quotes", {"symbols": ",".join(fyers_symbols)})
        if response_data.get("s") == "error":
            message = response_data.get("message") or "unknown FYERS error"
            raise DataProviderDisabledError(f"fyers quotes request failed: {message}")
        quote_rows = response_data.get("d", [])
        if not isinstance(quote_rows, list):
            raise DataProviderDisabledError("fyers quotes response did not include a quote list")
        return [_fyers_quote_to_market_data_quote(row) for row in quote_rows if row.get("s") == "ok"]

    def get_candles(
        self,
        *,
        symbol: str,
        exchange: str = "NSE",
        timeframe: str = "1d",
        start: date | None = None,
        end: date | None = None,
    ) -> list[MarketDataCandle]:
        self._validate_history_credentials()
        requested_start = start or date.today()
        requested_end = end or requested_start
        fyers_symbol = _to_fyers_symbol(symbol=symbol, exchange=exchange)
        payload = {
            "symbol": fyers_symbol,
            "resolution": _to_fyers_resolution(timeframe),
            "date_format": "1",
            "range_from": requested_start.isoformat(),
            "range_to": requested_end.isoformat(),
            "cont_flag": "1",
        }
        response_data = self._get_json("/history", payload)
        if response_data.get("s") != "ok":
            message = response_data.get("message") or response_data.get("errmsg") or "unknown FYERS error"
            raise DataProviderDisabledError(f"fyers history request failed: {message}")

        candles = response_data.get("candles", [])
        if not isinstance(candles, list):
            raise DataProviderDisabledError("fyers history response did not include a candle list")

        normalized_symbol = _from_fyers_symbol(fyers_symbol)
        return [
            _fyers_candle_to_market_data_candle(
                row,
                symbol=normalized_symbol,
                exchange=exchange,
                timeframe=timeframe,
            )
            for row in candles
        ]

    def _get_json(self, path: str, payload: dict[str, str]) -> dict[str, Any]:
        query = urlencode(payload)
        request = Request(
            f"{self.data_base_url}{path}?{query}",
            headers={
                "Authorization": f"{self.app_id}:{self.access_token}",
                "Accept": "application/json",
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/126.0.0.0 Safari/537.36"
                ),
                "Origin": "https://api-t1.fyers.in",
                "Referer": "https://api-t1.fyers.in/",
            },
            method="GET",
        )
        try:
            with _prefer_ipv4():
                with self._opener(request, timeout=self.request_timeout_seconds) as response:
                    return json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            detail = body or str(exc)
            raise DataProviderDisabledError(f"fyers history request failed: {detail}") from exc
        except (OSError, HTTPError, URLError, json.JSONDecodeError) as exc:
            raise DataProviderDisabledError(f"fyers history request failed: {exc}") from exc

    def _validate_history_credentials(self) -> None:
        missing = [
            env_name
            for env_name, value in (
                ("FYERS_APP_ID", self.app_id),
                ("FYERS_ACCESS_TOKEN", self.access_token),
            )
            if not value
        ]
        if missing:
            raise DataProviderDisabledError(
                "fyers historical data requires " + ", ".join(missing)
            )


class AngelOneHistoricalAdapter(_DisabledBrokerHistoricalAdapter):
    provider_name = "angel_one"


def _fixture_row_to_candle(row: dict[str, str]) -> MarketDataCandle:
    return MarketDataCandle(
        symbol=row["symbol"].upper(),
        exchange=row["exchange"].upper(),
        timeframe=row["timeframe"],
        timestamp=_parse_fixture_datetime(row["timestamp"]),
        open=Decimal(row["open"]),
        high=Decimal(row["high"]),
        low=Decimal(row["low"]),
        close=Decimal(row["close"]),
        volume=Decimal(row["volume"]),
        source=row.get("source") or CsvFixtureMarketDataAdapter.provider_name,
    )


def _nse_bhavcopy_row_to_candle(row: dict[str, str]) -> MarketDataCandle:
    timestamp = datetime.combine(
        _parse_bhavcopy_date(row["TIMESTAMP"]),
        datetime.min.time(),
        tzinfo=UTC,
    )
    return MarketDataCandle(
        symbol=row["SYMBOL"].upper(),
        exchange="NSE",
        timeframe="1d",
        timestamp=timestamp,
        open=Decimal(row["OPEN"]),
        high=Decimal(row["HIGH"]),
        low=Decimal(row["LOW"]),
        close=Decimal(row["CLOSE"]),
        volume=Decimal(row["TOTTRDQTY"]),
        source=NseBhavcopyDailyAdapter.provider_name,
    )


def _fyers_symbol_master_row_to_instrument(row: list[str]) -> MarketDataInstrument | None:
    if len(row) < 14:
        return None
    fyers_symbol = row[9].strip().upper()
    if not fyers_symbol.startswith("NSE:") or not fyers_symbol.endswith("-EQ"):
        return None
    return MarketDataInstrument(
        symbol=_from_fyers_symbol(fyers_symbol),
        exchange="NSE",
        name=row[1].strip() or _from_fyers_symbol(fyers_symbol),
        isin=row[5].strip() or None,
        segment="equity",
        currency="INR",
    )


def _fyers_candle_to_market_data_candle(
    row: list[Any],
    *,
    symbol: str,
    exchange: str,
    timeframe: str,
) -> MarketDataCandle:
    if len(row) < 6:
        raise DataProviderDisabledError("fyers returned a malformed candle row")
    return MarketDataCandle(
        symbol=symbol.upper(),
        exchange=exchange.upper(),
        timeframe=timeframe,
        timestamp=datetime.fromtimestamp(int(row[0]), tz=UTC),
        open=Decimal(str(row[1])),
        high=Decimal(str(row[2])),
        low=Decimal(str(row[3])),
        close=Decimal(str(row[4])),
        volume=Decimal(str(row[5])),
        source=FyersHistoricalAdapter.provider_name,
    )


def _fyers_quote_to_market_data_quote(row: dict[str, Any]) -> MarketDataQuote:
    values = row.get("v")
    if not isinstance(values, dict):
        raise DataProviderDisabledError("fyers returned a malformed quote row")
    fyers_symbol = str(values.get("symbol") or row.get("n") or "").upper()
    timestamp = datetime.fromtimestamp(int(values.get("tt") or 0), tz=UTC)
    symbol = _from_fyers_symbol(fyers_symbol)
    if fyers_symbol.endswith("-INDEX"):
        symbol = fyers_symbol
    return MarketDataQuote(
        symbol=symbol,
        exchange=str(values.get("exchange") or "NSE").upper(),
        timestamp=timestamp,
        open=Decimal(str(values.get("open_price") or 0)),
        high=Decimal(str(values.get("high_price") or 0)),
        low=Decimal(str(values.get("low_price") or 0)),
        last=Decimal(str(values.get("lp") or 0)),
        previous_close=Decimal(str(values.get("prev_close_price") or 0)),
        change=Decimal(str(values.get("ch") or 0)),
        change_pct=Decimal(str(values.get("chp") or 0)),
        volume=Decimal(str(values.get("volume") or 0)),
        source=FyersHistoricalAdapter.provider_name,
    )


def _to_fyers_symbol(*, symbol: str, exchange: str) -> str:
    normalized_symbol = symbol.strip().upper()
    normalized_exchange = exchange.strip().upper()
    if ":" in normalized_symbol:
        return normalized_symbol
    if normalized_symbol.endswith("-EQ"):
        return f"{normalized_exchange}:{normalized_symbol}"
    return f"{normalized_exchange}:{normalized_symbol}-EQ"


def _from_fyers_symbol(symbol: str) -> str:
    local_symbol = symbol.split(":", maxsplit=1)[-1].upper()
    if local_symbol.endswith("-EQ"):
        return local_symbol.removesuffix("-EQ")
    return local_symbol


def _to_fyers_resolution(timeframe: str) -> str:
    normalized = timeframe.strip().lower()
    mapping = {
        "1m": "1",
        "3m": "3",
        "5m": "5",
        "10m": "10",
        "15m": "15",
        "30m": "30",
        "45m": "45",
        "1h": "60",
        "60m": "60",
        "2h": "120",
        "120m": "120",
        "4h": "240",
        "240m": "240",
        "1d": "D",
        "d": "D",
        "day": "D",
        "daily": "D",
    }
    return mapping.get(normalized, timeframe.upper())


class _prefer_ipv4:
    def __enter__(self):
        self._original_getaddrinfo = socket.getaddrinfo

        def getaddrinfo_ipv4(*args, **kwargs):
            return [
                result
                for result in self._original_getaddrinfo(*args, **kwargs)
                if result[0] == socket.AF_INET
            ]

        socket.getaddrinfo = getaddrinfo_ipv4

    def __exit__(self, exc_type, exc_value, traceback) -> None:
        socket.getaddrinfo = self._original_getaddrinfo


def _parse_fixture_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed


def _parse_bhavcopy_date(value: str) -> date:
    return datetime.strptime(value, "%d-%b-%Y").replace(tzinfo=UTC).date()


def _is_inside_date_range(value: date, *, start: date | None, end: date | None) -> bool:
    if start is not None and value < start:
        return False
    if end is not None and value > end:
        return False
    return True
