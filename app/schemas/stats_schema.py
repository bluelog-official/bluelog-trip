"""방문자 카운터 API 응답 계약."""

from pydantic import BaseModel, Field


class VisitorStats(BaseModel):
    today: int = Field(description="오늘(Asia/Seoul) 순 방문자 수")
    total: int = Field(description="누적 순 방문자 수")
    date: str = Field(description="집계 기준일. YYYY-MM-DD")


class VisitorHit(VisitorStats):
    counted: bool = Field(description="이번 요청이 새 방문으로 집계되었는지")
