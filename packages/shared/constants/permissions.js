import { USER_ROLES } from "./roles.js";

// Language-neutral permission codes. Authorize on codes, never on role names.
export const USER_PERMISSIONS = {
  CREATE: "user.create",
  LIST: "user.list",
  VIEW: "user.view",
  EDIT: "user.edit",
  DELETE: "user.delete",
  // Admin sets a student's pedagogical StudentLevel.
  SET_LEVEL: "user.set_level",
  // Admin bans/unbans an account (blocks login).
  BAN: "user.ban",
};

export const PLAN_PERMISSIONS = {
  CREATE: "plan.create",
  LIST: "plan.list",
  VIEW: "plan.view",
  EDIT: "plan.edit",
  DELETE: "plan.delete",
};

export const COUPON_PERMISSIONS = {
  CREATE: "coupon.create",
  LIST: "coupon.list",
  VIEW: "coupon.view",
  EDIT: "coupon.edit",
  DELETE: "coupon.delete",
};

export const SUBSCRIPTION_PERMISSIONS = {
  CREATE: "subscription.create",
  LIST: "subscription.list",
  VIEW: "subscription.view",
  EDIT: "subscription.edit",
  DELETE: "subscription.delete",
  // Parent asks for a plan for a child → PENDING request.
  REQUEST: "subscription.request",
  // Admin approves a PENDING request → ACTIVE/UPCOMING (or rejects it).
  APPROVE: "subscription.approve",
  // Admin cancels a PENDING/UPCOMING/ACTIVE subscription → CANCELLED.
  CANCEL: "subscription.cancel",
  // Admin renews an ACTIVE/EXPIRED subscription → creates a new subscription.
  RENEW: "subscription.renew",
  // Admin activates an UPCOMING subscription immediately → ACTIVE.
  ACTIVATE: "subscription.activate",
};

export const GAME_PERMISSIONS = {
  LIST: "game.list",
  VIEW: "game.view",
  ASSIGN: "game.assign",
  ATTEMPT: "game.attempt",
  // Admin-only: manage game settings, e.g. pick which game is the public free
  // trial. ADMIN gets it automatically via getAllPermissions().
  MANAGE: "game.manage",
};

export const REPORT_PERMISSIONS = {
  CREATE: "report.create",
  LIST: "report.list",
  VIEW: "report.view",
  EDIT: "report.edit",
  DELETE: "report.delete",
};

// Logged tutoring sessions (تسجيل حصة). Admin creates/manages; parent reads
// (scoped to their children); students are not exposed to this list.
export const SESSION_LOG_PERMISSIONS = {
  CREATE: "session_log.create",
  LIST: "session_log.list",
  VIEW: "session_log.view",
  EDIT: "session_log.edit",
  DELETE: "session_log.delete",
};

export const QUIZ_PERMISSIONS = {
  CREATE_BANK: "quiz.create_bank",
  LIST_BANK: "quiz.list_bank",
  EDIT_BANK: "quiz.edit_bank",
  DELETE_BANK: "quiz.delete_bank",
  CREATE_INVITE: "quiz.create_invite",
  LIST: "quiz.list",
  BUILD: "quiz.build",
  ATTEMPT: "quiz.attempt",
  VIEW: "quiz.view",
};

export const CERTIFICATE_PERMISSIONS = {
  CREATE: "certificate.create",
  LIST: "certificate.list",
  VIEW: "certificate.view",
  // Admin manages reusable certificate templates (fixed copy + style).
  MANAGE_TEMPLATES: "certificate.manage_templates",
};

// File uploads (avatars, certificate photos). Any authenticated user may upload;
// object-scope is enforced where the attachment is consumed (e.g. avatar).
export const ATTACHMENT_PERMISSIONS = {
  UPLOAD: "attachment.upload",
};

export const REWARD_PERMISSIONS = {
  LIST: "reward.list",
  VIEW: "reward.view",
  CLAIM: "reward.claim",
};

export const NOTIFICATION_PERMISSIONS = {
  LIST: "notification.list",
  READ: "notification.read",
};

// Admin-managed badge definitions + awarding/revoking to students.
export const BADGE_PERMISSIONS = {
  CREATE: "badge.create",
  LIST: "badge.list",
  VIEW: "badge.view",
  EDIT: "badge.edit",
  DELETE: "badge.delete",
  AWARD: "badge.award",
  REVOKE: "badge.revoke",
};

// Points ledger + leaderboard. VIEW_LEADERBOARD is readable by parent/student
// (scoped); LIST/AWARD are admin-only.
export const POINT_PERMISSIONS = {
  LIST: "point.list",
  AWARD: "point.award",
  VIEW_LEADERBOARD: "point.view_leaderboard",
};

// Backup / encryption keys / Drive accounts — admin-only management.
export const BACKUP_PERMISSIONS = {
  MANAGE: "backup.manage",
};

