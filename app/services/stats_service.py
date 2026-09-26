"""날짜별 순 방문자 집계. LLM 의존성 없음."""

import hashlib
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Set
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.models.daily_stats import connect, fetch_counts, record_unique_visit

_ROOT_DIR = Path(__file__).resolve().parents[2]
_LOCK = threading.Lock()
_DAY_CACHE: Dict[str, Set[str]] = {}
_CACHE_DB = ""


def _seoul_timezone():
    try:
        return ZoneInfo("Asia/Seoul")
    except ZoneInfoNotFoundError:
        return timezone.utc


def current_stat_date() -> str:
    """집계 기준일. Asia/Seoul 달력의 YYYY-MM-DD."""
    now = datetime.now(timezone.utc).astimezone(_seoul_timezone())
    return now.date().isoformat()


def db_path() -> Path:
    override = os.getenv("STATS_DB_PATH", "").strip()
    if override:
        return Path(override)
    return _ROOT_DIR / "output" / "visitor_stats.db"


def reset_visitor_cache() -> None:
    """테스트가 DB 파일을 바꿀 때 메모리 중복 캐시를 비운다."""
    global _CACHE_DB
    with _LOCK:
        _DAY_CACHE.clear()
        _CACHE_DB = ""


def _hash_ip(ip: str) -> str:
    salt = os.getenv("STATS_IP_SALT", "bluelog-visitor").strip() or "bluelog-visitor"
    material = "{0}|{1}".format(salt, (ip or "unknown").strip() or "unknown")
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def _sync_cache_db() -> None:
    global _CACHE_DB
    path = str(db_path())
    if path != _CACHE_DB:
        _DAY_CACHE.clear()
        _CACHE_DB = path


def _read_counts(stat_date: str):
    conn = connect(db_path())
    try:
        return fetch_counts(conn, stat_date)
    finally:
        conn.close()


def visitor_counts() -> Dict[str, object]:
    stat_date = current_stat_date()
    with _LOCK:
        today, total = _read_counts(stat_date)
    return {"today": today, "total": total, "date": stat_date}


def record_hit(ip: str) -> Dict[str, object]:
    """같은 IP 해시는 해당 날짜에 한 번만 today/total을 올린다."""
    stat_date = current_stat_date()
    digest = _hash_ip(ip)
    with _LOCK:
        _sync_cache_db()
        for key in list(_DAY_CACHE):
            if key != stat_date:
                _DAY_CACHE.pop(key, None)
        seen = _DAY_CACHE.setdefault(stat_date, set())
        if digest in seen:
            today, total = _read_counts(stat_date)
            return {"counted": False, "today": today, "total": total, "date": stat_date}

        conn = connect(db_path())
        try:
            counted = record_unique_visit(conn, stat_date, digest)
        finally:
            conn.close()
        seen.add(digest)
        today, total = _read_counts(stat_date)
        return {"counted": counted, "today": today, "total": total, "date": stat_date}
