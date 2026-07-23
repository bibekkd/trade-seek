from __future__ import annotations

import html
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import UTC, date, datetime
from email.utils import parsedate_to_datetime
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote_plus
from urllib.request import Request, urlopen
from xml.etree import ElementTree


@dataclass(frozen=True)
class NewsArticle:
    title: str
    url: str
    source: str
    published_at: datetime | None
    summary: str
    sentiment_score: float
    sentiment_label: str


class NewsProvider(ABC):
    name: str

    @abstractmethod
    def search(
        self,
        *,
        symbol: str,
        start: date | None = None,
        end: date | None = None,
        limit: int = 10,
    ) -> list[NewsArticle]:
        raise NotImplementedError


class RssNewsProvider(NewsProvider):
    name = "rss"

    def __init__(
        self,
        *,
        url_template: str,
        timeout_seconds: float = 10.0,
        opener: Any = urlopen,
    ) -> None:
        self.url_template = url_template
        self.timeout_seconds = timeout_seconds
        self._opener = opener

    def search(
        self,
        *,
        symbol: str,
        start: date | None = None,
        end: date | None = None,
        limit: int = 10,
    ) -> list[NewsArticle]:
        url = self.url_template.format(query=quote_plus(f"{symbol} India stock"))
        request = Request(url, headers={"User-Agent": "algo-trading-research/0.1"})
        try:
            with self._opener(request, timeout=self.timeout_seconds) as response:
                root = ElementTree.fromstring(response.read())
        except (HTTPError, URLError, OSError, ElementTree.ParseError) as exc:
            raise RuntimeError(f"RSS news request failed: {exc}") from exc

        articles: list[NewsArticle] = []
        seen: set[str] = set()
        for item in root.findall(".//item"):
            title = _text(item.findtext("title"))
            link = _text(item.findtext("link"))
            if not title or not link or link in seen:
                continue
            published_at = _parse_date(_text(item.findtext("pubDate")))
            if not _in_date_range(published_at, start=start, end=end):
                continue
            summary = _text(item.findtext("description"))
            score = sentiment_score(f"{title} {summary}")
            source = _text(item.findtext("source")) or "RSS"
            articles.append(
                NewsArticle(
                    title=title,
                    url=link,
                    source=source,
                    published_at=published_at,
                    summary=summary[:1000],
                    sentiment_score=score,
                    sentiment_label=sentiment_label(score),
                )
            )
            seen.add(link)
            if len(articles) >= limit:
                break
        return articles


class EmptyNewsProvider(NewsProvider):
    name = "none"

    def search(self, *, symbol: str, start: date | None = None, end: date | None = None, limit: int = 10) -> list[NewsArticle]:
        return []


POSITIVE_WORDS = {"beat", "growth", "gain", "gains", "profit", "strong", "surge", "upgrade", "positive", "record", "bullish", "outperform"}
NEGATIVE_WORDS = {"loss", "losses", "fall", "falls", "weak", "downgrade", "negative", "fraud", "miss", "missed", "bearish", "risk", "decline"}


def sentiment_score(text: str) -> float:
    words = set(re.findall(r"[a-z]+", text.lower()))
    positive = len(words & POSITIVE_WORDS)
    negative = len(words & NEGATIVE_WORDS)
    total = positive + negative
    if total == 0:
        return 0.0
    return round(max(-1.0, min(1.0, (positive - negative) / total)), 3)


def sentiment_label(score: float) -> str:
    if score >= 0.25:
        return "positive"
    if score <= -0.25:
        return "negative"
    return "neutral"


def summarize_news(articles: list[NewsArticle]) -> dict[str, Any]:
    if not articles:
        return {"available": False, "article_count": 0, "average_sentiment": 0.0, "dominant_sentiment": "unavailable", "articles": []}
    average = round(sum(article.sentiment_score for article in articles) / len(articles), 3)
    return {
        "available": True,
        "article_count": len(articles),
        "average_sentiment": average,
        "dominant_sentiment": sentiment_label(average),
        "articles": [
            {
                "title": article.title,
                "source": article.source,
                "url": article.url,
                "published_at": article.published_at.isoformat() if article.published_at else None,
                "summary": article.summary,
                "sentiment_score": article.sentiment_score,
                "sentiment_label": article.sentiment_label,
            }
            for article in articles
        ],
    }


def _text(value: str | None) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value or ""))).strip()


def _parse_date(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).astimezone(UTC)
    except (TypeError, ValueError, OverflowError):
        return None


def _in_date_range(value: datetime | None, *, start: date | None, end: date | None) -> bool:
    if value is None:
        return True
    value_date = value.date()
    return (start is None or value_date >= start) and (end is None or value_date <= end)
