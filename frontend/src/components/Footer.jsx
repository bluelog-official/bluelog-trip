import { useEffect, useId, useRef, useState } from "react";
import { Compass, X } from "lucide-react";

const EDITORIAL_EMAIL = "editorial@bluelogtrip.com";
const SUPPORT_EMAIL = "support@bluelogtrip.com";
const EEAT_STATEMENT =
  "BlueLog Trip은 자체 AI 데이터 엔진과 편집 팀의 큐레이션을 통해 검증된 여행 동선과 현지 정보를 제공합니다.";

const CONTACT_TOPICS = [
  { id: "correction", label: "Guide correction", email: EDITORIAL_EMAIL },
  { id: "privacy", label: "Advertising or privacy", email: EDITORIAL_EMAIL },
  { id: "support", label: "General support", email: SUPPORT_EMAIL },
];

const POLICIES = {
  privacy: {
    title: "Privacy Policy",
    updated: "September 26, 2026",
    sections: [
      {
        heading: "Who we are",
        paragraphs: [
          "BlueLog Trip publishes city routes, neighborhood food notes, and community trip logs. This policy explains what information the site collects and how advertising partners, including Google, may use cookies.",
        ],
      },
      {
        heading: "Information we collect",
        paragraphs: [
          "When you search, open a guide, or post a community log, the site may process the text you submit, basic device and browser data, and pages you view. We use that information to show guides, keep the site working, and understand which pages are useful.",
          "We do not sell personal information. We do not require an account to read published guides.",
        ],
      },
      {
        heading: "Cookies, Google AdSense, and third-party advertising",
        paragraphs: [
          "This site is supported by advertising, including Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites.",
          "Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to this site and/or other sites on the Internet. These cookies may collect or receive information from your browser, including a cookie identifier, IP address, browser type, and pages viewed, and use that information to provide advertisements about goods and services of interest to you and to measure the performance of those ads.",
          "Third-party advertising partners may also use web beacons and similar technologies to recognize your browser across sites. BlueLog does not control the cookies set by those partners.",
          "You may opt out of personalized advertising by visiting Google Ads Settings at https://adssettings.google.com. You can also opt out of some third-party vendors' use of cookies for personalized advertising by visiting https://www.aboutads.info/choices or, if you are in the European Economic Area, https://www.youronlinechoices.eu. You can control cookies in your browser settings. Blocking cookies may limit some site features and will not remove all advertising.",
        ],
      },
      {
        heading: "Other third parties",
        paragraphs: [
          "Guides may link to maps, photos, or external sites. Those sites have their own privacy practices. A link from BlueLog is not an endorsement of that site's data handling.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          `Questions about this policy can be sent to the editorial desk at ${EDITORIAL_EMAIL}. For help using the site, write to ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "September 25, 2026",
    sections: [
      {
        heading: "Using the site",
        paragraphs: [
          "BlueLog Trip provides trip writing for general information. Guides are not a booking service, a tour operator, or professional safety, medical, or legal advice. Routes, prices, hours, and local rules change. Confirm details with the venue or local authority before you trip.",
        ],
      },
      {
        heading: "Your posts",
        paragraphs: [
          "Community logs you submit should be your own words. Do not post content that is unlawful, misleading, or that infringes someone else's rights. We may remove a post that breaks these terms.",
        ],
      },
      {
        heading: "Our content",
        paragraphs: [
          "Guides, layout, and the BlueLog name are owned by BlueLog unless a credit says otherwise. You may share a link to a published guide. You may not copy the site wholesale or present our guides as your own commercial product.",
        ],
      },
      {
        heading: "Liability",
        paragraphs: [
          "The site is provided as available. To the extent the law allows, BlueLog is not liable for trip decisions you make from a guide, for third-party ads, or for interruptions in the service.",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    updated: "September 25, 2026",
    sections: [
      {
        heading: "What we use",
        paragraphs: [
          "BlueLog uses essential cookies and local storage to remember interface choices, such as a draft community log stored in your browser. These are not used to build an advertising profile by themselves.",
        ],
      },
      {
        heading: "Advertising cookies",
        paragraphs: [
          "Google AdSense and other third-party advertising partners may set cookies to deliver and measure ads, including ads based on your visits to this site and other sites. See the Privacy Policy for how to opt out of personalized advertising.",
        ],
      },
    ],
  },
  about: {
    title: "About Us",
    updated: "September 26, 2026",
    sections: [
      {
        heading: "The desk",
        paragraphs: [
          "BlueLog Trip is a trip desk for city routes and neighborhood food. Each guide is drafted from local research, then checked before it is published for readers.",
          "We write for people planning a walk, a meal, or a short stay — not for a booking cart. Destinations cover Asia, Europe, and the Americas, with a separate shelf for local food.",
        ],
      },
      {
        heading: "Editorial Policy",
        paragraphs: [
          EEAT_STATEMENT,
          "BlueLog Trip provides verified travel routes and local information through curation by its own AI data engine and editorial team. Guides are original desk work, checked before publication, and are not scraped copies of other sites. Prices and opening hours should still be confirmed on site.",
        ],
      },
      {
        heading: "How guides are checked",
        paragraphs: [
          "A guide marked Verified Guide has been reviewed for publication. A guide marked Checked by Local AI has been read by our local checking process and may still be waiting for a final publish step.",
        ],
      },
    ],
  },
  editorial: {
    title: "Editorial Policy",
    updated: "September 26, 2026",
    sections: [
      {
        heading: "How BlueLog Trip is produced",
        paragraphs: [
          EEAT_STATEMENT,
          "BlueLog Trip provides verified travel routes and local information through curation by its own AI data engine and editorial team. The desk researches a city, drafts a route, and reviews it before the guide is published.",
          "Published guides are original editorial work for readers planning a walk, a meal, or a short stay. They are not reproduced from other websites. A factual correction can be sent to the editorial desk from Contact Us.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact Us",
    updated: "September 26, 2026",
    showForm: true,
    sections: [
      {
        heading: "How to reach the desk",
        paragraphs: [
          `Send a guide correction, a missing neighborhood, or an advertising and privacy question to ${EDITORIAL_EMAIL}. Include the city and the guide title so the desk can check the published page.`,
          `For help using the site, write to ${SUPPORT_EMAIL}. You can email either address directly, or use the form below. The form opens your email app with the message already addressed to the right desk.`,
        ],
      },
    ],
  },
};

function linkifyEmails(text) {
  const pattern = /(editorial@bluelogtrip\.com|support@bluelogtrip\.com)/g;
  const parts = text.split(pattern);
  return parts.map((part, index) => {
    if (part === EDITORIAL_EMAIL || part === SUPPORT_EMAIL) {
      return (
        <a key={`${part}-${index}`} href={`mailto:${part}`}>
          {part}
        </a>
      );
    }
    return part;
  });
}

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topicId, setTopicId] = useState(CONTACT_TOPICS[0].id);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const topic = CONTACT_TOPICS.find((item) => item.id === topicId) || CONTACT_TOPICS[0];

  const onSubmit = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent(`[BlueLog Trip] ${topic.label} from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nReply-to: ${email}\nTopic: ${topic.label}\n\n${message}`);
    window.location.href = `mailto:${topic.email}?subject=${subject}&body=${body}`;
    setNotice(`Your email app should open a message to ${topic.email}. If it does not, send the same note directly to that address.`);
  };

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <h3>Send an inquiry</h3>
      <p>This form addresses your note to the desk that handles the topic you choose.</p>
      <label className="contact-label" htmlFor="contact-name">Name</label>
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
      <label className="contact-label" htmlFor="contact-email">Your email</label>
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
      <label className="contact-label" htmlFor="contact-topic">Topic</label>
      <select
        id="contact-topic"
        className="contact-input"
        name="topic"
        value={topicId}
        onChange={(event) => setTopicId(event.target.value)}
      >
        {CONTACT_TOPICS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label} — {item.email}
          </option>
        ))}
      </select>
      <label className="contact-label" htmlFor="contact-message">Message</label>
      <textarea
        id="contact-message"
        className="contact-input contact-message"
        name="message"
        rows={5}
        required
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <button type="submit" className="contact-submit">Send inquiry</button>
      {notice ? <p className="contact-notice" role="status">{notice}</p> : null}
    </form>
  );
}

function PolicyDialog({ policyId, onClose }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const policy = policyId ? POLICIES[policyId] : null;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !policy) return undefined;
    if (!dialog.open) dialog.showModal();
    const handleClose = () => onCloseRef.current();
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
      if (dialog.open) dialog.close();
    };
  }, [policy]);

  if (!policy) return null;

  return (
    <dialog
      ref={dialogRef}
      className="policy-dialog"
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="policy-dialog-card">
        <header className="policy-dialog-header">
          <div>
            <p className="policy-kicker">BlueLog Trip</p>
            <h2 id={titleId}>{policy.title}</h2>
            <p className="policy-updated">Last updated {policy.updated}</p>
          </div>
          <button type="button" className="policy-close" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="policy-dialog-body">
          {policy.sections.map((section) => (
            <section key={section.heading}>
              <h3>{section.heading}</h3>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{linkifyEmails(paragraph)}</p>
              ))}
            </section>
          ))}
          {policy.showForm ? <ContactForm /> : null}
        </div>
      </div>
    </dialog>
  );
}

