from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any

from app.services.market_data import MarketDataAdapter, MarketDataCandle
from app.services.news import NewsProvider, summarize_news


def build_market_context(
    adapter: MarketDataAdapter,
    *,
    symbol: str,
    exchange: str,
    timeframe: str,
    start: date,
    end: date,
    max_candles: int = 90,
) -> dict[str, Any]:
    candles = adapter.get_candles(
        symbol=symbol,
        exchange=exchange,
        timeframe=timeframe,
        start=start,
        end=end,
    )
    if not candles:
        raise ValueError(f"No market candles available for {exchange}:{symbol} in the requested window")

    ordered = sorted(candles, key=lambda candle: candle.timestamp)
    closes = [candle.close for candle in ordered]
    returns = [
        (current - previous) / previous
        for previous, current in zip(closes, closes[1:])
        if previous != 0
    ]
    high = max(candle.high for candle in ordered)
    low = min(candle.low for candle in ordered)
    first_close = closes[0]
    last_close = closes[-1]
    total_return = ((last_close - first_close) / first_close) if first_close else Decimal("0")
    average_volume = sum((candle.volume for candle in ordered), Decimal("0")) / len(ordered)
    volatility = _standard_deviation(returns)

    return {
        "source": adapter.provider_name,
        "symbol": symbol.upper(),
        "exchange": exchange.upper(),
        "timeframe": timeframe,
        "window": {"start": start.isoformat(), "end": end.isoformat()},
        "observations": len(ordered),
        "features": {
            "first_close": _number(first_close),
            "last_close": _number(last_close),
            "period_return_pct": _number(total_return * 100),
            "period_high": _number(high),
            "period_low": _number(low),
            "average_volume": _number(average_volume),
            "daily_return_volatility_pct": _number(volatility * 100),
        },
        "candles": [_candle_context(candle) for candle in ordered[-max_candles:]],
    }


def build_news_context(
    provider: NewsProvider,
    *,
    symbol: str,
    start: date,
    end: date,
    max_articles: int = 10,
) -> dict[str, Any]:
    articles = provider.search(symbol=symbol, start=start, end=end, limit=max_articles)
    return {"source": provider.name, **summarize_news(articles)}


def _candle_context(candle: MarketDataCandle) -> dict[str, Any]:
    return {
        "date": candle.timestamp.date().isoformat(),
        "open": _number(candle.open),
        "high": _number(candle.high),
        "low": _number(candle.low),
        "close": _number(candle.close),
        "volume": _number(candle.volume),
    }


def _standard_deviation(values: list[Decimal]) -> Decimal:
    if len(values) < 2:
        return Decimal("0")
    mean = sum(values, Decimal("0")) / len(values)
    variance = sum(((value - mean) ** 2 for value in values), Decimal("0")) / len(values)
    return variance.sqrt()


def _number(value: Decimal) -> float:
    return float(value)
