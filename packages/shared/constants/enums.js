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

// Subjects taught in a logged tutoring session (multi-select). The UI groups
// these under Qur'an Programs / Arabic Language / Islamic Education.
export const SESSION_SUBJECTS = {
  QURAN_MEMORIZATION: "QURAN_MEMORIZATION",
  TAJWEED_COURSES: "TAJWEED_COURSES",
  ARABIC_READING: "ARABIC_READING",
  ARABIC_SPEAKING: "ARABIC_SPEAKING",
  QURANIC_ARABIC: "QURANIC_ARABIC",
  ISLAMIC_STUDIES: "ISLAMIC_STUDIES",
};

// Display grouping for the subject multi-select (group label → subject keys).
export const SESSION_SUBJECT_GROUPS = [
  {
    key: "QURAN_PROGRAMS",
    subjects: [
      SESSION_SUBJECTS.QURAN_MEMORIZATION,
      SESSION_SUBJECTS.TAJWEED_COURSES,
    ],
  },
  {
    key: "ARABIC_LANGUAGE",
    subjects: [
      SESSION_SUBJECTS.ARABIC_READING,
      SESSION_SUBJECTS.ARABIC_SPEAKING,
      SESSION_SUBJECTS.QURANIC_ARABIC,
    ],
  },
  {
    key: "ISLAMIC_EDUCATION",
    subjects: [SESSION_SUBJECTS.ISLAMIC_STUDIES],
  },
];

export const SESSION_ATTENDANCE = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
};

// Teacher's evaluation of the student in a session (best → weakest).
export const SESSION_RATINGS = {
  EXCELLENT: "EXCELLENT",
  VERY_GOOD: "VERY_GOOD",
  GOOD: "GOOD",
  FAIR: "FAIR",
  WEAK: "WEAK",
};

export const SESSION_RATING_ORDER = [
  SESSION_RATINGS.EXCELLENT,
  SESSION_RATINGS.VERY_GOOD,
  SESSION_RATINGS.GOOD,
  SESSION_RATINGS.FAIR,
  SESSION_RATINGS.WEAK,
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

// Invoice lifecycle. Payment is not real yet — status is set manually.
export const INVOICE_STATUSES = {
  UNPAID: "UNPAID",
  PAID: "PAID",
  VOID: "VOID",
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

// Reusable-template purpose. GENERAL = admin-picked for manual certificates;
// GAME = auto-applied to every game certificate; EXAM = auto-applied to every
// quiz/exam-pass certificate. Multiple GAME/EXAM templates may exist, but only
// ONE of each type is active at a time (the "in-use" one). Activating a new one
// deactivates the rest of its type.
export const CERTIFICATE_TEMPLATE_TYPES = {
  GENERAL: "GENERAL",
  GAME: "GAME",
  EXAM: "EXAM",
};

// Auto-applied template types — at most one ACTIVE template each (used by games
// and quizzes respectively). GENERAL templates have no such constraint.
export const AUTO_CERTIFICATE_TEMPLATE_TYPES = [
  CERTIFICATE_TEMPLATE_TYPES.GAME,
  CERTIFICATE_TEMPLATE_TYPES.EXAM,
];

// Certificate template keys drive the frontend's decorative rendering.
// GAME certificates use the game's `slug` as their templateKey (one look per
// game). QUIZ (exam-pass) certificates fall back to this unified key only when
// no active EXAM template is configured.
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
  INVOICE_SENT: "INVOICE_SENT",
  CERTIFICATE_ISSUED: "CERTIFICATE_ISSUED",
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

