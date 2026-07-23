from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class InstrumentResponse(BaseModel):
    symbol: str
    exchange: str
    name: str
    isin: str | None = None
    segment: str
    currency: str
    is_active: bool = True


class CandleResponse(BaseModel):
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


class QuoteResponse(BaseModel):
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
