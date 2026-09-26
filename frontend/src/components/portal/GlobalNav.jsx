import { useEffect, useRef, useState } from "react";
import { ChevronDown, Compass, Menu, Search, X } from "lucide-react";
import { uiCopy } from "../../lib/localeCopy";

const DESTINATIONS = [
  { id: "all", label: "All regions", path: "/destinations" },
  { id: "asia", label: "Asia", path: "/destinations/asia" },
  { id: "europe", label: "Europe", path: "/destinations/europe" },
  { id: "americas", label: "Americas", path: "/destinations/americas" },
];

export default function GlobalNav({
  active,
  region,
  query,
  onQueryChange,
  onSearch,
  language,
  onLanguageChange,
  onNavigate,
  onOpenAdmin,
  onLogout,
  adminMode = false,
}) {
  const [destOpen, setDestOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const destRef = useRef(null);

  useEffect(() => {
    const onPointer = (event) => {
      if (destRef.current && !destRef.current.contains(event.target)) {
        setDestOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setDestOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const visit = (path) => {
    setDestOpen(false);
    setMobileOpen(false);
    onNavigate(path);
  };
  const copy = uiCopy(language);

  return (
    <header className="gnb">
      <div className="gnb-inner">
        <button type="button" className="logo" onClick={() => visit("/")}>
          <Compass size={22} aria-hidden="true" />
          <span>BlueLog Trip</span>
        </button>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={mobileOpen ? "gnb-links open" : "gnb-links"} aria-label="Categories">
          <button
            type="button"
            className={active === "home" ? "nav-link active" : "nav-link"}
            onClick={() => visit("/")}
          >
            Home
          </button>

          <div className="nav-dropdown" ref={destRef}>
            <button
              type="button"
              className={active === "destinations" ? "nav-link active" : "nav-link"}
              aria-expanded={destOpen}
              aria-haspopup="true"
              onClick={() => setDestOpen((open) => !open)}
            >
              Destinations
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            {destOpen ? (
              <div className="dropdown-panel" role="menu">
                {DESTINATIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className={region === item.id ? "dropdown-item active" : "dropdown-item"}
                    onClick={() => visit(item.path)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className={active === "food" ? "nav-link active" : "nav-link"}
            onClick={() => visit("/local-food")}
          >
            Local Food
          </button>
          <button
            type="button"
            className={active === "community" ? "nav-link active" : "nav-link"}
            onClick={() => visit("/community")}
          >
            Community & Viral Log
          </button>
        </nav>

        <div className="gnb-tools">
          <form className="gnb-search" onSubmit={onSearch}>
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search"
              aria-label="Search guides"
            />
          </form>
          <select
            className="lang-select"
            value={language}
            aria-label={copy.languageLabel}
            onChange={(event) => onLanguageChange(event.target.value)}
          >
            <option value="en">{copy.languageEnglish}</option>
            <option value="ko">{copy.languageKorean}</option>
          </select>
          {adminMode ? (
            <>
              <button type="button" className="admin-btn" onClick={onOpenAdmin}>
                Admin / Generator
              </button>
              <button type="button" className="logout-btn" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
