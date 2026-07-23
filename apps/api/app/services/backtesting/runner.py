from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from math import sqrt

from app.schemas.backtesting import (
    BacktestParameters,
    MovingAverageCrossoverParameters,
    RsiMeanReversionParameters,
    StrategyType,
)


class BacktestExecutionError(ValueError):
    pass


@dataclass(frozen=True)
class BacktestCandle:
    timestamp: datetime
    close: Decimal
    open: Decimal | None = None
    high: Decimal | None = None
    low: Decimal | None = None
    volume: Decimal | None = None


@dataclass(frozen=True)
class BacktestRunResult:
    metrics: dict[str, object]
    equity_curve: list[dict[str, object]]
    trades: list[dict[str, object]]


class VectorbtBacktestRunner:
    engine_name = "vectorbt"

    def run(
        self,
        *,
        candles: list[BacktestCandle],
        parameters: BacktestParameters,
        strategy_type: StrategyType = StrategyType.MOVING_AVERAGE_CROSSOVER,
    ) -> BacktestRunResult:
        ordered_candles = sorted(candles, key=lambda candle: candle.timestamp)
        self._validate_candles(ordered_candles, parameters)
        data_quality = _data_quality_report(ordered_candles)

        split_index = self._split_index(ordered_candles, parameters.train_fraction)
        in_sample = self._run_segment(ordered_candles[:split_index], parameters, strategy_type)
        out_of_sample = self._run_segment(ordered_candles[split_index:], parameters, strategy_type)
        full = self._run_segment(ordered_candles, parameters, strategy_type)

        return BacktestRunResult(
            metrics={
                "engine": self.engine_name,
                "strategy_type": strategy_type.value,
                "primary_window": "out_of_sample",
                "in_sample": in_sample.metrics,
                "out_of_sample": out_of_sample.metrics,
                "full": full.metrics,
                "data_quality": data_quality,
                "execution": _execution_summary(parameters),
            },
            equity_curve=full.equity_curve,
            trades=full.trades,
        )

    def _validate_candles(
        self,
        candles: list[BacktestCandle],
        parameters: BacktestParameters,
    ) -> None:
        minimum_rows = minimum_candles_for_parameters(parameters)
        if len(candles) < minimum_rows:
            raise BacktestExecutionError(
                f"at least {minimum_rows} candles are required for train/test backtesting"
            )
        if any(candle.close <= 0 for candle in candles):
            raise BacktestExecutionError("all close prices must be positive")
        if any(
            candle.high is not None
            and candle.low is not None
            and (candle.high < candle.low or candle.close > candle.high or candle.close < candle.low)
            for candle in candles
        ):
            raise BacktestExecutionError("OHLC prices must be internally consistent")

    def _split_index(self, candles: list[BacktestCandle], train_fraction: float) -> int:
        split_index = int(len(candles) * train_fraction)
        return min(max(split_index, 1), len(candles) - 1)

    def _run_segment(
        self,
        candles: list[BacktestCandle],
        parameters: BacktestParameters,
        strategy_type: StrategyType,
    ) -> BacktestRunResult:
        closes = [float(candle.close) for candle in candles]
        signals = _signals_for_strategy(closes, parameters, strategy_type)

        cash = float(parameters.initial_cash)
        shares = 0.0
        position_opened_at: dict[str, object] | None = None
        equity_curve: list[dict[str, object]] = []
        trades: list[dict[str, object]] = []

        for index, candle in enumerate(candles):
            price = closes[index]
            signal = signals[index]

            if shares == 0 and signal == "buy":
                shares, cash, entry_fee = _buy_shares(cash, price, parameters)
                position_opened_at = {
                    "entry_at": candle.timestamp.isoformat(),
                    "entry_price": round(_apply_slippage(price, parameters, "buy"), 6),
                    "entry_fee": round(entry_fee, 6),
                }

            if shares > 0 and signal == "sell":
                exit_price = _apply_slippage(price, parameters, "sell")
                cash, exit_fee = _sell_shares(cash, shares, price, parameters)
                shares = 0.0
                if position_opened_at is not None:
                    trades.append(
                        {
                            **position_opened_at,
                            "exit_at": candle.timestamp.isoformat(),
                            "exit_price": round(exit_price, 6),
                            "exit_fee": round(exit_fee, 6),
                            "return_pct": round(
                                (exit_price / float(position_opened_at["entry_price"]) - 1) * 100,
                                6,
                            ),
                        }
                    )
                position_opened_at = None

            equity = cash + shares * price
            drawdown_pct = _max_drawdown_pct(
                [float(point["equity"]) for point in equity_curve] + [equity]
            )
            equity_curve.append(
                {
                    "timestamp": candle.timestamp.isoformat(),
                    "equity": round(equity, 6),
                    "close": round(price, 6),
                    "position": "long" if shares > 0 else "flat",
                    "drawdown_pct": round(drawdown_pct, 6),
                }
            )

        if shares > 0 and position_opened_at is not None:
            final_price = closes[-1]
            exit_price = _apply_slippage(final_price, parameters, "sell")
            trades.append(
                {
                    **position_opened_at,
                    "exit_at": candles[-1].timestamp.isoformat(),
                    "exit_price": round(exit_price, 6),
                    "exit_fee": round(shares * exit_price * _fee_rate(parameters), 6),
                    "return_pct": round(
                        (exit_price / float(position_opened_at["entry_price"]) - 1) * 100,
                        6,
                    ),
                    "forced_exit": True,
                }
            )

        metrics = _calculate_metrics(candles, equity_curve, trades, float(parameters.initial_cash))
        return BacktestRunResult(metrics=metrics, equity_curve=equity_curve, trades=trades)


