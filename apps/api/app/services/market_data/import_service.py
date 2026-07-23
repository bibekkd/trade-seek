from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Instrument, OhlcvCandle
from app.services.market_data.adapters import (
    MarketDataAdapter,
    MarketDataCandle,
    MarketDataInstrument,
)


def import_market_data(adapter: MarketDataAdapter, session: Session) -> tuple[int, int]:
    instruments_imported = import_instruments(adapter, session)
    candles_imported = import_candles(adapter, session)
    return instruments_imported, candles_imported


def import_instruments(adapter: MarketDataAdapter, session: Session) -> int:
    count = 0
    for instrument_data in adapter.list_instruments():
        _upsert_instrument(session, instrument_data)
        count += 1
    session.commit()
    return count


def import_candles(
    adapter: MarketDataAdapter,
    session: Session,
    *,
    symbol: str | None = None,
    exchange: str = "NSE",
    timeframe: str = "1d",
    start: date | None = None,
    end: date | None = None,
) -> int:
    instruments = (
        [
            instrument
            for instrument in adapter.list_instruments()
            if instrument.symbol == symbol.upper()
        ]
        if symbol
        else adapter.list_instruments()
    )
    count = 0
    for instrument in instruments:
        candles = adapter.get_candles(
            symbol=instrument.symbol,
            exchange=exchange,
            timeframe=timeframe,
            start=start,
            end=end,
        )
        for candle in candles:
            db_instrument = _upsert_instrument(
                session,
                MarketDataInstrument(
                    symbol=candle.symbol,
                    exchange=candle.exchange,
                    name=instrument.name,
                    isin=instrument.isin,
                    segment=instrument.segment,
                    currency=instrument.currency,
                ),
            )
            _upsert_candle(session, db_instrument, candle)
            count += 1
    session.commit()
    return count


def upsert_candles_for_instrument(
    session: Session,
    *,
    instrument: MarketDataInstrument,
    candles: list[MarketDataCandle],
) -> int:
    db_instrument = _upsert_instrument(session, instrument)
    count = 0
    for candle in candles:
        _upsert_candle(session, db_instrument, candle)
        count += 1
    session.flush()
    return count


def list_imported_instruments(session: Session) -> list[Instrument]:
    return list(
        session.scalars(select(Instrument).order_by(Instrument.exchange.asc(), Instrument.symbol.asc()))
    )


def get_candles_by_symbol(
    session: Session,
    *,
    symbol: str,
    exchange: str = "NSE",
    timeframe: str = "1d",
    start: datetime | None = None,
    end: datetime | None = None,
) -> list[OhlcvCandle]:
    statement = (
        select(OhlcvCandle)
        .join(Instrument)
        .where(
            Instrument.symbol == symbol.upper(),
            Instrument.exchange == exchange.upper(),
            OhlcvCandle.timeframe == timeframe,
        )
        .order_by(OhlcvCandle.timestamp.asc())
    )
    if start is not None:
        statement = statement.where(OhlcvCandle.timestamp >= start)
    if end is not None:
        statement = statement.where(OhlcvCandle.timestamp <= end)

    return list(session.scalars(statement))


def _upsert_instrument(session: Session, data: MarketDataInstrument) -> Instrument:
    instrument = session.scalar(
        select(Instrument).where(
            Instrument.exchange == data.exchange.upper(),
            Instrument.symbol == data.symbol.upper(),
        )
    )
    if instrument is None:
        instrument = Instrument(
            symbol=data.symbol.upper(),
            exchange=data.exchange.upper(),
            name=data.name,
            isin=data.isin,
            segment=data.segment,
            currency=data.currency.upper(),
            is_active=True,
        )
        session.add(instrument)
        session.flush()
        return instrument

    instrument.name = data.name
    instrument.isin = data.isin
    instrument.segment = data.segment
    instrument.currency = data.currency.upper()
    instrument.is_active = True
    session.flush()
    return instrument


def _upsert_candle(session: Session, instrument: Instrument, data: MarketDataCandle) -> OhlcvCandle:
    candle = session.scalar(
        select(OhlcvCandle).where(
            OhlcvCandle.instrument_id == instrument.id,
            OhlcvCandle.timeframe == data.timeframe,
            OhlcvCandle.timestamp == data.timestamp,
        )
    )
    if candle is None:
        candle = OhlcvCandle(
            instrument_id=instrument.id,
            timeframe=data.timeframe,
            timestamp=data.timestamp,
            open=data.open,
            high=data.high,
            low=data.low,
            close=data.close,
            volume=data.volume,
            source=data.source,
        )
        session.add(candle)
        session.flush()
        return candle

    candle.open = data.open
    candle.high = data.high
    candle.low = data.low
    candle.close = data.close
    candle.volume = data.volume
    candle.source = data.source
    session.flush()
    return candle
