const HANGUL = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7A3]/;

export function isEnglishLanguage(language) {
  const value = String(language || "").trim().toLowerCase();
  return value === "en" || value === "english";
}

export function containsHangul(text) {
  return HANGUL.test(String(text || ""));
}

export function englishField(text, fallback) {
  const source = String(text || "").replace(/\s+/g, " ").trim();
  if (!source || containsHangul(source)) return fallback;
  return source;
}

export function strictEnglishText(text, fallback, minLength = 1) {
  const clean = englishField(text, "");
  if (clean.length >= minLength) return clean;
  return fallback;
}

export function presentGuideCard(card, language) {
  if (!card || !isEnglishLanguage(language)) return card;
  const destination = englishField(card.destination, "Destination");
  const title = englishField(card.title, `${destination} Trip Guide`);
  const summary = englishField(card.summary, `Local trip notes for ${destination}.`);
  const tags = [];
  (card.tags || []).forEach((tag) => {
    const next = englishField(tag, "");
    if (next && !tags.includes(next)) tags.push(next);
  });
  if (destination && !tags.includes(destination)) tags.unshift(destination);
  return { ...card, destination, title, summary, tags };
}

const EN = {
  languageLabel: "Language",
  languageEnglish: "English",
  languageKorean: "Korean",
  popularTitle: "Top 5 destinations",
  popularEmpty: "Guides will rank here after they are generated.",
  viralTitle: "Latest viral logs",
  viralEmpty: "Performance notes will show up after the first post.",
  communityTitle: "Community board",
  adminNote: "Writing language follows the top bar. Current:",
  adminLanguage: "English (Global SEO)",
  adminDestination: "Destination",
  adminPlaceholder: "Example: Rome, Bali, New York",
  adminGenerating: "Generating...",
  adminSubmit: "Generate guide",
  reviewPending: "Awaiting review",
  reviewApproved: "QA Approved",
  reviewPendingHelp: "This draft stays unpublished until it is approved.",
  reviewApprovedHelp: "This guide is published.",
  publishing: "Publishing...",
  approve: "Approve & Publish",
  back: "All guides",
  toc: "On this page",
  sources: "Sources",
  published: "Published",
  author: "BlueLog Local AI",
  verified: "Verified Guide",
  checked: "Checked by Local AI",
  copy: "Copy",
  copied: "Copied",
  viralEmptyDetail: "This guide has no export copy yet.",
  loadingGuide: "Loading this guide…",
  missingGuide: "This guide is not available yet.",
  home: "Home",
  siteDescription: "BlueLog Trip - Curated Local City Guides",
  statusReady: "Guide created.",
  statusReadyScore: (score) => `Guide created. QA score: ${score}.`,
  statusFailed: (message) => `Could not create the guide. ${message}`,
  statusApproved: "Review complete. Sitemap updated and search engines were pinged.",
  statusApproveFailed: (message) => `Could not approve the guide. ${message}`,
  approveFailed: "Approval failed.",
  generateFailed: "Guide generation failed.",
};

const KO = {
  languageLabel: "작성 언어",
  languageEnglish: "English",
  languageKorean: "한국어",
  popularTitle: "인기 여행지 Top 5",
  popularEmpty: "Guides will rank here after they are generated.",
  viralTitle: "최신 바이럴 성공 로그",
  viralEmpty: "Performance notes will show up after the first post.",
  communityTitle: "활용 게시판",
  adminNote: "작성 언어는 상단 바를 따릅니다. 현재:",
  adminLanguage: "한국어",
  adminDestination: "여행 목적지 (Target City)",
  adminPlaceholder: "예: Rome, Bali, New York",
  adminGenerating: "생성 중...",
  adminSubmit: "가이드 자동 생성",
  reviewPending: "검수 대기",
  reviewApproved: "QA Approved",
  reviewPendingHelp: "Ad slots stay hidden until this guide is approved.",
  reviewApprovedHelp: "This guide is published. Ad slots are visible.",
  publishing: "게시 중...",
  approve: "검수 및 퍼블리시 (Approve & Publish)",
  back: "All guides",
  toc: "목차",
  sources: "출처",
  published: "발행",
  author: "BlueLog Local AI",
  verified: "Verified Guide",
  checked: "Checked by Local AI",
  copy: "복사",
  copied: "복사됨",
  viralEmptyDetail: "이 가이드에는 내보낼 홍보 문구가 없습니다.",
  loadingGuide: "Loading this guide…",
  missingGuide: "데이터를 찾을 수 없습니다.",
  home: "홈",
  siteDescription: "BlueLog Trip - Curated Local City Guides",
  statusReady: "생성 완료!",
  statusReadyScore: (score) => `생성 완료! (QA 점수: ${score}점)`,
  statusFailed: (message) => `오류 발생: ${message}`,
  statusApproved: "검수 완료. sitemap 갱신과 검색엔진 ping을 보냈습니다.",
  statusApproveFailed: (message) => `승인 오류: ${message}`,
  approveFailed: "승인에 실패했습니다.",
  generateFailed: "가이드 생성 실패",
};

export function uiCopy(language) {
  return isEnglishLanguage(language) ? EN : KO;
}

export function formatPublishedDate(iso, language) {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(isEnglishLanguage(language) ? "en-US" : "ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
