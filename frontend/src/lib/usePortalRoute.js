import { useEffect, useState } from "react";

export function parseRoute(pathname) {
  const path = pathname || "/";
  const guideMatch = path.match(/^\/guides?\/(.+)$/);
  if (guideMatch) {
    return {
      name: "article",
      category: "",
      guideId: decodeURIComponent(guideMatch[1]),
    };
  }
  if (path === "/destinations" || path.startsWith("/destinations/")) {
    const region = path.split("/")[2] || "all";
    const known = ["asia", "europe", "americas"];
    return {
      name: "destinations",
      category: known.includes(region) ? region : "all",
      guideId: "",
    };
  }
  if (path === "/local-food") {
    return { name: "food", category: "food", guideId: "" };
  }
  if (path === "/community") {
    return { name: "community", category: "community", guideId: "" };
  }
  return { name: "home", category: "home", guideId: "" };
}

export function usePortalRoute() {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const sync = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const go = (path) => {
    const next = path.startsWith("/") ? path : `/${path}`;
    if (window.location.pathname !== next) {
      window.history.pushState({ path: next }, "", next);
    }
    setRoute(parseRoute(next));
  };

  return { route, go };
}
