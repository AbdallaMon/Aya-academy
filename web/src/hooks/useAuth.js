"use client";

import { useContext } from "react";
import { AuthContext } from "../providers/AuthProvider.jsx";

/**
 * useAuth — access the current auth state and actions.
 * Must be used inside <AuthProvider>.
 *
 * Returns: { user, isLoggedIn, validatingAuth, setAuthUser, logout, clearUser }
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
