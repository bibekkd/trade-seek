"""Provider-neutral LLM routing for research workflows.

This package deliberately contains no broker or order-management dependency.
LLM output is research data only and must pass the later validation gates before
it can be used by another part of the application.
"""

from app.services.llm.providers import (
    DeepSeekMockProvider,
    GLMMockProvider,
    LLMProvider,
    OpenAICompatibleProvider,
    LocalOpenSourceMockProvider,
    MockDeepSeekProvider,
    MockGLMProvider,
    MockLocalOpenSourceProvider,
    MockQwenProvider,
    QwenMockProvider,
    configured_llm_providers,
)
from app.services.llm.router import (
    DEFAULT_TASK_ROUTING,
    LLMRouter,
    LLMRouterError,
    MalformedLLMResponseError,
    ProviderExhaustedError,
    Task,
    UnsupportedTaskError,
)
from app.services.llm.market_context import build_market_context, build_news_context
from app.services.llm.schemas import LLMRequest, LLMResponse

__all__ = [
    "DEFAULT_TASK_ROUTING",
    "build_market_context",
    "build_news_context",
    "DeepSeekMockProvider",
    "GLMMockProvider",
    "LLMProvider",
    "OpenAICompatibleProvider",
    "LLMRequest",
    "LLMResponse",
    "LLMRouter",
    "LLMRouterError",
    "LocalOpenSourceMockProvider",
    "MalformedLLMResponseError",
    "MockDeepSeekProvider",
    "MockGLMProvider",
    "MockLocalOpenSourceProvider",
    "MockQwenProvider",
    "ProviderExhaustedError",
    "QwenMockProvider",
    "Task",
    "configured_llm_providers",
    "UnsupportedTaskError",
]
