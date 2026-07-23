from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.market_data import _adapter_for_provider
from app.db.session import get_session
from app.models import BacktestRun, Instrument, PaperAccount, PaperOrder, PaperPosition, PaperStrategyRun
from app.schemas.paper_trading import (
    PaperAccountCreateRequest,
    PaperAccountResponse,
    PaperOrderCreateRequest,
    PaperOrderResponse,
    PaperPositionResponse,
    PaperStrategyRunResponse,
    PaperStrategyStartRequest,
)
from app.services.market_data import DataProviderDisabledError, get_candles_by_symbol

router = APIRouter(tags=["paper-trading"])


@router.post("/paper/accounts", response_model=PaperAccountResponse)
def create_paper_account(
    request: PaperAccountCreateRequest,
    session: Session = Depends(get_session),
) -> PaperAccountResponse:
    account = PaperAccount(
        name=request.name,
        initial_cash=request.initial_cash,
        cash=request.initial_cash,
        status="active",
        kill_switch_enabled=False,
    )
    session.add(account)
    session.commit()
    session.refresh(account)
    return _account_to_response(account)


@router.get("/paper/accounts/{account_id}", response_model=PaperAccountResponse)
def get_paper_account(
    account_id: UUID,
    session: Session = Depends(get_session),
) -> PaperAccountResponse:
    return _account_to_response(_load_account(account_id, session))


@router.post("/paper/accounts/{account_id}/orders", response_model=PaperOrderResponse)
def place_paper_order(
    account_id: UUID,
    request: PaperOrderCreateRequest,
    session: Session = Depends(get_session),
) -> PaperOrderResponse:
    account = _load_account(account_id, session)
    instrument = _resolve_or_create_instrument(request.symbol, request.exchange, session)
    price = _latest_market_price(
        symbol=instrument.symbol,
        exchange=instrument.exchange,
        provider=request.provider,
        session=session,
    )

    order = _execute_market_order(
        account=account,
        instrument=instrument,
        side=request.side,
        quantity=request.quantity,
        price=price,
        session=session,
    )
    session.commit()
    session.refresh(order)
    return _order_to_response(order)


@router.post("/paper/strategy-runs", response_model=PaperStrategyRunResponse)
def start_paper_strategy_run(
    request: PaperStrategyStartRequest,
    session: Session = Depends(get_session),
) -> PaperStrategyRunResponse:
    account = _load_account(request.account_id, session)
    if account.kill_switch_enabled or account.status != "active":
        raise HTTPException(status_code=423, detail="Paper account is not accepting new strategy runs")

    backtest = session.scalar(
        select(BacktestRun)
        .options(selectinload(BacktestRun.strategy_definition), selectinload(BacktestRun.instrument))
        .where(BacktestRun.id == request.backtest_run_id)
    )
    if backtest is None:
        raise HTTPException(status_code=404, detail="Backtest not found")
    if backtest.status != "completed":
        raise HTTPException(status_code=422, detail="Only completed backtests can be started in paper mode")

    existing = session.scalar(
        select(PaperStrategyRun).where(
            PaperStrategyRun.account_id == account.id,
            PaperStrategyRun.backtest_run_id == backtest.id,
            PaperStrategyRun.status == "active",
        )
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="This backtest is already running in paper mode")

    strategy_run = PaperStrategyRun(
        account_id=account.id,
        backtest_run_id=backtest.id,
        status="active",
        max_position_value=request.max_position_value,
        last_signal="started_from_completed_backtest",
    )
    session.add(strategy_run)
    session.commit()
    session.refresh(strategy_run)
    return _strategy_run_to_response(strategy_run)


def _load_account(account_id: UUID, session: Session) -> PaperAccount:
    account = session.scalar(
        select(PaperAccount)
        .options(
            selectinload(PaperAccount.orders).selectinload(PaperOrder.instrument),
            selectinload(PaperAccount.positions).selectinload(PaperPosition.instrument),
            selectinload(PaperAccount.strategy_runs),
        )
        .where(PaperAccount.id == account_id)
    )
    if account is None:
        raise HTTPException(status_code=404, detail="Paper account not found")
    return account


def _resolve_or_create_instrument(symbol: str, exchange: str, session: Session) -> Instrument:
    normalized_symbol = symbol.upper()
    normalized_exchange = exchange.upper()
    instrument = session.scalar(
        select(Instrument).where(
            Instrument.symbol == normalized_symbol,
            Instrument.exchange == normalized_exchange,
        )
    )
    if instrument is not None:
        return instrument
    instrument = Instrument(
        symbol=normalized_symbol,
        exchange=normalized_exchange,
        name=normalized_symbol,
        segment="equity",
        currency="INR",
        is_active=True,
    )
    session.add(instrument)
    session.flush()
    return instrument


