import { useEffect, useMemo, useState } from "react";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import AdSenseUnit from "./components/AdSenseUnit";
import AdminDrawer from "./components/portal/AdminDrawer";
import AdminLogin from "./components/portal/AdminLogin";
import ArticleGrid from "./components/portal/ArticleGrid";
import ArticleReader from "./components/portal/ArticleReader";
import CommunityBoard from "./components/portal/CommunityBoard";
import GlobalNav from "./components/portal/GlobalNav";
import HeroSearch, { CategoryIntro } from "./components/portal/HeroSearch";
import PortalSidebar from "./components/portal/PortalSidebar";
import {
  API_BASE_URL,
  fetchGuideCards,
  fetchGuideDetail,
  matchesGuideQuery,
} from "./lib/guideCards";
import {
  adminAuthHeaders,
  clearAdminToken,
  consumeAdminReturn,
  readAdminToken,
  rememberAdminReturn,
  storeAdminToken,
} from "./lib/adminSession";
import { loadCommunityPosts, saveCommunityPosts } from "./lib/communityStore";
import { setMetaDescription } from "./lib/articleDocument";
import { isEnglishLanguage, presentGuideCard, uiCopy } from "./lib/localeCopy";
import { usePortalRoute } from "./lib/usePortalRoute";
import "./App.css";

function navActive(route) {
  if (route.name === "home") return "home";
  if (route.name === "destinations") return "destinations";
  if (route.name === "food") return "food";
  if (route.name === "community") return "community";
  return "";
}

