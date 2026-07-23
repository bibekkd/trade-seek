from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.backtests import router as backtests_router
from app.api.health import router as health_router
from app.api.market_data import router as market_data_router
from app.api.research import router as research_router
from app.api.news import router as news_router
from app.api.paper_trading import router as paper_trading_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.middleware.request_id import RequestIdMiddleware


def create_app() -> FastAPI:
    configure_logging()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        summary="Research and backtesting API. Live trading is disabled.",
    )

    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(market_data_router)
    app.include_router(backtests_router)
    app.include_router(research_router)
    app.include_router(news_router)
    app.include_router(paper_trading_router)
    return app


app = create_app()
