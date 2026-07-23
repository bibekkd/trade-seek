from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_session
from app.models import Instrument, OhlcvCandle
from app.schemas.market_data import CandleResponse, InstrumentResponse, QuoteResponse
from app.services.market_data import (
    AngelOneHistoricalAdapter,
    CsvFixtureMarketDataAdapter,
    DataProviderDisabledError,
    FyersHistoricalAdapter,
    MarketDataAdapter,
    MarketDataCandle,
    MarketDataInstrument,
    MarketDataQuote,
    NseBhavcopyDailyAdapter,
    get_candles_by_symbol,
    list_imported_instruments,
    upsert_candles_for_instrument,
)

router = APIRouter(tags=["market-data"])

MarketDataProvider = Literal["fixture", "database", "nse_bhavcopy", "fyers", "angel_one"]


@router.get("/instruments", response_model=list[InstrumentResponse])
def list_instruments(
    provider: MarketDataProvider = Query(default="fixture"),
    session: Session = Depends(get_session),
) -> list[InstrumentResponse]:
    if provider == "database":
        return [_instrument_model_to_response(instrument) for instrument in list_imported_instruments(session)]

    adapter = _adapter_for_provider(provider)
    try:
        instruments = adapter.list_instruments()
    except DataProviderDisabledError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return [
        InstrumentResponse(
            symbol=instrument.symbol,
            exchange=instrument.exchange,
            name=instrument.name,
            isin=instrument.isin,
            segment=instrument.segment,
            currency=instrument.currency,
        )
        for instrument in instruments
    ]


@router.get("/market-data/candles", response_model=list[CandleResponse])
def list_candles(
    symbol: str = Query(min_length=1, max_length=32),
    exchange: str = Query(default="NSE", min_length=1, max_length=12),
    timeframe: str = Query(default="1d", min_length=1, max_length=12),
    start: date | None = None,
    end: date | None = None,
    provider: MarketDataProvider = Query(default="fixture"),
    session: Session = Depends(get_session),
) -> list[CandleResponse]:
    if start is not None and end is not None and end < start:
        raise HTTPException(status_code=422, detail="end must be on or after start")

    if provider == "database":
        candles = get_candles_by_symbol(
            session,
            symbol=symbol,
            exchange=exchange,
            timeframe=timeframe,
            start=_date_to_datetime(start, boundary="start"),
            end=_date_to_datetime(end, boundary="end"),
        )
        if not candles:
            raise HTTPException(status_code=404, detail=f"No candles found for {symbol.upper()}")
        return [_candle_model_to_response(candle) for candle in candles]

    adapter = _adapter_for_provider(provider)
    try:
        candles = adapter.get_candles(
            symbol=symbol,
            exchange=exchange,
            timeframe=timeframe,
            start=start,
            end=end,
        )
    except DataProviderDisabledError as exc:
        cached_candles = get_candles_by_symbol(
            session,
            symbol=symbol,
            exchange=exchange,
            timeframe=timeframe,
            start=_date_to_datetime(start, boundary="start"),
            end=_date_to_datetime(end, boundary="end"),
        )
        if cached_candles:
            return [_candle_model_to_response(candle) for candle in cached_candles]
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if not candles:
        raise HTTPException(status_code=404, detail=f"No candles found for {symbol.upper()}")
    if provider == "fyers":
        upsert_candles_for_instrument(
            session,
            instrument=MarketDataInstrument(
                symbol=symbol.upper(),
                exchange=exchange.upper(),
                name=symbol.upper(),
            ),
            candles=candles,
        )
        session.commit()
    return [_adapter_candle_to_response(candle) for candle in candles]


