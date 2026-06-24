import { prisma } from "@aya/db/prisma.client.js";
import {
  LESSON_STATUSES,
  USER_ROLES,
  activeSubscriptionWhere,
} from "@aya/shared";

// All Prisma I/O for the dashboard module lives here. Read-only aggregates.
class DashboardRepo {
  // ── admin ──────────────────────────────────────────────────
  async adminCounts() {
    const now = new Date();
    const expiringUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      students,
      parents,
      admins,
      activeSubscriptions,
      expiringSoon,
      totalCertificates,
      games,
      quizzes,
    ] = await Promise.all([
      prisma.user.count({ where: { role: USER_ROLES.STUDENT } }),
      prisma.user.count({ where: { role: USER_ROLES.PARENT } }),
      prisma.user.count({ where: { role: USER_ROLES.ADMIN } }),
      prisma.subscription.count({
        where: activeSubscriptionWhere(now),
      }),
      prisma.subscription.count({
        where: {
          ...activeSubscriptionWhere(now),
          endDate: { gte: now, lte: expiringUntil },
        },
      }),
      prisma.certificate.count(),
      prisma.game.count(),
      prisma.quiz.count(),
    ]);

    return {
      students,
      parents,
      admins,
      activeSubscriptions,
      expiringSoon,
      totalCertificates,
      games,
      quizzes,
    };
  }

  subscriptionsByStatus() {
    return prisma.subscription.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
  }

  revenueSum() {
    return prisma.subscription.aggregate({
      where: activeSubscriptionWhere(),
      _sum: { priceCharged: true },
    });
  }

  recentCertificates(limit) {
    return prisma.certificate.findMany({
      take: limit,
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        type: true,
        studentName: true,
        titleAr: true,
        titleEn: true,
        issuedAt: true,
      },
    });
  }

  countGames() {
    return prisma.game.count();
  }

  countQuizzes() {
    return prisma.quiz.count();
  }

  // ── leaderboard ────────────────────────────────────────────
  leaderboard(limit) {
    return prisma.user.findMany({
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
  async studentRank(points) {
    const ahead = await prisma.user.count({
      where: { role: USER_ROLES.STUDENT, points: { gt: points } },
    });
    return ahead + 1;
  }

  // ── parent ─────────────────────────────────────────────────
  parentChildren(studentIds) {
    return prisma.user.findMany({
      where: { id: { in: studentIds }, role: USER_ROLES.STUDENT },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        nickname: true,
        points: true,
        level: true,
      },
    });
  }

  activeSubscriptionForStudent(studentId) {
    return prisma.subscription.findFirst({
      where: { studentId, ...activeSubscriptionWhere() },
      orderBy: { endDate: "desc" },
      select: {
        id: true,
        planId: true,
        endDate: true,
        remainingHours: true,
      },
    });
  }

  upcomingLessons(studentIds, limit) {
    const now = new Date();
    return prisma.lessonSession.findMany({
      where: {
        studentId: { in: studentIds },
        status: LESSON_STATUSES.SCHEDULED,
        startsAt: { gte: now },
      },
      take: limit,
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        studentId: true,
        title: true,
        startsAt: true,
        meetingLink: true,
      },
    });
  }

  recentReports(studentIds, limit) {
    return prisma.report.findMany({
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

  recentCertificatesForStudents(studentIds, limit) {
    return prisma.certificate.findMany({
      where: { studentId: { in: studentIds } },
      take: limit,
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        type: true,
        studentName: true,
        titleAr: true,
        titleEn: true,
        issuedAt: true,
      },
    });
  }

  // ── student ────────────────────────────────────────────────
  studentProfile(studentId) {
    return prisma.user.findUnique({
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

  studentBadges(studentId) {
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
            icon: true,
          },
        },
      },
    });
  }

  studentCertificates(studentId, limit) {
    return prisma.certificate.findMany({
      where: { studentId },
      take: limit,
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        type: true,
        studentName: true,
        titleAr: true,
        titleEn: true,
        issuedAt: true,
      },
    });
  }

  studentAssignedGames(studentId) {
    return prisma.gameAssignment.findMany({
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
