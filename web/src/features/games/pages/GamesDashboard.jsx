"use client";

// Role-aware games dashboard switch. ADMIN (the teacher) sees the games
// manager; everyone else (students) sees their own "ألعابي" list. Keeps the
// student experience (MyGamesPage) untouched.

import { USER_ROLES } from "@aya/shared";
import { useAuth } from "../../../hooks/useAuth.js";
import GamesAdminPage from "./GamesAdminPage.jsx";
import MyGamesPage from "./MyGamesPage.jsx";

export default function GamesDashboard() {
  const { user } = useAuth();
  return user?.role === USER_ROLES.ADMIN ? <GamesAdminPage /> : <MyGamesPage />;
}