export default function Footer({ onNavigate, policyId, onOpenPolicy, onClosePolicy }) {
  const visit = (path) => {
    onNavigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="portal-footer">
      <div className="footer-grid">
        <section className="footer-brand" aria-label="Brand">
          <button type="button" className="footer-logo" onClick={() => visit("/")}>
            <Compass size={22} aria-hidden="true" />
            <span>BlueLog Trip</span>
          </button>
          <p className="footer-tagline">
            City routes and neighborhood food guides, checked before they go live.
          </p>
          <p className="footer-copy">Copyright © 2026 BlueLog.</p>
        </section>

        <nav className="footer-col" aria-label="Footer navigation">
          <p className="footer-heading">Navigation</p>
          <ul className="footer-links">
            <li>
              <button type="button" onClick={() => visit("/")}>Home</button>
            </li>
            <li>
              <button type="button" onClick={() => visit("/destinations")}>Destinations</button>
              <ul className="footer-sublinks">
                <li>
                  <button type="button" onClick={() => visit("/destinations/asia")}>Asia</button>
                </li>
                <li>
                  <button type="button" onClick={() => visit("/destinations/europe")}>Europe</button>
                </li>
                <li>
                  <button type="button" onClick={() => visit("/destinations/americas")}>Americas</button>
                </li>
              </ul>
            </li>
            <li>
              <button type="button" onClick={() => visit("/local-food")}>Local Food</button>
            </li>
            <li>
              <button type="button" onClick={() => visit("/community")}>Community Log</button>
            </li>
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Legal and policies">
          <p className="footer-heading">Legal & Policies</p>
          <ul className="footer-links">
            <li>
              <button type="button" onClick={() => onOpenPolicy("privacy")}>Privacy Policy</button>
            </li>
            <li>
              <button type="button" onClick={() => onOpenPolicy("terms")}>Terms of Service</button>
            </li>
            <li>
              <button type="button" onClick={() => onOpenPolicy("cookies")}>Cookie Policy</button>
            </li>
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Support">
          <p className="footer-heading">Support & Search</p>
          <ul className="footer-links">
            <li>
              <button type="button" onClick={() => onOpenPolicy("about")}>About Us</button>
            </li>
            <li>
              <button type="button" onClick={() => onOpenPolicy("editorial")}>Editorial Policy</button>
            </li>
            <li>
              <button type="button" onClick={() => onOpenPolicy("contact")}>Contact Us</button>
            </li>
            <li>
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
                sitemap.xml
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <PolicyDialog policyId={policyId} onClose={onClosePolicy} />
    </footer>
  );
}
