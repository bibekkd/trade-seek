from __future__ import annotations

import time
from enum import StrEnum
from typing import Callable, Mapping, Sequence

from app.services.llm.providers import (
    LLMProvider,
    configured_llm_providers,
)
from app.services.llm.schemas import LLMRequest, LLMResponse


class Task(StrEnum):
    INTENT_PARSING = "intent_parsing"
    MARKET_SUMMARY = "market_summary"
    STRATEGY_REASONING = "strategy_reasoning"
    LOGICAL_RISK_VALIDATION = "logical_risk_validation"
    BACKTEST_INTERPRETATION = "backtest_interpretation"
    USER_FACING_REPORT = "user_facing_report"
    ORCHESTRATION = "orchestration"


DEFAULT_TASK_ROUTING: dict[str, list[str]] = {
    Task.INTENT_PARSING: ["groq_intent", "mistral_intent", "cerebras_intent", "qwen"],
    Task.MARKET_SUMMARY: ["mistral_summary", "groq_summary", "cerebras_summary", "qwen"],
    Task.STRATEGY_REASONING: ["cerebras_strategy", "groq_strategy", "mistral_strategy", "deepseek"],
    Task.LOGICAL_RISK_VALIDATION: ["groq_risk", "cerebras_risk", "mistral_risk", "glm"],
    Task.BACKTEST_INTERPRETATION: ["cerebras_reasoning", "groq_reasoning", "mistral_reasoning", "reasoning"],
    Task.USER_FACING_REPORT: ["mistral_report", "groq_report", "cerebras_report", "report"],
    Task.ORCHESTRATION: ["groq_intent", "cerebras_intent", "local_open_source"],
}

_FORBIDDEN_TASKS = {"execute_order", "place_order", "broker_execution", "trading_execution"}


class LLMRouterError(RuntimeError):
    pass


class UnsupportedTaskError(LLMRouterError, ValueError):
    pass


class MalformedLLMResponseError(LLMRouterError, ValueError):
    pass


class ProviderExhaustedError(LLMRouterError):
    def __init__(self, provider: str, attempts: int, cause: Exception) -> None:
        self.provider = provider
        self.attempts = attempts
        self.cause = cause
        super().__init__(f"LLM provider {provider!r} failed after {attempts} attempts: {cause}")


class LLMRouter:
    """Route research tasks and isolate provider failures from callers."""

    def __init__(
        self,
        providers: Mapping[str, LLMProvider] | None = None,
        *,
        task_routing: Mapping[str, str | Sequence[str]] | None = None,
        fallback_provider: str = "local_open_source",
        max_retries: int = 2,
        backoff_seconds: float = 0.0,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        if max_retries < 0:
            raise ValueError("max_retries must be non-negative")
        if backoff_seconds < 0:
            raise ValueError("backoff_seconds must be non-negative")
        self.providers = dict(providers or configured_llm_providers())
        self.task_routing = {
            task: _normalize_provider_chain(provider_names)
            for task, provider_names in dict(task_routing or DEFAULT_TASK_ROUTING).items()
        }
        self.fallback_provider = fallback_provider
        self.max_retries = max_retries
        self.backoff_seconds = backoff_seconds
        self._sleep = sleep

    def provider_for_task(self, task: str | Task) -> LLMProvider:
        return self.providers_for_task(task)[0]

    def providers_for_task(self, task: str | Task) -> list[LLMProvider]:
        task_name = str(task)
        if task_name in _FORBIDDEN_TASKS:
            raise UnsupportedTaskError(f"LLM routing is not available for execution task {task_name!r}")
        provider_names = self.task_routing.get(task_name)
        if provider_names is None:
            raise UnsupportedTaskError(f"No LLM provider route configured for task {task_name!r}")
        providers = [
            self.providers[provider_name]
            for provider_name in provider_names
            if provider_name in self.providers
        ]
        if not providers:
            raise UnsupportedTaskError(f"No LLM provider route configured for task {task_name!r}")
        return providers

    def route(self, request: LLMRequest) -> LLMResponse:
        providers = self.providers_for_task(request.task)
        fallback = self.providers.get(self.fallback_provider)
        if fallback is not None and all(provider.name != fallback.name for provider in providers):
            providers.append(fallback)

        last_error: ProviderExhaustedError | None = None
        for provider in providers:
            try:
                return self._call_with_retries(provider, request, original_error=last_error)
            except ProviderExhaustedError as error:
                last_error = error
                continue
        if last_error is not None:
            raise last_error
        raise UnsupportedTaskError(f"No LLM provider route configured for task {request.task!r}")

    def complete(self, request: LLMRequest) -> LLMResponse:
        return self.route(request)

    def _call_with_retries(
        self,
        provider: LLMProvider,
        request: LLMRequest,
        *,
        original_error: Exception | None = None,
    ) -> LLMResponse:
        last_error: Exception = original_error or RuntimeError("provider call failed")
        for attempt in range(self.max_retries + 1):
            try:
                response = provider.complete(request)
                return self._validate_response(response, provider)
            except MalformedLLMResponseError:
                # A malformed payload is a contract violation, not a transient
                # outage; never hide it by selecting another model.
                raise
            except Exception as error:
                last_error = error
                if attempt < self.max_retries and self.backoff_seconds:
                    self._sleep(self.backoff_seconds * (2**attempt))
        raise ProviderExhaustedError(provider.name, self.max_retries + 1, last_error)

    @staticmethod
    def _validate_response(response: LLMResponse | dict, provider: LLMProvider) -> LLMResponse:
        try:
            if isinstance(response, LLMResponse):
                return response
            if not isinstance(response, dict):
                raise TypeError("provider response must be an LLMResponse or object")
            payload = dict(response)
            payload.setdefault("provider", provider.name)
            payload.setdefault("model", provider.model)
            return LLMResponse.model_validate(payload)
        except Exception as error:
            raise MalformedLLMResponseError(
                f"Provider {provider.name!r} returned malformed structured output"
            ) from error


def _normalize_provider_chain(provider_names: str | Sequence[str]) -> list[str]:
    if isinstance(provider_names, str):
        return [provider_names]
    return list(provider_names)
