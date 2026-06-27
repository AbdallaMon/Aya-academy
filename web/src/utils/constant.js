// Shared app-level constants (frontend). Mirrors the small set the foundation
// hooks/components rely on. Pagination defaults come from @aya/shared so the
// client agrees with the server.

import {
  DEFAULT_PAGE_SIZE as SHARED_DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS as SHARED_PAGE_SIZE_OPTIONS,
} from '@aya/shared';
import { stripLocale } from '../i18n/routing.js';

export const DEFAULT_PAGE_SIZE = SHARED_DEFAULT_PAGE_SIZE ?? 25;
export const PAGE_SIZE_OPTIONS = SHARED_PAGE_SIZE_OPTIONS ?? [25, 50, 100, 200];

// Paths that should NOT trigger the global "redirect to /error" behaviour when
// an API call fails (public viewers, the error page itself, auth pages).
export const EXCLUDED_FROM_ERROR_REDIRECT = ['/error', '/login', '/register'];

// Route prefixes that require an authenticated session (checked AFTER the
// /{lng} locale prefix is stripped, so it works for /ar/dashboard, /en/... too).
export const PROTECTED_PREFIXES = ['/dashboard'];

// Locale-agnostic protected check: "/ar/dashboard/games" → protected.
export function isProtectedPath(pathname = '') {
  const bare = stripLocale(pathname);
  return PROTECTED_PREFIXES.some(
    (prefix) => bare === prefix || bare.startsWith(`${prefix}/`)
  );
}

export function isPublicPath(pathname = '') {
  const bare = stripLocale(pathname);
  return ['/login', '/register', '/', '/error', '/free-game'].includes(bare);
}