def _simple_moving_average(values: list[float], window: int) -> list[float | None]:
    averages: list[float | None] = []
    rolling_sum = 0.0
    for index, value in enumerate(values):
        rolling_sum += value
        if index >= window:
            rolling_sum -= values[index - window]
        if index + 1 < window:
            averages.append(None)
        else:
            averages.append(rolling_sum / window)
    return averages


def _relative_strength_index(values: list[float], window: int) -> list[float | None]:
    indexes: list[float | None] = [None]
    for index in range(1, len(values)):
        if index < window:
            indexes.append(None)
            continue
        changes = [values[item] - values[item - 1] for item in range(index - window + 1, index + 1)]
        gains = [max(change, 0.0) for change in changes]
        losses = [abs(min(change, 0.0)) for change in changes]
        average_gain = sum(gains) / window
        average_loss = sum(losses) / window
        if average_loss == 0:
            indexes.append(100.0)
        else:
            relative_strength = average_gain / average_loss
            indexes.append(100 - (100 / (1 + relative_strength)))
    return indexes


def _signals_for_strategy(
    closes: list[float],
    parameters: BacktestParameters,
    strategy_type: StrategyType,
) -> list[str | None]:
    if strategy_type == StrategyType.RSI_MEAN_REVERSION:
        assert isinstance(parameters, RsiMeanReversionParameters)
        rsi = _relative_strength_index(closes, parameters.lookback_window)
        return [
            "buy" if value is not None and value <= parameters.oversold_threshold else
            "sell" if value is not None and value >= parameters.overbought_threshold else
            None
            for value in rsi
        ]

    assert isinstance(parameters, MovingAverageCrossoverParameters)
    short_ma = _simple_moving_average(closes, parameters.short_window)
    long_ma = _simple_moving_average(closes, parameters.long_window)
    signals: list[str | None] = []
    for index, current_short in enumerate(short_ma):
        previous_short = short_ma[index - 1] if index > 0 else None
        previous_long = long_ma[index - 1] if index > 0 else None
        current_long = long_ma[index]
        if (
            previous_short is not None
            and previous_long is not None
            and current_short is not None
            and current_long is not None
            and previous_short <= previous_long
            and current_short > current_long
        ):
            signals.append("buy")
        elif (
            previous_short is not None
            and previous_long is not None
            and current_short is not None
            and current_long is not None
            and previous_short >= previous_long
            and current_short < current_long
        ):
            signals.append("sell")
        else:
            signals.append(None)
    return signals


def minimum_candles_for_parameters(parameters: BacktestParameters) -> int:
    if isinstance(parameters, RsiMeanReversionParameters):
        return (parameters.lookback_window + 1) * 2
    return (parameters.long_window + 1) * 2


def _fee_rate(parameters: BacktestParameters) -> float:
    return float(parameters.fee_bps) / 10_000


def _slippage_rate(parameters: BacktestParameters) -> float:
    return float(parameters.slippage_bps) / 10_000


def _apply_slippage(price: float, parameters: BacktestParameters, side: str) -> float:
    rate = _slippage_rate(parameters)
    return price * (1 + rate) if side == "buy" else price * (1 - rate)


def _buy_shares(cash: float, price: float, parameters: BacktestParameters) -> tuple[float, float, float]:
    allocation = cash * parameters.position_size_fraction
    fee = allocation * _fee_rate(parameters)
    effective_price = _apply_slippage(price, parameters, "buy")
    shares = max(allocation - fee, 0.0) / effective_price
    return shares, cash - allocation, fee


