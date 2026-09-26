import { useEffect } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdminDrawer({
  open,
  onClose,
  destination,
  onDestinationChange,
  loading,
  statusMessage,
  onSubmit,
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-root">
      <button type="button" className="drawer-backdrop" aria-label={t("admin.close")} onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="generator-title">
        <header className="drawer-header">
          <div>
            <p className="drawer-kicker">{t("admin.kicker")}</p>
            <h2 id="generator-title">{t("admin.title")}</h2>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label={t("admin.closeButton")}>
            <X size={18} />
          </button>
        </header>
        <p className="drawer-note">
          {t("admin.note")} {t("admin.languageName")}
        </p>
        <form className="gen-form" onSubmit={onSubmit}>
          <label className="gen-label" htmlFor="target-city">
            {t("admin.destination")}
          </label>
          <input
            id="target-city"
            className="gen-input"
            type="text"
            placeholder={t("admin.placeholder")}
            value={destination}
            onChange={(event) => onDestinationChange(event.target.value)}
            disabled={loading}
            autoFocus
          />
          <button type="submit" className="gen-submit" disabled={loading} aria-busy={loading}>
            {loading ? (
              <Loader2 className="spinner" size={16} aria-label={t("admin.generating")} />
            ) : (
              <>
                <Sparkles size={16} /> {t("admin.submit")}
              </>
            )}
          </button>
        </form>
        {statusMessage ? <div className="gen-status">{statusMessage}</div> : null}
      </aside>
    </div>
  );
}
