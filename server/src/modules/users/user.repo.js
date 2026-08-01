// ===========================================================================
// user.repo — Prisma I/O only on User / ParentStudent (+ cross-entity counts).
//
// FREEZE: this is the most-shared repo in the codebase. Methods called from
// OTHER modules keep their POSITIONAL signatures byte-for-byte — changing their
// shape would silently break ~10 callers (auth, badges, attachments, dashboard,
// reports, rewards, certificates, points, invoices, subscriptions). Each such
// method is marked `FROZEN — externally called (positional)`.
//
// Internal-only methods (used solely within users/) follow the reference idiom:
// single object args with optional `client` (`client ?? prisma`).
// ===========================================================================

import { USER_ROLES } from "@ayah/shared";
import { prisma } from "@ayah/db/prisma.client.js";
import { buildSearchQuery, parseBooleanFilter } from "../../shared/utility/queryBuilders.js";
import {
  childUserSelect,
  overviewChildSelect,
  overviewParentSelect,
  overviewUserSelect,
  publicUserSelect,
  userListSelect,
} from "./user.dto.js";

class UserRepo {
  /**
   * Build the scoped Prisma `where` for the users list.
   * Where-building lives in the repo (reference convention) — the usecase only
   * forwards the raw filters + the auth context.
   *   ADMIN   → optional role filter over everyone
   *   PARENT  → their linked students only
   *   other   → just themselves
   */
  async buildListWhere(authUser, { search, role, isActive } = {}) {
    const where = {};
    const or = buildSearchQuery({
      search: typeof search === "string" ? search : undefined,
      keys: ["name", "email", "username", "nickname"],
    });
    if (or) where.OR = or;

    const active = parseBooleanFilter(isActive);
    if (active !== undefined) where.isActive = active;

    if (authUser.role === USER_ROLES.ADMIN) {
      if (role && role !== "ALL") where.role = role;
    } else if (authUser.role === USER_ROLES.PARENT) {
      const studentIds = await this.getStudentIdsForParent(authUser.id);
      where.id = { in: studentIds };
      where.role = USER_ROLES.STUDENT;
    } else {
      where.id = authUser.id;
    }
    return where;
  }

  // Scoped list — builds the where from (authUser, filters) then pages.
  async listScoped({ authUser, filters = {}, skip, take } = {}) {
    const where = await this.buildListWhere(authUser, filters);
    return this.listUsers({ where, skip, take });
  }

