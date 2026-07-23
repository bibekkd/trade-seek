from datetime import date

from fastapi.testclient import TestClient

from app.main import app
from app.services.news import EmptyNewsProvider, RssNewsProvider, sentiment_score


def test_rss_provider_normalizes_articles_and_scores_sentiment() -> None:
    provider = RssNewsProvider(
        url_template="https://news.example/rss?q={query}",
        opener=lambda request, timeout: _Response(
            b"""<rss><channel>
              <item><title>Reliance reports strong profit growth</title>
              <link>https://news.example/1</link><pubDate>Wed, 16 Jul 2026 10:00:00 GMT</pubDate>
              <description>Business outlook remains positive.</description></item>
            </channel></rss>"""
        ),
    )

    articles = provider.search(symbol="RELIANCE", start=date(2026, 7, 1), end=date(2026, 7, 17))

    assert len(articles) == 1
    assert articles[0].source == "RSS"
    assert articles[0].sentiment_label == "positive"
    assert sentiment_score("profit growth and strong gains") > 0


def test_news_endpoint_returns_empty_response_without_feed(monkeypatch) -> None:
    monkeypatch.setattr("app.api.news.get_news_provider", lambda: EmptyNewsProvider())

    response = TestClient(app).get("/news", params={"symbol": "RELIANCE"})

    assert response.status_code == 200
    assert response.json()["articles"] == []
    assert response.json()["dominant_sentiment"] == "unavailable"


class _Response:
    def __init__(self, body: bytes) -> None:
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *_args) -> None:
        return None

    def read(self) -> bytes:
        return self.body
