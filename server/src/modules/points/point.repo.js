import { USER_ROLES } from "@aya/shared";
import { prisma } from "@aya/db/prisma.client.js";
import { pointSelect, leaderboardStudentSelect } from "./point.dto.js";

class PointRepo {
  /** Ledger rows for a student, newest first. */
  async listForStudent(studentId, skip, take) {
    const where = { studentId };
    const [items, total] = await Promise.all([
      prisma.point.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: pointSelect,
      }),
      prisma.point.count({ where }),
    ]);
    return { items, total };
  }

  /** Insert a ledger row (optionally inside a transaction). */
  create(data, client) {
    return (client ?? prisma).point.create({ data });
  }

  /** Adjust the cached User.points total by `delta` (optionally in a tx). */
  incrementUserPoints(studentId, delta, client) {
    return (client ?? prisma).user.update({
      where: { id: studentId },
      data: { points: { increment: delta } },
    });
  }

  // ── leaderboard helpers ──────────────────────────────────────
  /** Top students by all-time cached points (User.points). */
  topStudentsByPoints(take) {
    return prisma.user.findMany({
      where: { role: USER_ROLES.STUDENT, isActive: true },
      orderBy: { points: "desc" },
      take,
      select: leaderboardStudentSelect,
    });
  }

  /** Sum of ledger amounts since `since`, grouped by student. */
  weeklyPointsByStudent(since) {
    return prisma.point.groupBy({
      by: ["studentId"],
      where: { createdAt: { gte: since } },
      _sum: { amount: true },
    });
  }

  /** Count of awarded badges, grouped by student. */
  badgeCountByStudent(studentIds) {
    return prisma.studentBadge.groupBy({
      by: ["studentId"],
      where: { studentId: { in: studentIds } },
      _count: { _all: true },
    });
  }

  /**
   * Students ranked by weekly ledger sum (for range=week). Returns
   * [{ studentId, weeklyPoints }] ordered desc, limited to `take`.
   */
  async topStudentsByWeekly(since, take) {
    const grouped = await prisma.point.groupBy({
      by: ["studentId"],
      where: { createdAt: { gte: since } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take,
    });
    return grouped.map((g) => ({
      studentId: g.studentId,
      weeklyPoints: g._sum.amount ?? 0,
    }));
  }

  /** Hydrate student name/nickname/points for a set of ids. */
  getStudentsByIds(studentIds) {
    return prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: leaderboardStudentSelect,
    });
  }
}

export const pointRepo = new PointRepo();
