import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminAuthHeaders } from "../lib/adminSession";
import { API_BASE_URL } from "../lib/guideCards";

const EMPTY_STATS = {
  total_guides_count: 0,
  approved_count: 0,
  pending_count: 0,
  daily_batch_status: { last_run: "", status: "SUCCESS", target_city: "" },
  agent_health: {
    research_agent: "OK",
    writer_agent: "OK",
    qa_agent: "OK",
    syndication_agent: "OK",
  },
  recent_guides: [],
  marketing_alerts: [],
};

const PIPELINE = [
  ["research_agent", "Research"],
  ["writer_agent", "Writer"],
  ["qa_agent", "QA"],
  ["syndication_agent", "Syndication"],
];

function scoreClass(score) {
  return Number(score) >= 75 ? "score-tag pass" : "score-tag hold";
}

export default function Dashboard({ onUnauthorized }) {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [batching, setBatching] = useState(false);
  const [approvingId, setApprovingId] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [dismissingId, setDismissingId] = useState(null);
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  const loadStats = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
      headers: adminAuthHeaders(),
    });
    if (res.status === 401) {
      onUnauthorizedRef.current();
      throw new Error("Unauthorized");
    }
    if (!res.ok) {
      throw new Error("대시보드 통계를 불러오지 못했습니다.");
    }
    return res.json();
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled && err.message !== "Unauthorized") setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadStats]);

  useEffect(() => {
    if (!batching) return undefined;
    const timer = window.setInterval(() => {
      loadStats()
        .then((data) => setStats(data))
        .catch(() => {});
    }, 4000);
    return () => window.clearInterval(timer);
  }, [batching, loadStats]);

  const triggerBatch = async () => {
    if (batching) return;
    setBatching(true);
    setNotice("");
    setError("");
    setStats((current) => ({
      ...current,
      daily_batch_status: {
        ...current.daily_batch_status,
        status: "RUNNING",
      },
    }));
    try {
      const res = await fetch(`${API_BASE_URL}/cron/trigger`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      if (res.status === 401) {
        onUnauthorizedRef.current();
        return;
      }
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || "배치 실행에 실패했습니다.");
      }
      setNotice("수동 배치 실행이 끝났습니다.");
      const data = await loadStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
      loadStats().then(setStats).catch(() => {});
    } finally {
      setBatching(false);
    }
  };

  const approveGuide = async (filename) => {
    if (!filename || approvingId) return;
    setApprovingId(filename);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/guides/${encodeURIComponent(filename)}/approve`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      if (res.status === 401) {
        onUnauthorizedRef.current();
        return;
      }
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || "승인에 실패했습니다.");
      }
      setNotice(`${filename} 가이드를 승인했습니다.`);
      const data = await loadStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setApprovingId("");
    }
  };

  const copyDraft = async (alert) => {
    const text = alert.body || "";
    setError("");
    const copyWithTextarea = () => {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "0";
      area.style.left = "0";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.focus();
      area.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(area);
      return copied;
    };
    try {
      if (!copyWithTextarea()) {
        if (!navigator.clipboard) throw new Error("copy failed");
        const write = navigator.clipboard.writeText(text);
        const timeout = new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error("copy failed")), 800);
        });
        await Promise.race([write, timeout]);
      }
      setCopiedId(alert.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === alert.id ? null : current));
      }, 2000);
    } catch {
      setError("클립보드에 복사하지 못했습니다.");
    }
  };

  const dismissAlert = async (alertId) => {
    if (dismissingId) return;
    setDismissingId(alertId);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/marketing-alerts/${alertId}`, {
        method: "DELETE",
        headers: adminAuthHeaders(),
      });
      if (res.status === 401) {
        onUnauthorizedRef.current();
        return;
      }
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || "마케팅 알림을 지우지 못했습니다.");
      }
      setNotice("마케팅 초안을 확인 완료로 처리했습니다.");
      const data = await loadStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDismissingId(null);
    }
  };

  const batch = stats.daily_batch_status || EMPTY_STATS.daily_batch_status;
  const health = stats.agent_health || EMPTY_STATS.agent_health;
  const guides = stats.recent_guides || [];
  const alerts = stats.marketing_alerts || [];

  return (
    <section className="dash">
      <header className="dash-header">
        <div>
          <h1>운영 대시보드</h1>
          <p>사이트 콘텐츠, QA 게이트, 파이썬 배치 상태를 한 화면에서 확인합니다.</p>
        </div>
        <button type="button" className="dash-trigger" onClick={triggerBatch} disabled={batching}>
          {batching ? <Loader2 className="spinner" size={16} aria-hidden="true" /> : null}
          {batching ? "배치 실행 중..." : "Manual Batch Trigger (수동 배치 실행)"}
        </button>
      </header>

      {error ? <p className="dash-banner error">{error}</p> : null}
      {notice ? <p className="dash-banner">{notice}</p> : null}

      <div className="dash-cards">
        <article className="dash-card">
          <span>전체 콘텐츠</span>
          <strong>{loading ? "…" : stats.total_guides_count}</strong>
        </article>
        <article className="dash-card">
          <span>QA 75점+ 자동 발행</span>
          <strong>{loading ? "…" : stats.approved_count}</strong>
        </article>
        <article className="dash-card">
          <span>검수 대기 보류</span>
          <strong>{loading ? "…" : stats.pending_count}</strong>
        </article>
        <article className={`dash-card batch ${String(batch.status || "").toLowerCase()}`}>
          <span>배치 봇 상태</span>
          <strong>{batch.status || "SUCCESS"}</strong>
          <small>
            {batch.target_city || "—"}
            {" · "}
            {batch.last_run || "기록 없음"}
          </small>
        </article>
      </div>

      <section className="health-panel" aria-label="에이전트 파이프라인 헬스체크">
        <h2>Agent pipeline</h2>
        <ol className="health-bar">
          {PIPELINE.map(([key, label], index) => {
            const state = health[key] || "OK";
            const ok = state === "OK";
            return (
              <li key={key} className={ok ? "health-step ok" : "health-step down"}>
                {index > 0 ? <span className="health-arrow" aria-hidden="true">→</span> : null}
                <span className="health-name">{label}</span>
                <span className="health-state">{state}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="dash-table-wrap">
        <h2>최근 생성 가이드</h2>
        <table className="dash-table">
          <thead>
            <tr>
              <th>도시</th>
              <th>QA 점수</th>
              <th>발행 상태</th>
              <th>생성일시</th>
              <th>조치</th>
            </tr>
          </thead>
          <tbody>
            {guides.length === 0 ? (
              <tr>
                <td colSpan={5}>{loading ? "불러오는 중..." : "생성된 가이드가 없습니다."}</td>
              </tr>
            ) : (
              guides.map((guide) => (
                <tr key={guide.filename}>
                  <td>
                    <strong>{guide.city}</strong>
                    <small>{guide.filename}</small>
                  </td>
                  <td>
                    <span className={scoreClass(guide.qa_score)}>{guide.qa_score}</span>
                  </td>
                  <td>{guide.is_approved ? "발행" : "보류"}</td>
                  <td>{guide.created_at}</td>
                  <td>
                    <button
                      type="button"
                      className="approve-btn"
                      disabled={guide.is_approved || approvingId === guide.filename}
                      onClick={() => approveGuide(guide.filename)}
                    >
                      {guide.is_approved ? "승인됨" : "승인 (Approve)"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="marketing-panel" aria-label="Marketing Alerts (Reddit Drafts)">
        <h2>Marketing Alerts (Reddit Drafts)</h2>
        {alerts.length === 0 ? (
          <p className="marketing-empty">{loading ? "불러오는 중..." : "저장된 Reddit 초안이 없습니다."}</p>
        ) : (
          <ul className="marketing-list">
            {alerts.map((alert) => (
              <li key={alert.id} className="marketing-card">
                <header>
                  <div>
                    <strong>{alert.title || alert.guide_id}</strong>
                    <small>
                      {alert.guide_id}
                      {" · "}
                      {alert.created_at}
                    </small>
                  </div>
                  <div className="marketing-actions">
                    <button type="button" className="alert-copy" onClick={() => copyDraft(alert)}>
                      {copiedId === alert.id ? "Copied" : "Copy to Clipboard"}
                    </button>
                    <button
                      type="button"
                      className="alert-dismiss"
                      disabled={dismissingId === alert.id}
                      onClick={() => dismissAlert(alert.id)}
                    >
                      {dismissingId === alert.id ? "처리 중..." : "Dismiss (확인 완료)"}
                    </button>
                  </div>
                </header>
                <pre className="alert-body">{alert.body}</pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
