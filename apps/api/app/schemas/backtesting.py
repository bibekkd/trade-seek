from decimal import Decimal
from enum import StrEnum

from typing import Union

from pydantic import BaseModel, Field, model_validator


class StrategyType(StrEnum):
    MOVING_AVERAGE_CROSSOVER = "moving_average_crossover"
    RSI_MEAN_REVERSION = "rsi_mean_reversion"


class ExecutionCostParameters(BaseModel):
    initial_cash: Decimal = Field(default=Decimal("100000"), gt=0)
    train_fraction: float = Field(default=0.7, gt=0.1, lt=0.9)
    fee_bps: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    slippage_bps: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    position_size_fraction: float = Field(default=1.0, gt=0, le=1.0)


class MovingAverageCrossoverParameters(ExecutionCostParameters):
    short_window: int = Field(ge=2, le=200)
    long_window: int = Field(ge=3, le=400)

    @model_validator(mode="after")
    def validate_windows(self) -> "MovingAverageCrossoverParameters":
        if self.long_window <= self.short_window:
            raise ValueError("long_window must be greater than short_window")
        return self


class RsiMeanReversionParameters(ExecutionCostParameters):
    lookback_window: int = Field(default=14, ge=2, le=100)
    oversold_threshold: float = Field(default=30, gt=0, lt=50)
    overbought_threshold: float = Field(default=70, gt=50, lt=100)

    @model_validator(mode="after")
    def validate_thresholds(self) -> "RsiMeanReversionParameters":
        if self.oversold_threshold >= self.overbought_threshold:
            raise ValueError("oversold_threshold must be below overbought_threshold")
        return self


BacktestParameters = Union[MovingAverageCrossoverParameters, RsiMeanReversionParameters]


class BacktestStrategyInput(BaseModel):
    strategy_type: StrategyType
    parameters: BacktestParameters

    @model_validator(mode="before")
    @classmethod
    def validate_parameters_for_strategy(cls, data: object) -> object:
        if not isinstance(data, dict):
            return data
        data = dict(data)
        strategy_type = data.get("strategy_type")
        parameters = data.get("parameters", {})
        if strategy_type == StrategyType.RSI_MEAN_REVERSION.value:
            data["parameters"] = RsiMeanReversionParameters.model_validate(parameters)
        elif strategy_type == StrategyType.MOVING_AVERAGE_CROSSOVER.value:
            data["parameters"] = MovingAverageCrossoverParameters.model_validate(parameters)
        return data
