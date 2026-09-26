const CONTACT_EMAIL = "bluelog.official@gmail.com";

export default function PrivacyPolicy() {
  return (
    <article className="policy-page">
      <p className="policy-kicker">BlueLog Trip</p>
      <h1>Privacy Policy</h1>
      <p className="policy-updated">Last updated September 26, 2026</p>

      <section>
        <h2>Who we are</h2>
        <p>
          BlueLog Trip publishes city walking routes, neighborhood food notes, and community trip logs.
          This policy explains what the site collects and how advertising partners, including Google, may use cookies.
        </p>
      </section>

      <section>
        <h2>Information we collect</h2>
        <p>
          When you search, open a guide, or send a contact message, the site may process the text you submit,
          basic device and browser data, and the pages you view. We use that information to show guides, keep
          the site working, and understand which pages are useful.
        </p>
        <p>
          A visitor counter stores a salted hash of your IP address so the same browser is counted once per day.
          We do not sell personal information, and you do not need an account to read published guides.
        </p>
      </section>

      <section id="cookies">
        <h2>Cookies and third-party cookies</h2>
        <p>
          BlueLog Trip uses essential cookies and local storage for interface choices, such as a draft community
          log kept in your browser. Those tools are not used by themselves to build an advertising profile.
        </p>
        <p>
          Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to
          this website or other websites. Third-party advertising partners may also use web beacons and similar
          technologies to recognize your browser across sites. BlueLog Trip does not control the cookies those
          partners set.
        </p>
        <p>
          Google&apos;s use of advertising cookies enables it and its partners to serve ads to users based on
          their visit to this site and other sites on the Internet. Those cookies may collect or receive
          information from your browser, including a cookie identifier, IP address, browser type, and pages
          viewed, and use that information to provide advertisements and to measure ad performance.
        </p>
      </section>

      <section id="adsense">
        <h2>Google AdSense and the DART cookie</h2>
        <p>
          This site is supported by advertising, including Google AdSense. Google, as a third-party vendor, uses
          cookies to serve ads on BlueLog Trip.
        </p>
        <p>
          Google&apos;s use of the DART cookie enables it to serve ads to visitors based on their visit to this
          site and other sites on the Internet. Visitors may opt out of the use of the DART cookie by visiting
          the Google ad and content network privacy policy at{" "}
          <a href="https://policies.google.com/technologies/ads" rel="noopener noreferrer">
            https://policies.google.com/technologies/ads
          </a>
          .
        </p>
        <p>
          You may opt out of personalized advertising by visiting Google Ads Settings at{" "}
          <a href="https://adssettings.google.com" rel="noopener noreferrer">
            https://adssettings.google.com
          </a>
          . You can also opt out of some third-party vendors&apos; use of cookies for personalized advertising
          by visiting{" "}
          <a href="https://www.aboutads.info/choices" rel="noopener noreferrer">
            https://www.aboutads.info/choices
          </a>{" "}
          or, in the European Economic Area,{" "}
          <a href="https://www.youronlinechoices.eu" rel="noopener noreferrer">
            https://www.youronlinechoices.eu
          </a>
          . Browser settings can block cookies. Blocking cookies may limit some site features and will not
          remove all advertising.
        </p>
      </section>

      <section>
        <h2>Other third parties</h2>
        <p>
          Guides may link to maps, photos, or external sites. Those sites have their own privacy practices. A
          link from BlueLog Trip is not an endorsement of that site&apos;s data handling.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about this policy can be sent to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </article>
  );
}
