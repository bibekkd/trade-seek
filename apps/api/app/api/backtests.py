from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.db.session import get_session
from app.models import BacktestRun, Instrument, StrategyDefinition
from app.schemas.backtests import BacktestCreateRequest, BacktestRunResponse
from app.services.backtesting import VectorbtBacktestRunner, minimum_candles_for_parameters
from app.services.market_data import (
    CsvFixtureMarketDataAdapter,
    DataProviderDisabledError,
    FyersHistoricalAdapter,
    get_candles_by_symbol,
    upsert_candles_for_instrument,
)
from app.services.market_data.adapters import MarketDataInstrument

router = APIRouter(tags=["backtests"])


@router.post("/backtests", response_model=BacktestRunResponse)
def create_backtest(
    request: BacktestCreateRequest,
    session: Session = Depends(get_session),
) -> BacktestRunResponse:
    strategy = _create_strategy_definition(request, session)
    instrument = _resolve_instrument(request, session)
    _preload_provider_candles(request, instrument, session)
    run = BacktestRun(
        strategy_definition_id=strategy.id,
        instrument_id=instrument.id,
        timeframe=request.timeframe,
        start_at=request.start_at,
        end_at=request.end_at,
        data_provider=request.provider,
        status="queued",
        engine=VectorbtBacktestRunner.engine_name,
    )
    session.add(run)
    session.flush()
    session.commit()
    session.refresh(run)
    try:
        enqueue_backtest(run.id)
    except Exception as exc:
        run.status = "failed"
        run.error_message = "Backtest queue unavailable. Start Redis and the Celery worker, then retry."
        run.completed_at = _utc_now()
        session.commit()
        raise HTTPException(status_code=503, detail=run.error_message) from exc

    return _run_to_response(run)


def _preload_provider_candles(
    request: BacktestCreateRequest,
    instrument: Instrument,
    session: Session,
) -> None:
    if request.provider != "fyers":
        return

    adapter = _fyers_adapter()
    try:
        candles = adapter.get_candles(
            symbol=instrument.symbol,
            exchange=instrument.exchange,
            timeframe=request.timeframe,
            start=request.start_at.date(),
            end=request.end_at.date(),
        )
    except DataProviderDisabledError as exc:
        cached_candles = _cached_candles_for_backtest(request, instrument, session)
        if len(cached_candles) >= _minimum_candles_for_strategy(request):
            return
        raise HTTPException(
            status_code=503,
            detail=(
                f"{exc}. No cached {instrument.symbol} candles are available for this "
                "backtest window. Refresh the FYERS access token or load this symbol's "
                "historical data before running the comparison."
            ),
        ) from exc

    if not candles:
        cached_candles = _cached_candles_for_backtest(request, instrument, session)
        if len(cached_candles) >= _minimum_candles_for_strategy(request):
            return
        raise HTTPException(
            status_code=422,
            detail=(
                f"No FYERS candles found for {instrument.symbol} from "
                f"{request.start_at.date()} to {request.end_at.date()}. "
                "Choose a date range with available market data before running the backtest."
            ),
        )

    required_candles = _minimum_candles_for_strategy(request)
    if len(candles) < required_candles:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Only {len(candles)} FYERS candles found for {instrument.symbol}; "
                f"this strategy requires at least {required_candles}. "
                "Choose a longer date range or smaller moving-average windows."
            ),
        )

    upsert_candles_for_instrument(
        session,
        instrument=_instrument_to_market_data(instrument),
        candles=candles,
    )


def _fyers_adapter() -> FyersHistoricalAdapter:
    return FyersHistoricalAdapter(
        app_id=settings.fyers_app_id,
        access_token=settings.fyers_access_token,
        data_base_url=settings.fyers_data_base_url,
        symbol_master_url=settings.fyers_symbol_master_url,
    )


def _instrument_to_market_data(instrument: Instrument) -> MarketDataInstrument:
    return MarketDataInstrument(
        symbol=instrument.symbol,
        exchange=instrument.exchange,
        name=instrument.name,
        isin=instrument.isin,
        segment=instrument.segment,
        currency=instrument.currency,
    )


