import { Compass } from "lucide-react";

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/sitemap.xml", label: "Sitemap" },
];

function FooterLink({ href, onNavigate, children, external = false }) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        onNavigate(href);
        const hash = href.includes("#") ? href.slice(href.indexOf("#") + 1) : "";
        window.setTimeout(() => {
          const target = hash ? document.getElementById(hash) : null;
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
          else window.scrollTo({ top: 0, behavior: "smooth" });
        }, 0);
      }}
    >
      {children}
    </a>
  );
}

export default function Footer({ onNavigate }) {
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
              <FooterLink href="/privacy" onNavigate={onNavigate}>Privacy Policy</FooterLink>
            </li>
            <li>
              <FooterLink href="/terms" onNavigate={onNavigate}>Terms of Service</FooterLink>
            </li>
            <li>
              <FooterLink href="/privacy#cookies" onNavigate={onNavigate}>Cookie Policy</FooterLink>
            </li>
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Support">
          <p className="footer-heading">Support & Search</p>
          <ul className="footer-links">
            <li>
              <FooterLink href="/about" onNavigate={onNavigate}>About</FooterLink>
            </li>
            <li>
              <FooterLink href="/about#editorial" onNavigate={onNavigate}>Editorial Policy</FooterLink>
            </li>
            <li>
              <FooterLink href="/contact" onNavigate={onNavigate}>Contact</FooterLink>
            </li>
            <li>
              <FooterLink href="/sitemap.xml" external>Sitemap</FooterLink>
            </li>
          </ul>
        </nav>
      </div>

      <div className="footer-bottom">
        <nav aria-label="Required site links">
          <ul className="footer-legal">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <FooterLink href={link.href} onNavigate={onNavigate} external={link.href === "/sitemap.xml"}>
                  {link.label}
                </FooterLink>
              </li>
            ))}
          </ul>
        </nav>
        <p className="footer-copy">Copyright ⓒ 2026 BlueLog Trip. All rights reserved.</p>
      </div>
    </footer>
  );
}
