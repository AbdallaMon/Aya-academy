"use client";

// Builds the dashboard navigation model, gated by role + permission code.
//
// Each item: { key, labelKey, href, icon, permission? , anyPermission? }
//   - `permission`     single PERMISSIONS code required to show the item
//   - `anyPermission`  array — show if the user holds ANY of them
//   - items with neither are always shown (e.g. Overview)
//
// The actual rendering (in DashboardSidebar) filters with usePermission, so this
// stays declarative. Role decides WHICH set of links; permission decides whether
// each gated link is visible at all.

import { PERMISSIONS, USER_ROLES } from "@aya/shared";
import {
  MdSpaceDashboard,
  MdWorkspacePremium,
  MdSubscriptions,
  MdSportsEsports,
  MdQuiz,
  MdLibraryBooks,
  MdMarkEmailRead,
  MdAssessment,
  MdNotifications,
  MdChildCare,
  MdBackup,
  MdMilitaryTech,
  MdGroup,
  MdFamilyRestroom,
  MdSchool,
  MdEventNote,
  MdLocalOffer,
  MdLeaderboard,
} from "react-icons/md";

const ICONS = {
  overview: MdSpaceDashboard,
  users: MdGroup,
  parents: MdFamilyRestroom,
  students: MdSchool,
  plans: MdWorkspacePremium,
  subscriptions: MdSubscriptions,
  sessions: MdEventNote,
  coupons: MdLocalOffer,
  games: MdSportsEsports,
  quizzes: MdQuiz,
  quizBank: MdLibraryBooks,
  invitations: MdMarkEmailRead,
  reports: MdAssessment,
  certificates: MdWorkspacePremium,
  backups: MdBackup,
  notifications: MdNotifications,
  children: MdChildCare,
  badges: MdMilitaryTech,
  leaderboard: MdLeaderboard,
};

function adminNav() {
  return [
    { key: "overview", labelKey: "overview", href: "/dashboard", icon: ICONS.overview },
    { key: "users", labelKey: "users", href: "/dashboard/users", icon: ICONS.users, permission: PERMISSIONS.USER.LIST },
    { key: "parents", labelKey: "parents", href: "/dashboard/parents", icon: ICONS.parents, permission: PERMISSIONS.USER.LIST },
    { key: "students", labelKey: "students", href: "/dashboard/students", icon: ICONS.students, permission: PERMISSIONS.USER.LIST },
    { key: "plans", labelKey: "plans", href: "/dashboard/plans", icon: ICONS.plans, permission: PERMISSIONS.PLAN.LIST },
    { key: "subscriptions", labelKey: "subscriptions", href: "/dashboard/subscriptions", icon: ICONS.subscriptions, permission: PERMISSIONS.SUBSCRIPTION.LIST },
    { key: "sessions", labelKey: "sessions", href: "/dashboard/sessions", icon: ICONS.sessions, permission: PERMISSIONS.SESSION.LIST },
    { key: "coupons", labelKey: "coupons", href: "/dashboard/coupons", icon: ICONS.coupons, permission: PERMISSIONS.COUPON.LIST },
    { key: "games", labelKey: "games", href: "/dashboard/games", icon: ICONS.games, permission: PERMISSIONS.GAME.LIST },
    { key: "quizzes", labelKey: "quizzes", href: "/dashboard/quizzes", icon: ICONS.quizzes, permission: PERMISSIONS.QUIZ.LIST },
    { key: "quizBank", labelKey: "quizBank", href: "/dashboard/quiz-bank", icon: ICONS.quizBank, permission: PERMISSIONS.QUIZ.LIST_BANK },
    { key: "invitations", labelKey: "invitations", href: "/dashboard/quiz-invites", icon: ICONS.invitations, permission: PERMISSIONS.QUIZ.CREATE_INVITE },
    { key: "reports", labelKey: "reports", href: "/dashboard/reports", icon: ICONS.reports, permission: PERMISSIONS.REPORT.LIST },
    { key: "certificates", labelKey: "certificates", href: "/dashboard/certificates", icon: ICONS.certificates, permission: PERMISSIONS.CERTIFICATE.LIST },
    { key: "badges", labelKey: "badges", href: "/dashboard/badges", icon: ICONS.badges, permission: PERMISSIONS.BADGE.LIST },
    { key: "leaderboard", labelKey: "leaderboardNav", href: "/dashboard/leaderboard", icon: ICONS.leaderboard, permission: PERMISSIONS.POINT.VIEW_LEADERBOARD },
    { key: "backups", labelKey: "backups", href: "/dashboard/backups", icon: ICONS.backups, permission: PERMISSIONS.BACKUP.MANAGE },
    { key: "notifications", labelKey: "notifications", href: "/dashboard/notifications", icon: ICONS.notifications, permission: PERMISSIONS.NOTIFICATION.LIST },
  ];
}

