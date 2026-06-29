import { POINT_SOURCES, USER_ROLES, messagesNames } from "@aya/shared";
import { prisma } from "@aya/db/prisma.client.js";
import { badRequest, forbidden } from "../../shared/errors/AppError.js";
import { userRepo } from "../users/user.repo.js";
import { pointRepo } from "./point.repo.js";
import { toLeaderboardItem } from "./point.dto.js";
import { pointMessagesCodes } from "./point.messages.js";
import { assertActiveForStudent } from "../../shared/access/subscriptionAccess.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const LEADERBOARD_LIMIT = 50;

class PointUsecase {
  /** Throws unless `authUser` may read the given student's ledger. */
  async assertCanAccess(authUser, studentId) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    if (authUser.role === USER_ROLES.STUDENT) {
      if (authUser.id === studentId) return;
    } else if (authUser.role === USER_ROLES.PARENT) {
      const linked = await userRepo.isStudentOfParent(authUser.id, studentId);
      if (linked) return;
    }
    throw forbidden(pointMessagesCodes.CANNOT_ACCESS_POINTS);
  }

  /** Ledger rows for a student (scoped), newest first. */
  async list({ authUser, studentId, page, limit }) {
    await this.assertCanAccess(authUser, studentId);
    return pointRepo.listForStudent({ studentId, page, limit });
  }

  /**
   * Leaderboard (range=week|all). Returns up to 50 rows ordered by the relevant
   * metric. Exposes only non-PII fields (name/nickname/points/level/avatar) —
   * never email/phone/birthDate.
   */
  async leaderboard({ authUser, range }) {
    // Students must have an ACTIVE subscription to view the leaderboard.
    // Admins/parents are unaffected.
    if (authUser?.role === USER_ROLES.STUDENT) {
      await assertActiveForStudent(authUser.id);
    }
    const since = new Date(Date.now() - WEEK_MS);

    if (range === "week") {
      const weekly = await pointRepo.topStudentsByWeekly({
        since,
        take: LEADERBOARD_LIMIT,
      });
      const ids = weekly.map((w) => w.studentId);
      if (!ids.length) return [];

      const [students, badges] = await Promise.all([
        pointRepo.getStudentsByIds({ studentIds: ids }),
        pointRepo.badgeCountByStudent({ studentIds: ids }),
      ]);
      const studentById = new Map(students.map((s) => [s.id, s]));
      const badgeById = new Map(
        badges.map((b) => [b.studentId, b._count?._all ?? 0]),
      );

      return weekly.map((w, i) => {
        const s = studentById.get(w.studentId) ?? {};
        return toLeaderboardItem(
          {
            studentId: w.studentId,
            name: s.name,
            nickname: s.nickname,
            points: s.points,
            weeklyPoints: w.weeklyPoints,
            badgeCount: badgeById.get(w.studentId) ?? 0,
            level: s.level,
            studentLevel: s.studentLevel,
            avatar: s.avatar,
          },
          i + 1,
        );
      });
    }

    // range=all → order by cached all-time points.
    const students = await pointRepo.topStudentsByPoints({
      take: LEADERBOARD_LIMIT,
    });
    const ids = students.map((s) => s.id);
    if (!ids.length) return [];

    const [weekly, badges] = await Promise.all([
      pointRepo.weeklyPointsByStudent({ since }),
      pointRepo.badgeCountByStudent({ studentIds: ids }),
    ]);
    const weeklyById = new Map(
      weekly.map((w) => [w.studentId, w._sum?.amount ?? 0]),
    );
    const badgeById = new Map(
      badges.map((b) => [b.studentId, b._count?._all ?? 0]),
    );

    return students.map((s, i) =>
      toLeaderboardItem(
        {
          studentId: s.id,
          name: s.name,
          nickname: s.nickname,
          points: s.points,
          weeklyPoints: weeklyById.get(s.id) ?? 0,
          badgeCount: badgeById.get(s.id) ?? 0,
          level: s.level,
          studentLevel: s.studentLevel,
          avatar: s.avatar,
        },
        i + 1,
      ),
    );
  }

  /**
   * Admin manually awards (or adjusts) a student's points. Positive → MANUAL,
   * negative → ADJUSTMENT. Writes the ledger row + bumps the cached total atomically.
   */
  async award({ authUser, studentId, amount, reason }) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(pointMessagesCodes.CANNOT_ACCESS_POINTS);
    }
    if (!Number.isInteger(amount) || amount === 0) {
      throw badRequest(
        pointMessagesCodes.INVALID_AMOUNT,
        messagesNames.pointMessages,
      );
    }

    const target = await userRepo.getRoleById(studentId);
    if (!target || target.role !== USER_ROLES.STUDENT) {
      throw badRequest(
        pointMessagesCodes.NOT_A_STUDENT,
        messagesNames.pointMessages,
      );
    }

    const source =
      amount < 0 ? POINT_SOURCES.ADJUSTMENT : POINT_SOURCES.MANUAL;

    return prisma.$transaction(async (tx) => {
      const point = await pointRepo.create({
        data: {
          studentId,
          amount,
          source,
          reason: reason ?? null,
          awardedById: authUser.id,
        },
        client: tx,
      });
      await pointRepo.incrementUserPoints({ studentId, delta: amount, client: tx });
      return point;
    });
  }

  // ── reusable services (composed inside another module's transaction) ──────
  /**
   * Insert a BADGE-sourced ledger row + bump the cached total. MUST be called
   * with the caller's `tx` so it joins the same transaction.
   *
   * Positional `tx` + object arg — also called cross-module (badges).
   */
  async awardForBadge(tx, { studentId, badgeId, amount, awardedById, sourceId }) {
    const point = await pointRepo.create({
      data: {
        studentId,
        amount,
        source: POINT_SOURCES.BADGE,
        badgeId,
        sourceId: sourceId ?? null,
        awardedById: awardedById ?? null,
      },
      client: tx,
    });
    if (amount) {
      await pointRepo.incrementUserPoints({ studentId, delta: amount, client: tx });
    }
    return point;
  }

  /**
   * Reverse a previously awarded badge: insert a negative ADJUSTMENT row +
   * decrement the cached total. MUST be called with the caller's `tx`.
   *
   * Positional `tx` + object arg — also called cross-module (badges).
   */
  async reverseForBadge(tx, { studentId, badgeId, amount, awardedById }) {
    const delta = -Math.abs(amount ?? 0);
    const point = await pointRepo.create({
      data: {
        studentId,
        amount: delta,
        source: POINT_SOURCES.ADJUSTMENT,
        badgeId,
        awardedById: awardedById ?? null,
      },
      client: tx,
    });
    if (delta) {
      await pointRepo.incrementUserPoints({ studentId, delta, client: tx });
    }
    return point;
  }
}

export const pointUsecase = new PointUsecase();
export { PointUsecase };
