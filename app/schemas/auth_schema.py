"""관리자 로그인 요청과 토큰 응답 계약."""

from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(description="관리자 ID")
    password: str = Field(description="관리자 비밀번호")


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