@router.get("/market-data/quotes", response_model=list[QuoteResponse])
def list_quotes(
    symbols: str = Query(min_length=1),
    exchange: str = Query(default="NSE", min_length=1, max_length=12),
    provider: Literal["fyers"] = Query(default="fyers"),
    session: Session = Depends(get_session),
) -> list[QuoteResponse]:
    adapter = _adapter_for_provider(provider)
    requested_symbols = [symbol.strip() for symbol in symbols.split(",") if symbol.strip()]
    if not requested_symbols:
        raise HTTPException(status_code=422, detail="symbols must contain at least one symbol")
    cached_quotes = _cached_quotes_for_symbols(
        session=session,
        symbols=requested_symbols,
        exchange=exchange,
    )
    quotes_by_symbol = {_normalize_symbol_key(quote.symbol): quote for quote in cached_quotes}
    if all(_normalize_symbol_key(symbol) in quotes_by_symbol for symbol in requested_symbols):
        return [
            _adapter_quote_to_response(quotes_by_symbol[_normalize_symbol_key(symbol)])
            for symbol in requested_symbols
        ]

    symbols_to_fetch = [
        symbol
        for symbol in requested_symbols
        if _normalize_symbol_key(symbol) not in quotes_by_symbol
    ]
    quotes: list[MarketDataQuote] = []
    provider_error: DataProviderDisabledError | None = None
    try:
        quotes = adapter.get_quotes(symbols=symbols_to_fetch, exchange=exchange)  # type: ignore[attr-defined]
    except DataProviderDisabledError as exc:
        provider_error = exc

    quotes_by_symbol.update({_normalize_symbol_key(quote.symbol): quote for quote in quotes})
    missing_symbols = [
        symbol
        for symbol in requested_symbols
        if _normalize_symbol_key(symbol) not in quotes_by_symbol
    ]
    fallback_quotes = _fallback_quotes_for_symbols(
        session=session,
        adapter=adapter,
        symbols=missing_symbols,
        exchange=exchange,
        try_live_history=provider_error is None,
    )
    quotes_by_symbol.update({_normalize_symbol_key(quote.symbol): quote for quote in fallback_quotes})

    ordered_quotes = [
        quotes_by_symbol[_normalize_symbol_key(symbol)]
        for symbol in requested_symbols
        if _normalize_symbol_key(symbol) in quotes_by_symbol
    ]
    if not ordered_quotes and provider_error is not None:
        raise HTTPException(status_code=503, detail=str(provider_error)) from provider_error
    return [_adapter_quote_to_response(quote) for quote in ordered_quotes]


def _adapter_for_provider(provider: MarketDataProvider) -> MarketDataAdapter:
    if provider == "fixture":
        return CsvFixtureMarketDataAdapter()
    if provider == "nse_bhavcopy":
        if settings.nse_bhavcopy_csv_path is None:
            raise HTTPException(
                status_code=400,
                detail="NSE_BHAVCOPY_CSV_PATH must be configured to use nse_bhavcopy",
            )
        return NseBhavcopyDailyAdapter(settings.nse_bhavcopy_csv_path)
    if provider == "fyers":
        return FyersHistoricalAdapter(
            app_id=settings.fyers_app_id,
            access_token=settings.fyers_access_token,
            data_base_url=settings.fyers_data_base_url,
            symbol_master_url=settings.fyers_symbol_master_url,
            request_timeout_seconds=4.0,
        )
    if provider == "angel_one":
        return AngelOneHistoricalAdapter()

    raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")


def _instrument_model_to_response(instrument: Instrument) -> InstrumentResponse:
    return InstrumentResponse(
        symbol=instrument.symbol,
        exchange=instrument.exchange,
        name=instrument.name,
        isin=instrument.isin,
        segment=instrument.segment,
        currency=instrument.currency,
        is_active=instrument.is_active,
    )


def _adapter_candle_to_response(candle: MarketDataCandle) -> CandleResponse:
    return CandleResponse(
        symbol=candle.symbol,
        exchange=candle.exchange,
        timeframe=candle.timeframe,
        timestamp=candle.timestamp,
        open=candle.open,
        high=candle.high,
        low=candle.low,
        close=candle.close,
        volume=candle.volume,
        source=candle.source,
    )


def _adapter_quote_to_response(quote: MarketDataQuote) -> QuoteResponse:
    return QuoteResponse(
        symbol=quote.symbol,
        exchange=quote.exchange,
        timestamp=quote.timestamp,
        open=quote.open,
        high=quote.high,
        low=quote.low,
        last=quote.last,
        previous_close=quote.previous_close,
        change=quote.change,
        change_pct=quote.change_pct,
        volume=quote.volume,
        source=quote.source,
    )


def _fallback_quotes_for_symbols(
    *,
    session: Session,
    adapter: MarketDataAdapter,
    symbols: list[str],
    exchange: str,
    try_live_history: bool,
) -> list[MarketDataQuote]:
    quotes: list[MarketDataQuote] = []
    quoted_symbols: set[str] = set()
    end = date.today()
    start = end - timedelta(days=45)
    if try_live_history:
        for symbol in symbols:
            try:
                candles = adapter.get_candles(
                    symbol=symbol,
                    exchange=exchange,
                    timeframe="1d",
                    start=start,
                    end=end,
                )
            except DataProviderDisabledError:
                continue
            quote = _quote_from_candles(candles)
            if quote is not None:
                quotes.append(quote)
                quoted_symbols.add(_normalize_symbol_key(symbol))
                upsert_candles_for_instrument(
                    session,
                    instrument=MarketDataInstrument(
                        symbol=_candle_symbol(candles[-1]),
                        exchange=_candle_exchange(candles[-1]),
                        name=_candle_symbol(candles[-1]),
                    ),
                    candles=candles,
                )
        if quoted_symbols:
            session.commit()

    for symbol in symbols:
        if _normalize_symbol_key(symbol) in quoted_symbols:
            continue
        quote = _cached_quote_for_symbol(session=session, symbol=symbol, exchange=exchange)
        if quote is not None:
            quotes.append(quote)
            quoted_symbols.add(_normalize_symbol_key(symbol))

    fixture_adapter = CsvFixtureMarketDataAdapter()
    for symbol in symbols:
        if _normalize_symbol_key(symbol) in quoted_symbols:
            continue
        fixture_candles = fixture_adapter.get_candles(
            symbol=symbol,
            exchange=exchange,
            timeframe="1d",
        )
        quote = _quote_from_candles(fixture_candles)
        if quote is not None:
            quotes.append(quote)
            quoted_symbols.add(_normalize_symbol_key(symbol))
    return quotes


