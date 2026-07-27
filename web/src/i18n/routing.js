// Locale routing helpers — pure + isomorphic (safe on server and client).
// The app uses URL-prefixed locales: every page lives under /ar/... or /en/...
// English is the default; Arabic remains available as RTL.

import { defaultLng, languages } from "./settings.js";

// Read the locale from a pathname like "/ar/dashboard" → "ar" (or default).
export function getLocaleFromPathname(pathname = "/") {
  const seg = pathname.split("/")[1];
  return languages.includes(seg) ? seg : defaultLng;
}

// Strip the leading /{lng} from a pathname. "/ar/dashboard" → "/dashboard",
// "/en" → "/", "/dashboard" (no prefix) → "/dashboard".
export function stripLocale(pathname = "/") {
  const seg = pathname.split("/");
  if (languages.includes(seg[1])) {
    const rest = "/" + seg.slice(2).join("/");
    return rest === "/" ? "/" : rest.replace(/\/+$/, "") || "/";
  }
  return pathname || "/";
}

// Prefix a locale onto an app path. localePath("ar", "/dashboard") → "/ar/dashboard".
// Pass-through for external/hash/absolute links so we never mangle them.
export function localePath(lng, path = "/") {
  const lang = languages.includes(lng) ? lng : defaultLng;
  if (!path) return `/${lang}`;
  // External, protocol-relative, mailto/tel, or pure hash → leave untouched.
  if (/^([a-z]+:)?\/\//i.test(path) || /^(mailto:|tel:|#)/i.test(path)) return path;

  // Split off a trailing #hash so we can prefix the path part only.
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const bare = hashIndex >= 0 ? path.slice(0, hashIndex) : path;

  const clean = stripLocale(bare.startsWith("/") ? bare : `/${bare}`);
  const joined = clean === "/" ? `/${lang}` : `/${lang}${clean}`;
  return `${joined}${hash}`;
}

// Swap the locale in the CURRENT pathname (used by the language switcher).
// swapLocale("/ar/dashboard/games", "en") → "/en/dashboard/games".
export function swapLocale(pathname, nextLng) {
  return localePath(nextLng, stripLocale(pathname));
}
