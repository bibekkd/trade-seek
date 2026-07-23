from abc import ABC, abstractmethod
import json
from typing import Callable
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.services.llm.schemas import LLMRequest, LLMResponse


class LLMProvider(ABC):
    """Small contract implemented by real or test LLM integrations."""

    name: str
    model: str

    @abstractmethod
    def complete(self, request: LLMRequest) -> LLMResponse | dict[str, Any]:
        """Return structured research output, or raise an exception."""


class OpenAICompatibleProvider(LLMProvider):
    """Adapter for hosted or local OpenAI-compatible chat-completions APIs."""

    def __init__(
        self,
        *,
        name: str,
        model: str,
        api_key: str,
        base_url: str,
        timeout_seconds: float = 60.0,
        http_referer: str | None = None,
        app_title: str | None = None,
        opener: Callable[..., Any] = urlopen,
    ) -> None:
        self.name = name
        self.model = model
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.http_referer = http_referer
        self.app_title = app_title
        self._opener = opener

    def complete(self, request: LLMRequest) -> LLMResponse:
        payload = {
            "model": self.model,
            "temperature": 0.2,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a careful quantitative research assistant. "
                        "Use only the supplied market context. Return ONLY valid JSON with a "
                        "strategy_proposal object containing name, description, evidence, "
                        "risk_notes, and strategy. The strategy must use strategy_type "
                        "moving_average_crossover with short_window, long_window, "
                        "initial_cash, and train_fraction. Never place or recommend an "
                        "immediate live order."
                    ),
                },
                {"role": "user", "content": request.prompt},
            ],
            "response_format": {"type": "json_object"},
        }
        body = json.dumps(payload).encode("utf-8")
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.http_referer:
            headers["HTTP-Referer"] = self.http_referer
        if self.app_title:
            headers["X-Title"] = self.app_title
        http_request = Request(
            f"{self.base_url}/chat/completions",
            data=body,
            headers=headers,
            method="POST",
        )
        try:
            with self._opener(http_request, timeout=self.timeout_seconds) as response:
                response_body = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"{self.name} request failed ({exc.code}): {detail}") from exc
        except (OSError, URLError, json.JSONDecodeError) as exc:
            raise RuntimeError(f"{self.name} request failed: {exc}") from exc

        try:
            content = response_body["choices"][0]["message"]["content"]
            if isinstance(content, str):
                content = _parse_json_content(content)
            if not isinstance(content, dict):
                raise TypeError("model content was not a JSON object")
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            raise ValueError(f"{self.name} returned an invalid structured response") from exc

        return LLMResponse(provider=self.name, model=self.model, content=content)


