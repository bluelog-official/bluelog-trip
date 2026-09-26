"""sitemap 갱신 이후 Google ping이 비동기로 호출되는지 검증한다."""

import asyncio

from app.schemas.guide_schema import ResearchOutput
from app.services import scheduler_service
from app.services.guide_service import build_generate_response


def _sample_response():
    research = ResearchOutput(
        attractions=["Central Park", "Statue of Liberty", "Times Square"],
        food_spots=["Katz's Delicatessen"],
        seo_keywords=["뉴욕 3박4일 일정"],
        target_currency="$",
        local_tip="메트로카드를 미리 충전한다.",
    )
    article = "## 뉴욕 여행 코스\n\n" + ("현지 동선을 기준으로 비용을 나눴다. " * 40)
    article += (
        "\n\n| 카테고리 | 추천 장소 | 예상 비용 | 별점 |\n"
        "| --- | --- | --- | --- |\n"
        "| 식사 | Katz | $20 | 5 |\n"
    )
    return build_generate_response(
        destination="New York",
        article_markdown=article,
        research_model="test-research",
        writer_model="test-writer",
        research=research,
        guide_id="new_york_guide.md",
    )


class _Response:
    def __init__(self, status_code):
        self.status_code = status_code


def test_ping_uses_google_sitemap_endpoint(monkeypatch):
    captured = {}

    def fake_get(url, timeout=10):
        captured["url"] = url
        captured["timeout"] = timeout
        return _Response(200)

    monkeypatch.setattr(scheduler_service.requests, "get", fake_get)
    result = asyncio.run(
        scheduler_service.ping_google_sitemap("http://127.0.0.1:8000/api/v1/sitemap.xml")
    )

    assert result["ok"] is True
    assert result["status_code"] == 200
    assert captured["timeout"] == 10
    assert captured["url"] == (
        "http://www.google.com/ping?sitemap="
        "http%3A%2F%2F127.0.0.1%3A8000%2Fapi%2Fv1%2Fsitemap.xml"
    )


def test_ping_failure_does_not_raise(monkeypatch):
    def fake_get(url, timeout=10):
        raise OSError("network down")

    monkeypatch.setattr(scheduler_service.requests, "get", fake_get)
    result = asyncio.run(
        scheduler_service.ping_google_sitemap("http://example.com/sitemap.xml")
    )

    assert result["ok"] is False
    assert result["status_code"] is None
    assert "network down" in result["error"]


def test_daily_generation_publishes_passing_guide(monkeypatch, tmp_path):
    from app.services import guide_service

    response = _sample_response()
    order = []
    previous_store = dict(guide_service._GUIDE_STORE)
    guide_service._GUIDE_STORE.clear()

    async def fake_generate(destination, keyword=""):
        order.append(("generate", destination, keyword))
        assert destination == "New York"
        assert keyword == ""
        return response

    def fake_get(url, timeout=10):
        order.append("ping")
        return _Response(200)

    monkeypatch.setattr(guide_service, "_OUTPUT_DIR", tmp_path)
    monkeypatch.setattr(scheduler_service, "OUTPUT_DIR", tmp_path)
    monkeypatch.setattr(scheduler_service, "SITEMAP_PATH", tmp_path / "sitemap.xml")
    monkeypatch.setattr(scheduler_service, "STATE_PATH", tmp_path / "scheduler_state.json")
    marketing_calls = []

    def fake_marketing(guide_data):
        marketing_calls.append(guide_data.get("id"))

    monkeypatch.setattr(scheduler_service, "generate_city_guide", fake_generate)
    monkeypatch.setattr(scheduler_service.requests, "get", fake_get)
    monkeypatch.setattr(scheduler_service, "run_marketing_pipeline", fake_marketing)

    try:
        result = asyncio.run(scheduler_service.run_daily_auto_generation())
    finally:
        guide_service._GUIDE_STORE.clear()
        guide_service._GUIDE_STORE.update(previous_store)

    assert result["status"] == "ok"
    assert result["published"] is True
    assert result["qa_result"]["quality_score"] >= 75
    assert result["qa_result"]["is_approved"] is True
    assert result["seo_ping"]["ok"] is True
    assert order[0][0] == "generate"
    assert "ping" in order
    assert marketing_calls == ["new_york_guide.md"]
    assert (tmp_path / "new_york_guide.md").exists()
    sitemap = (tmp_path / "sitemap.xml").read_text(encoding="utf-8")
    assert "new_york_guide.md" in sitemap


def test_daily_generation_holds_low_score(monkeypatch, tmp_path):
    from app.services import guide_service
    from app.services.guide_service import build_generate_response

    article = "짧은 초안입니다."
    response = build_generate_response(
        destination="New York",
        article_markdown=article,
        research_model="test-research",
        writer_model="test-writer",
        guide_id="new_york_guide.md",
    )
    order = []
    previous_store = dict(guide_service._GUIDE_STORE)

    async def fake_generate(destination, keyword=""):
        order.append("generate")
        return response

    def fail_get(url, timeout=10):
        order.append("ping")
        raise AssertionError("low score must not ping Google")

    monkeypatch.setattr(scheduler_service, "OUTPUT_DIR", tmp_path)
    monkeypatch.setattr(scheduler_service, "SITEMAP_PATH", tmp_path / "sitemap.xml")
    monkeypatch.setattr(scheduler_service, "STATE_PATH", tmp_path / "scheduler_state.json")
    marketing_calls = []

    monkeypatch.setattr(scheduler_service, "generate_city_guide", fake_generate)
    monkeypatch.setattr(scheduler_service.requests, "get", fail_get)
    monkeypatch.setattr(
        scheduler_service,
        "run_marketing_pipeline",
        lambda guide_data: marketing_calls.append(guide_data),
    )

    try:
        result = asyncio.run(scheduler_service.run_daily_auto_generation())
    finally:
        guide_service._GUIDE_STORE.clear()
        guide_service._GUIDE_STORE.update(previous_store)

    assert result["status"] == "ok"
    assert result["published"] is False
    assert result["qa_result"]["quality_score"] < 75
    assert result["qa_result"]["is_approved"] is False
    assert "seo_ping" not in result
    assert order == ["generate"]
    assert marketing_calls == []
    assert (tmp_path / "new_york_guide.md").exists()
    assert not (tmp_path / "sitemap.xml").exists()


def test_daily_generation_skips_existing_city(monkeypatch, tmp_path):
    (tmp_path / "new_york_guide.md").write_text("## 기존\n", encoding="utf-8")
    seen = []

    async def fake_generate(destination, keyword=""):
        seen.append(destination)
        raise AssertionError("existing New York should be skipped before generate")

    monkeypatch.setattr(scheduler_service, "OUTPUT_DIR", tmp_path)
    monkeypatch.setattr(scheduler_service, "SITEMAP_PATH", tmp_path / "sitemap.xml")
    monkeypatch.setattr(scheduler_service, "STATE_PATH", tmp_path / "scheduler_state.json")
    monkeypatch.setattr(scheduler_service, "generate_city_guide", fake_generate)

    pending = scheduler_service.select_pending_city()
    assert pending == "Los Angeles"
    assert seen == []
