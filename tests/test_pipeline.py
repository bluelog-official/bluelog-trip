import asyncio
import re
from httpx import AsyncClient, ASGITransport
from app.main import app

async def run_pipeline_test():
    print("\n🧪 [Self-Healing Test] /api/v1/generate-guide 파이프라인 자율 검증 시작...")
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 테스트 요청 전송 (Bali 목적지)
        response = await client.post("/api/v1/generate-guide", json={"destination": "Bali"})
        
        print(f"📡 응답 상태 코드: {response.status_code}")
        assert response.status_code == 200, f"HTTP Error {response.status_code}: {response.text}"
        
        data = response.json()
        assert "article_markdown" in data, "응답에 article_markdown 필드가 없습니다."
        assert "qa_result" in data, "응답에 qa_result 필드가 없습니다."
        assert data["qa_result"]["quality_score"] >= 75, "QA 점수가 기준보다 낮습니다."
        assert data["qa_result"]["is_approved"] is False, "생성 직후 가이드는 검수 전이어야 합니다."
        assert data.get("research_model"), "응답에 research_model 필드가 없습니다."
        assert data.get("writer_model"), "응답에 writer_model 필드가 없습니다."
        assert "model_used" not in data, "레거시 model_used 필드가 응답에 남아 있습니다."
        assert re.search(
            r"!\[[^\]]*\]\(https?://", data["article_markdown"]
        ), "아티클에 이미지 마크다운 URL이 없습니다."

        print(
            "✅ [테스트 성공] Research: {0} / Writer: {1}".format(
                data["research_model"], data["writer_model"]
            )
        )
        print("🎉 파이프라인 검증 완료! 에러 없이 정상 동작합니다.\n")

if __name__ == "__main__":
    asyncio.run(run_pipeline_test())