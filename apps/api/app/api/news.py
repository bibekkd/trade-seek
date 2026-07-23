from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.core.config import settings
from app.schemas.news import NewsArticleResponse, NewsResponse
from app.services.news import EmptyNewsProvider, RssNewsProvider, NewsProvider, summarize_news

router = APIRouter(prefix="/news", tags=["news"])


def get_news_provider() -> NewsProvider:
    if settings.news_rss_url:
        return RssNewsProvider(url_template=settings.news_rss_url, timeout_seconds=settings.news_timeout_seconds)
    return EmptyNewsProvider()


@router.get("", response_model=NewsResponse)
def list_news(
    symbol: str = Query(min_length=1, max_length=32),
    start: date | None = None,
    end: date | None = None,
    limit: int = Query(default=10, ge=1, le=50),
) -> NewsResponse:
    provider = get_news_provider()
    try:
        articles = provider.search(symbol=symbol, start=start, end=end, limit=limit)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    summary = summarize_news(articles)
    return NewsResponse(
        symbol=symbol.upper(),
        provider=provider.name,
        articles=[NewsArticleResponse.model_validate(article.__dict__) for article in articles],
        average_sentiment=summary["average_sentiment"],
        dominant_sentiment=summary["dominant_sentiment"],
    )
