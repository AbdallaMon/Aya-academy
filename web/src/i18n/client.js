"use client";

// Client-side i18n. Self-contained (no i18next runtime) but exposes the same
// `useTranslation()` API the rest of the app expects:
//   const { t, lng, changeLanguage, toggleLanguage } = useTranslation();
//   const data = t("tableData", { returnObjects: true });
//
// Language is held in React context, persisted to a cookie + localStorage, and
// applied to <html dir/lang>. Arabic (RTL) is the default.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cookieName, fallbackLng, getDirection, languages } from "./settings.js";
import { getLanguageResources } from "./resources.js";
import translation from "./locales/translation.js";

const I18nContext = createContext(null);

function readCookieLng() {
  if (typeof document === "undefined") return undefined;
  const raw = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${cookieName}=`))
    ?.split("=")[1];
  return languages.includes(raw) ? raw : undefined;
}

export function I18nProviderClient({ children, lng: initialLng }) {
  const [lng, setLng] = useState(() => {
    if (languages.includes(initialLng)) return initialLng;
    return readCookieLng() ?? fallbackLng;
  });

  const resources = useMemo(() => getLanguageResources(translation, lng), [lng]);

  const t = useCallback(
    (section, options) => {
      const value = resources[section];
      if (options?.returnObjects) return value ?? {};
      return value ?? section;
    },
    [resources],
  );

  const changeLanguage = useCallback((nextLng) => {
    if (!languages.includes(nextLng)) return;
    setLng(nextLng);
    if (typeof document !== "undefined") {
      document.cookie = `${cookieName}=${nextLng}; path=/; max-age=${60 * 60 * 24 * 365}`;
      window.localStorage.setItem(cookieName, nextLng);
      document.documentElement.lang = nextLng;
      document.documentElement.dir = getDirection(nextLng);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    changeLanguage(lng === "ar" ? "en" : "ar");
  }, [lng, changeLanguage]);

  // Keep <html dir/lang> in sync with the active language.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lng;
    document.documentElement.dir = getDirection(lng);
  }, [lng]);

  const value = useMemo(
    () => ({ t, lng, changeLanguage, toggleLanguage, i18n: { language: lng, changeLanguage } }),
    [t, lng, changeLanguage, toggleLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Graceful fallback so components used outside the provider (e.g. isolated
    // tests) still render with default-language strings instead of crashing.
    const resources = getLanguageResources(translation, fallbackLng);
    const t = (section, options) =>
      options?.returnObjects ? resources[section] ?? {} : resources[section] ?? section;
    return {
      t,
      lng: fallbackLng,
      changeLanguage: () => {},
      toggleLanguage: () => {},
      i18n: { language: fallbackLng, changeLanguage: () => {} },
    };
  }
  return ctx;
}
