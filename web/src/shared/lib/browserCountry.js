"use client";

import { useSyncExternalStore } from "react";

/**
 * Guess the user's country (ISO-3166 alpha-2, e.g. "EG") from signals the
 * browser already exposes — NO network/IP API calls.
 *
 * Order of preference:
 *   1. Region subtag of the browser UI language(s)  ("ar-EG" → "EG").
 *   2. Region implied by the language when it has none ("ar" → "EG", "en" → "US")
 *      via Intl.Locale#maximize().
 *
 * Returns `undefined` on the server (no `navigator`) so callers can render a
 * neutral picker until the client resolves a country on mount.
 */
export function detectBrowserCountry() {
  if (typeof navigator === "undefined") return undefined;

  const langs =
    navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];

  // First pass: an explicit region subtag the user actually set ("ar-EG").
  for (const lang of langs) {
    const region = regionFromLocale(lang, false);
    if (region) return region;
  }
  // Second pass: let Intl infer the most likely region for a bare language.
  for (const lang of langs) {
    const region = regionFromLocale(lang, true);
    if (region) return region;
  }
  return undefined;
}

function regionFromLocale(lang, allowMaximize) {
  if (!lang) return null;
  try {
    let locale = new Intl.Locale(lang);
    if (!locale.region && allowMaximize) locale = locale.maximize();
    const region = locale.region;
    return region && /^[A-Z]{2}$/.test(region) ? region : null;
  } catch {
    return null;
  }
}

const subscribe = () => () => {};

/**
 * Client hook: returns the browser-detected country.
 * `undefined` during SSR / first paint (so server and client markup match),
 * then the resolved ISO code on the client — without a setState-in-effect.
 */
export function useBrowserCountry() {
  return useSyncExternalStore(
    subscribe,
    () => detectBrowserCountry(),
    () => undefined,
  );
}
