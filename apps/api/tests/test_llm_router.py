import pytest

from app.services.llm import (
    LLMProvider,
    LLMRequest,
    LLMResponse,
    LLMRouter,
    MalformedLLMResponseError,
    ProviderExhaustedError,
    Task,
    OpenAICompatibleProvider,
)


def test_router_selects_expected_provider_for_each_task() -> None:
    router = LLMRouter()
    assert router.provider_for_task(Task.INTENT_PARSING).name == "qwen"
    assert router.provider_for_task(Task.STRATEGY_REASONING).name == "deepseek"
    assert router.provider_for_task(Task.LOGICAL_RISK_VALIDATION).name == "glm"
    assert router.provider_for_task(Task.ORCHESTRATION).name == "local_open_source"


def test_router_prefers_first_configured_provider_in_task_chain() -> None:
    router = LLMRouter(
        {
            "groq_intent": _FlakyProvider("groq_intent", failures=0),
            "qwen": _FlakyProvider("qwen", failures=0),
            "local_open_source": _FlakyProvider("local_open_source", failures=0),
        },
        task_routing={Task.INTENT_PARSING: ["groq_intent", "qwen"]},
    )

    assert router.provider_for_task(Task.INTENT_PARSING).name == "groq_intent"


def test_router_retries_then_uses_fallback() -> None:
    primary = _FlakyProvider("qwen", failures=2)
    fallback = _FlakyProvider("local_open_source", failures=0)
    router = LLMRouter(
        {"qwen": primary, "local_open_source": fallback},
        task_routing={Task.INTENT_PARSING: "qwen"},
        max_retries=1,
    )

    result = router.route(LLMRequest(task=Task.INTENT_PARSING, prompt="parse this"))

    assert result.provider == "local_open_source"
    assert primary.calls == 2
    assert fallback.calls == 1


def test_router_walks_provider_chain_before_final_fallback() -> None:
    primary = _FlakyProvider("groq_strategy", failures=2)
    secondary = _FlakyProvider("mistral_strategy", failures=0)
    fallback = _FlakyProvider("local_open_source", failures=0)
    router = LLMRouter(
        {
            "groq_strategy": primary,
            "mistral_strategy": secondary,
            "local_open_source": fallback,
        },
        task_routing={Task.STRATEGY_REASONING: ["groq_strategy", "mistral_strategy"]},
        max_retries=1,
    )

    result = router.route(LLMRequest(task=Task.STRATEGY_REASONING, prompt="generate"))

    assert result.provider == "mistral_strategy"
    assert primary.calls == 2
    assert secondary.calls == 1
    assert fallback.calls == 0


def test_malformed_provider_output_fails_safely() -> None:
    router = LLMRouter(
        {"qwen": _MalformedProvider("qwen", 0), "local_open_source": _FlakyProvider("local_open_source", 0)},
        task_routing={Task.INTENT_PARSING: "qwen"},
    )
    with pytest.raises(MalformedLLMResponseError):
        router.route(LLMRequest(task=Task.INTENT_PARSING, prompt="parse this"))


def test_execution_tasks_are_rejected() -> None:
    router = LLMRouter()
    with pytest.raises(ValueError, match="execution task"):
        router.route(LLMRequest(task="place_order", prompt="buy RELIANCE"))


def test_openai_compatible_provider_parses_structured_model_output() -> None:
    provider = OpenAICompatibleProvider(
        name="qwen",
        model="qwen-plus",
        api_key="test-key",
        base_url="https://models.example/v1",
        opener=lambda request, timeout: _FakeHttpResponse(
            {"choices": [{"message": {"content": "```json\n{\"ok\": true}\n```"}}]}
        ),
    )

    response = provider.complete(LLMRequest(task=Task.MARKET_SUMMARY, prompt="summarize"))

    assert response.provider == "qwen"
    assert response.model == "qwen-plus"
    assert response.content == {"ok": True}


class _FakeHttpResponse:
    def __init__(self, payload: dict) -> None:
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *_args) -> None:
        return None

    def read(self) -> bytes:
        import json

        return json.dumps(self.payload).encode()


class _FlakyProvider(LLMProvider):
    def __init__(self, name: str, failures: int) -> None:
        self.name = name
        self.model = f"{name}-test"
        self.failures = failures
        self.calls = 0

    def complete(self, request: LLMRequest) -> LLMResponse:
        self.calls += 1
        if self.calls <= self.failures:
            raise RuntimeError("temporary outage")
        return LLMResponse(provider=self.name, model=self.model, content={"ok": True})


class _MalformedProvider(_FlakyProvider):
    def complete(self, request: LLMRequest) -> dict:
        return {"content": "not an object"}
