import GuideArticle from "./GuideArticle";
import ViralExport from "../ViralExport";
import { readGuideApproved } from "../adSlotPlan";
import { uiCopy } from "../../lib/localeCopy";

export default function ArticleReader({
  guide,
  fileName,
  tab,
  onTabChange,
  publishing,
  onApprove,
  onBack,
  onOpenCommunity,
  onNavigate,
  language,
}) {
  const copy = uiCopy(language);

  if (!guide) {
    return <p className="grid-empty">{copy.loadingGuide}</p>;
  }

  const approved = readGuideApproved(guide);

  return (
    <div className="detail-panel">
      <button type="button" className="back-link" onClick={onBack}>
        ← {copy.back}
      </button>
      {tab === "article" ? (
        <GuideArticle
          guide={guide}
          fileName={fileName}
          language={language}
          onNavigate={onNavigate}
        />
      ) : null}
      <div className="review-bar">
        <div>
          <strong>{approved ? copy.reviewApproved : copy.reviewPending}</strong>
          <p>{approved ? copy.reviewApprovedHelp : copy.reviewPendingHelp}</p>
        </div>
        <button
          type="button"
          className="approve-btn"
          onClick={onApprove}
          disabled={approved || publishing}
        >
          {publishing ? copy.publishing : copy.approve}
        </button>
      </div>
      <div className="reader-tools">
        <div className="detail-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "article"}
            className={tab === "article" ? "detail-tab active" : "detail-tab"}
            onClick={() => onTabChange("article")}
          >
            Article
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "viral"}
            className={tab === "viral" ? "detail-tab active" : "detail-tab"}
            onClick={() => onTabChange("viral")}
          >
            Viral Export
          </button>
        </div>
        <button type="button" className="text-link" onClick={onOpenCommunity}>
          Open Community & Viral Log
        </button>
      </div>
      {tab === "viral" ? (
        <ViralExport syndication={guide.syndication} language={language} />
      ) : null}
    </div>
  );
}
