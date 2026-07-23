from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.backtests import _preload_provider_candles, _resolve_instrument, enqueue_backtest
from app.db.session import get_session
from app.models import AIRequestLog, BacktestRun, ResearchRun, StrategyDefinition
from app.schemas.backtesting import BacktestStrategyInput
from app.schemas.backtests import BacktestCreateRequest
from app.schemas.research import ResearchRunResponse, ResearchStrategyRequest
from app.services.backtesting import VectorbtBacktestRunner
from app.services.backtesting import minimum_candles_for_parameters
from app.services.llm import LLMRequest, LLMRouter, Task
from app.services.llm.market_context import build_market_context
from app.services.llm.market_context import build_news_context
from app.api.news import get_news_provider
from app.api.market_data import _adapter_for_provider

router = APIRouter(tags=["research"])


def get_llm_router() -> LLMRouter:
    return LLMRouter()


@router.post("/research/strategy", response_model=ResearchRunResponse)
def create_strategy_research(
    request: ResearchStrategyRequest,
    session: Session = Depends(get_session),
    llm_router: LLMRouter = Depends(get_llm_router),
) -> ResearchRunResponse:
    market_context: dict = {}
    news_context: dict = {"available": False, "article_count": 0, "dominant_sentiment": "unavailable", "articles": []}
    context_error: str | None = None
    try:
        adapter = _adapter_for_provider(request.provider)
        market_context = build_market_context(
            adapter,
            symbol=request.symbol,
            exchange=request.exchange,
            timeframe=request.timeframe,
            start=request.start_at.date(),
            end=request.end_at.date(),
        )
    except Exception as exc:
        context_error = f"Market context could not be loaded: {exc}"
    try:
        news_context = build_news_context(
            get_news_provider(),
            symbol=request.symbol,
            start=request.start_at.date(),
            end=request.end_at.date(),
        )
    except Exception as exc:
        news_context = {"available": False, "article_count": 0, "dominant_sentiment": "unavailable", "articles": [], "error": str(exc)}

    llm_prompt = _build_strategy_prompt(request, market_context, news_context)
    ai_log = AIRequestLog(
        task=Task.STRATEGY_REASONING.value,
        provider=llm_router.provider_for_task(Task.STRATEGY_REASONING).name,
        prompt=llm_prompt,
        status="running",
    )
    run = ResearchRun(
        symbol=request.symbol.upper(),
        exchange=request.exchange.upper(),
        timeframe=request.timeframe,
        data_provider=request.provider,
        start_at=request.start_at,
        end_at=request.end_at,
        prompt=request.prompt,
        status="running",
        ai_request_log=ai_log,
    )
    session.add_all([ai_log, run])
    session.flush()

    if context_error:
        ai_log.status = "failed"
        ai_log.error_message = context_error
        run.status = "rejected"
        run.error_message = context_error
        session.commit()
        session.refresh(run)
        return _run_to_response(run)

    try:
        llm_response = llm_router.route(
            LLMRequest(
                task=Task.STRATEGY_REASONING,
                prompt=llm_prompt,
                context={**request.model_dump(mode="json"), "market_data": market_context, "news": news_context},
            )
        )
        ai_log.provider = llm_response.provider
        ai_log.response = {"model": llm_response.model, **llm_response.content}
        ai_log.status = "completed"

        try:
            proposal = _extract_strategy_proposal(llm_response.content)
        except ValueError as exc:
            proposal = _fallback_strategy_proposal(market_context, reason=str(exc))
        proposal = _ensure_backtestable_proposal(proposal, market_context)
        candidates = _build_strategy_candidates(proposal, market_context)
        strategy = _validate_strategy_proposal(candidates[0])
        _validate_strategy_against_market_context(strategy, market_context)
        # Persist only proposals that pass the same schema used by backtests.
        # Raw invalid model output remains available in the AI request log.
        run.strategy_proposal = {**candidates[0], "strategy_candidates": candidates}
    except Exception as exc:
        ai_log.status = "failed" if ai_log.response is None else ai_log.status
        ai_log.error_message = str(exc)
        run.status = "rejected"
        run.error_message = f"AI strategy proposal rejected: {exc}"
        session.commit()
        session.refresh(run)
        return _run_to_response(run)

    if not request.run_backtest:
        run.status = "proposed"
        session.commit()
        session.refresh(run)
        return _run_to_response(run)

    backtest_request = BacktestCreateRequest(
        symbol=request.symbol,
        exchange=request.exchange,
        timeframe=request.timeframe,
        provider=request.provider,
        start_at=request.start_at,
        end_at=request.end_at,
        strategy=strategy,
    )
    strategy_definition = StrategyDefinition(
        name=proposal.get("name") or f"{request.symbol.upper()} AI strategy",
        description=proposal.get("description"),
        strategy_type=strategy.strategy_type.value,
        parameters=strategy.parameters.model_dump(mode="json"),
        created_by="ai",
    )
    instrument = _resolve_instrument(backtest_request, session)
    _preload_provider_candles(backtest_request, instrument, session)
    backtest = BacktestRun(
        strategy_definition=strategy_definition,
        instrument=instrument,
        timeframe=request.timeframe,
        start_at=request.start_at,
        end_at=request.end_at,
        data_provider=request.provider,
        status="queued",
        engine=VectorbtBacktestRunner.engine_name,
    )
    session.add(backtest)
    session.flush()
    run.backtest_run = backtest
    run.status = "queued"
    session.commit()
    session.refresh(run)

    try:
        enqueue_backtest(backtest.id)
    except Exception as exc:
        backtest.status = "failed"
        backtest.error_message = "Backtest queue unavailable. Start Redis and the Celery worker, then retry."
        run.status = "failed"
        run.error_message = backtest.error_message
        session.commit()
        raise HTTPException(status_code=503, detail=run.error_message) from exc

    return _run_to_response(run)


