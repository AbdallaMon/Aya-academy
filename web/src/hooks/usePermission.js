"use client";

import { useCallback, useMemo } from "react";
import { getPermissionsForRole } from "@aya/shared";
import { useAuth } from "./useAuth.js";

/**
 * usePermission — permission helpers derived from the authenticated user.
 *
 * The backend `/auth/me` endpoint returns the user with a flat `permissions`
 * array of language-neutral codes (e.g. ["user.list", "plan.view"]). If, for
 * any reason, the array is absent, we resolve it from the user's role via the
 * shared `getPermissionsForRole(role)` so gating still works.
 *
 * Supports both code shapes:
 *   permissions: ["user.list", "plan.view"]
 *   permissions: [{ code: "user.list" }, { code: "plan.view" }]
 *
 * Usage:
 *   const { hasPermission, hasAnyPermission, hasAllPermissions, can } = usePermission();
 *   if (hasPermission(PERMISSIONS.USER.LIST)) { ... }
 *
 * UI gating is cosmetic — combine codes with the record's `capabilities.*`
 * flag for object-level actions; the server remains the source of truth.
 */
export function usePermission() {
  const { user } = useAuth();

  const permissionCodes = useMemo(() => {
    let permissions = user?.permissions;
    // Fallback: derive from role when the API didn't include the array.
    if ((!permissions || permissions.length === 0) && user?.role) {
      permissions = getPermissionsForRole(user.role);
    }
    return (permissions || [])
      .map((permission) =>
        typeof permission === "string" ? permission : permission?.code,
      )
      .filter(Boolean);
  }, [user?.permissions, user?.role]);

  const permissionSet = useMemo(() => new Set(permissionCodes), [permissionCodes]);

  const hasPermission = useCallback(
    (code) => (code ? permissionSet.has(code) : false),
    [permissionSet],
  );

  const hasAnyPermission = useCallback(
    (codes = []) =>
      Array.isArray(codes) ? codes.some((code) => permissionSet.has(code)) : false,
    [permissionSet],
  );

  const hasAllPermissions = useCallback(
    (codes = []) =>
      Array.isArray(codes) ? codes.every((code) => permissionSet.has(code)) : false,
    [permissionSet],
  );

  // capabilities.* style alias: `can("user.create")`.
  const can = hasPermission;

  return {
    permissions: permissionCodes,
    permissionCodes,
    permissionSet,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
  };
}
