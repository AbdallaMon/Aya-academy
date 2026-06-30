// ===========================================================================
// point.repo — Prisma I/O only on Point / User / StudentBadge. (Reference idiom:
// single object args with optional `client`, list owns filtering + pagination
// and returns { items, total, page, pageSize }.)
// ===========================================================================

import { USER_ROLES } from "@aya/shared";
import { prisma } from "@aya/db/prisma.client.js";
import { paginate } from "../../shared/utility/pagination.js";
import { pointSelect, leaderboardStudentSelect } from "./point.dto.js";

class PointRepo {
  /** Ledger rows for a student, newest first. */
  async listForStudent({ studentId, page, limit, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });

    const where = { studentId };
    const [items, total] = await Promise.all([
      db.point.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: pointSelect,
      }),
      db.point.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  /** Insert a ledger row (optionally inside a transaction). */
  create({ data, client } = {}) {
    return (client ?? prisma).point.create({ data });
  }

  /** Adjust the cached User.points total by `delta` (optionally in a tx). */
  incrementUserPoints({ studentId, delta, client } = {}) {
    return (client ?? prisma).user.update({
      where: { id: studentId },
      data: { points: { increment: delta } },
    });
  }

  // ── leaderboard helpers ──────────────────────────────────────
  /** Top students by all-time cached points (User.points). */
  topStudentsByPoints({ take, client } = {}) {
    return (client ?? prisma).user.findMany({
      where: { role: USER_ROLES.STUDENT, isActive: true },
      orderBy: { points: "desc" },
      take,
      select: leaderboardStudentSelect,
    });
  }

  /** Sum of ledger amounts since `since`, grouped by student. */
  weeklyPointsByStudent({ since, client } = {}) {
    return (client ?? prisma).point.groupBy({
      by: ["studentId"],
      where: { createdAt: { gte: since } },
      _sum: { amount: true },
    });
  }

  /** Count of awarded badges, grouped by student. */
  badgeCountByStudent({ studentIds, client } = {}) {
    return (client ?? prisma).studentBadge.groupBy({
      by: ["studentId"],
      where: { studentId: { in: studentIds } },
      _count: { _all: true },
    });
  }

  /**
   * Students ranked by weekly ledger sum (for range=week). Returns
   * [{ studentId, weeklyPoints }] ordered desc, limited to `take`.
   */
  async topStudentsByWeekly({ since, take, client } = {}) {
    const grouped = await (client ?? prisma).point.groupBy({
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
  getStudentsByIds({ studentIds, client } = {}) {
    return (client ?? prisma).user.findMany({
      where: { id: { in: studentIds } },
      select: leaderboardStudentSelect,
    });
  }
}

export const pointRepo = new PointRepo();
export { PointRepo };
