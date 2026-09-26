"""마케팅 초안을 관리자 알림 테이블에 저장한다. LLM 의존성 없음."""

from datetime import datetime, timezone
from typing import Any, Dict, List

from app.models.daily_stats import (
    connect,
    delete_marketing_alert,
    fetch_marketing_alerts,
    insert_marketing_alert,
)
from app.services.stats_service import db_path


def save_marketing_alert(
    guide_id: str,
    channel: str,
    title: str,
    body: str,
) -> Dict[str, Any]:
    """Reddit 등 직접 게시하지 않는 초안을 DB 알림으로 남긴다."""
    created_at = datetime.now(timezone.utc).isoformat()
    conn = connect(db_path())
    try:
        alert_id = insert_marketing_alert(
            conn,
            guide_id=guide_id or "unknown",
            channel=channel,
            title=title,
            body=body,
            created_at=created_at,
        )
    finally:
        conn.close()
    return {
        "id": alert_id,
        "guide_id": guide_id,
        "channel": channel,
        "title": title,
        "body": body,
        "created_at": created_at,
    }


def list_marketing_alerts(limit: int = 20) -> List[Dict[str, Any]]:
    """대시보드에 보여줄 최근 마케팅 초안."""
    conn = connect(db_path())
    try:
        return fetch_marketing_alerts(conn, limit)
    finally:
        conn.close()


def dismiss_marketing_alert(alert_id: int) -> bool:
    """관리자가 확인한 초안을 목록에서 제거한다."""
    conn = connect(db_path())
    try:
        return delete_marketing_alert(conn, alert_id)
    finally:
        conn.close()
