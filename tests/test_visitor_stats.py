"""날짜별 방문자 카운터. 같은 IP는 하루에 한 번만 집계한다."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import stats_service


@pytest.fixture
def client(monkeypatch, tmp_path):
    monkeypatch.setenv("STATS_DB_PATH", str(tmp_path / "visitor_stats.db"))
    stats_service.reset_visitor_cache()
    return TestClient(app)


def test_hit_counts_unique_ip_once_per_day(client):
    first = client.post("/api/v1/stats/hit", headers={"X-Forwarded-For": "203.0.113.10"})
    assert first.status_code == 200, first.text
    body = first.json()
    assert body["counted"] is True
    assert body["today"] == 1
    assert body["total"] == 1

    duplicate = client.post("/api/v1/stats/hit", headers={"X-Forwarded-For": "203.0.113.10"})
    assert duplicate.status_code == 200
    assert duplicate.json()["counted"] is False
    assert duplicate.json()["today"] == 1
    assert duplicate.json()["total"] == 1

    other = client.post("/api/v1/stats/hit", headers={"X-Forwarded-For": "203.0.113.11, 10.0.0.1"})
    assert other.json()["counted"] is True
    assert other.json()["today"] == 2
    assert other.json()["total"] == 2

    listed = client.get("/api/v1/stats/visitors")
    assert listed.status_code == 200
    assert listed.json()["today"] == 2
    assert listed.json()["total"] == 2


def test_next_day_resets_today_and_keeps_total(client, monkeypatch):
    monkeypatch.setattr(stats_service, "current_stat_date", lambda: "2026-09-25")
    first = client.post("/api/v1/stats/hit", headers={"X-Forwarded-For": "198.51.100.8"})
    assert first.json()["counted"] is True
    assert first.json()["date"] == "2026-09-25"

    monkeypatch.setattr(stats_service, "current_stat_date", lambda: "2026-09-26")
    second = client.post("/api/v1/stats/hit", headers={"X-Forwarded-For": "198.51.100.8"})
    assert second.json()["counted"] is True
    assert second.json()["today"] == 1
    assert second.json()["total"] == 2
    assert second.json()["date"] == "2026-09-26"
