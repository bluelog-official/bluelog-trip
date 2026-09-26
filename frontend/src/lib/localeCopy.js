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

const REGION_LABELS = {
  en: { asia: "Asia", europe: "Europe", americas: "Americas", oceania: "Oceania" },
  ko: { asia: "아시아", europe: "유럽", americas: "아메리카", oceania: "오세아니아" },
};
const FOOD_LABELS = { en: "Local Food", ko: "현지 음식" };
const CHROME_TAGS = new Set([
  ...Object.values(REGION_LABELS.en),
  ...Object.values(REGION_LABELS.ko),
  FOOD_LABELS.en,
  FOOD_LABELS.ko,
]);

export function presentGuideCard(card, language) {
  if (!card) return card;
  const english = isEnglishLanguage(language);
  const lang = english ? "en" : "ko";
  const destination = english ? englishField(card.destination, "Destination") : card.destination;
  const title = english ? englishField(card.title, `${destination} Trip Guide`) : card.title;
  const summary = english
    ? englishField(card.summary, `Local trip notes for ${destination}.`)
    : card.summary;
  const tags = [];
  (card.tags || []).forEach((tag) => {
    if (CHROME_TAGS.has(tag)) return;
    const next = english ? englishField(tag, "") : String(tag || "").trim();
    if (next && !tags.includes(next)) tags.push(next);
  });
  const regionLabel = REGION_LABELS[lang][card.region] || "";
  if (regionLabel) tags.unshift(regionLabel);
  if (destination && !tags.includes(destination)) tags.splice(regionLabel ? 1 : 0, 0, destination);
  if (card.hasFood && !tags.includes(FOOD_LABELS[lang])) tags.push(FOOD_LABELS[lang]);
  return { ...card, destination, title, summary, tags };
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
