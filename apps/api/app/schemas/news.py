from datetime import datetime

from pydantic import BaseModel


class NewsArticleResponse(BaseModel):
    title: str
    url: str
    source: str
    published_at: datetime | None
    summary: str
    sentiment_score: float
    sentiment_label: str


class NewsResponse(BaseModel):
    symbol: str
    provider: str
    articles: list[NewsArticleResponse]
    average_sentiment: float
    dominant_sentiment: str
