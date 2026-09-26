"""DailyStats SQLite 테이블. 원본 IP는 저장하지 않고 해시만 중복 방지에 쓴다."""

import sqlite3
from pathlib import Path
from typing import Tuple


_SCHEMA = """
CREATE TABLE IF NOT EXISTS daily_stats (
    stat_date TEXT PRIMARY KEY,
    visitor_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS visitor_seen (
    stat_date TEXT NOT NULL,
    ip_hash TEXT NOT NULL,
    PRIMARY KEY (stat_date, ip_hash)
);

CREATE TABLE IF NOT EXISTS marketing_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guide_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
);
"""


def connect(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path), timeout=10, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.executescript(_SCHEMA)
    return conn


def record_unique_visit(conn: sqlite3.Connection, stat_date: str, ip_hash: str) -> bool:
    """같은 날짜·해시 조합은 한 번만 카운트한다. 새로 집계되면 True."""
    conn.execute("BEGIN IMMEDIATE")
    try:
        conn.execute(
            "INSERT OR IGNORE INTO visitor_seen (stat_date, ip_hash) VALUES (?, ?)",
            (stat_date, ip_hash),
        )
        changed = conn.execute("SELECT changes()").fetchone()[0]
        if not changed:
            conn.execute("COMMIT")
            return False
        conn.execute(
            """
            INSERT INTO daily_stats (stat_date, visitor_count)
            VALUES (?, 1)
            ON CONFLICT(stat_date) DO UPDATE SET
                visitor_count = visitor_count + 1
            """,
            (stat_date,),
        )
        conn.execute("COMMIT")
        return True
    except Exception:
        conn.execute("ROLLBACK")
        raise


def fetch_counts(conn: sqlite3.Connection, stat_date: str) -> Tuple[int, int]:
    row = conn.execute(
        "SELECT visitor_count FROM daily_stats WHERE stat_date = ?",
        (stat_date,),
    ).fetchone()
    today = int(row["visitor_count"]) if row else 0
    total_row = conn.execute(
        "SELECT COALESCE(SUM(visitor_count), 0) AS total FROM daily_stats"
    ).fetchone()
    total = int(total_row["total"]) if total_row else 0
    return today, total


def insert_marketing_alert(
    conn: sqlite3.Connection,
    guide_id: str,
    channel: str,
    title: str,
    body: str,
    created_at: str,
) -> int:
    conn.execute("BEGIN IMMEDIATE")
    try:
        cursor = conn.execute(
            """
            INSERT INTO marketing_alerts (guide_id, channel, title, body, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (guide_id, channel, title, body, created_at),
        )
        alert_id = int(cursor.lastrowid)
        conn.execute("COMMIT")
        return alert_id
    except Exception:
        conn.execute("ROLLBACK")
        raise
