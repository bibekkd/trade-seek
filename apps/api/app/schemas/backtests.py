from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.schemas.backtesting import BacktestStrategyInput


BacktestDataProvider = Literal["fixture", "database", "fyers"]


class BacktestCreateRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=32)
    exchange: str = Field(default="NSE", min_length=1, max_length=12)
    timeframe: str = Field(default="1d", min_length=1, max_length=12)
    provider: BacktestDataProvider = "fixture"
    start_at: datetime
    end_at: datetime
    strategy: BacktestStrategyInput

    @model_validator(mode="after")
    def validate_date_range(self) -> "BacktestCreateRequest":
        if self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self


class BacktestRunResponse(BaseModel):
    id: UUID
    status: str
    engine: str
    symbol: str
    exchange: str
    timeframe: str
    provider: str
    start_at: datetime
    end_at: datetime
    strategy_type: str
    parameters: dict
    metrics: dict | None = None
    equity_curve: list | None = None
    trades: list | None = None
    error_message: str | None = None