@router.get("/research/runs", response_model=list[ResearchRunResponse])
def list_research_runs(
    limit: int = 20,
    session: Session = Depends(get_session),
) -> list[ResearchRunResponse]:
    bounded_limit = min(max(limit, 1), 50)
    runs = session.scalars(
        select(ResearchRun)
        .where(ResearchRun.strategy_proposal.is_not(None))
        .order_by(ResearchRun.created_at.desc())
        .limit(bounded_limit)
    ).all()
    return [_run_to_response(run) for run in runs]


@router.get("/research/runs/{research_run_id}", response_model=ResearchRunResponse)
def get_research_run(
    research_run_id: UUID,
    session: Session = Depends(get_session),
) -> ResearchRunResponse:
    run = session.scalar(select(ResearchRun).where(ResearchRun.id == research_run_id))
    if run is None:
        raise HTTPException(status_code=404, detail="Research run not found")
    return _run_to_response(run)


def _build_strategy_prompt(request: ResearchStrategyRequest, market_context: dict, news_context: dict) -> str:
    return (
        "Propose one backtestable India equities research strategy using only the supplied market data. "
        "Return ONLY JSON shaped as: "
        '{"strategy_proposal":{"name":"...","description":"...","evidence":[],"risk_notes":[],"strategy":{"strategy_type":"moving_average_crossover","parameters":{"short_window":2,"long_window":5,"initial_cash":"100000","train_fraction":0.7}}}}. '
        "Explain the evidence inside JSON fields, state risks, and do not place orders. "
        "The strategy must have enough observations for train/test validation: "
        "(long_window + 1) * 2 must be less than or equal to the market observations. "
        f"Symbol={request.symbol.upper()}, exchange={request.exchange.upper()}, "
        f"timeframe={request.timeframe}, prompt={request.prompt}. "
        f"Market context={market_context}. News and sentiment context={news_context}"
    )


def _extract_strategy_proposal(content: dict) -> dict:
    proposal = content.get("strategy_proposal")
    if isinstance(proposal, dict):
        return proposal

    for key in ("strategy_candidates", "strategies", "candidates", "proposals"):
        candidates = content.get(key)
        if isinstance(candidates, list):
            for candidate in candidates:
                normalized = _proposal_from_object(candidate)
                if normalized is not None:
                    return normalized

    for key in ("proposal", "result", "output"):
        nested = content.get(key)
        normalized = _proposal_from_object(nested)
        if normalized is not None:
            return normalized

    normalized = _proposal_from_object(content)
    if normalized is not None:
        return normalized

    raise ValueError("missing backtestable strategy proposal object")


def _proposal_from_object(value: object) -> dict | None:
    if not isinstance(value, dict):
        return None
    nested = value.get("strategy_proposal")
    if isinstance(nested, dict):
        return nested
    if isinstance(value.get("strategy"), dict):
        return value
    if {"strategy_type", "short_window", "long_window"}.issubset(value):
        return {
            "name": value.get("name", "AI strategy proposal"),
            "description": value.get("description"),
            "evidence": value.get("evidence", []),
            "risk_notes": value.get("risk_notes", []),
            "strategy": value,
        }
    return None


def _validate_strategy_proposal(proposal: dict) -> BacktestStrategyInput:
    strategy_payload = _normalize_strategy_shape(proposal.get("strategy"))
    try:
        return BacktestStrategyInput.model_validate(strategy_payload)
    except ValidationError as exc:
        raise ValueError(str(exc)) from exc


def _ensure_backtestable_proposal(proposal: dict, market_context: dict) -> dict:
    try:
        strategy = _validate_strategy_proposal(proposal)
        _validate_strategy_against_market_context(strategy, market_context)
        return proposal
    except Exception as exc:
        return _fallback_strategy_proposal(market_context, reason=str(exc))


