const CONTACT_EMAIL = "bluelog.official@gmail.com";

export default function TermsOfService() {
  return (
    <article className="policy-page">
      <p className="policy-kicker">BlueLog Trip</p>
      <h1>Terms of Service</h1>
      <p className="policy-updated">Last updated September 26, 2026</p>

      <section>
        <h2>Using the site</h2>
        <p>
          These terms cover your use of BlueLog Trip, including city guides, community logs, and the pages
          linked from the site footer. By using the site you agree to these terms. If you do not agree, please
          do not use the site.
        </p>
        <p>
          BlueLog Trip provides travel writing for general information. Guides are not a booking service, a
          tour operator, or professional safety, medical, or legal advice. Routes, prices, hours, and local
          rules change. Confirm details with the venue or local authority before you travel.
        </p>
      </section>

      <section>
        <h2>Your posts</h2>
        <p>
          Community logs you submit should be your own words. Do not post content that is unlawful,
          misleading, or that infringes someone else&apos;s rights. We may remove a post that breaks these terms.
        </p>
      </section>

      <section>
        <h2>Our content</h2>
        <p>
          Guides, layout, and the BlueLog Trip name are owned by BlueLog Trip unless a credit says otherwise.
          You may share a link to a published guide. You may not copy the site wholesale or present our guides
          as your own commercial product.
        </p>
      </section>

      <section>
        <h2>Advertising</h2>
        <p>
          Some pages display third-party advertisements, including Google AdSense. Advertisers are responsible
          for their own offers. A displayed ad is not a recommendation from BlueLog Trip.
        </p>
      </section>

      <section>
        <h2>Liability</h2>
        <p>
          The site is provided as available. To the extent the law allows, BlueLog Trip is not liable for
          travel decisions you make from a guide, for third-party ads, or for interruptions in the service.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </article>
  );
}