  // Internal-only — low-level page fetch; the caller owns pagination.
  async listUsers({ where, skip, take, client } = {}) {
    const db = client ?? prisma;
    const [items, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: userListSelect,
      }),
      db.user.count({ where }),
    ]);
    return { items, total };
  }

  /** Linked students of a parent, with the ParentStudent relation. */
  getChildrenOfParent({ parentId, client } = {}) {
    return (client ?? prisma).parentStudent.findMany({
      where: { parentId },
      orderBy: { createdAt: "desc" },
      select: {
        relation: true,
        student: { select: childUserSelect },
      },
    });
  }

  // FROZEN — externally called (positional). Certificates uses getPublicById(id).
  getPublicById(id) {
    return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  }

  // FROZEN — externally called (positional). Auth uses findByEmail(email).
  findByEmail(email) {
    if (!email) return null;
    return prisma.user.findUnique({ where: { email } });
  }

  findByUsername(username) {
    if (!username) return null;
    return prisma.user.findUnique({ where: { username } });
  }

  getIdentityById({ id, client } = {}) {
    return (client ?? prisma).user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        email: true,
        username: true,
        nickname: true,
        avatarId: true,
      },
    });
  }

  // FROZEN — externally called (positional). Auth uses createUser(data, tx).
  createUser(data, tx) {
    const client = tx ?? prisma;
    return client.user.create({ data, select: publicUserSelect });
  }

  updateUser({ id, data, client } = {}) {
    return (client ?? prisma).user.update({
      where: { id },
      data,
      select: publicUserSelect,
    });
  }

  updateNotificationPreferences({ id, data, client } = {}) {
    return (client ?? prisma).user.update({
      where: { id },
      data,
      select: {
        inAppNotificationsEnabled: true,
        emailNotificationsEnabled: true,
      },
    });
  }

  getNotificationRecipients({ userIds, client } = {}) {
    return (client ?? prisma).user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        locale: true,
        inAppNotificationsEnabled: true,
        emailNotificationsEnabled: true,
      },
    });
  }

  deactivateUser({ id, client } = {}) {
    return (client ?? prisma).user.update({
      where: { id },
      data: { isActive: false, sessionVersion: { increment: 1 } },
      select: publicUserSelect,
    });
  }

  // ── parent ↔ student links ──────────────────────────────
  // FROZEN — externally called (positional). Auth uses
  // linkParentStudent(parentId, studentId, relation, tx).
  linkParentStudent(parentId, studentId, relation, tx) {
    const client = tx ?? prisma;
    return client.parentStudent.upsert({
      where: { parentId_studentId: { parentId, studentId } },
      update: { relation },
      create: { parentId, studentId, relation },
    });
  }

  unlinkParentStudent({ parentId, studentId, client } = {}) {
    return (client ?? prisma).parentStudent.deleteMany({
      where: { parentId, studentId },
    });
  }

  // FROZEN — externally called (positional). dashboard / certificates / invoices
  // / rewards / reports / subscriptions use getStudentIdsForParent(parentId).
  async getStudentIdsForParent(parentId) {
    const links = await prisma.parentStudent.findMany({
      where: { parentId },
      select: { studentId: true },
    });
    return links.map((l) => l.studentId);
  }

  /** The parent (guardian) user ids linked to a given student. */
  // FROZEN — externally called (positional). certificates / subscriptions use
  // getParentIdsForStudent(studentId).
  async getParentIdsForStudent(studentId) {
    const links = await prisma.parentStudent.findMany({
      where: { studentId },
      select: { parentId: true },
    });
    return links.map((l) => l.parentId);
  }

  // FROZEN — externally called (positional). badges / attachments / certificates
  // / points / rewards / subscriptions use isStudentOfParent(parentId, studentId).
  async isStudentOfParent(parentId, studentId) {
    const link = await prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId, studentId } },
      select: { id: true },
    });
    return Boolean(link);
  }

  // FROZEN — externally called (positional). badges / points use getRoleById(id).
  getRoleById(id) {
    return prisma.user.findUnique({ where: { id }, select: { role: true } });
  }

  // ── avatar ─────────────────────────────────────────────────
  getAvatarId({ id, client } = {}) {
    return (client ?? prisma).user.findUnique({
      where: { id },
      select: { avatarId: true },
    });
  }

  setAvatar({ id, attachmentId, client } = {}) {
    return (client ?? prisma).user.update({
      where: { id },
      data: { avatarId: attachmentId },
      select: publicUserSelect,
    });
  }

  clearAvatar({ id, client } = {}) {
    return (client ?? prisma).user.update({
      where: { id },
      data: { avatarId: null },
      select: publicUserSelect,
    });
  }

  // ── level & ban ────────────────────────────────────────────
  setStudentLevel({ id, studentLevel, client } = {}) {
    return (client ?? prisma).user.update({
      where: { id },
      data: { studentLevel },
      select: publicUserSelect,
    });
  }

  banUser({ id, reason, client } = {}) {
    return (client ?? prisma).user.update({
      where: { id },
      data: {
        isActive: false,
        banReason: reason ?? null,
        bannedAt: new Date(),
        sessionVersion: { increment: 1 },
      },
      select: publicUserSelect,
    });
  }

  unbanUser({ id, client } = {}) {
    return (client ?? prisma).user.update({
      where: { id },
      data: { isActive: true, banReason: null, bannedAt: null },
      select: publicUserSelect,
    });
  }

  // ── overview ───────────────────────────────────────────────
  getOverviewUser({ id, client } = {}) {
    return (client ?? prisma).user.findUnique({
      where: { id },
      select: overviewUserSelect,
    });
  }

  /** A student's parents (with contact), via studentLinks. */
  getStudentParents({ studentId, client } = {}) {
    return (client ?? prisma).parentStudent.findMany({
      where: { studentId },
      select: overviewParentSelect,
    });
  }

  /** A parent's children (with overview detail), via parentLinks. */
  getParentChildrenDetailed({ parentId, client } = {}) {
    return (client ?? prisma).parentStudent.findMany({
      where: { parentId },
      orderBy: { createdAt: "desc" },
      select: { student: { select: overviewChildSelect } },
    });
  }

  countCertificates({ studentId, client } = {}) {
    return (client ?? prisma).certificate.count({ where: { studentId } });
  }

  countCertificatesForStudents({ studentIds, client } = {}) {
    return (client ?? prisma).certificate.groupBy({
      by: ["studentId"],
      where: { studentId: { in: studentIds } },
      _count: { _all: true },
    });
  }

  getStudentBadges({ studentId, client } = {}) {
    return (client ?? prisma).studentBadge.findMany({
      where: { studentId },
      orderBy: { awardedAt: "desc" },
      select: {
        awardedAt: true,
        badge: {
          select: {
            id: true,
            code: true,
            nameAr: true,
            nameEn: true,
            emoji: true,
            bgColor: true,
            textColor: true,
            score: true,
          },
        },
      },
    });
  }

  getRecentGameAttempts({ studentId, take = 10, client } = {}) {
    return (client ?? prisma).gameAttempt.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        gameId: true,
        score: true,
        correctCount: true,
        totalQuestions: true,
        passed: true,
        completedAt: true,
        createdAt: true,
      },
    });
  }

  getRecentQuizAttempts({ studentId, take = 10, client } = {}) {
    return (client ?? prisma).quizAttempt.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        quizId: true,
        score: true,
        correctCount: true,
        totalQuestions: true,
        passed: true,
        completedAt: true,
        createdAt: true,
      },
    });
  }

  /** Active ADMIN user ids — used for fan-out notifications (e.g. pending requests). */
  // FROZEN — externally called (positional, no args). auth / subscriptions use findAdminIds().
  async findAdminIds() {
    const admins = await prisma.user.findMany({
      where: { role: USER_ROLES.ADMIN, isActive: true },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }

  /** The first active ADMIN id (lowest id) — default teacher for session logs; null if none. */
  // FROZEN — externally called (positional, no args). sessionLogs uses findFirstAdminId().
  async findFirstAdminId() {
    const admin = await prisma.user.findFirst({
      where: { role: USER_ROLES.ADMIN, isActive: true },
      orderBy: { id: "asc" },
      select: { id: true },
    });
    return admin?.id ?? null;
  }
}

export const userRepo = new UserRepo();
export { UserRepo };
