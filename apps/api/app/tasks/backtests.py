from __future__ import annotations

import logging
from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from celery import Task
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.celery_app import celery_app
from app.db.session import SessionLocal
from app.models import BacktestResult, BacktestRun
from app.schemas.backtesting import BacktestStrategyInput, StrategyType
from app.core.config import settings
from app.services.backtesting import BacktestCandle, VectorbtBacktestRunner
from app.services.market_data import (
    CsvFixtureMarketDataAdapter,
    DataProviderDisabledError,
    FyersHistoricalAdapter,
    get_candles_by_symbol,
)

logger = logging.getLogger(__name__)


class BacktestTask(Task):
    pass


@celery_app.task(bind=True, base=BacktestTask, name="backtests.run")
def run_backtest_task(self: BacktestTask, backtest_id: str) -> str:
    session = SessionLocal()
    run: BacktestRun | None = None
    try:
        run = session.scalar(
            select(BacktestRun)
            .options(
                selectinload(BacktestRun.instrument),
                selectinload(BacktestRun.strategy_definition),
            )
            .where(BacktestRun.id == UUID(backtest_id))
        )
        if run is None:
            return backtest_id

        run.status = "running"
        session.commit()
        self.update_state(state="STARTED", meta={"backtest_id": backtest_id})

        strategy = BacktestStrategyInput.model_validate(
            {
                "strategy_type": run.strategy_definition.strategy_type,
                "parameters": run.strategy_definition.parameters,
            }
        )
        logger.info(
            "backtest data request symbol=%s exchange=%s provider=%s timeframe=%s start=%s end=%s",
            run.instrument.symbol,
            run.instrument.exchange,
            run.data_provider,
            run.timeframe,
            run.start_at.date(),
            run.end_at.date(),
        )
        candles = _load_candles(run, session)
        logger.info("backtest data received symbol=%s candles=%d", run.instrument.symbol, len(candles))
        result = VectorbtBacktestRunner().run(
            candles=candles,
            parameters=strategy.parameters,
            strategy_type=strategy.strategy_type,
        )

        run.status = "completed"
        run.completed_at = _utc_now()
        session.add(
            BacktestResult(
                backtest_run_id=run.id,
                metrics=result.metrics,
                equity_curve=result.equity_curve,
                trades=result.trades,
            )
        )
        session.commit()
        return backtest_id
    except Exception as exc:
        session.rollback()
        logger.exception("backtest task failed backtest_id=%s", backtest_id)
        run = session.get(BacktestRun, UUID(backtest_id))
        if run is not None:
            run.status = "failed"
            run.error_message = str(exc)
            run.completed_at = _utc_now()
            session.commit()
        raise
    finally:
        session.close()


def _load_candles(run: BacktestRun, session: Session) -> list[BacktestCandle]:
    if run.strategy_definition.strategy_type not in {item.value for item in StrategyType}:
        raise ValueError("Unsupported strategy type")

    if run.data_provider == "fixture":
        candles = CsvFixtureMarketDataAdapter().get_candles(
            symbol=run.instrument.symbol,
            exchange=run.instrument.exchange,
            timeframe=run.timeframe,
            start=run.start_at.date(),
            end=run.end_at.date(),
        )
    elif run.data_provider == "fyers":
        try:
            candles = FyersHistoricalAdapter(
                app_id=settings.fyers_app_id,
                access_token=settings.fyers_access_token,
                data_base_url=settings.fyers_data_base_url,
                symbol_master_url=settings.fyers_symbol_master_url,
            ).get_candles(
                symbol=run.instrument.symbol,
                exchange=run.instrument.exchange,
                timeframe=run.timeframe,
                start=run.start_at.date(),
                end=run.end_at.date(),
            )
        except DataProviderDisabledError as exc:
            logger.warning(
                "fyers unavailable for symbol=%s; falling back to cached database candles: %s",
                run.instrument.symbol,
                exc,
            )
            candles = []
        if not candles:
            candles = get_candles_by_symbol(
                session,
                symbol=run.instrument.symbol,
                exchange=run.instrument.exchange,
                timeframe=run.timeframe,
                start=run.start_at,
                end=run.end_at,
            )
    else:
        candles = get_candles_by_symbol(
            session,
            symbol=run.instrument.symbol,
            exchange=run.instrument.exchange,
            timeframe=run.timeframe,
            start=run.start_at,
            end=run.end_at,
        )

    if not candles:
        raise ValueError(
            f"No candles found for {run.instrument.symbol} from "
            f"{run.start_at.date()} to {run.end_at.date()} using {run.data_provider}. "
            "Choose a date range with available market data or verify the provider credentials."
        )
    return [
        BacktestCandle(
            timestamp=candle.timestamp,
            open=Decimal(candle.open) if candle.open is not None else None,
            high=Decimal(candle.high) if candle.high is not None else None,
            low=Decimal(candle.low) if candle.low is not None else None,
            close=Decimal(candle.close),
            volume=Decimal(candle.volume) if candle.volume is not None else None,
        )
        for candle in candles
    ]


def _utc_now() -> datetime:
    return datetime.now(UTC)
