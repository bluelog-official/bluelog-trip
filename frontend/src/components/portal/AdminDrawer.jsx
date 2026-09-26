import { useEffect } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { uiCopy } from "../../lib/localeCopy";

export default function AdminDrawer({
  open,
  onClose,
  destination,
  onDestinationChange,
  language,
  loading,
  statusMessage,
  onSubmit,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const copy = uiCopy(language);

  return (
    <div className="drawer-root">
      <button type="button" className="drawer-backdrop" aria-label="Close generator" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="generator-title">
        <header className="drawer-header">
          <div>
            <p className="drawer-kicker">Admin</p>
            <h2 id="generator-title">Generator</h2>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <p className="drawer-note">
          {copy.adminNote} {copy.adminLanguage}
        </p>
        <form className="gen-form" onSubmit={onSubmit}>
          <label className="gen-label" htmlFor="target-city">
            {copy.adminDestination}
          </label>
          <input
            id="target-city"
            className="gen-input"
            type="text"
            placeholder={copy.adminPlaceholder}
            value={destination}
            onChange={(event) => onDestinationChange(event.target.value)}
            disabled={loading}
            autoFocus
          />
          <button type="submit" className="gen-submit" disabled={loading} aria-busy={loading}>
            {loading ? (
              <Loader2 className="spinner" size={16} aria-label={copy.adminGenerating} />
            ) : (
              <>
                <Sparkles size={16} /> {copy.adminSubmit}
              </>
            )}
          </button>
        </form>
        {statusMessage ? <div className="gen-status">{statusMessage}</div> : null}
      </aside>
    </div>
  );
}
