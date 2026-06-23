"use client";

// Role-adaptive badges screen:
//   - ADMIN holding BADGE.LIST → the badge-definition management surface.
//   - Everyone else (students) → the existing read-only awarded-badges view.
//
// Gating is on the permission code (BADGE.LIST is admin-only via the role
// profiles), never on the raw role string.

import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import BadgesPage from "../../badges/pages/BadgesPage.jsx";
import BadgesAdminPage from "./BadgesAdminPage.jsx";

export default function BadgesRouter() {
  const { hasPermission } = usePermission();
  if (hasPermission(PERMISSIONS.BADGE.LIST)) {
    return <BadgesAdminPage />;
  }
  return <BadgesPage />;
}
