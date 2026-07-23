from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


API_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = API_ROOT.parents[1]
ENV_FILES = (REPO_ROOT / ".env", API_ROOT / ".env")


class Settings(BaseSettings):
    app_name: str = "algo-trading-api"
    app_version: str = "0.1.0"
    environment: str = "local"
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    request_id_header: str = "X-Request-ID"

    database_url: str = Field(
        default="postgresql+psycopg://algo:algo@localhost:5432/algo_trading",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    celery_task_always_eager: bool = Field(default=False, alias="CELERY_TASK_ALWAYS_EAGER")
    celery_task_eager_propagates: bool = Field(default=False, alias="CELERY_TASK_EAGER_PROPAGATES")
    dependency_check_timeout_seconds: float = 1.0
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    nse_bhavcopy_csv_path: str | None = Field(default=None, alias="NSE_BHAVCOPY_CSV_PATH")
    fyers_app_id: str | None = Field(default=None, alias="FYERS_APP_ID")
    fyers_secret_id: str | None = Field(default=None, alias="FYERS_SECRET_ID")
    fyers_access_token: str | None = Field(default=None, alias="FYERS_ACCESS_TOKEN")
    fyers_redirect_uri: str = Field(
        default="http://127.0.0.1:8000/fyers/callback",
        alias="FYERS_REDIRECT_URI",
    )
    fyers_data_base_url: str = Field(
        default="https://api-t1.fyers.in/data",
        alias="FYERS_DATA_BASE_URL",
    )
    fyers_symbol_master_url: str = Field(
        default="https://public.fyers.in/sym_details/NSE_CM.csv",
        alias="FYERS_SYMBOL_MASTER_URL",
    )
    llm_mode: str = Field(default="auto", alias="LLM_MODE")
    llm_timeout_seconds: float = Field(default=60.0, alias="LLM_TIMEOUT_SECONDS")
    openrouter_api_key: str | None = Field(default=None, alias="OPENROUTER_API_KEY")
    openrouter_base_url: str = Field(default="https://openrouter.ai/api/v1", alias="OPENROUTER_BASE_URL")
    openrouter_http_referer: str | None = Field(default=None, alias="OPENROUTER_HTTP_REFERER")
    openrouter_app_title: str = Field(default="AI Trading Platform", alias="OPENROUTER_APP_TITLE")
    openrouter_qwen_model: str = Field(default="qwen/qwen3.6-plus:free", alias="OPENROUTER_QWEN_MODEL")
    openrouter_strategy_model: str = Field(default="deepseek/deepseek-chat-v3-0324:free", alias="OPENROUTER_STRATEGY_MODEL")
    openrouter_reasoning_model: str = Field(default="deepseek/deepseek-r1-0528:free", alias="OPENROUTER_REASONING_MODEL")
    openrouter_glm_model: str = Field(default="z-ai/glm-4.5-air:free", alias="OPENROUTER_GLM_MODEL")
    openrouter_report_model: str = Field(default="openai/gpt-oss-120b:free", alias="OPENROUTER_REPORT_MODEL")
    openrouter_fallback_model: str = Field(default="openrouter/free", alias="OPENROUTER_FALLBACK_MODEL")
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    groq_base_url: str = Field(default="https://api.groq.com/openai/v1", alias="GROQ_BASE_URL")
    groq_intent_model: str = Field(default="llama-3.1-8b-instant", alias="GROQ_INTENT_MODEL")
    groq_summary_model: str = Field(default="llama-3.1-8b-instant", alias="GROQ_SUMMARY_MODEL")
    groq_strategy_model: str = Field(default="qwen/qwen3-32b", alias="GROQ_STRATEGY_MODEL")
    groq_risk_model: str = Field(default="qwen/qwen3-32b", alias="GROQ_RISK_MODEL")
    groq_reasoning_model: str = Field(default="openai/gpt-oss-120b", alias="GROQ_REASONING_MODEL")
    groq_report_model: str = Field(default="qwen/qwen3-32b", alias="GROQ_REPORT_MODEL")
    mistral_api_key: str | None = Field(default=None, alias="MISTRAL_API_KEY")
    mistral_base_url: str = Field(default="https://api.mistral.ai/v1", alias="MISTRAL_BASE_URL")
    mistral_intent_model: str = Field(default="ministral-8b-latest", alias="MISTRAL_INTENT_MODEL")
    mistral_summary_model: str = Field(default="mistral-small-latest", alias="MISTRAL_SUMMARY_MODEL")
    mistral_strategy_model: str = Field(default="mistral-small-latest", alias="MISTRAL_STRATEGY_MODEL")
    mistral_risk_model: str = Field(default="magistral-small-latest", alias="MISTRAL_RISK_MODEL")
    mistral_reasoning_model: str = Field(default="magistral-small-latest", alias="MISTRAL_REASONING_MODEL")
    mistral_report_model: str = Field(default="mistral-small-latest", alias="MISTRAL_REPORT_MODEL")
    cerebras_api_key: str | None = Field(default=None, alias="CEREBRAS_API_KEY")
    cerebras_base_url: str = Field(default="https://api.cerebras.ai/v1", alias="CEREBRAS_BASE_URL")
    cerebras_intent_model: str = Field(default="llama-3.1-8b", alias="CEREBRAS_INTENT_MODEL")
    cerebras_summary_model: str = Field(default="llama-3.3-70b", alias="CEREBRAS_SUMMARY_MODEL")
    cerebras_strategy_model: str = Field(default="qwen-3-32b", alias="CEREBRAS_STRATEGY_MODEL")
    cerebras_risk_model: str = Field(default="qwen-3-32b", alias="CEREBRAS_RISK_MODEL")
    cerebras_reasoning_model: str = Field(default="gpt-oss-120b", alias="CEREBRAS_REASONING_MODEL")
    cerebras_report_model: str = Field(default="gpt-oss-120b", alias="CEREBRAS_REPORT_MODEL")
    news_rss_url: str | None = Field(default=None, alias="NEWS_RSS_URL")
    news_timeout_seconds: float = Field(default=10.0, alias="NEWS_TIMEOUT_SECONDS")

    @field_validator("database_url")
    @classmethod
    def use_installed_postgres_driver(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    model_config = SettingsConfigDict(
        env_file=ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
