"""방문자 통계 HTTP 라우트. 집계 로직은 stats_service에 둔다."""

from fastapi import APIRouter, Request

from app.schemas.stats_schema import VisitorHit, VisitorStats
from app.services.stats_service import record_hit, visitor_counts

router = APIRouter(prefix="/api/v1/stats", tags=["stats"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


@router.get("/visitors", response_model=VisitorStats)
def get_visitor_stats() -> VisitorStats:
    return VisitorStats.model_validate(visitor_counts())


@router.post("/hit", response_model=VisitorHit)
def post_visitor_hit(request: Request) -> VisitorHit:
    return VisitorHit.model_validate(record_hit(_client_ip(request)))