def _fallback_strategy_proposal(market_context: dict, *, reason: str) -> dict:
    observations = market_context.get("observations")
    if not isinstance(observations, int) or observations < 8:
        observations = 120
    long_window = min(20, max(3, (observations // 2) - 1))
    short_window = min(5, long_window - 1)
    return {
        "name": "Safe moving-average fallback",
        "description": (
            "Fallback strategy generated because the model response could not be "
            "used directly. It keeps parameters inside the available data window."
        ),
        "evidence": ["Generated from available candle count and validation limits."],
        "risk_notes": [f"Original model response issue: {reason}"],
        "strategy": {
            "strategy_type": "moving_average_crossover",
            "parameters": {
                "short_window": short_window,
                "long_window": long_window,
                "initial_cash": "100000",
                "train_fraction": 0.6,
            },
        },
    }


def _normalize_strategy_shape(strategy: object) -> dict:
    """Accept the common LLM variant with parameters flattened into strategy."""
    if not isinstance(strategy, dict):
        return {}
    if isinstance(strategy.get("parameters"), dict):
        return strategy

    parameter_names = {"short_window", "long_window", "initial_cash", "train_fraction"}
    flattened_parameters = {
        name: strategy[name] for name in parameter_names if name in strategy
    }
    if not flattened_parameters:
        return strategy

    return {
        "strategy_type": strategy.get("strategy_type"),
        "parameters": flattened_parameters,
    }


def _build_strategy_candidates(proposal: dict, market_context: dict) -> list[dict]:
    base_strategy = _validate_strategy_proposal(proposal)
    observations = market_context.get("observations")
    if not isinstance(observations, int):
        observations = 120

    base_parameters = base_strategy.parameters.model_dump(mode="json")
    base_short = int(base_parameters["short_window"])
    base_long = int(base_parameters["long_window"])
    initial_cash = base_parameters["initial_cash"]
    train_fraction = base_parameters["train_fraction"]

    parameter_sets = [
        (
            "Fast trend scout",
            "More reactive moving-average crossover for quicker signals.",
            max(2, min(base_short, 8)),
            max(3, min(base_long, 18)),
            "Higher turnover; more sensitive to noisy candles.",
        ),
        (
            "Balanced trend filter",
            proposal.get("description") or "Balanced crossover candidate for validation.",
            base_short,
            base_long,
            "Middle-ground speed; use out-of-sample result as the decision point.",
        ),
        (
            "Slow confirmation trend",
            "Slower confirmation candidate intended to reduce whipsaws.",
            max(base_short + 3, min(base_long - 1, base_short * 2)),
            max(base_long + 5, int(base_long * 1.5)),
            "May enter late and miss sharp reversals.",
        ),
    ]

    candidates: list[dict] = []
    seen: set[tuple[int, int]] = set()
    for rank, (name, description, short_window, long_window, risk_note) in enumerate(parameter_sets, start=1):
        short_window, long_window = _fit_windows_to_observations(short_window, long_window, observations)
        if long_window <= short_window:
            long_window = short_window + 1
        key = (short_window, long_window)
        if key in seen:
            continue
        seen.add(key)
        candidate = {
            "name": name,
            "description": description,
            "rank": rank,
            "score": max(1, 100 - (rank - 1) * 8),
            "evidence": proposal.get("evidence", []),
            "risk_notes": [risk_note, *_normalize_notes(proposal.get("risk_notes"))],
            "strategy": {
                "strategy_type": base_strategy.strategy_type.value,
                "parameters": {
                    "short_window": short_window,
                    "long_window": long_window,
                    "initial_cash": initial_cash,
                    "train_fraction": train_fraction,
                },
            },
        }
        _validate_strategy_against_market_context(_validate_strategy_proposal(candidate), market_context)
        candidates.append(candidate)

    if not candidates:
        raise ValueError("no valid strategy candidates could be generated")
    return candidates[:3]


def _fit_windows_to_observations(short_window: int, long_window: int, observations: int) -> tuple[int, int]:
    max_long_window = max(3, (observations // 2) - 1)
    fitted_long = min(max(long_window, 3), max_long_window)
    fitted_short = min(max(short_window, 2), fitted_long - 1)
    return fitted_short, fitted_long


def _normalize_notes(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value[:3]]
    if isinstance(value, str):
        return [value]
    return []


def _validate_strategy_against_market_context(
    strategy: BacktestStrategyInput,
    market_context: dict,
) -> None:
    observations = market_context.get("observations")
    if not isinstance(observations, int):
        return
    required_candles = minimum_candles_for_parameters(strategy.parameters)
    if observations < required_candles:
        raise ValueError(
            f"strategy requires at least {required_candles} candles, "
            f"but market context has {observations}; use smaller windows or a longer date range"
        )


def _run_to_response(run: ResearchRun) -> ResearchRunResponse:
    return ResearchRunResponse(
        id=run.id,
        created_at=run.created_at,
        status=run.status,
        symbol=run.symbol,
        exchange=run.exchange,
        timeframe=run.timeframe,
        provider=run.data_provider,
        start_at=run.start_at,
        end_at=run.end_at,
        prompt=run.prompt,
        strategy_proposal=run.strategy_proposal,
        ai_request_log_id=run.ai_request_log_id,
        backtest_run_id=run.backtest_run_id,
        error_message=run.error_message,
        ai_provider=run.ai_request_log.provider if run.ai_request_log else None,
        ai_model=(run.ai_request_log.response or {}).get("model") if run.ai_request_log and run.ai_request_log.response else None,
    )
