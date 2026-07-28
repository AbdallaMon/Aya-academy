// ===========================================================================
// dashboard.repo — Prisma I/O only. Read-only aggregates. (Reference idiom:
// single object args with optional `client`; keep select projections.)
// ===========================================================================

import { prisma } from "@ayah/db/prisma.client.js";
import {
  USER_ROLES,
  activeSubscriptionWhere,
  currentSubscriptionWhere,
  SUBSCRIPTION_ORIGINS,
  SUBSCRIPTION_STATUSES,
} from "@ayah/shared";
import {
  firstOfNextMonth,
  monthRange,
} from "../../shared/utility/dates.js";

const SUB_CARD_SELECT = {
  id: true,
  origin: true,
  status: true,
  planId: true,
  startDate: true,
  endDate: true,
  remainingMinutes: true,
  subsMinutes: true,
  remainingHours: true,
  // v2 stored model: the accumulating next-month bill renders these directly
  // (no usage-preview fetch) on the parent card / children page.
  subsHours: true,
  priceCharged: true,
  currency: true,
  coupon: {
    select: {
      code: true,
      type: true,
      value: true,
    },
  },
};

class DashboardRepo {
  // ── admin ──────────────────────────────────────────────────
  async adminCounts({ client } = {}) {
    const db = client ?? prisma;
    const now = new Date();
    const expiringUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      students,
      parents,
      admins,
      plans,
      activeSubscriptions,
      expiringSoon,
      totalCertificates,
      games,
      quizzes,
    ] = await Promise.all([
      db.user.count({ where: { role: USER_ROLES.STUDENT } }),
      db.user.count({ where: { role: USER_ROLES.PARENT } }),
      db.user.count({ where: { role: USER_ROLES.ADMIN } }),
      db.plan.count(),
      db.subscription.count({
        where: activeSubscriptionWhere(now),
      }),
      db.subscription.count({
        where: {
          ...activeSubscriptionWhere(now),
          endDate: { gte: now, lte: expiringUntil },
        },
      }),
      db.certificate.count(),
      db.game.count(),
      db.quiz.count(),
    ]);

