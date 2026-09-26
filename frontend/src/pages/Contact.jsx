import { useState } from "react";

const CONTACT_EMAIL = "bluelog.official@gmail.com";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  const onSubmit = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent(`[BlueLog Trip] Inquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nReply-to: ${email}\n\n${message}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setNotice(`Your email app should open a message to ${CONTACT_EMAIL}. If it does not, send the same note directly.`);
  };

  return (
    <article className="policy-page">
      <p className="policy-kicker">BlueLog Trip</p>
      <h1>Contact</h1>
      <p className="policy-updated">We read every note sent to the desk.</p>

      <section>
        <h2>Email the desk</h2>
        <p>
          Guide corrections, missing neighborhoods, advertising questions, and privacy requests can be sent to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Include the city and the guide title when
          you are writing about a published page.
        </p>
      </section>

      <form className="contact-form" onSubmit={onSubmit}>
        <h2>Send an inquiry</h2>
        <p>This form opens your email app with the message already addressed to {CONTACT_EMAIL}.</p>
        <label className="contact-label" htmlFor="contact-name">
          Name
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
          Your email
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
          Message
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
          Send inquiry
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
