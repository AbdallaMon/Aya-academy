"use client";

// Role-aware dashboard overview. The shell already guarantees an authenticated
// user, so we branch on user.role to render the right overview.

import { USER_ROLES } from "@ayah/shared";
import { useAuth } from "../../../hooks/useAuth.js";
import AdminOverview from "../components/AdminOverview.jsx";
import ParentOverview from "../components/ParentOverview.jsx";
import StudentOverview from "../components/StudentOverview.jsx";

export default function DashboardOverview() {
  const { user } = useAuth();
  if (!user) return null;

  switch (user.role) {
    case USER_ROLES.ADMIN:
      return <AdminOverview />;
    case USER_ROLES.PARENT:
      return <ParentOverview />;
    case USER_ROLES.STUDENT:
      return <StudentOverview />;
    default:
      return <StudentOverview />;
  }
}
