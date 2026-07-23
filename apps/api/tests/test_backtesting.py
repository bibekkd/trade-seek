from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas.backtesting import MovingAverageCrossoverParameters, RsiMeanReversionParameters, StrategyType
from app.services.backtesting import BacktestCandle, BacktestExecutionError, VectorbtBacktestRunner


def test_moving_average_parameters_reject_invalid_windows() -> None:
    with pytest.raises(ValidationError, match="long_window must be greater"):
        MovingAverageCrossoverParameters(short_window=5, long_window=5)


def test_vectorbt_runner_produces_deterministic_moving_average_result() -> None:
    runner = VectorbtBacktestRunner()
    parameters = MovingAverageCrossoverParameters(
        short_window=2,
        long_window=3,
        initial_cash=Decimal("1000"),
        train_fraction=0.5,
    )

    result = runner.run(candles=_sample_candles(), parameters=parameters)

    assert result.metrics["engine"] == "vectorbt"
    assert result.metrics["primary_window"] == "out_of_sample"
    assert result.metrics["full"]["final_equity"] == 1384.615385
    assert result.metrics["full"]["total_return_pct"] == pytest.approx(38.461538)
    assert result.metrics["full"]["number_of_trades"] == 2
    assert result.metrics["out_of_sample"]["number_of_trades"] == 1
    assert result.trades[0]["entry_price"] == 10.0
    assert result.trades[0]["exit_price"] == 12.0
    assert result.trades[-1]["forced_exit"] is True
    assert result.equity_curve[-1]["equity"] == 1384.615385


def test_vectorbt_runner_rejects_too_little_data() -> None:
    runner = VectorbtBacktestRunner()
    parameters = MovingAverageCrossoverParameters(short_window=2, long_window=3)

    with pytest.raises(BacktestExecutionError, match="at least 8 candles"):
        runner.run(candles=_sample_candles()[:7], parameters=parameters)


def test_vectorbt_runner_rejects_non_positive_close() -> None:
    runner = VectorbtBacktestRunner()
    parameters = MovingAverageCrossoverParameters(short_window=2, long_window=3)
    candles = _sample_candles()
    candles[3] = BacktestCandle(timestamp=candles[3].timestamp, close=Decimal("0"))

    with pytest.raises(BacktestExecutionError, match="close prices must be positive"):
        runner.run(candles=candles, parameters=parameters)


def test_vectorbt_runner_supports_rsi_with_execution_costs_and_data_quality() -> None:
    runner = VectorbtBacktestRunner()
    parameters = RsiMeanReversionParameters(
        lookback_window=3,
        oversold_threshold=35,
        overbought_threshold=65,
        initial_cash=Decimal("1000"),
        train_fraction=0.5,
        fee_bps=Decimal("10"),
        slippage_bps=Decimal("5"),
        position_size_fraction=Decimal("0.5"),
    )
    candles = _sample_candles()
    candles[5] = BacktestCandle(
        timestamp=candles[5].timestamp,
        close=candles[5].close,
        open=candles[5].close,
        high=candles[5].close,
        low=candles[5].close,
        volume=Decimal("0"),
    )

    result = runner.run(
        candles=candles,
        parameters=parameters,
        strategy_type=StrategyType.RSI_MEAN_REVERSION,
    )

    assert result.metrics["strategy_type"] == "rsi_mean_reversion"
    assert result.metrics["execution"]["fee_bps"] == 10.0
    assert result.metrics["execution"]["position_size_fraction"] == 0.5
    assert result.metrics["data_quality"]["missing_volume_count"] == 14
    assert "benchmark_return_pct" in result.metrics["full"]
    assert "drawdown_pct" in result.equity_curve[-1]


def _sample_candles() -> list[BacktestCandle]:
    start = datetime(2024, 1, 1, tzinfo=UTC)
    closes = [
        "10",
        "9",
        "8",
        "9",
        "10",
        "12",
        "14",
        "13",
        "12",
        "11",
        "12",
        "13",
        "14",
        "15",
    ]
    return [
        BacktestCandle(timestamp=start + timedelta(days=index), close=Decimal(close))
        for index, close in enumerate(closes)
    ]