def configured_llm_providers() -> dict[str, LLMProvider]:
    """Build real providers when keys are configured, otherwise safe test fallbacks."""
    from app.core.config import settings

    providers: dict[str, LLMProvider] = {
        "qwen": MockQwenProvider(),
        "deepseek": MockDeepSeekProvider(),
        "glm": MockGLMProvider(),
        "reasoning": MockDeepSeekProvider(),
        "report": MockQwenProvider(),
        "local_open_source": MockLocalOpenSourceProvider(),
    }
    if settings.llm_mode.lower() != "mock":
        provider_configs = (
            ("qwen", settings.openrouter_qwen_model),
            ("deepseek", settings.openrouter_strategy_model),
            ("glm", settings.openrouter_glm_model),
            ("reasoning", settings.openrouter_reasoning_model),
            ("report", settings.openrouter_report_model),
            ("local_open_source", settings.openrouter_fallback_model),
        )
        for name, model in provider_configs:
            if settings.openrouter_api_key:
                providers[name] = OpenAICompatibleProvider(
                    name=name,
                    model=model,
                    api_key=settings.openrouter_api_key,
                    base_url=settings.openrouter_base_url,
                    timeout_seconds=settings.llm_timeout_seconds,
                    http_referer=settings.openrouter_http_referer,
                    app_title=settings.openrouter_app_title,
                )
        for name, model in (
            ("groq_intent", settings.groq_intent_model),
            ("groq_summary", settings.groq_summary_model),
            ("groq_strategy", settings.groq_strategy_model),
            ("groq_risk", settings.groq_risk_model),
            ("groq_reasoning", settings.groq_reasoning_model),
            ("groq_report", settings.groq_report_model),
        ):
            if settings.groq_api_key:
                providers[name] = OpenAICompatibleProvider(
                    name=name,
                    model=model,
                    api_key=settings.groq_api_key,
                    base_url=settings.groq_base_url,
                    timeout_seconds=settings.llm_timeout_seconds,
                )
        for name, model in (
            ("mistral_intent", settings.mistral_intent_model),
            ("mistral_summary", settings.mistral_summary_model),
            ("mistral_strategy", settings.mistral_strategy_model),
            ("mistral_risk", settings.mistral_risk_model),
            ("mistral_reasoning", settings.mistral_reasoning_model),
            ("mistral_report", settings.mistral_report_model),
        ):
            if settings.mistral_api_key:
                providers[name] = OpenAICompatibleProvider(
                    name=name,
                    model=model,
                    api_key=settings.mistral_api_key,
                    base_url=settings.mistral_base_url,
                    timeout_seconds=settings.llm_timeout_seconds,
                )
        for name, model in (
            ("cerebras_intent", settings.cerebras_intent_model),
            ("cerebras_summary", settings.cerebras_summary_model),
            ("cerebras_strategy", settings.cerebras_strategy_model),
            ("cerebras_risk", settings.cerebras_risk_model),
            ("cerebras_reasoning", settings.cerebras_reasoning_model),
            ("cerebras_report", settings.cerebras_report_model),
        ):
            if settings.cerebras_api_key:
                providers[name] = OpenAICompatibleProvider(
                    name=name,
                    model=model,
                    api_key=settings.cerebras_api_key,
                    base_url=settings.cerebras_base_url,
                    timeout_seconds=settings.llm_timeout_seconds,
                )
    return providers


def _parse_json_content(content: str) -> dict[str, Any]:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```").removeprefix("json").removesuffix("```").strip()
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise TypeError("JSON content was not an object")
    return parsed


class _MockProvider(LLMProvider):
    def __init__(self, *, name: str, model: str | None = None) -> None:
        self.name = name
        self.model = model or f"mock-{name}"

    def complete(self, request: LLMRequest) -> LLMResponse:
        if request.task == "strategy_reasoning":
            return LLMResponse(
                provider=self.name,
                model=self.model,
                content={
                    "kind": "mock_strategy_proposal",
                    "task": request.task,
                    "strategy_proposal": {
                        "name": "Mock moving-average crossover",
                        "description": "Deterministic AI proposal for research-only backtesting.",
                        "strategy": {
                            "strategy_type": "moving_average_crossover",
                            "parameters": {
                                "short_window": 2,
                                "long_window": 3,
                                "initial_cash": "100000",
                                "train_fraction": 0.5,
                            },
                        },
                    },
                },
            )
        return LLMResponse(
            provider=self.name,
            model=self.model,
            content={
                "kind": "mock_research_response",
                "task": request.task,
                "summary": f"Deterministic {self.name} response for {request.task}.",
                "prompt": request.prompt,
            },
        )


class MockQwenProvider(_MockProvider):
    def __init__(self) -> None:
        super().__init__(name="qwen", model="qwen-mock")


class MockDeepSeekProvider(_MockProvider):
    def __init__(self) -> None:
        super().__init__(name="deepseek", model="deepseek-mock")


class MockGLMProvider(_MockProvider):
    def __init__(self) -> None:
        super().__init__(name="glm", model="glm-mock")


class MockLocalOpenSourceProvider(_MockProvider):
    def __init__(self) -> None:
        super().__init__(name="local_open_source", model="local-open-source-mock")


# Both spellings are useful while the real provider adapters are introduced.
QwenMockProvider = MockQwenProvider
DeepSeekMockProvider = MockDeepSeekProvider
GLMMockProvider = MockGLMProvider
LocalOpenSourceMockProvider = MockLocalOpenSourceProvider
