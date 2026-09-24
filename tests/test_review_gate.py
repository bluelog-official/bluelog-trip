"""휴먼 리뷰 승인 시점의 sitemap ping과 3단 광고 배치를 검증한다."""

import asyncio
import json
import subprocess
from pathlib import Path
from xml.etree import ElementTree

from app.services import guide_service, scheduler_service
from app.services.guide_service import save_guide
from tests.test_seo_ping import _Response, _sample_response

ROOT = Path(__file__).resolve().parents[1]


def test_ad_slots_are_three_positions_and_hidden_until_approval():
    script = """
import { planAdSlots, visibleAdSlots } from "./frontend/src/components/adSlotPlan.js";

const withTable = [
  "인트로 문단입니다.",
  "",
  "## 시작",
  "본문",
  "",
  "## 추천 코스",
  "",
  "| 카테고리 | 장소 |",
  "| --- | --- |",
  "| 식사 | 시장 |",
  "",
  "## 결론",
  "마무리 문단",
  "",
  "## FAQ",
  "질문과 답",
].join("\\n");

const withoutTable = [
  "인트로",
  "## 첫 구간",
  "본문",
  "## 둘째 구간",
  "본문",
  "## Conclusion",
  "끝",
].join("\\n");

const plan = planAdSlots(withTable);
const fallback = planAdSlots(withoutTable);
console.log(JSON.stringify({
  hidden: visibleAdSlots(withTable, false),
  shown: visibleAdSlots(withTable, true),
  inArticle: plan.inArticle,
  multiplexAfterH2: plan.multiplexAfterH2,
  fallbackInArticle: fallback.inArticle,
  fallbackMultiplex: fallback.multiplexAfterH2,
}));
"""
    completed = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=str(ROOT),
        check=True,
        capture_output=True,
        text=True,
    )
    payload = json.loads(completed.stdout)
    assert payload["hidden"] == []
    assert payload["shown"] == ["display", "in-article", "multiplex"]
    assert payload["inArticle"] == {"type": "table", "index": 1}
    assert payload["multiplexAfterH2"] == 4
    assert payload["fallbackInArticle"] == {"type": "h2", "index": 2}
    assert payload["fallbackMultiplex"] == 3


def test_approve_refreshes_sitemap_and_pings(monkeypatch, tmp_path):
    response = _sample_response()
    guide_id = "new_york_guide.md"
    order = []
    previous_store = dict(guide_service._GUIDE_STORE)
    guide_service._GUIDE_STORE.clear()

    def fake_get(url, timeout=10):
        order.append("ping")
        assert scheduler_service.SITEMAP_PATH.exists()
        assert url.startswith("http://www.google.com/ping?sitemap=")
        return _Response(200)

    monkeypatch.setattr(guide_service, "_OUTPUT_DIR", tmp_path)
    monkeypatch.setattr(scheduler_service, "OUTPUT_DIR", tmp_path)
    monkeypatch.setattr(scheduler_service, "SITEMAP_PATH", tmp_path / "sitemap.xml")
    monkeypatch.setattr(scheduler_service.requests, "get", fake_get)
    (tmp_path / "draft_guide.md").write_text("## 미승인 초안\n", encoding="utf-8")
    save_guide(guide_id, response)

    try:
        pending = guide_service.get_guide(guide_id)
        assert pending["qa_result"]["is_approved"] is False

        published = asyncio.run(scheduler_service.publish_approved_guide(guide_id))
        assert published["qa_result"]["is_approved"] is True
        assert published["seo_ping"]["ok"] is True
        assert order == ["ping"]
        assert guide_service.get_guide(guide_id)["qa_result"]["is_approved"] is True

        root = ElementTree.fromstring((tmp_path / "sitemap.xml").read_text(encoding="utf-8"))
        locations = [node.text or "" for node in root.iter() if node.tag.endswith("loc")]
        assert any(guide_id in loc for loc in locations)
        assert all("draft_guide.md" not in loc for loc in locations)
    finally:
        guide_service._GUIDE_STORE.clear()
        guide_service._GUIDE_STORE.update(previous_store)


def test_approve_missing_guide_raises(monkeypatch, tmp_path):
    previous_store = dict(guide_service._GUIDE_STORE)
    guide_service._GUIDE_STORE.clear()
    monkeypatch.setattr(guide_service, "_OUTPUT_DIR", tmp_path)
    try:
        try:
            asyncio.run(scheduler_service.publish_approved_guide("missing_guide.md"))
            raised = False
        except LookupError:
            raised = True
        assert raised is True
    finally:
        guide_service._GUIDE_STORE.clear()
        guide_service._GUIDE_STORE.update(previous_store)