// Per-subscription invoices. VIEW/LIST are readable by parent/student (scoped);
// GENERATE/EDIT/SEND are admin-only.
export const INVOICE_PERMISSIONS = {
  LIST: "invoice.list",
  VIEW: "invoice.view",
  GENERATE: "invoice.generate",
  EDIT: "invoice.edit",
  // Admin sends invoice to the parent via WhatsApp/notification.
  SEND: "invoice.send",
};

// Global payment-template settings — admin-only management.
export const PAYMENT_TEMPLATE_PERMISSIONS = {
  VIEW: "payment_template.view",
  MANAGE: "payment_template.manage",
};

// Global app settings (hourly rate + currency) — admin-only management.
export const SETTINGS_PERMISSIONS = {
  VIEW: "settings.view",
  MANAGE: "settings.manage",
};

export const DASHBOARD_PERMISSIONS = {
  VIEW_ADMIN: "dashboard.view_admin",
  VIEW_PARENT: "dashboard.view_parent",
  VIEW_STUDENT: "dashboard.view_student",
};

export const PERMISSIONS = {
  USER: USER_PERMISSIONS,
  PLAN: PLAN_PERMISSIONS,
  COUPON: COUPON_PERMISSIONS,
  SUBSCRIPTION: SUBSCRIPTION_PERMISSIONS,
  GAME: GAME_PERMISSIONS,
  REPORT: REPORT_PERMISSIONS,
  SESSION_LOG: SESSION_LOG_PERMISSIONS,
  QUIZ: QUIZ_PERMISSIONS,
  CERTIFICATE: CERTIFICATE_PERMISSIONS,
  REWARD: REWARD_PERMISSIONS,
  NOTIFICATION: NOTIFICATION_PERMISSIONS,
  DASHBOARD: DASHBOARD_PERMISSIONS,
  BACKUP: BACKUP_PERMISSIONS,
  BADGE: BADGE_PERMISSIONS,
  POINT: POINT_PERMISSIONS,
  ATTACHMENT: ATTACHMENT_PERMISSIONS,
  INVOICE: INVOICE_PERMISSIONS,
  PAYMENT_TEMPLATE: PAYMENT_TEMPLATE_PERMISSIONS,
  SETTINGS: SETTINGS_PERMISSIONS,
};

/** Every permission code defined above, flattened. */
export function getAllPermissions() {
  return Object.values(PERMISSIONS).flatMap((group) => Object.values(group));
}

// Default permission profile per role. ADMIN gets everything.
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: getAllPermissions(),
  [USER_ROLES.PARENT]: [
    USER_PERMISSIONS.CREATE,
    USER_PERMISSIONS.VIEW,
    USER_PERMISSIONS.LIST,
    USER_PERMISSIONS.EDIT,
    SUBSCRIPTION_PERMISSIONS.VIEW,
    SUBSCRIPTION_PERMISSIONS.LIST,
    SUBSCRIPTION_PERMISSIONS.REQUEST,
    INVOICE_PERMISSIONS.VIEW,
    INVOICE_PERMISSIONS.LIST,
    REPORT_PERMISSIONS.VIEW,
    REPORT_PERMISSIONS.LIST,
    SESSION_LOG_PERMISSIONS.VIEW,
    SESSION_LOG_PERMISSIONS.LIST,
    QUIZ_PERMISSIONS.LIST,
    QUIZ_PERMISSIONS.BUILD,
    QUIZ_PERMISSIONS.VIEW,
    CERTIFICATE_PERMISSIONS.LIST,
    CERTIFICATE_PERMISSIONS.VIEW,
    REWARD_PERMISSIONS.LIST,
    REWARD_PERMISSIONS.VIEW,
    NOTIFICATION_PERMISSIONS.LIST,
    NOTIFICATION_PERMISSIONS.READ,
    POINT_PERMISSIONS.VIEW_LEADERBOARD,
    ATTACHMENT_PERMISSIONS.UPLOAD,
    DASHBOARD_PERMISSIONS.VIEW_PARENT,
  ],
  [USER_ROLES.STUDENT]: [
    GAME_PERMISSIONS.LIST,
    GAME_PERMISSIONS.VIEW,
    GAME_PERMISSIONS.ATTEMPT,
    QUIZ_PERMISSIONS.ATTEMPT,
    QUIZ_PERMISSIONS.VIEW,
    CERTIFICATE_PERMISSIONS.LIST,
    CERTIFICATE_PERMISSIONS.VIEW,
    INVOICE_PERMISSIONS.VIEW,
    REWARD_PERMISSIONS.LIST,
    REWARD_PERMISSIONS.VIEW,
    REWARD_PERMISSIONS.CLAIM,
    NOTIFICATION_PERMISSIONS.LIST,
    NOTIFICATION_PERMISSIONS.READ,
    POINT_PERMISSIONS.VIEW_LEADERBOARD,
    ATTACHMENT_PERMISSIONS.UPLOAD,
    DASHBOARD_PERMISSIONS.VIEW_STUDENT,
  ],
};

export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ?? [];
}
