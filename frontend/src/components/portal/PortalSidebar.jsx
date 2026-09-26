import { useTranslation } from "react-i18next";
import AdSenseUnit from "../AdSenseUnit";
import { formatPostDate, latestViralLogs } from "../../lib/communityStore";
import { popularDestinations } from "../../lib/guideCards";
import i18n, { appLanguage } from "../../i18n/i18n";

export default function PortalSidebar({ cards, posts, onPickDestination, onOpenLog }) {
  const { t } = useTranslation();
  const language = appLanguage();
  const popular = popularDestinations(cards, 5);
  const logs = latestViralLogs(posts, 5);

  return (
    <aside className="portal-side" aria-label={t("sidebar.highlights")}>
      <section className="side-card">
        <h2>{t("sidebar.popularTitle")}</h2>
        {popular.length === 0 ? (
          <p className="side-empty">{t("sidebar.popularEmpty")}</p>
        ) : (
          <ol className="rank-list">
            {popular.map((card, index) => (
              <li key={card.id}>
                <button type="button" onClick={() => onPickDestination(card.destination)}>
                  <span className="rank-no">{index + 1}</span>
                  <span className="rank-copy">
                    <strong>{card.destination}</strong>
                    <small>{card.approved ? t("catalog.verified") : t("catalog.checked")}</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="side-card">
        <h2>{t("sidebar.viralTitle")}</h2>
        {logs.length === 0 ? (
          <p className="side-empty">{t("sidebar.viralEmpty")}</p>
        ) : (
          <ul className="log-list">
            {logs.map((post) => {
              const titleKey = `community.seeds.${post.id}.title`;
              const title = i18n.exists(titleKey) ? t(titleKey) : post.title;
              const metricKey = `community.seeds.${post.id}.metric`;
              const metric = i18n.exists(metricKey) ? t(metricKey) : post.metric;
              return (
                <li key={post.id}>
                  <button type="button" onClick={() => onOpenLog(post)}>
                    <span className={`platform-pill ${post.platform}`}>
                      {t(`community.labels.${post.platform}`, { defaultValue: post.platform })}
                    </span>
                    <strong>{title}</strong>
                    <small>
                      {metric ? `${metric} · ` : ""}
                      {formatPostDate(post.createdAt, language)}
                    </small>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <AdSenseUnit slotId="sidebar-bottom" format="auto" className="side-ad" />
    </aside>
  );
}