def _minimum_candles_for_strategy(request: BacktestCreateRequest) -> int:
    return minimum_candles_for_parameters(request.strategy.parameters)


def _cached_candles_for_backtest(
    request: BacktestCreateRequest,
    instrument: Instrument,
    session: Session,
) -> list:
    return get_candles_by_symbol(
        session,
        symbol=instrument.symbol,
        exchange=instrument.exchange,
        timeframe=request.timeframe,
        start=request.start_at,
        end=request.end_at,
    )


@router.get("/backtests/{backtest_id}", response_model=BacktestRunResponse)
def get_backtest(
    backtest_id: UUID,
    session: Session = Depends(get_session),
) -> BacktestRunResponse:
    run = session.scalar(
        select(BacktestRun)
        .options(
            selectinload(BacktestRun.instrument),
            selectinload(BacktestRun.strategy_definition),
            selectinload(BacktestRun.result),
        )
        .where(BacktestRun.id == backtest_id)
    )
    if run is None:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return _run_to_response(run)


def _create_strategy_definition(
    request: BacktestCreateRequest,
    session: Session,
) -> StrategyDefinition:
    strategy = StrategyDefinition(
        name=f"{request.symbol.upper()} moving-average crossover",
        strategy_type=request.strategy.strategy_type.value,
        parameters=request.strategy.parameters.model_dump(mode="json"),
        created_by="user",
    )
    session.add(strategy)
    session.flush()
    return strategy


def _resolve_instrument(request: BacktestCreateRequest, session: Session) -> Instrument:
    instrument = session.scalar(
        select(Instrument).where(
            Instrument.symbol == request.symbol.upper(),
            Instrument.exchange == request.exchange.upper(),
        )
    )
    if instrument is not None:
        return instrument

    if request.provider == "fixture":
        fixture_instrument = _fixture_instrument(request)
        instrument = Instrument(
            symbol=fixture_instrument.symbol,
            exchange=fixture_instrument.exchange,
            name=fixture_instrument.name,
            isin=fixture_instrument.isin,
            segment=fixture_instrument.segment,
            currency=fixture_instrument.currency,
            is_active=True,
        )
        session.add(instrument)
        session.flush()
        return instrument

    if request.provider == "fyers":
        instrument = Instrument(
            symbol=request.symbol.upper(),
            exchange=request.exchange.upper(),
            name=request.symbol.upper(),
            isin=None,
            segment="equity",
            currency="INR",
            is_active=True,
        )
        session.add(instrument)
        session.flush()
        return instrument

    raise HTTPException(
        status_code=404,
        detail=f"Instrument not found: {request.symbol.upper()}",
    )


def _fixture_instrument(request: BacktestCreateRequest) -> MarketDataInstrument:
    adapter = CsvFixtureMarketDataAdapter()
    for instrument in adapter.list_instruments():
        if (
            instrument.symbol == request.symbol.upper()
            and instrument.exchange == request.exchange.upper()
        ):
            return instrument
    raise HTTPException(
        status_code=404,
        detail=f"Instrument not found: {request.symbol.upper()}",
    )


def _run_to_response(run: BacktestRun) -> BacktestRunResponse:
    result = run.result
    return BacktestRunResponse(
        id=run.id,
        status=run.status,
        engine=run.engine,
        symbol=run.instrument.symbol,
        exchange=run.instrument.exchange,
        timeframe=run.timeframe,
        provider=run.data_provider,
        start_at=run.start_at,
        end_at=run.end_at,
        strategy_type=run.strategy_definition.strategy_type,
        parameters=run.strategy_definition.parameters,
        metrics=result.metrics if result else None,
        equity_curve=result.equity_curve if result else None,
        trades=result.trades if result else None,
        error_message=run.error_message,
    )


def enqueue_backtest(backtest_id: UUID) -> None:
    from app.tasks.backtests import run_backtest_task

    run_backtest_task.delay(str(backtest_id))


def _utc_now() -> datetime:
    return datetime.now(UTC)
