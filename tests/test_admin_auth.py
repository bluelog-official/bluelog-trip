"""관리자 로그인과 Bearer 검증. 가이드 생성 LLM은 호출하지 않는다."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import TOKEN_TTL_SECONDS, issue_admin_token

LOGIN_ERROR = "잘못된 관리자 정보입니다"


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("ADMIN_USERNAME", "admin")
    monkeypatch.setenv("ADMIN_PASSWORD", "bluelog123!")
    monkeypatch.delenv("ADMIN_TOKEN_SECRET", raising=False)
    return TestClient(app)


def _auth_header(token):
    return {"Authorization": "Bearer {0}".format(token)}


def test_login_returns_bearer_token(client):
    response = client.post(
        "/api/v1/admin/login",
        json={"username": "admin", "password": "bluelog123!"},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]


def test_login_rejects_wrong_password(client):
    response = client.post(
        "/api/v1/admin/login",
        json={"username": "admin", "password": "wrong-password"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == LOGIN_ERROR


def test_login_rejects_wrong_username(client):
    response = client.post(
        "/api/v1/admin/login",
        json={"username": "root", "password": "bluelog123!"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == LOGIN_ERROR


def test_public_guide_list_stays_open(client):
    response = client.get("/api/v1/guides")
    assert response.status_code == 200


def test_generate_guide_requires_bearer_token(client, monkeypatch):
    called = {"value": False}

    async def _blocked(*_args, **_kwargs):
        called["value"] = True
        raise RuntimeError("generate should not run")

    monkeypatch.setattr("app.main.generate_city_guide", _blocked)

    missing = client.post("/api/v1/generate-guide", json={"destination": "Bali"})
    assert missing.status_code == 401
    assert missing.json()["detail"] == "Unauthorized"

    forged = client.post(
        "/api/v1/generate-guide",
        json={"destination": "Bali"},
        headers=_auth_header("not-a-real-token"),
    )
    assert forged.status_code == 401
    assert called["value"] is False


def test_generate_guide_accepts_valid_token(client, monkeypatch):
    called = {"value": False}

    async def _marker(*_args, **_kwargs):
        called["value"] = True
        raise RuntimeError("authorized-generate")

    monkeypatch.setattr("app.main.generate_city_guide", _marker)
    login = client.post(
        "/api/v1/admin/login",
        json={"username": "admin", "password": "bluelog123!"},
    )
    token = login.json()["access_token"]
    response = client.post(
        "/api/v1/generate-guide",
        json={"destination": "Bali"},
        headers=_auth_header(token),
    )
    assert called["value"] is True
    assert response.status_code == 500
    assert "authorized-generate" in response.text


def test_cron_trigger_requires_bearer_token(client, monkeypatch):
    called = {"value": False}

    async def _blocked():
        called["value"] = True
        return {"status": "ok"}

    monkeypatch.setattr("app.main.run_daily_auto_generation", _blocked)
    response = client.post("/api/v1/cron/trigger")
    assert response.status_code == 401
    assert called["value"] is False


def test_approve_requires_bearer_token(client, monkeypatch):
    called = {"value": False}

    async def _blocked(_guide_id):
        called["value"] = True
        return {}

    monkeypatch.setattr("app.main.publish_approved_guide", _blocked)
    missing = client.post("/api/v1/guides/missing_guide.md/approve")
    assert missing.status_code == 401
    bad = client.post(
        "/api/v1/guides/missing_guide.md/approve",
        headers={"Authorization": "Token abc"},
    )
    assert bad.status_code == 401
    assert called["value"] is False


def test_approve_with_valid_token_reaches_publisher(client, monkeypatch):
    seen = {"id": ""}

    async def _missing(guide_id):
        seen["id"] = guide_id
        raise LookupError(guide_id)

    monkeypatch.setattr("app.main.publish_approved_guide", _missing)
    token = issue_admin_token()
    response = client.post(
        "/api/v1/guides/missing_auth_probe_guide.md/approve",
        headers=_auth_header(token),
    )
    assert response.status_code == 404
    assert seen["id"] == "missing_auth_probe_guide.md"


def test_expired_token_is_rejected(monkeypatch):
    monkeypatch.setenv("ADMIN_USERNAME", "admin")
    monkeypatch.setenv("ADMIN_PASSWORD", "bluelog123!")
    monkeypatch.delenv("ADMIN_TOKEN_SECRET", raising=False)
    issued_at = 1_700_000_000
    token = issue_admin_token(now=issued_at)
    monkeypatch.setattr(
        "app.services.auth_service.time.time",
        lambda: issued_at + TOKEN_TTL_SECONDS + 5,
    )
    client = TestClient(app)
    response = client.post(
        "/api/v1/guides/missing_guide.md/approve",
        headers=_auth_header(token),
    )
    assert response.status_code == 401
