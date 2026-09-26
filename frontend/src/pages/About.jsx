const CONTACT_EMAIL = "bluelog.official@gmail.com";

export default function About() {
  return (
    <article className="policy-page">
      <p className="policy-kicker">BlueLog Trip</p>
      <h1>About BlueLog Trip</h1>
      <p className="policy-updated">Last updated September 26, 2026</p>

      <section>
        <h2>Our mission</h2>
        <p>
          BlueLog Trip is an AI-assisted local guide desk. We research a city, draft a walkable route and
          neighborhood food notes, then check the guide before it is published for readers planning a walk, a
          meal, or a short stay.
        </p>
        <p>
          The desk covers Asia, Europe, and the Americas. We write original guides for people on the ground.
          We are not a booking cart, and we do not scrape other sites and republish their pages.
        </p>
      </section>

      <section id="editorial">
        <h2>Experience, expertise, and trust</h2>
        <p>
          Each guide starts from local research collected by our own AI data engine, then passes an editorial
          check. A guide marked Verified Guide has been reviewed for publication. A guide marked Checked by
          Local AI has been read by that checking process and may still be waiting for a final publish step.
        </p>
        <p>
          Prices, opening hours, and transit rules still belong to the venue or the city. We say so in the
          guide and ask readers to confirm them on site. Factual corrections are welcome at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
        <p>
          Advertising, including Google AdSense, may appear on published pages. Ads do not change the route
          we recommend. How cookies are used is explained in the Privacy Policy.
        </p>
      </section>

      <section>
        <h2>Who to write to</h2>
        <p>
          Editorial questions, missing neighborhoods, and privacy requests go to the same desk:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Include the city and the guide title so we
          can open the published page.
        </p>
      </section>
    </article>
  );
}
