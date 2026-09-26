import asyncio
import os
from pathlib import Path
from xml.etree import ElementTree

from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.scheduler_service import OUTPUT_DIR, TARGET_CITIES, start_scheduler

async def run_scheduler_test():
    print("\n🧪 [Scheduler Test] cron 엔드포인트와 1회 자동 생성 검증 시작...")
    start_scheduler()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        status_response = await client.get("/api/v1/cron/status")
        print("📡 status 상태 코드: {0}".format(status_response.status_code))
        assert status_response.status_code == 200, status_response.text
        status_payload = status_response.json()
        assert status_payload["running"] is True, "스케줄러가 실행 중이 아닙니다."
        assert status_payload["next_run_time"], "다음 실행 시각이 없습니다."
        assert status_payload["next_city"] in TARGET_CITIES

        login = await client.post(
            "/api/v1/admin/login",
            json={
                "username": os.getenv("ADMIN_USERNAME", "admin"),
                "password": os.getenv("ADMIN_PASSWORD", "bluelog123!"),
            },
        )
        assert login.status_code == 200, login.text
        token = login.json()["access_token"]
        auth_headers = {"Authorization": "Bearer {0}".format(token)}

        trigger_response = await client.post("/api/v1/cron/trigger", headers=auth_headers)
        print("📡 trigger 상태 코드: {0}".format(trigger_response.status_code))
        assert trigger_response.status_code == 200, trigger_response.text
        generated = trigger_response.json()
        assert generated["status"] == "ok"
        assert generated["destination"] in TARGET_CITIES
        score = generated["qa_result"]["quality_score"]
        if score >= 75:
            assert generated["published"] is True
            assert generated["qa_result"]["is_approved"] is True
            assert generated["seo_ping"]["ping_url"].startswith("http://www.google.com/ping?sitemap=")
        else:
            assert generated["published"] is False
            assert generated["qa_result"]["is_approved"] is False
            assert "seo_ping" not in generated

        syndication = generated["syndication"]
        for platform in ("reddit", "quora", "pinterest", "backlink"):
            assert syndication.get(platform), "{0} 홍보 데이터가 없습니다.".format(platform)
        assert syndication["reddit"]["title"]
        assert syndication["quora"]["question"]
        assert syndication["pinterest"]["pin_title"]
        assert syndication["backlink"]["target_path"].endswith(generated["guide_id"])

        guide_file = Path(generated["file_path"])
        assert guide_file.exists(), "가이드 파일이 저장되지 않았습니다."
        assert guide_file.parent == OUTPUT_DIR
        assert "![" in guide_file.read_text(encoding="utf-8")

        sitemap_response = await client.get("/api/v1/sitemap.xml")
        print("📡 sitemap 상태 코드: {0}".format(sitemap_response.status_code))
        assert sitemap_response.status_code == 200, sitemap_response.text
        root = ElementTree.fromstring(sitemap_response.text)
        locations = [node.text or "" for node in root.iter() if node.tag.endswith("loc")]
        if generated["published"]:
            assert any(generated["guide_id"] in loc for loc in locations), "자동 승인 가이드가 sitemap에 없습니다."
        else:
            assert all(generated["guide_id"] not in loc for loc in locations), "검수 전 가이드가 sitemap에 포함되었습니다."

        approve_response = await client.post(
            "/api/v1/guides/{0}/approve".format(generated["guide_id"]),
            headers=auth_headers,
        )
        print("📡 approve 상태 코드: {0}".format(approve_response.status_code))
        assert approve_response.status_code == 200, approve_response.text
        approved = approve_response.json()
        assert approved["qa_result"]["is_approved"] is True
        assert approved["seo_ping"]["ping_url"].startswith("http://www.google.com/ping?sitemap=")

        published_sitemap = await client.get("/api/v1/sitemap.xml")
        published_root = ElementTree.fromstring(published_sitemap.text)
        published_locations = [node.text or "" for node in published_root.iter() if node.tag.endswith("loc")]
        assert any(generated["guide_id"] in loc for loc in published_locations), "승인 후 sitemap에 가이드가 없습니다."

        print("✅ [테스트 성공] {0} -> {1}".format(generated["destination"], generated["guide_id"]))
        print("🎉 스케줄러 검증 완료! 자동 생성과 sitemap 갱신이 정상 동작합니다.\n")


if __name__ == "__main__":
    asyncio.run(run_scheduler_test())
