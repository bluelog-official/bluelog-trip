import AdSenseUnit from "../AdSenseUnit";
import { PLATFORM_LABELS, formatPostDate, latestViralLogs } from "../../lib/communityStore";
import { popularDestinations } from "../../lib/guideCards";
import { uiCopy } from "../../lib/localeCopy";

export default function PortalSidebar({ cards, posts, onPickDestination, onOpenLog, language }) {
  const copy = uiCopy(language);
  const popular = popularDestinations(cards, 5);
  const logs = latestViralLogs(posts, 5);

  return (
    <aside className="portal-side" aria-label="Highlights">
      <section className="side-card">
        <h2>{copy.popularTitle}</h2>
        {popular.length === 0 ? (
          <p className="side-empty">{copy.popularEmpty}</p>
        ) : (
          <ol className="rank-list">
            {popular.map((card, index) => (
              <li key={card.id}>
                <button type="button" onClick={() => onPickDestination(card.destination)}>
                  <span className="rank-no">{index + 1}</span>
                  <span className="rank-copy">
                    <strong>{card.destination}</strong>
                    <small>{card.approved ? "Verified Guide" : "Checked by Local AI"}</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="side-card">
        <h2>{copy.viralTitle}</h2>
        {logs.length === 0 ? (
          <p className="side-empty">{copy.viralEmpty}</p>
        ) : (
          <ul className="log-list">
            {logs.map((post) => (
              <li key={post.id}>
                <button type="button" onClick={() => onOpenLog(post)}>
                  <span className={`platform-pill ${post.platform}`}>
                    {PLATFORM_LABELS[post.platform] || post.platform}
                  </span>
                  <strong>{post.title}</strong>
                  <small>
                    {post.metric ? `${post.metric} · ` : ""}
                    {formatPostDate(post.createdAt)}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <AdSenseUnit slotId="sidebar-bottom" format="auto" className="side-ad" />
    </aside>
  );
}