function parentNav() {
  return [
    { key: "overview", labelKey: "overview", href: "/dashboard", icon: ICONS.overview },
    { key: "children", labelKey: "children", href: "/dashboard/children", icon: ICONS.children, permission: PERMISSIONS.USER.LIST },
    { key: "invitations", labelKey: "invitations", href: "/dashboard/quiz-invites", icon: ICONS.invitations, permission: PERMISSIONS.QUIZ.LIST },
    { key: "subscriptions", labelKey: "subscriptions", href: "/dashboard/subscriptions", icon: ICONS.subscriptions, permission: PERMISSIONS.SUBSCRIPTION.LIST },
    { key: "reports", labelKey: "reports", href: "/dashboard/reports", icon: ICONS.reports, permission: PERMISSIONS.REPORT.LIST },
    { key: "certificates", labelKey: "certificates", href: "/dashboard/certificates", icon: ICONS.certificates, permission: PERMISSIONS.CERTIFICATE.LIST },
    { key: "leaderboard", labelKey: "leaderboardNav", href: "/dashboard/leaderboard", icon: ICONS.leaderboard, permission: PERMISSIONS.POINT.VIEW_LEADERBOARD },
    { key: "notifications", labelKey: "notifications", href: "/dashboard/notifications", icon: ICONS.notifications, permission: PERMISSIONS.NOTIFICATION.LIST },
  ];
}

function studentNav() {
  return [
    { key: "overview", labelKey: "overview", href: "/dashboard", icon: ICONS.overview },
    { key: "games", labelKey: "myGames", href: "/dashboard/games", icon: ICONS.games, permission: PERMISSIONS.GAME.LIST },
    { key: "quizzes", labelKey: "quizzes", href: "/dashboard/quizzes", icon: ICONS.quizzes, anyPermission: [PERMISSIONS.QUIZ.VIEW, PERMISSIONS.QUIZ.ATTEMPT] },
    { key: "certificates", labelKey: "certificates", href: "/dashboard/certificates", icon: ICONS.certificates, permission: PERMISSIONS.CERTIFICATE.LIST },
    { key: "badges", labelKey: "badges", href: "/dashboard/badges", icon: ICONS.badges, permission: PERMISSIONS.REWARD.LIST },
    { key: "leaderboard", labelKey: "leaderboardNav", href: "/dashboard/leaderboard", icon: ICONS.leaderboard, permission: PERMISSIONS.POINT.VIEW_LEADERBOARD },
    { key: "notifications", labelKey: "notifications", href: "/dashboard/notifications", icon: ICONS.notifications, permission: PERMISSIONS.NOTIFICATION.LIST },
  ];
}

export function getNavModelForRole(role) {
  switch (role) {
    case USER_ROLES.ADMIN:
      return adminNav();
    case USER_ROLES.PARENT:
      return parentNav();
    case USER_ROLES.STUDENT:
      return studentNav();
    default:
      return [{ key: "overview", labelKey: "overview", href: "/dashboard", icon: ICONS.overview }];
  }
}

// Find the nav item whose href best matches the given bare (locale-stripped)
// pathname, so the topbar can show the current section title. Longest-prefix
// match wins (so /dashboard/users beats /dashboard). Returns the item or null.
export function findNavItemByPath(role, barePath) {
  const items = getNavModelForRole(role);
  let best = null;
  for (const item of items) {
    if (item.href === "/dashboard") {
      if (barePath === "/dashboard" && !best) best = item;
      continue;
    }
    if (barePath === item.href || barePath.startsWith(item.href + "/")) {
      if (!best || item.href.length > best.href.length) best = item;
    }
  }
  // Fall back to Overview if nothing matched but we're under /dashboard.
  if (!best && barePath.startsWith("/dashboard")) {
    best = items.find((i) => i.href === "/dashboard") || null;
  }
  return best;
}

export function roleLabelKey(role) {
  if (role === USER_ROLES.ADMIN) return "roleAdmin";
  if (role === USER_ROLES.PARENT) return "roleParent";
  if (role === USER_ROLES.STUDENT) return "roleStudent";
  return "roleStudent";
}
