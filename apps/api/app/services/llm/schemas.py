from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class LLMRequest(BaseModel):
    """The provider-independent request sent through the router."""

    model_config = ConfigDict(extra="forbid")

    task: str = Field(min_length=1, max_length=64)
    prompt: str = Field(min_length=1)
    context: dict[str, Any] = Field(default_factory=dict)


class LLMResponse(BaseModel):
    """The stable response envelope returned by every provider."""

    model_config = ConfigDict(extra="forbid")

    provider: str = Field(min_length=1, max_length=64)
    model: str = Field(min_length=1, max_length=128)
    content: dict[str, Any]
    finish_reason: str = "stop"
