from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.schemas.backtests import BacktestDataProvider


class ResearchStrategyRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=4000)
    symbol: str = Field(min_length=1, max_length=32)
    exchange: str = Field(default="NSE", min_length=1, max_length=12)
    timeframe: str = Field(default="1d", min_length=1, max_length=12)
    provider: BacktestDataProvider = "fixture"
    start_at: datetime
    end_at: datetime
    run_backtest: bool = True

    @model_validator(mode="after")
    def validate_date_range(self) -> "ResearchStrategyRequest":
        if self.end_at <= self.start_at:
            raise ValueError("end_at must be after start_at")
        return self


class ResearchRunResponse(BaseModel):
    id: UUID
    created_at: datetime
    status: str
    symbol: str
    exchange: str
    timeframe: str
    provider: str
    start_at: datetime
    end_at: datetime
    prompt: str
    strategy_proposal: dict | None = None
    ai_request_log_id: UUID | None = None
    backtest_run_id: UUID | None = None
    error_message: str | None = None
    ai_provider: str | None = None
    ai_model: str | None = None
