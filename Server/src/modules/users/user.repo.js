import { prisma } from "@aya/db/prisma.client.js";
import {
  childUserSelect,
  overviewChildSelect,
  overviewParentSelect,
  overviewUserSelect,
  publicUserSelect,
  userListSelect,
} from "./user.dto.js";

class UserRepo {
  async listUsers(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: userListSelect,
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  /** Linked students of a parent, with the ParentStudent relation. */
  getChildrenOfParent(parentId) {
    return prisma.parentStudent.findMany({
      where: { parentId },
      orderBy: { createdAt: "desc" },
      select: {
        relation: true,
        student: { select: childUserSelect },
      },
    });
  }

  getPublicById(id) {
    return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  }

  findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  createUser(data, tx) {
    const client = tx ?? prisma;
    return client.user.create({ data, select: publicUserSelect });
  }

  updateUser(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: publicUserSelect,
    });
  }

  deactivateUser(id) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false, sessionVersion: { increment: 1 } },
      select: publicUserSelect,
    });
  }

  // ── parent ↔ student links ──────────────────────────────
  linkParentStudent(parentId, studentId, relation, tx) {
    const client = tx ?? prisma;
    return client.parentStudent.upsert({
      where: { parentId_studentId: { parentId, studentId } },
      update: { relation },
      create: { parentId, studentId, relation },
    });
  }

  unlinkParentStudent(parentId, studentId) {
    return prisma.parentStudent.deleteMany({ where: { parentId, studentId } });
  }

  async getStudentIdsForParent(parentId) {
    const links = await prisma.parentStudent.findMany({
      where: { parentId },
      select: { studentId: true },
    });
    return links.map((l) => l.studentId);
  }

  async isStudentOfParent(parentId, studentId) {
    const link = await prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId, studentId } },
      select: { id: true },
    });
    return Boolean(link);
  }

  getRoleById(id) {
    return prisma.user.findUnique({ where: { id }, select: { role: true } });
  }

  // ── level & ban ────────────────────────────────────────────
  setStudentLevel(id, studentLevel) {
    return prisma.user.update({
      where: { id },
      data: { studentLevel },
      select: publicUserSelect,
    });
  }

  banUser(id, reason) {
    return prisma.user.update({
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

  unbanUser(id) {
    return prisma.user.update({
      where: { id },
      data: { isActive: true, banReason: null, bannedAt: null },
      select: publicUserSelect,
    });
  }

  // ── overview ───────────────────────────────────────────────
  getOverviewUser(id) {
    return prisma.user.findUnique({
      where: { id },
      select: overviewUserSelect,
    });
  }

  /** A student's parents (with contact), via studentLinks. */
  getStudentParents(studentId) {
    return prisma.parentStudent.findMany({
      where: { studentId },
      select: overviewParentSelect,
    });
  }

  /** A parent's children (with overview detail), via parentLinks. */
  getParentChildrenDetailed(parentId) {
    return prisma.parentStudent.findMany({
      where: { parentId },
      orderBy: { createdAt: "desc" },
      select: { student: { select: overviewChildSelect } },
    });
  }

  countCertificates(studentId) {
    return prisma.certificate.count({ where: { studentId } });
  }

  countCertificatesForStudents(studentIds) {
    return prisma.certificate.groupBy({
      by: ["studentId"],
      where: { studentId: { in: studentIds } },
      _count: { _all: true },
    });
  }

  getStudentBadges(studentId) {
    return prisma.studentBadge.findMany({
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

  getRecentGameAttempts(studentId, take = 10) {
    return prisma.gameAttempt.findMany({
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

  getRecentQuizAttempts(studentId, take = 10) {
    return prisma.quizAttempt.findMany({
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
  async findAdminIds() {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }
}

export const userRepo = new UserRepo();