def _cached_quotes_for_symbols(
    *,
    session: Session,
    symbols: list[str],
    exchange: str,
) -> list[MarketDataQuote]:
    requested_symbols = [symbol.upper() for symbol in symbols]
    ranked_candles = (
        select(
            OhlcvCandle.id.label("candle_id"),
            func.row_number()
            .over(
                partition_by=Instrument.symbol,
                order_by=OhlcvCandle.timestamp.desc(),
            )
            .label("row_number"),
        )
        .join(Instrument)
        .where(
            Instrument.exchange == exchange.upper(),
            Instrument.symbol.in_(requested_symbols),
            OhlcvCandle.timeframe == "1d",
        )
        .subquery()
    )
    rows = session.execute(
        select(
            Instrument.symbol,
            Instrument.exchange,
            OhlcvCandle.timeframe,
            OhlcvCandle.timestamp,
            OhlcvCandle.open,
            OhlcvCandle.high,
            OhlcvCandle.low,
            OhlcvCandle.close,
            OhlcvCandle.volume,
            OhlcvCandle.source,
        )
        .join(Instrument)
        .join(ranked_candles, ranked_candles.c.candle_id == OhlcvCandle.id)
        .where(ranked_candles.c.row_number <= 2)
        .order_by(Instrument.symbol.asc(), OhlcvCandle.timestamp.asc())
    )
    candles_by_symbol: dict[str, list[MarketDataCandle]] = {}
    for row in rows:
        candles_by_symbol.setdefault(row.symbol, []).append(
            MarketDataCandle(
                symbol=row.symbol,
                exchange=row.exchange,
                timeframe=row.timeframe,
                timestamp=row.timestamp,
                open=row.open,
                high=row.high,
                low=row.low,
                close=row.close,
                volume=row.volume,
                source=row.source,
            )
        )
    return [
        quote
        for symbol in requested_symbols
        if (quote := _quote_from_candles(candles_by_symbol.get(symbol, []))) is not None
    ]


def _cached_quote_for_symbol(
    *,
    session: Session,
    symbol: str,
    exchange: str,
) -> MarketDataQuote | None:
    cached_candles = get_candles_by_symbol(
        session,
        symbol=symbol,
        exchange=exchange,
        timeframe="1d",
    )
    return _quote_from_candles(cached_candles)


def _quote_from_candles(candles: list[Any]) -> MarketDataQuote | None:
    if not candles:
        return None
    latest = candles[-1]
    previous = candles[-2] if len(candles) > 1 else latest
    latest_close = Decimal(latest.close)
    previous_close = Decimal(previous.close)
    change = latest_close - previous_close
    change_pct = Decimal("0")
    if previous_close != 0:
        change_pct = (change / previous_close) * Decimal("100")
    return MarketDataQuote(
        symbol=_candle_symbol(latest),
        exchange=_candle_exchange(latest),
        timestamp=latest.timestamp,
        open=Decimal(latest.open),
        high=Decimal(latest.high),
        low=Decimal(latest.low),
        last=latest_close,
        previous_close=previous_close,
        change=change,
        change_pct=change_pct,
        volume=Decimal(latest.volume),
        source=f"{latest.source}_cached",
    )


def _candle_symbol(candle: Any) -> str:
    instrument = getattr(candle, "instrument", None)
    if instrument is not None:
        return instrument.symbol
    return candle.symbol


def _candle_exchange(candle: Any) -> str:
    instrument = getattr(candle, "instrument", None)
    if instrument is not None:
        return instrument.exchange
    return candle.exchange


def _normalize_symbol_key(symbol: str) -> str:
    return symbol.upper().removesuffix("-EQ")


def _candle_model_to_response(candle: Any) -> CandleResponse:
    return CandleResponse(
        symbol=candle.instrument.symbol,
        exchange=candle.instrument.exchange,
        timeframe=candle.timeframe,
        timestamp=candle.timestamp,
        open=Decimal(candle.open),
        high=Decimal(candle.high),
        low=Decimal(candle.low),
        close=Decimal(candle.close),
        volume=Decimal(candle.volume),
        source=candle.source,
    )


def _date_to_datetime(value: date | None, *, boundary: Literal["start", "end"]) -> datetime | None:
    if value is None:
        return None
    day_time = time.min if boundary == "start" else time.max
    return datetime.combine(value, day_time, tzinfo=UTC)
