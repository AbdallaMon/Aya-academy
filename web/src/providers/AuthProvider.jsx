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

// Non-sensitive UI hint only. Authentication still depends exclusively on the
// server's httpOnly JWT cookies. The hint prevents anonymous public visitors
// from making two guaranteed-to-fail /auth requests on every page view.
const SESSION_HINT_COOKIE = "ayah_session_hint";

function hasSessionHint() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((entry) => entry.trim().startsWith(`${SESSION_HINT_COOKIE}=`));
}

function setSessionHint(active) {
  if (typeof document === "undefined") return;
  if (!active) {
    document.cookie = `${SESSION_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_HINT_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

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
      setSessionHint(false);
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
    setSessionHint(true);
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

  // Validate protected routes, plus public routes where a prior successful
  // login left a session hint. A brand-new anonymous homepage visit can render
  // the guest navbar immediately without predictable 401 + refresh failures.
  useEffect(() => {
    let cancelled = false;
    async function validateSession() {
      const protectedRoute = isProtectedPath(window.location.pathname);
      if (!protectedRoute && !hasSessionHint()) {
        setValidatingAuth(false);
        return;
      }

      setValidatingAuth(true);
      try {
        const result = await apiFetch.get(
          "auth/me",
          protectedRoute ? undefined : { _skipRefresh: true, _public: true },
        );
        if (cancelled) return;
        const currentUser = result?.data?.user ?? null;
        setUser(currentUser);
        setIsLoggedIn(Boolean(currentUser));
        setSessionHint(Boolean(currentUser));
      } catch {
        if (cancelled) return;
        setIsLoggedIn(false);
        setUser(null);
        setSessionHint(false);
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
