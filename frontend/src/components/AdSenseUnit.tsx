import { useEffect, useRef } from "react";

type AdFormat = "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";

type AdSenseUnitProps = {
  slotId?: string;
  format?: AdFormat;
  className?: string;
};

type AdsWindow = Window & {
  adsbygoogle?: Record<string, unknown>[];
};

const CLIENT_ID = String(import.meta.env.VITE_ADSENSE_CLIENT_ID || "").trim();

let scriptPromise: Promise<void> | null = null;

function loadAdSenseScript(clientId: string) {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-adsense-client]");
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.crossOrigin = "anonymous";
    script.dataset.adsenseClient = clientId;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("adsense script failed"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function AdSenseUnit({
  slotId = "auto",
  format = "auto",
  className = "",
}: AdSenseUnitProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT_ID || !insRef.current || pushed.current) return undefined;
    let cancelled = false;
    loadAdSenseScript(CLIENT_ID)
      .then(() => {
        const node = insRef.current;
        if (cancelled || !node || pushed.current || node.dataset.adsbygoogleStatus) return;
        const adsWindow = window as AdsWindow;
        const queue = adsWindow.adsbygoogle || [];
        adsWindow.adsbygoogle = queue;
        queue.push({});
        pushed.current = true;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slotId, format]);

  if (!CLIENT_ID) {
    return (
      <aside
        className={`adsense-unit adsense-sponsored ${className}`.trim()}
        data-ad-placeholder="true"
        data-ad-slot={slotId}
        data-ad-format={format}
        role="complementary"
        aria-label="Sponsored Content"
      >
        <span className="adsense-sponsored-kicker">Sponsored Content</span>
        <p>Advertisement space reserved for a responsive Google AdSense unit.</p>
      </aside>
    );
  }

  return (
    <aside className={`adsense-unit adsense-live ${className}`.trim()} aria-label="Advertisement">
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
