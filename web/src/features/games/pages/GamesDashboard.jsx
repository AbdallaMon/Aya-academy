"use client";

// Role-aware games dashboard switch. ADMIN (the teacher) sees the games
// manager; STUDENT sees their own "ألعابي" list. Parents have no games surface,
// so they get nothing (the route has no parent nav link).

import { USER_ROLES } from "@aya/shared";
import { useAuth } from "../../../hooks/useAuth.js";
import GamesAdminPage from "./GamesAdminPage.jsx";
import MyGamesPage from "./MyGamesPage.jsx";

export default function GamesDashboard() {
  const { user } = useAuth();
  if (user?.role === USER_ROLES.ADMIN) return <GamesAdminPage />;
  if (user?.role === USER_ROLES.STUDENT) return <MyGamesPage />;
  return null;
}