export default function App() {
  const { route, go, adminGate, leaveAdminGate } = usePortalRoute();
  const [adminSession, setAdminSession] = useState(() => Boolean(readAdminToken()));
  const [loginOpen, setLoginOpen] = useState(false);
  const adminMode = adminSession;
  const [destination, setDestination] = useState("");
  const [language, setLanguage] = useState("en");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [guidesLoading, setGuidesLoading] = useState(true);
  const [guidesError, setGuidesError] = useState("");
  const [cards, setCards] = useState([]);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [detailTab, setDetailTab] = useState("article");
  const [statusMessage, setStatusMessage] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [posts, setPosts] = useState(() => loadCommunityPosts());
  const [policyId, setPolicyId] = useState("");

  useEffect(() => {
    let cancelled = false;
    setGuidesLoading(true);
    fetchGuideCards()
      .then((next) => {
        if (cancelled) return;
        setCards(next);
        setGuidesError("");
      })
      .catch((err) => {
        console.error("가이드 목록 로드 실패:", err);
        if (!cancelled) {
          setGuidesError("Guides could not be loaded. Check that the API is running.");
        }
      })
      .finally(() => {
        if (!cancelled) setGuidesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    if (route.name !== "article" || !route.guideId) {
      setSelectedGuide(null);
      return undefined;
    }
    let cancelled = false;
    setDetailTab("article");
    fetchGuideDetail(route.guideId)
      .then((data) => {
        if (!cancelled) setSelectedGuide(data);
      })
      .catch((err) => {
        console.error("가이드 본문 로드 실패:", err);
        if (!cancelled) setSelectedGuide(null);
      });
    return () => {
      cancelled = true;
    };
  }, [route.name, route.guideId, reloadToken]);

  useEffect(() => {
    document.documentElement.lang = isEnglishLanguage(language) ? "en" : "ko";
  }, [language]);

  useEffect(() => {
    if (!adminMode) setAdminOpen(false);
  }, [adminMode]);

  useEffect(() => {
    if (route.name !== "dashboard" || adminSession) return;
    rememberAdminReturn("/dashboard");
    go("/admin");
  }, [route.name, adminSession, go]);

  useEffect(() => {
    if (!(adminSession && adminGate)) return;
    const next = consumeAdminReturn();
    leaveAdminGate("replace");
    if (next === "/dashboard") go("/dashboard");
  }, [adminSession, adminGate, leaveAdminGate, go]);

  const endAdminSession = () => {
    clearAdminToken();
    setAdminSession(false);
    setAdminOpen(false);
  };

  const handleLogout = () => {
    endAdminSession();
    setLoginOpen(false);
    if (route.name === "dashboard") {
      go("/");
      return;
    }
    if (adminGate) leaveAdminGate("replace");
  };

  const handleLoginSuccess = (token) => {
    storeAdminToken(token);
    setAdminSession(true);
    setLoginOpen(false);
  };

  const handleCloseLogin = () => {
    setLoginOpen(false);
    consumeAdminReturn();
    if (adminGate) leaveAdminGate("push");
  };

  const handleUnauthorized = () => {
    endAdminSession();
    setLoginOpen(true);
  };

  useEffect(() => {
    const copy = uiCopy(language);
    const card = presentGuideCard(
      cards.find((item) => item.id === route.guideId),
      language,
    );
    if (route.name === "article") {
      document.title = `${card?.title || "Guide"} · BlueLog Trip`;
      setMetaDescription(card?.summary || copy.siteDescription);
      return;
    }
    const titles = {
      home: "BlueLog Trip - Curated Local City Guides",
      destinations: "Destinations · BlueLog Trip",
      food: "Local Food · BlueLog Trip",
      community: "Community & Viral Log · BlueLog Trip",
      dashboard: "Dashboard · BlueLog Trip",
    };
    document.title = titles[route.name] || "BlueLog Trip - Curated Local City Guides";
    setMetaDescription(copy.siteDescription);
  }, [route, cards, language]);

  const localizedCards = useMemo(
    () => cards.map((card) => presentGuideCard(card, language)),
    [cards, language],
  );

  const visibleCards = useMemo(() => {
    return localizedCards.filter((card) => {
      if (route.name === "destinations" && route.category !== "all" && card.region !== route.category) {
        return false;
      }
      if (route.name === "food" && !card.hasFood) return false;
      return matchesGuideQuery(card, query);
    });
  }, [localizedCards, route, query]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (route.name !== "home" && route.name !== "community") {
      go("/");
    }
  };

  const openGuide = (card) => {
    go(`/guide/${encodeURIComponent(card.id)}`);
    window.scrollTo({ top: 0 });
  };

  const handleCreatePost = (draft) => {
    const post = {
      ...draft,
      id: globalThis.crypto?.randomUUID?.() || `post-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPosts((current) => {
      const next = [post, ...current];
      saveCommunityPosts(next);
      return next;
    });
    return post;
  };

  const handleApprove = async () => {
    if (!route.guideId || publishing) return;
    setPublishing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/guides/${encodeURIComponent(route.guideId)}/approve`, {
        method: "POST",
        headers: adminAuthHeaders(),
      });
      if (res.status === 401) {
        handleUnauthorized();
        throw new Error(uiCopy(language).approveFailed);
      }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || uiCopy(language).approveFailed);
      }
      const data = await res.json();
      setSelectedGuide(data);
      setStatusMessage(uiCopy(language).statusApproved);
      setReloadToken((token) => token + 1);
    } catch (err) {
      setStatusMessage(uiCopy(language).statusApproveFailed(err.message));
    } finally {
      setPublishing(false);
    }
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!destination.trim()) return;

    setLoading(true);
    setStatusMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/generate-guide`, {
        method: "POST",
        headers: adminAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ destination, target_language: language }),
      });

      if (res.status === 401) {
        handleUnauthorized();
        throw new Error(uiCopy(language).generateFailed);
      }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || uiCopy(language).generateFailed);
      }

      const data = await res.json();
      const qualityScore = data.qa_result?.quality_score;
      const copy = uiCopy(language);
      setStatusMessage(
        qualityScore == null ? copy.statusReady : copy.statusReadyScore(qualityScore),
      );
      const newFileName = `${destination.trim().toLowerCase().replace(/\s+/g, "_")}_guide.md`;
      setDestination("");
      setAdminOpen(false);
      setReloadToken((token) => token + 1);
      go(`/guide/${encodeURIComponent(newFileName)}`);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setStatusMessage(uiCopy(language).statusFailed(err.message));
    } finally {
      setLoading(false);
    }
  };

  const showCatalog = route.name === "home" || route.name === "destinations" || route.name === "food";
  const showSidebar = showCatalog || route.name === "article";

  return (
    <div className="portal">
      <GlobalNav
        active={navActive(route)}
        region={route.name === "destinations" ? route.category : ""}
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        language={language}
        onLanguageChange={setLanguage}
        onNavigate={go}
        onOpenAdmin={() => setAdminOpen(true)}
        onOpenDashboard={() => go("/dashboard")}
        onLogout={handleLogout}
        adminMode={adminMode}
        dashboardActive={route.name === "dashboard"}
      />

      {route.name === "home" ? (
        <>
          <HeroSearch query={query} onQueryChange={setQuery} onSearch={handleSearch} />
          <div className="ad-band">
            <AdSenseUnit slotId="hero-below" format="auto" />
          </div>
        </>
      ) : null}

      <main className="portal-main">
        {route.name === "dashboard" ? (
          adminSession ? (
            <Dashboard onUnauthorized={handleUnauthorized} />
          ) : (
            <p className="dash-note">관리자 로그인으로 이동합니다.</p>
          )
        ) : route.name === "community" ? (
          <CommunityBoard
            posts={posts}
            query={query}
            onCreate={handleCreatePost}
            language={language}
          />
        ) : (
          <div className={showSidebar ? "portal-body" : "portal-body solo"}>
            <div className="portal-stream">
              {route.name === "destinations" || route.name === "food" ? (
                <CategoryIntro category={route.category} />
              ) : null}
              {route.name === "article" ? (
                <ArticleReader
                  guide={selectedGuide}
                  fileName={route.guideId}
                  tab={detailTab}
                  onTabChange={setDetailTab}
                  publishing={publishing}
                  onApprove={handleApprove}
                  onBack={() => go("/")}
                  onOpenCommunity={() => go("/community")}
                  onNavigate={go}
                  language={language}
                  adminMode={adminMode}
                />
              ) : (
                <ArticleGrid
                  cards={visibleCards}
                  loading={guidesLoading}
                  error={guidesError}
                  onOpen={openGuide}
                />
              )}
            </div>
            {showSidebar ? (
              <PortalSidebar
                cards={localizedCards}
                posts={posts}
                language={language}
                onPickDestination={(name) => {
                  setQuery(name);
                  go("/");
                }}
                onOpenLog={(post) => {
                  go("/community");
                  window.location.hash = post.id;
                }}
              />
            ) : null}
          </div>
        )}
      </main>

      <Footer
        onNavigate={go}
        policyId={policyId}
        onOpenPolicy={setPolicyId}
        onClosePolicy={() => setPolicyId("")}
      />

      {adminMode ? (
        <AdminDrawer
          open={adminOpen}
          onClose={() => setAdminOpen(false)}
          destination={destination}
          onDestinationChange={setDestination}
          language={language}
          loading={loading}
          statusMessage={statusMessage}
          onSubmit={handleGenerate}
        />
      ) : null}
      {!adminSession && (adminGate || loginOpen) ? (
        <AdminLogin onClose={handleCloseLogin} onSuccess={handleLoginSuccess} />
      ) : null}
    </div>
  );
}
