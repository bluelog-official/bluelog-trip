"""관리자 모니터링 대시보드 응답 계약."""

from typing import List, Literal

from pydantic import BaseModel, Field


class DailyBatchStatus(BaseModel):
    last_run: str = Field(description="마지막 배치 시각. YYYY-MM-DD HH:MM")
    status: Literal["SUCCESS", "RUNNING", "FAILED"]
    target_city: str


class AgentHealth(BaseModel):
    research_agent: str
    writer_agent: str
    qa_agent: str
    syndication_agent: str


class RecentGuide(BaseModel):
    filename: str
    city: str
    qa_score: int
    created_at: str
    is_approved: bool


class DashboardStats(BaseModel):
    total_guides_count: int
    approved_count: int
    pending_count: int
    daily_batch_status: DailyBatchStatus
    agent_health: AgentHealth
    recent_guides: List[RecentGuide]