def _sell_shares(
    cash: float,
    shares: float,
    price: float,
    parameters: BacktestParameters,
) -> tuple[float, float]:
    proceeds = shares * _apply_slippage(price, parameters, "sell")
    fee = proceeds * _fee_rate(parameters)
    return cash + proceeds - fee, fee


def _calculate_metrics(
    candles: list[BacktestCandle],
    equity_curve: list[dict[str, object]],
    trades: list[dict[str, object]],
    initial_cash: float,
) -> dict[str, object]:
    equity_values = [float(point["equity"]) for point in equity_curve]
    final_equity = equity_values[-1]
    total_return_pct = (final_equity / initial_cash - 1) * 100
    days = max((candles[-1].timestamp.date() - candles[0].timestamp.date()).days, 1)
    cagr_pct = ((final_equity / initial_cash) ** (365 / days) - 1) * 100
    returns = [
        equity_values[index] / equity_values[index - 1] - 1
        for index in range(1, len(equity_values))
        if equity_values[index - 1] > 0
    ]

    max_drawdown_pct = _max_drawdown_pct(equity_values)
    win_rate_pct = _win_rate_pct(trades)
    benchmark_return_pct = (float(candles[-1].close) / float(candles[0].close) - 1) * 100

    return {
        "start_at": candles[0].timestamp.isoformat(),
        "end_at": candles[-1].timestamp.isoformat(),
        "initial_cash": round(initial_cash, 6),
        "final_equity": round(final_equity, 6),
        "total_return_pct": round(total_return_pct, 6),
        "cagr_pct": round(cagr_pct, 6),
        "sharpe": round(_sharpe_ratio(returns), 6),
        "max_drawdown_pct": round(max_drawdown_pct, 6),
        "benchmark_return_pct": round(benchmark_return_pct, 6),
        "win_rate_pct": round(win_rate_pct, 6),
        "number_of_trades": len(trades),
    }


def _data_quality_report(candles: list[BacktestCandle]) -> dict[str, object]:
    timestamps = [candle.timestamp for candle in candles]
    duplicate_count = len(timestamps) - len(set(timestamps))
    missing_volume_count = sum(1 for candle in candles if candle.volume is None or candle.volume <= 0)
    gap_count = 0
    if len(timestamps) >= 3:
        intervals = [
            (timestamps[index] - timestamps[index - 1]).total_seconds()
            for index in range(1, len(timestamps))
        ]
        expected_interval = sorted(intervals)[len(intervals) // 2]
        gap_count = sum(1 for interval in intervals if interval > expected_interval * 1.5)
    warnings = []
    if duplicate_count:
        warnings.append(f"{duplicate_count} duplicate candle timestamps detected")
    if gap_count:
        warnings.append(f"{gap_count} larger-than-expected candle gaps detected")
    if missing_volume_count:
        warnings.append(f"{missing_volume_count} candles have missing or zero volume")
    return {
        "observations": len(candles),
        "duplicate_timestamps": duplicate_count,
        "gap_count": gap_count,
        "missing_volume_count": missing_volume_count,
        "warnings": warnings,
    }


def _execution_summary(parameters: BacktestParameters) -> dict[str, object]:
    return {
        "initial_cash": float(parameters.initial_cash),
        "fee_bps": float(parameters.fee_bps),
        "slippage_bps": float(parameters.slippage_bps),
        "position_size_fraction": parameters.position_size_fraction,
    }


def _max_drawdown_pct(equity_values: list[float]) -> float:
    peak = equity_values[0]
    max_drawdown = 0.0
    for value in equity_values:
        peak = max(peak, value)
        drawdown = value / peak - 1
        max_drawdown = min(max_drawdown, drawdown)
    return max_drawdown * 100


def _win_rate_pct(trades: list[dict[str, object]]) -> float:
    if not trades:
        return 0.0
    wins = [trade for trade in trades if float(trade["return_pct"]) > 0]
    return len(wins) / len(trades) * 100


def _sharpe_ratio(returns: list[float]) -> float:
    if len(returns) < 2:
        return 0.0
    mean_return = sum(returns) / len(returns)
    variance = sum((value - mean_return) ** 2 for value in returns) / (len(returns) - 1)
    standard_deviation = variance**0.5
    if standard_deviation == 0:
        return 0.0
    return mean_return / standard_deviation * sqrt(252)
