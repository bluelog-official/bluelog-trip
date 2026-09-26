import { useTranslation } from "react-i18next";

export default function NotFound({ onNavigate }) {
  const { t } = useTranslation();
  const goHome = (event) => {
    event.preventDefault();
    onNavigate("/");
    window.scrollTo({ top: 0 });
  };

  return (
    <article className="policy-page not-found-page">
      <p className="policy-kicker">{t("notFound.kicker")}</p>
      <h1>{t("notFound.title")}</h1>
      <p>{t("notFound.body")}</p>
      <a className="not-found-home" href="/" onClick={goHome}>
        {t("notFound.home")}
      </a>
    </article>
  );
}
