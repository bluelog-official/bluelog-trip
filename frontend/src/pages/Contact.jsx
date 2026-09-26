import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

const CONTACT_EMAIL = "bluelog.official@gmail.com";
const MAIL = { mail: <a href={`mailto:${CONTACT_EMAIL}`} /> };

export default function Contact() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  const onSubmit = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent(t("contact.subject", { name }));
    const body = encodeURIComponent(t("contact.bodyHeader", { name, email, message }));
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setNotice(t("contact.notice", { email: CONTACT_EMAIL }));
  };

  return (
    <article className="policy-page">
      <p className="policy-kicker">{t("contact.kicker")}</p>
      <h1>{t("contact.title")}</h1>
      <p className="policy-updated">{t("contact.updated")}</p>

      <section>
        <h2>{t("contact.emailTitle")}</h2>
        <p>
          <Trans i18nKey="contact.emailBody" values={{ email: CONTACT_EMAIL }} components={MAIL} />
        </p>
      </section>

      <form className="contact-form" onSubmit={onSubmit}>
        <h2>{t("contact.formTitle")}</h2>
        <p>{t("contact.formHelp", { email: CONTACT_EMAIL })}</p>
        <label className="contact-label" htmlFor="contact-name">
          {t("contact.name")}
        </label>
        <input
          id="contact-name"
          className="contact-input"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <label className="contact-label" htmlFor="contact-email">
          {t("contact.email")}
        </label>
        <input
          id="contact-email"
          className="contact-input"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label className="contact-label" htmlFor="contact-message">
          {t("contact.message")}
        </label>
        <textarea
          id="contact-message"
          className="contact-input contact-message"
          name="message"
          rows={5}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button type="submit" className="contact-submit">
          {t("contact.submit")}
        </button>
        {notice ? (
          <p className="contact-notice" role="status">
            {notice}
          </p>
        ) : null}
      </form>
    </article>
  );
}
