"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import apiFetch from "../lib/api/ApiFetch.js";
import { isProtectedPath } from "../utils/constant.js";
import { getLocaleFromPathname, localePath } from "../i18n/routing.js";

export const AuthContext = createContext(null);

/**
 * AuthProvider — hydrates the current user from `/auth/me` on mount and exposes
 * auth state + actions. The JWT lives in httpOnly cookies, so there is no token
 * to store client-side; we just validate the session and hold the user object.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [validatingAuth, setValidatingAuth] = useState(true);
  const router = useRouter();

  const clearUser = useCallback(
    (withRedirect = true) => {
      setUser(null);
      setIsLoggedIn(false);
      if (withRedirect) {
        const lng = getLocaleFromPathname(window.location.pathname);
        router.replace(localePath(lng, "/login"));
      }
    },
    [router],
  );

  /** Called by a login flow after a successful login response. */
  const setAuthUser = useCallback((userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  }, []);

  /** Best-effort server logout, then clear + redirect. */
  const logout = useCallback(() => {
    apiFetch.post("auth/logout").catch(() => {});
    clearUser();
  }, [clearUser]);

  // Redirect to /login when a 401 survives a failed token refresh, but only on
  // protected routes.
  useEffect(() => {
    apiFetch.onAuthFailure = () => {
      clearUser(false);
      const pathname = window.location.pathname;
      if (isProtectedPath(pathname)) {
        const lng = getLocaleFromPathname(pathname);
        router.replace(localePath(lng, "/login"));
      }
    };
    return () => {
      apiFetch.onAuthFailure = null;
    };
  }, [router, clearUser]);

  // Validate the session once on mount. We do this on EVERY route (including the
  // public marketing pages) so the navbar can show the right entry point
  // (Dashboard for a signed-in user vs Login / Sign-up for a guest). A 401 on a
  // public page just resolves to "logged out" — the redirect in onAuthFailure
  // only fires on protected routes.
  useEffect(() => {
    let cancelled = false;
    async function validateSession() {
      setValidatingAuth(true);
      try {
        const result = await apiFetch.get("auth/me");
        if (cancelled) return;
        setUser(result?.data?.user ?? null);
        setIsLoggedIn(Boolean(result?.data?.user));
      } catch {
        if (cancelled) return;
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        if (!cancelled) setValidatingAuth(false);
      }
    }
    validateSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ user, isLoggedIn, validatingAuth, setAuthUser, logout, clearUser }),
    [user, isLoggedIn, validatingAuth, setAuthUser, logout, clearUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