def _latest_market_price(*, symbol: str, exchange: str, provider: str, session: Session) -> Decimal:
    if provider == "database":
        candles = get_candles_by_symbol(
            session,
            symbol=symbol,
            exchange=exchange,
            timeframe="1d",
            start=datetime(1970, 1, 1, tzinfo=UTC),
            end=datetime.now(UTC),
        )
    else:
        start = date(2000, 1, 1) if provider == "fixture" else date.today() - timedelta(days=90)
        try:
            candles = _adapter_for_provider(provider).get_candles(
                symbol=symbol,
                exchange=exchange,
                timeframe="1d",
                start=start,
                end=date.today(),
            )
        except DataProviderDisabledError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not candles:
        raise HTTPException(status_code=422, detail=f"No market price available for {symbol}")
    return Decimal(candles[-1].close)


def _execute_market_order(
    *,
    account: PaperAccount,
    instrument: Instrument,
    side: str,
    quantity: Decimal,
    price: Decimal,
    session: Session,
) -> PaperOrder:
    order = PaperOrder(
        account_id=account.id,
        instrument_id=instrument.id,
        side=side,
        order_type="market",
        quantity=quantity,
        status="rejected",
        requested_price=price,
    )
    if account.kill_switch_enabled or account.status != "active":
        order.rejection_reason = "Paper account kill switch is enabled"
        session.add(order)
        return order

    position = _position_for(account, instrument, session)
    notional = quantity * price
    if side == "buy":
        if notional > account.cash:
            order.rejection_reason = "Insufficient paper cash"
            session.add(order)
            return order
        new_quantity = position.quantity + quantity
        position.average_price = (
            ((position.quantity * position.average_price) + notional) / new_quantity
            if new_quantity > 0
            else Decimal("0")
        )
        position.quantity = new_quantity
        account.cash -= notional
    else:
        if quantity > position.quantity:
            order.rejection_reason = "Insufficient paper position quantity"
            session.add(order)
            return order
        account.cash += notional
        position.quantity -= quantity
        if position.quantity == 0:
            position.average_price = Decimal("0")

    order.status = "filled"
    order.filled_price = price
    order.filled_at = datetime.now(UTC)
    session.add_all([position, order])
    return order


def _position_for(account: PaperAccount, instrument: Instrument, session: Session) -> PaperPosition:
    position = session.scalar(
        select(PaperPosition).where(
            PaperPosition.account_id == account.id,
            PaperPosition.instrument_id == instrument.id,
        )
    )
    if position is not None:
        return position
    position = PaperPosition(
        account_id=account.id,
        instrument_id=instrument.id,
        quantity=Decimal("0"),
        average_price=Decimal("0"),
    )
    session.add(position)
    session.flush()
    return position


def _account_to_response(account: PaperAccount) -> PaperAccountResponse:
    positions = [_position_to_response(position) for position in account.positions]
    portfolio_equity = account.cash + sum((position.market_value or Decimal("0")) for position in positions)
    return PaperAccountResponse(
        id=account.id,
        name=account.name,
        initial_cash=account.initial_cash,
        cash=account.cash,
        status=account.status,
        kill_switch_enabled=account.kill_switch_enabled,
        portfolio_equity=portfolio_equity,
        positions=positions,
        orders=[_order_to_response(order) for order in account.orders],
        strategy_runs=[_strategy_run_to_response(run) for run in account.strategy_runs],
        created_at=account.created_at,
    )


def _position_to_response(position: PaperPosition) -> PaperPositionResponse:
    market_price = position.average_price if position.quantity > 0 else None
    market_value = position.quantity * market_price if market_price is not None else Decimal("0")
    unrealized_pnl = (market_price - position.average_price) * position.quantity if market_price is not None else Decimal("0")
    return PaperPositionResponse(
        symbol=position.instrument.symbol,
        exchange=position.instrument.exchange,
        quantity=position.quantity,
        average_price=position.average_price,
        market_price=market_price,
        market_value=market_value,
        unrealized_pnl=unrealized_pnl,
    )


def _order_to_response(order: PaperOrder) -> PaperOrderResponse:
    return PaperOrderResponse(
        id=order.id,
        account_id=order.account_id,
        symbol=order.instrument.symbol,
        exchange=order.instrument.exchange,
        side=order.side,
        order_type=order.order_type,
        quantity=order.quantity,
        status=order.status,
        requested_price=order.requested_price,
        filled_price=order.filled_price,
        filled_at=order.filled_at,
        rejection_reason=order.rejection_reason,
        created_at=order.created_at,
    )


def _strategy_run_to_response(run: PaperStrategyRun) -> PaperStrategyRunResponse:
    return PaperStrategyRunResponse(
        id=run.id,
        account_id=run.account_id,
        backtest_run_id=run.backtest_run_id,
        status=run.status,
        max_position_value=run.max_position_value,
        last_signal=run.last_signal,
        created_at=run.created_at,
    )
