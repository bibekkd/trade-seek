from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class Exchange(StrEnum):
    NSE = "NSE"
    BSE = "BSE"


class BacktestStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AIRequestStatus(StrEnum):
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class InstrumentCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    symbol: str = Field(min_length=1, max_length=32)
    exchange: Exchange
    name: str = Field(min_length=1, max_length=255)
    isin: str | None = Field(default=None, min_length=12, max_length=12)
    segment: str = Field(default="equity", min_length=1, max_length=32)
    currency: str = Field(default="INR", min_length=3, max_length=3)

    @field_validator("symbol", "currency", mode="after")
    @classmethod
    def uppercase_codes(cls, value: str) -> str:
        return value.upper()

    @field_validator("currency")
    @classmethod
    def only_inr(cls, value: str) -> str:
        if value != "INR":
            raise ValueError("MVP supports INR instruments only")
        return value


class OhlcvCandleCreate(BaseModel):
    timeframe: str = Field(min_length=1, max_length=12)
    timestamp: datetime
    open: Decimal = Field(ge=0)
    high: Decimal = Field(ge=0)
    low: Decimal = Field(ge=0)
    close: Decimal = Field(ge=0)
    volume: Decimal = Field(ge=0)
    source: str = Field(min_length=1, max_length=64)

    @model_validator(mode="after")
    def validate_price_range(self) -> "OhlcvCandleCreate":
        if self.high < self.low:
            raise ValueError("high must be greater than or equal to low")
        return self


class StrategyDefinitionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    strategy_type: str = Field(min_length=1, max_length=64)
    parameters: dict = Field(default_factory=dict)
    created_by: str = Field(min_length=1, max_length=24)


class BacktestRunCreate(BaseModel):
    timeframe: str = Field(min_length=1, max_length=12)
    start_at: datetime
    end_at: datetime
    status: BacktestStatus = BacktestStatus.QUEUED
    engine: str = Field(default="vectorbt", min_length=1, max_length=32)

    @model_validator(mode="after")
    def validate_time_range(self) -> "BacktestRunCreate":
        if self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self


class BacktestResultCreate(BaseModel):
    metrics: dict = Field(default_factory=dict)
    equity_curve: list | None = None
    trades: list | None = None


class AIRequestLogCreate(BaseModel):
    task: str = Field(min_length=1, max_length=64)
    provider: str = Field(min_length=1, max_length=64)
    prompt: str = Field(min_length=1)
    response: dict | None = None
    status: AIRequestStatus
    error_message: str | None = None

