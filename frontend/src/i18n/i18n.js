import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ko from "./locales/ko.json";

export const APP_LANG_KEY = "app_lang";

export function normalizeAppLanguage(language) {
  const value = String(language || "").trim().toLowerCase();
  if (value === "ko" || value.startsWith("ko-")) return "ko";
  return "en";
}

export function readAppLanguage(storage = globalThis.localStorage) {
  try {
    return normalizeAppLanguage(storage?.getItem(APP_LANG_KEY));
  } catch {
    return "en";
  }
}

export function writeAppLanguage(language, storage = globalThis.localStorage) {
  const next = normalizeAppLanguage(language);
  try {
    storage?.setItem(APP_LANG_KEY, next);
  } catch {
    /* private mode or a blocked storage API */
  }
  return next;
}

if (!i18n.isInitialized) {
  const initial = readAppLanguage();
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
    },
    lng: initial,
    fallbackLng: "en",
    supportedLngs: ["en", "ko"],
    interpolation: { escapeValue: false },
    returnNull: false,
    react: { useSuspense: false },
  });
}

i18n.on("languageChanged", (language) => {
  const next = writeAppLanguage(language);
  if (typeof document !== "undefined") {
    document.documentElement.lang = next;
  }
});

if (typeof document !== "undefined") {
  document.documentElement.lang = normalizeAppLanguage(i18n.language);
}

export function appLanguage() {
  return normalizeAppLanguage(i18n.resolvedLanguage || i18n.language);
}

export default i18n;
