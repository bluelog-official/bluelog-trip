import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../lib/guideCards";

let visitorRequest = null;

function loadVisitorCounts() {
  if (!visitorRequest) {
    visitorRequest = (async () => {
      try {
        await fetch(`${API_BASE_URL}/stats/hit`, { method: "POST", keepalive: true });
      } catch (err) {
        console.error("visitor hit failed:", err);
      }
      const res = await fetch(`${API_BASE_URL}/stats/visitors`);
      if (!res.ok) {
        throw new Error("visitor stats unavailable");
      }
      return res.json();
    })();
  }
  return visitorRequest;
}

export default function VisitorBadge() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadVisitorCounts()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        console.error("visitor stats failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;

  const today = Number(stats.today) || 0;
  const total = Number(stats.total) || 0;

  return (
    <div className="visitor-badge-row">
      <p className="visitor-badge" aria-live="polite">
        {t("visitors.badge", { today, total })}
      </p>
    </div>
  );
}
