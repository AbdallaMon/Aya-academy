"use client";

// Shared constants for the unified user-detail surface.
import { STUDENT_LEVELS, STUDENT_LEVEL_ORDER } from "@aya/shared";

export const USERS_URL = "users";
export const BADGES_URL = "badges";
export const POINTS_URL = "points";
export const REPORTS_URL = "reports";
export const INVITES_URL = "quizzes/invites";
export const SUBSCRIPTIONS_URL = "subscriptions";
export const PLANS_URL = "plans";

/** The ordered list of pedagogical levels (mirrors the server enum). */
export const LEVELS = STUDENT_LEVEL_ORDER;

/**
 * Bilingual labels for a student's StudentLevel. Used by the detail page,
 * the children table and anywhere a level needs a human label.
 */
export const STUDENT_LEVEL_LABELS = {
  ar: {
    [STUDENT_LEVELS.BEGINNER]: "مبتدئ",
    [STUDENT_LEVELS.EXPLORER]: "مستكشف",
    [STUDENT_LEVELS.BUILDER]: "بنّاء",
    [STUDENT_LEVELS.CONFIDENT_READER]: "قارئ واثق",
  },
  en: {
    [STUDENT_LEVELS.BEGINNER]: "Beginner",
    [STUDENT_LEVELS.EXPLORER]: "Explorer",
    [STUDENT_LEVELS.BUILDER]: "Builder",
    [STUDENT_LEVELS.CONFIDENT_READER]: "Confident reader",
  },
};

/** Resolve a level label for the active language (falls back to the raw value). */
export function levelLabel(level, lng) {
  if (!level) return "—";
  const table = STUDENT_LEVEL_LABELS[lng === "en" ? "en" : "ar"];
  return table[level] || level;
}

/** MUI Chip color per subscription status (shared with the subscriptions list). */
export const SUBSCRIPTION_STATUS_COLOR = {
  PENDING: "warning",
  UPCOMING: "info",
  ACTIVE: "success",
  EXPIRED: "default",
  CANCELLED: "error",
};

/** Statuses from which a subscription may still be cancelled. */
export const CANCELLABLE_STATUSES = ["PENDING", "UPCOMING", "ACTIVE"];

export function formatDate(value, lng) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(lng === "en" ? "en-GB" : "ar-EG", {
    dateStyle: "medium",
  }).format(d);
}

/** Best display name for a student/parent row. */
export function personLabel(person) {
  if (!person) return "";
  if (person.nickname && person.nickname !== person.name) {
    return `${person.name} (${person.nickname})`;
  }
  return person.name;
}
