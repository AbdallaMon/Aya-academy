// Closed-set enums shared between server, web and the Prisma schema.
// IMPORTANT: keep values in sync with packages/db/prisma/schema.prisma.

export const BILLING_PERIODS = {
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
};

export const DISCOUNT_TYPES = {
  PERCENT: "PERCENT",
  FIXED: "FIXED",
};

export const DISCOUNT_CONSTRAINTS = {
  COUNT: "COUNT",
  DURATION: "DURATION",
};

export const COUPON_SOURCES = {
  MANUAL: "MANUAL",
  GAME_REWARD: "GAME_REWARD",
  QUIZ_REWARD: "QUIZ_REWARD",
  ADMIN_GIFT: "ADMIN_GIFT",
};

// Pedagogical level an admin assigns to a student (distinct from numeric level).
export const STUDENT_LEVELS = {
  BEGINNER: "BEGINNER",
  EXPLORER: "EXPLORER",
  BUILDER: "BUILDER",
  CONFIDENT_READER: "CONFIDENT_READER",
};

// Order used for selectors / progression display.
export const STUDENT_LEVEL_ORDER = [
  STUDENT_LEVELS.BEGINNER,
  STUDENT_LEVELS.EXPLORER,
  STUDENT_LEVELS.BUILDER,
  STUDENT_LEVELS.CONFIDENT_READER,
];

export const POINT_SOURCES = {
  BADGE: "BADGE",
  GAME: "GAME",
  QUIZ: "QUIZ",
  MANUAL: "MANUAL",
  ADJUSTMENT: "ADJUSTMENT",
};

export const SUBSCRIPTION_STATUSES = {
  PENDING: "PENDING",
  UPCOMING: "UPCOMING",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
};

/**
 * Single source of truth for "currently active" subscription filtering.
 * A subscription counts as active only when its status is ACTIVE **and** now
 * falls inside its [startDate, endDate] window. This guards against the
 * "ACTIVE but expired" case where status was never flipped after endDate.
 *
 * Returns a Prisma `where` fragment; spread it into a larger `where`.
 *   prisma.subscription.findFirst({ where: { studentId, ...activeSubscriptionWhere() } })
 */
export function activeSubscriptionWhere(now = new Date()) {
  return {
    status: SUBSCRIPTION_STATUSES.ACTIVE,
    startDate: { lte: now },
    endDate: { gte: now },
  };
}

export const LESSON_STATUSES = {
  SCHEDULED: "SCHEDULED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  MISSED: "MISSED",
};

export const GAME_TYPES = {
  INTERACTIVE: "INTERACTIVE",
  QUIZ: "QUIZ",
  STORY: "STORY",
};

export const GAME_QUESTION_KINDS = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  PHONE_CALL: "PHONE_CALL",
  EMOJI_CHOICE: "EMOJI_CHOICE",
  SCENARIO: "SCENARIO",
  TAP_CHOICE: "TAP_CHOICE",
  DIALPAD: "DIALPAD",
  TONE_SLIDER: "TONE_SLIDER",
  MATCHING: "MATCHING",
  COMPASS: "COMPASS",
  CALENDAR_DROP: "CALENDAR_DROP",
  COLORING: "COLORING",
  BOARD_DICE: "BOARD_DICE",
};

export const ASSIGNMENT_STATUSES = {
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
};

export const QUIZ_INVITE_STATUSES = {
  PENDING: "PENDING",
  OPENED: "OPENED",
  BUILT: "BUILT",
  COMPLETED: "COMPLETED",
  EXPIRED: "EXPIRED",
};

export const QUIZ_ITEM_SOURCES = {
  BANK: "BANK",
  CUSTOM: "CUSTOM",
};

export const CERTIFICATE_TYPES = {
  GAME: "GAME",
  QUIZ: "QUIZ",
  MANUAL: "MANUAL",
};

// Certificate template keys drive the frontend's decorative rendering.
// GAME certificates use the game's `slug` as their templateKey (one look per
// game). QUIZ (exam-pass) certificates all share a single unified template,
// visually distinct from games.
export const CERTIFICATE_TEMPLATE_KEYS = {
  EXAM: "EXAM",
};

export const REWARD_TYPES = {
  COUPON: "COUPON",
  FREE_LECTURES: "FREE_LECTURES",
  BADGE: "BADGE",
};

export const REWARD_STATUSES = {
  PENDING: "PENDING",
  CLAIMED: "CLAIMED",
  EXPIRED: "EXPIRED",
};

export const NOTIFICATION_TYPES = {
  SUBSCRIPTION_CREATED: "SUBSCRIPTION_CREATED",
  SUBSCRIPTION_EXPIRING: "SUBSCRIPTION_EXPIRING",
  SUBSCRIPTION_RENEWED: "SUBSCRIPTION_RENEWED",
  SUBSCRIPTION_EXPIRED: "SUBSCRIPTION_EXPIRED",
  REPORT_RECEIVED: "REPORT_RECEIVED",
  GAME_ASSIGNED: "GAME_ASSIGNED",
  QUIZ_INVITE: "QUIZ_INVITE",
  QUIZ_PASSED: "QUIZ_PASSED",
  QUIZ_FAILED: "QUIZ_FAILED",
  GIFT_RECEIVED: "GIFT_RECEIVED",
  LESSON_SCHEDULED: "LESSON_SCHEDULED",
  GENERIC: "GENERIC",
};

export const ATTACHMENT_OWNER_TYPES = {
  REPORT: "REPORT",
  USER: "USER",
  CERTIFICATE: "CERTIFICATE",
  GAME: "GAME",
  GENERIC: "GENERIC",
};

// ── Backup / encryption-at-rest / Google Drive (mirrors C:\coding\asmaa) ──
export const BACKUP_TRIGGERS = {
  AUTO: "AUTO",
  MANUAL: "MANUAL",
};

export const BACKUP_STATUSES = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
};

export const BACKUP_PROVIDERS = {
  DRIVE: "drive",
  LOCAL: "local",
  S3: "s3",
};

// Drive account kind: KEY (stores encryption keys) | DB (stores DB dumps).
export const DRIVE_ACCOUNT_TYPES = {
  KEY: "KEY",
  DB: "DB",
};
