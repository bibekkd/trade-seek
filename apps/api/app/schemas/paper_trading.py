from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class PaperAccountCreateRequest(BaseModel):
    name: str = Field(default="Local paper account", min_length=1, max_length=120)
    initial_cash: Decimal = Field(default=Decimal("100000"), gt=0)


class PaperOrderCreateRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=32)
    exchange: str = Field(default="NSE", min_length=1, max_length=12)
    side: Literal["buy", "sell"]
    quantity: Decimal = Field(gt=0)
    provider: Literal["fixture", "database", "fyers"] = "fixture"


class PaperStrategyStartRequest(BaseModel):
    account_id: UUID
    backtest_run_id: UUID
    max_position_value: Decimal = Field(default=Decimal("25000"), gt=0)


class PaperOrderResponse(BaseModel):
    id: UUID
    account_id: UUID
    symbol: str
    exchange: str
    side: str
    order_type: str
    quantity: Decimal
    status: str
    requested_price: Decimal
    filled_price: Decimal | None
    filled_at: datetime | None
    rejection_reason: str | None
    created_at: datetime


class PaperPositionResponse(BaseModel):
    symbol: str
    exchange: str
    quantity: Decimal
    average_price: Decimal
    market_price: Decimal | None = None
    market_value: Decimal | None = None
    unrealized_pnl: Decimal | None = None


class PaperStrategyRunResponse(BaseModel):
    id: UUID
    account_id: UUID
    backtest_run_id: UUID
    status: str
    max_position_value: Decimal
    last_signal: str | None
    created_at: datetime


class PaperAccountResponse(BaseModel):
    id: UUID
    name: str
    initial_cash: Decimal
    cash: Decimal
    status: str
    kill_switch_enabled: bool
    portfolio_equity: Decimal
    positions: list[PaperPositionResponse]
    orders: list[PaperOrderResponse]
    strategy_runs: list[PaperStrategyRunResponse]
    created_at: datetime
