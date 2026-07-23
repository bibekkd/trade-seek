from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.api.research import get_llm_router
from app.db.base import Base
from app.db.session import get_session
from app.main import app
from app.models import AIRequestLog, BacktestRun, ResearchRun
from app.services.market_data import MarketDataCandle
from app.services.llm import LLMProvider, LLMRequest, LLMResponse, LLMRouter, Task


def test_research_request_generates_strategy_logs_ai_and_queues_backtest(
    client_with_sqlite: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr("app.api.research.enqueue_backtest", lambda _backtest_id: None)

    response = client_with_sqlite.post("/research/strategy", json=_research_payload())

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "queued"
    assert body["symbol"] == "RELIANCE"
    assert body["strategy_proposal"]["strategy"]["strategy_type"] == "moving_average_crossover"
    assert len(body["strategy_proposal"]["strategy_candidates"]) >= 2
    assert body["ai_request_log_id"] is not None
    assert body["backtest_run_id"] is not None

    fetch = client_with_sqlite.get(f"/research/runs/{body['id']}")
    assert fetch.status_code == 200
    assert fetch.json()["id"] == body["id"]


def test_invalid_ai_strategy_uses_safe_fallback_and_queues_backtest(
    client_with_sqlite: TestClient,
    monkeypatch,
) -> None:
    app.dependency_overrides[get_llm_router] = lambda: LLMRouter(
        {"deepseek": _InvalidStrategyProvider(), "local_open_source": _InvalidStrategyProvider()},
        task_routing={Task.STRATEGY_REASONING: "deepseek"},
    )
    monkeypatch.setattr("app.api.research.enqueue_backtest", lambda _backtest_id: None)
    try:
        response = client_with_sqlite.post("/research/strategy", json=_research_payload())
    finally:
        app.dependency_overrides.pop(get_llm_router, None)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "queued"
    assert body["backtest_run_id"] is not None
    assert "Original model response issue" in body["strategy_proposal"]["risk_notes"][1]


def test_empty_ai_response_uses_safe_fallback(
    client_with_sqlite: TestClient,
    monkeypatch,
) -> None:
    app.dependency_overrides[get_llm_router] = lambda: LLMRouter(
        {"deepseek": _EmptyResponseProvider(), "local_open_source": _EmptyResponseProvider()},
        task_routing={Task.STRATEGY_REASONING: "deepseek"},
    )
    monkeypatch.setattr("app.api.research.enqueue_backtest", lambda _backtest_id: None)
    try:
        response = client_with_sqlite.post("/research/strategy", json=_research_payload())
    finally:
        app.dependency_overrides.pop(get_llm_router, None)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "queued"
    assert body["strategy_proposal"]["strategy"]["strategy_type"] == "moving_average_crossover"


def test_flattened_ai_strategy_parameters_are_normalized(
    client_with_sqlite: TestClient,
    monkeypatch,
) -> None:
    app.dependency_overrides[get_llm_router] = lambda: LLMRouter(
        {"deepseek": _FlattenedStrategyProvider(), "local_open_source": _FlattenedStrategyProvider()},
        task_routing={Task.STRATEGY_REASONING: "deepseek"},
    )
    monkeypatch.setattr("app.api.research.enqueue_backtest", lambda _backtest_id: None)
    try:
        response = client_with_sqlite.post("/research/strategy", json=_research_payload())
    finally:
        app.dependency_overrides.pop(get_llm_router, None)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "queued"
    assert body["strategy_proposal"]["strategy"]["parameters"]["short_window"] == 3


def test_direct_ai_strategy_object_is_accepted(
    client_with_sqlite: TestClient,
    monkeypatch,
) -> None:
    app.dependency_overrides[get_llm_router] = lambda: LLMRouter(
        {"deepseek": _DirectStrategyProvider(), "local_open_source": _DirectStrategyProvider()},
        task_routing={Task.STRATEGY_REASONING: "deepseek"},
    )
    monkeypatch.setattr("app.api.research.enqueue_backtest", lambda _backtest_id: None)
    try:
        response = client_with_sqlite.post("/research/strategy", json=_research_payload())
    finally:
        app.dependency_overrides.pop(get_llm_router, None)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "queued"
    assert body["strategy_proposal"]["strategy"]["parameters"]["short_window"] == 3


def test_ai_strategy_candidates_list_is_accepted(
    client_with_sqlite: TestClient,
    monkeypatch,
) -> None:
    app.dependency_overrides[get_llm_router] = lambda: LLMRouter(
        {"deepseek": _CandidateListProvider(), "local_open_source": _CandidateListProvider()},
        task_routing={Task.STRATEGY_REASONING: "deepseek"},
    )
    monkeypatch.setattr("app.api.research.enqueue_backtest", lambda _backtest_id: None)
    try:
        response = client_with_sqlite.post("/research/strategy", json=_research_payload())
    finally:
        app.dependency_overrides.pop(get_llm_router, None)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "queued"
    assert body["strategy_proposal"]["strategy"]["parameters"]["short_window"] == 4


def test_research_logs_are_stored(client_with_sqlite: TestClient, sqlite_engine, monkeypatch) -> None:
    monkeypatch.setattr("app.api.research.enqueue_backtest", lambda _backtest_id: None)

    client_with_sqlite.post("/research/strategy", json=_research_payload())

    with Session(sqlite_engine) as session:
        logs = session.query(AIRequestLog).all()
        runs = session.query(ResearchRun).all()
        backtests = session.query(BacktestRun).all()

    assert len(logs) == 1
    assert logs[0].task == Task.STRATEGY_REASONING.value
    assert logs[0].provider == "deepseek"
    assert logs[0].status == "completed"
    assert logs[0].response["strategy_proposal"]["strategy"]["strategy_type"] == "moving_average_crossover"
    assert "Market context=" in logs[0].prompt
    assert "News and sentiment context=" in logs[0].prompt
    assert len(runs) == 1
    assert len(backtests) == 1


def test_list_research_runs_returns_generated_strategy_history(
    client_with_sqlite: TestClient,
    monkeypatch,
) -> None:
    monkeypatch.setattr("app.api.research.enqueue_backtest", lambda _backtest_id: None)

    first = client_with_sqlite.post(
        "/research/strategy",
        json=_research_payload(symbol="RELIANCE", run_backtest=False),
    ).json()
    second = client_with_sqlite.post(
        "/research/strategy",
        json=_research_payload(symbol="RELIANCE", run_backtest=False),
    ).json()

    response = client_with_sqlite.get("/research/runs?limit=10")

    assert response.status_code == 200
    history = response.json()
    assert {run["id"] for run in history} == {second["id"], first["id"]}
    assert all(run["created_at"] for run in history)
    assert all(run["strategy_proposal"]["strategy_candidates"] for run in history)


def test_full_strategy_builder_single_and_comparison_workflow(
    client_with_sqlite: TestClient,
    sqlite_engine,
    monkeypatch,
) -> None:
    monkeypatch.setattr("app.api.market_data.FyersHistoricalAdapter", _WorkflowFyersAdapter)
    monkeypatch.setattr("app.api.backtests.FyersHistoricalAdapter", _WorkflowFyersAdapter)
    monkeypatch.setattr("app.tasks.backtests.FyersHistoricalAdapter", _WorkflowFyersAdapter)
    monkeypatch.setattr("app.api.research.enqueue_backtest", lambda _backtest_id: None)
    monkeypatch.setattr("app.api.backtests.enqueue_backtest", lambda _backtest_id: None)
    monkeypatch.setattr(
        "app.tasks.backtests.SessionLocal",
        sessionmaker(bind=sqlite_engine, autoflush=False, autocommit=False),
    )

    research_response = client_with_sqlite.post(
        "/research/strategy",
        json=_research_payload(symbol="SBIN", provider="fyers", run_backtest=False),
    )
    assert research_response.status_code == 200
    research_body = research_response.json()
    assert research_body["status"] == "proposed"
    strategy = research_body["strategy_proposal"]["strategy"]

    single_response = client_with_sqlite.post(
        "/backtests",
        json=_backtest_payload(symbol="SBIN", strategy=strategy),
    )
    assert single_response.status_code == 200
    single_run = _run_worker_and_fetch(client_with_sqlite, single_response.json()["id"])
    assert single_run["status"] == "completed"
    assert single_run["metrics"]["out_of_sample"]["number_of_trades"] >= 0

    comparison_ids: list[str] = []
    for symbol in ("SBIN", "INFY", "RELIANCE"):
        response = client_with_sqlite.post(
            "/backtests",
            json=_backtest_payload(symbol=symbol, strategy=strategy),
        )
        assert response.status_code == 200
        comparison_ids.append(response.json()["id"])

    comparison_runs = [_run_worker_and_fetch(client_with_sqlite, backtest_id) for backtest_id in comparison_ids]
    assert {run["status"] for run in comparison_runs} == {"completed"}
    assert {run["symbol"] for run in comparison_runs} == {"SBIN", "INFY", "RELIANCE"}


def test_get_research_run_returns_404_for_unknown_id(client_with_sqlite: TestClient) -> None:
    response = client_with_sqlite.get("/research/runs/00000000-0000-0000-0000-000000000000")

    assert response.status_code == 404
    assert response.json()["detail"] == "Research run not found"


class _InvalidStrategyProvider(LLMProvider):
    name = "deepseek"
    model = "deepseek-invalid-test"

    def complete(self, request: LLMRequest) -> LLMResponse:
        return LLMResponse(
            provider=self.name,
            model=self.model,
            content={
                "strategy_proposal": {
                    "name": "Invalid moving-average crossover",
                    "strategy": {
                        "strategy_type": "moving_average_crossover",
                        "parameters": {
                            "short_window": 10,
                            "long_window": 3,
                            "initial_cash": "100000",
                            "train_fraction": 0.5,
                        },
                    },
                }
            },
        )


class _EmptyResponseProvider(LLMProvider):
    name = "deepseek"
    model = "deepseek-empty-test"

    def complete(self, request: LLMRequest) -> LLMResponse:
        return LLMResponse(
            provider=self.name,
            model=self.model,
            content={"summary": "Looks interesting, but no strategy JSON."},
        )


class _FlattenedStrategyProvider(LLMProvider):
    name = "deepseek"
    model = "deepseek-flattened-test"

    def complete(self, request: LLMRequest) -> LLMResponse:
        return LLMResponse(
            provider=self.name,
            model=self.model,
            content={
                "strategy_proposal": {
                    "name": "Flattened moving-average crossover",
                    "strategy": {
                        "strategy_type": "moving_average_crossover",
                        "short_window": 3,
                        "long_window": 5,
                        "initial_cash": "100000",
                        "train_fraction": 0.6,
                    },
                }
            },
        )


class _DirectStrategyProvider(LLMProvider):
    name = "deepseek"
    model = "deepseek-direct-test"

    def complete(self, request: LLMRequest) -> LLMResponse:
        return LLMResponse(
            provider=self.name,
            model=self.model,
            content={
                "name": "Direct strategy response",
                "description": "Model skipped the strategy_proposal wrapper.",
                "strategy": {
                    "strategy_type": "moving_average_crossover",
                    "parameters": {
                        "short_window": 3,
                        "long_window": 5,
                        "initial_cash": "100000",
                        "train_fraction": 0.6,
                    },
                },
            },
        )


class _CandidateListProvider(LLMProvider):
    name = "deepseek"
    model = "deepseek-candidates-test"

    def complete(self, request: LLMRequest) -> LLMResponse:
        return LLMResponse(
            provider=self.name,
            model=self.model,
            content={
                "strategy_candidates": [
                    {
                        "name": "Candidate list response",
                        "strategy": {
                            "strategy_type": "moving_average_crossover",
                            "parameters": {
                                "short_window": 4,
                                "long_window": 6,
                                "initial_cash": "100000",
                                "train_fraction": 0.6,
                            },
                        },
                    }
                ]
            },
        )


class _WorkflowFyersAdapter:
    provider_name = "fyers"

    def __init__(self, **kwargs) -> None:
        pass

    def get_candles(self, *, symbol, exchange, timeframe, start, end):
        start_at = datetime(2024, 1, 1, tzinfo=UTC)
        base = Decimal(str({"SBIN": 620, "INFY": 1500, "RELIANCE": 2500}.get(symbol, 1000)))
        return [
            MarketDataCandle(
                symbol=symbol,
                exchange=exchange,
                timeframe=timeframe,
                timestamp=start_at + timedelta(days=index),
                open=base + Decimal(index),
                high=base + Decimal(index + 4),
                low=base + Decimal(index - 3),
                close=base + Decimal(index) + (Decimal("2") if index % 4 in {1, 2} else Decimal("-1")),
                volume=Decimal("100000") + Decimal(index * 1000),
                source="fyers-test",
            )
            for index in range(40)
        ]


def _run_worker_and_fetch(client: TestClient, backtest_id: str) -> dict:
    from app.tasks.backtests import run_backtest_task

    run_backtest_task.apply(args=[backtest_id]).get()
    response = client.get(f"/backtests/{backtest_id}")
    assert response.status_code == 200
    return response.json()


def _research_payload(
    *,
    symbol: str = "RELIANCE",
    provider: str = "fixture",
    run_backtest: bool = True,
) -> dict:
    return {
        "prompt": "Find a simple trend-following idea and test it conservatively.",
        "symbol": symbol,
        "exchange": "NSE",
        "timeframe": "1d",
        "provider": provider,
        "start_at": "2024-01-01T00:00:00Z",
        "end_at": "2024-02-28T23:59:59Z",
        "run_backtest": run_backtest,
    }


def _backtest_payload(*, symbol: str, strategy: dict) -> dict:
    return {
        "symbol": symbol,
        "exchange": "NSE",
        "timeframe": "1d",
        "provider": "fyers",
        "start_at": "2024-01-01T00:00:00Z",
        "end_at": "2024-02-28T23:59:59Z",
        "strategy": strategy,
    }


@pytest.fixture
def client_with_sqlite(sqlite_engine) -> Iterator[TestClient]:
    Base.metadata.create_all(sqlite_engine)

    def override_get_session() -> Iterator[Session]:
        with Session(sqlite_engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(sqlite_engine)