    return {
      students,
      parents,
      admins,
      plans,
      activeSubscriptions,
      expiringSoon,
      totalCertificates,
      games,
      quizzes,
    };
  }

  subscriptionsByStatus({ client } = {}) {
    return (client ?? prisma).subscription.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
  }

  revenueSum({ client } = {}) {
    return (client ?? prisma).subscription.aggregate({
      where: activeSubscriptionWhere(),
      _sum: { priceCharged: true },
    });
  }

  recentCertificates({ limit, client } = {}) {
    return (client ?? prisma).certificate.findMany({
      take: limit,
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        type: true,
        studentName: true,
        titleAr: true,
        titleEn: true,
        reasonAr: true,
        reasonEn: true,
        issuedAt: true,
      },
    });
  }

  countGames({ client } = {}) {
    return (client ?? prisma).game.count();
  }

  countQuizzes({ client } = {}) {
    return (client ?? prisma).quiz.count();
  }

  // ── leaderboard ────────────────────────────────────────────
  leaderboard({ limit, client } = {}) {
    return (client ?? prisma).user.findMany({
      where: { role: USER_ROLES.STUDENT },
      take: limit,
      orderBy: [{ points: "desc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        nickname: true,
        points: true,
        level: true,
        _count: { select: { studentBadges: true } },
      },
    });
  }

  // 1-based rank: number of students with strictly more points + 1.
  async studentRank({ points, client } = {}) {
    const ahead = await (client ?? prisma).user.count({
      where: { role: USER_ROLES.STUDENT, points: { gt: points } },
    });
    return ahead + 1;
  }

  // ── parent ─────────────────────────────────────────────────
  parentChildren({ studentIds, client } = {}) {
    return (client ?? prisma).user.findMany({
      where: { id: { in: studentIds }, role: USER_ROLES.STUDENT },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        nickname: true,
        points: true,
        level: true,
        _count: { select: { studentBadges: true } },
      },
    });
  }

  activeSubscriptionForStudent({ studentId, client } = {}) {
    return (client ?? prisma).subscription.findFirst({
      where: { studentId, ...activeSubscriptionWhere() },
      orderBy: { endDate: "desc" },
      select: {
        id: true,
        planId: true,
        endDate: true,
        remainingMinutes: true,
        remainingHours: true,
      },
    });
  }

  // Returns the newest subscription for the student regardless of status,
  // so the parent dashboard can distinguish pending-renewal from expired/none.
  latestSubscriptionForStudent({ studentId, client } = {}) {
    return (client ?? prisma).subscription.findFirst({
      where: { studentId },
      orderBy: { id: "desc" },
      select: { id: true, status: true },
    });
  }

  // The subscriptions a parent card needs: the active one, the open USAGE
  // accumulator, and the newest overall (for history/CTA). De-duplicated by id.
  async cardSubscriptionsForStudent({ studentId, client } = {}) {
    const db = client ?? prisma;
    const now = new Date();
    const nextMonth = monthRange(firstOfNextMonth(now));
    const [active, open, latest] = await Promise.all([
      db.subscription.findFirst({
        // Current-period sub even if not yet activated (shown with its status).
        where: { studentId, ...currentSubscriptionWhere(now) },
        orderBy: [{ status: "asc" }, { endDate: "desc" }],
        select: SUB_CARD_SELECT,
      }),
      db.subscription.findFirst({
        where: {
          studentId,
          origin: SUBSCRIPTION_ORIGINS.USAGE,
          status: {
            in: [
              SUBSCRIPTION_STATUSES.PENDING,
              SUBSCRIPTION_STATUSES.UPCOMING,
            ],
          },
          startDate: { gte: nextMonth.gte, lt: nextMonth.lt },
        },
        orderBy: [{ startDate: "desc" }, { id: "desc" }],
        select: SUB_CARD_SELECT,
      }),
      db.subscription.findFirst({
        where: { studentId },
        orderBy: { id: "desc" },
        select: SUB_CARD_SELECT,
      }),
    ]);
    const byId = new Map();
    for (const s of [active, open, latest]) if (s) byId.set(s.id, s);
    return [...byId.values()];
  }

  recentReports({ studentIds, limit, client } = {}) {
    return (client ?? prisma).report.findMany({
      where: { students: { some: { studentId: { in: studentIds } } } },
      take: limit,
      orderBy: { reportDate: "desc" },
      select: {
        id: true,
        title: true,
        reportDate: true,
      },
    });
  }

  recentCertificatesForStudents({ studentIds, limit, client } = {}) {
    return (client ?? prisma).certificate.findMany({
      where: { studentId: { in: studentIds } },
      take: limit,
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        type: true,
        studentName: true,
        titleAr: true,
        titleEn: true,
        reasonAr: true,
        reasonEn: true,
        issuedAt: true,
      },
    });
  }

  // ── student ────────────────────────────────────────────────
  studentProfile({ studentId, client } = {}) {
    return (client ?? prisma).user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        nickname: true,
        points: true,
        level: true,
      },
    });
  }

  studentBadges({ studentId, client } = {}) {
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
            icon: true,
          },
        },
      },
    });
  }

  studentCertificates({ studentId, limit, client } = {}) {
    return (client ?? prisma).certificate.findMany({
      where: { studentId },
      take: limit,
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        type: true,
        studentName: true,
        titleAr: true,
        titleEn: true,
        reasonAr: true,
        reasonEn: true,
        issuedAt: true,
      },
    });
  }

  studentAssignedGames({ studentId, client } = {}) {
    return (client ?? prisma).gameAssignment.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        gameId: true,
        status: true,
        game: {
          select: {
            slug: true,
            titleAr: true,
            titleEn: true,
          },
        },
      },
    });
  }
}

export const dashboardRepo = new DashboardRepo();
export { DashboardRepo };
