// Locale proxy (Next 16 `proxy` convention, formerly `middleware`) — guarantees
// every page URL is prefixed with a supported locale (/ar or /en). English is the
// default. An explicit i18lng cookie wins; otherwise unprefixed URLs use English.
// It also keeps the i18lng cookie in sync with the URL so the
// server layout first-paint and the client i18n context agree with the URL.

import { NextResponse } from "next/server";
import { cookieName, defaultLng, languages } from "./i18n/settings.js";

const PUBLIC_FILE = /\.(.*)$/;

function detectLocale(request) {
  const cookieLng = request.cookies.get(cookieName)?.value;
  if (languages.includes(cookieLng)) return cookieLng;

  return defaultLng;
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
    // The bare root has one stable canonical destination, so make that redirect
    // permanent. Other unprefixed paths remain cookie-aware and temporary.
    const isRoot = pathname === "/";
    const lng = isRoot ? defaultLng : detectLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${lng}${isRoot ? "" : pathname}`;
    const res = NextResponse.redirect(url, isRoot ? 308 : 307);
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
