import { prisma } from "@aya/db/prisma.client.js";
import { badgeSelect, studentBadgeSelect } from "./badge.dto.js";

class BadgeRepo {
  async list(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.badge.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: badgeSelect,
      }),
      prisma.badge.count({ where }),
    ]);
    return { items, total };
  }

  getById(id) {
    return prisma.badge.findUnique({ where: { id }, select: badgeSelect });
  }

  create(data) {
    return prisma.badge.create({ data, select: badgeSelect });
  }

  update(id, data) {
    return prisma.badge.update({ where: { id }, data, select: badgeSelect });
  }

  remove(id) {
    return prisma.badge.delete({ where: { id }, select: badgeSelect });
  }

  // ── student ↔ badge awards ───────────────────────────────────
  /** Award a badge to a student (optionally inside a tx). */
  createStudentBadge(data, client) {
    return (client ?? prisma).studentBadge.create({
      data,
      select: studentBadgeSelect,
    });
  }

  /** Find a specific student's award of a badge. */
  findStudentBadge(studentId, badgeId, client) {
    return (client ?? prisma).studentBadge.findUnique({
      where: { studentId_badgeId: { studentId, badgeId } },
      select: studentBadgeSelect,
    });
  }

  /** Remove a student's award of a badge (optionally inside a tx). */
  deleteStudentBadge(id, client) {
    return (client ?? prisma).studentBadge.delete({ where: { id } });
  }

  /** A student's awarded badges (with their definitions), newest first. */
  listStudentBadges(studentId) {
    return prisma.studentBadge.findMany({
      where: { studentId },
      orderBy: { awardedAt: "desc" },
      select: studentBadgeSelect,
    });
  }
}

export const badgeRepo = new BadgeRepo();
