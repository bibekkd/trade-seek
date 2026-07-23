from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint(monkeypatch) -> None:
    monkeypatch.setattr("app.api.health.check_database", lambda: (True, "ok"))
    monkeypatch.setattr("app.api.health.check_redis", lambda: (True, "ok"))
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["checks"]["database"]["status"] == "ok"
    assert response.json()["checks"]["redis"]["status"] == "ok"


def test_health_endpoint_degrades_when_dependency_is_down(monkeypatch) -> None:
    monkeypatch.setattr("app.api.health.check_database", lambda: (False, "timeout"))
    monkeypatch.setattr("app.api.health.check_redis", lambda: (True, "ok"))
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "degraded"
    assert response.json()["checks"]["database"]["status"] == "error"


def test_request_id_header_is_returned() -> None:
    client = TestClient(app)

    response = client.get("/health", headers={"X-Request-ID": "test-request-id"})

    assert response.headers["X-Request-ID"] == "test-request-id"


def test_request_logs_include_request_id(monkeypatch, caplog) -> None:
    monkeypatch.setattr("app.api.health.check_database", lambda: (True, "ok"))
    monkeypatch.setattr("app.api.health.check_redis", lambda: (True, "ok"))
    client = TestClient(app)

    with caplog.at_level("INFO"):
        client.get("/health", headers={"X-Request-ID": "logged-request-id"})

    assert any(
        record.request_id == "logged-request-id"
        and "request completed" in record.message
        for record in caplog.records
    )
