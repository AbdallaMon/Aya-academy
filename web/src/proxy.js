// Locale proxy (Next 16 `proxy` convention, formerly `middleware`) — guarantees
// every page URL is prefixed with a supported locale (/ar or /en). English is the
// fallback. Detection on an unprefixed request: i18lng cookie → Accept-Language →
// fallback (en). It also keeps the i18lng cookie in sync with the URL so the
// server layout first-paint and the client i18n context agree with the URL.

import { NextResponse } from "next/server";
import { cookieName, fallbackLng, languages } from "./i18n/settings.js";

const PUBLIC_FILE = /\.(.*)$/;

function detectLocale(request) {
  const cookieLng = request.cookies.get(cookieName)?.value;
  if (languages.includes(cookieLng)) return cookieLng;

  const accept = request.headers.get("accept-language") || "";
  const preferred = accept
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase());
  const match = preferred.find((code) => languages.includes(code));
  return match || fallbackLng;
}

export default function proxy(request) {
  const { pathname } = request.nextUrl;

  // Skip Next internals, API routes, and static files (anything with an ext).
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes("/__nextjs") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const hasLocale = languages.some(
    (lng) => pathname === `/${lng}` || pathname.startsWith(`/${lng}/`),
  );

  if (!hasLocale) {
    const lng = detectLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${lng}${pathname === "/" ? "" : pathname}`;
    const res = NextResponse.redirect(url);
    res.cookies.set(cookieName, lng, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  // Already prefixed — make sure the cookie mirrors the URL locale.
  const urlLng = pathname.split("/")[1];
  const res = NextResponse.next();
  if (request.cookies.get(cookieName)?.value !== urlLng) {
    res.cookies.set(cookieName, urlLng, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
