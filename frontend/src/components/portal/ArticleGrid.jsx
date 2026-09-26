import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

function CardThumb({ src, title }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className="thumb-fallback" aria-hidden="true">{title.slice(0, 1)}</div>;
  }
  return <img src={src} alt="" onError={() => setFailed(true)} />;
}

function StoryCard({ card, onOpen }) {
  const { t } = useTranslation();
  return (
    <button type="button" className="story-card" onClick={() => onOpen(card)}>
      <div className="thumb-wrap">
        <CardThumb src={card.image} title={card.title} />
        {card.approved ? (
          <span className="qa-badge approved">
            <BadgeCheck size={14} aria-hidden="true" />
            {t("catalog.verified")}
          </span>
        ) : (
          <span className="qa-badge pending">{t("catalog.checked")}</span>
        )}
      </div>
      <div className="story-body">
        <h2>{card.title}</h2>
        <p>{card.summary}</p>
        <ul className="tag-row">
          {card.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>
    </button>
  );
}

export default function ArticleGrid({ cards, loading, error, onOpen }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="card-grid" aria-busy="true" aria-label={t("catalog.loading")}>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="story-skeleton" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="grid-empty">{error}</p>;
  }

  if (cards.length === 0) {
    return <p className="grid-empty">{t("catalog.empty")}</p>;
  }

  return (
    <div className="card-grid">
      {cards.map((card) => (
        <StoryCard key={card.id} card={card} onOpen={onOpen} />
      ))}
    </div>
  );
}
