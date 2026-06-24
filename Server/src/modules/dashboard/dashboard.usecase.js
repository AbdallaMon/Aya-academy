import { USER_ROLES } from "@aya/shared";
import { forbidden } from "../../shared/errors/AppError.js";
import { userRepo } from "../users/user.repo.js";
import { dashboardRepo } from "./dashboard.repo.js";
import { dashboardMessagesCodes } from "./dashboard.messages.js";

const LEADERBOARD_DEFAULT_LIMIT = 10;
const LEADERBOARD_MAX_LIMIT = 50;
const RECENT_LIMIT = 5;

// Decimal | null → Number (0 when absent). Prisma Decimal stringifies safely.
function toNumber(value) {
  return value === null || value === undefined ? 0 : Number(value);
}

class DashboardUsecase {
  // ── admin ──────────────────────────────────────────────────
  async getAdminDashboard(authUser) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(dashboardMessagesCodes.DASHBOARD_FORBIDDEN);
    }

    const [counts, byStatus, revenueAgg, recentCertificates] =
      await Promise.all([
        dashboardRepo.adminCounts(),
        dashboardRepo.subscriptionsByStatus(),
        dashboardRepo.revenueSum(),
        dashboardRepo.recentCertificates(RECENT_LIMIT),
      ]);

    return {
      counts,
      subscriptionsByStatus: byStatus.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
      revenue: toNumber(revenueAgg._sum.priceCharged),
      recentCertificates: recentCertificates.map((c) => ({
        id: c.id,
        type: c.type,
        studentName: c.studentName,
        titleAr: c.titleAr,
        titleEn: c.titleEn,
        issuedAt: c.issuedAt,
      })),
    };
  }

  // ── leaderboard ────────────────────────────────────────────
  resolveLimit(rawLimit) {
    const parsed = Number.parseInt(rawLimit, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return LEADERBOARD_DEFAULT_LIMIT;
    }
    return Math.min(parsed, LEADERBOARD_MAX_LIMIT);
  }

  async getLeaderboard({ authUser: _authUser, limit }) {
    const take = this.resolveLimit(limit);
    const rows = await dashboardRepo.leaderboard(take);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      nickname: row.nickname,
      points: row.points,
      level: row.level,
      badgeCount: row._count.studentBadges,
    }));
  }

  // ── parent ─────────────────────────────────────────────────
  async getParentDashboard(authUser) {
    if (authUser.role !== USER_ROLES.PARENT) {
      throw forbidden(dashboardMessagesCodes.NOT_A_PARENT);
    }

    const studentIds = await userRepo.getStudentIdsForParent(authUser.id);

    if (studentIds.length === 0) {
      return {
        children: [],
        upcomingLessons: [],
        recentCertificates: [],
        recentReports: [],
      };
    }

    const [children, upcomingLessons, recentCertificates, recentReports] =
      await Promise.all([
        dashboardRepo.parentChildren(studentIds),
        dashboardRepo.upcomingLessons(studentIds, RECENT_LIMIT),
        dashboardRepo.recentCertificatesForStudents(studentIds, RECENT_LIMIT),
        dashboardRepo.recentReports(studentIds, RECENT_LIMIT),
      ]);

    const childrenWithSubscription = await Promise.all(
      children.map(async (child) => {
        const sub = await dashboardRepo.activeSubscriptionForStudent(child.id);
        return {
          id: child.id,
          name: child.name,
          nickname: child.nickname,
          points: child.points,
          level: child.level,
          activeSubscription: sub
            ? {
                id: sub.id,
                planId: sub.planId,
                endDate: sub.endDate,
                remainingHours: sub.remainingHours,
              }
            : null,
        };
      }),
    );

    return {
      children: childrenWithSubscription,
      upcomingLessons: upcomingLessons.map((l) => ({
        id: l.id,
        studentId: l.studentId,
        title: l.title,
        startsAt: l.startsAt,
        meetingLink: l.meetingLink,
      })),
      recentCertificates: recentCertificates.map((c) => ({
        id: c.id,
        type: c.type,
        studentName: c.studentName,
        titleAr: c.titleAr,
        titleEn: c.titleEn,
        issuedAt: c.issuedAt,
      })),
      recentReports: recentReports.map((r) => ({
        id: r.id,
        title: r.title,
        reportDate: r.reportDate,
      })),
    };
  }

  // ── student ────────────────────────────────────────────────
  async getStudentDashboard(authUser) {
    if (authUser.role !== USER_ROLES.STUDENT) {
      throw forbidden(dashboardMessagesCodes.NOT_A_STUDENT);
    }

    const studentId = authUser.id;
    const profile = await dashboardRepo.studentProfile(studentId);

    const [rank, activeSubscription, upcomingLessons, badges, certificates, assignedGames] =
      await Promise.all([
        dashboardRepo.studentRank(profile?.points ?? 0),
        dashboardRepo.activeSubscriptionForStudent(studentId),
        dashboardRepo.upcomingLessons([studentId], RECENT_LIMIT),
        dashboardRepo.studentBadges(studentId),
        dashboardRepo.studentCertificates(studentId, RECENT_LIMIT),
        dashboardRepo.studentAssignedGames(studentId),
      ]);

    return {
      profile: profile
        ? {
            id: profile.id,
            name: profile.name,
            nickname: profile.nickname,
            points: profile.points,
            level: profile.level,
          }
        : null,
      rank,
      activeSubscription: activeSubscription
        ? {
            id: activeSubscription.id,
            planId: activeSubscription.planId,
            endDate: activeSubscription.endDate,
            remainingHours: activeSubscription.remainingHours,
          }
        : null,
      upcomingLessons: upcomingLessons.map((l) => ({
        id: l.id,
        studentId: l.studentId,
        title: l.title,
        startsAt: l.startsAt,
        meetingLink: l.meetingLink,
      })),
      badges: badges.map((b) => ({
        id: b.badge.id,
        code: b.badge.code,
        nameAr: b.badge.nameAr,
        nameEn: b.badge.nameEn,
        icon: b.badge.icon,
        awardedAt: b.awardedAt,
      })),
      certificates: certificates.map((c) => ({
        id: c.id,
        type: c.type,
        studentName: c.studentName,
        titleAr: c.titleAr,
        titleEn: c.titleEn,
        issuedAt: c.issuedAt,
      })),
      assignedGames: assignedGames.map((a) => ({
        id: a.id,
        gameId: a.gameId,
        status: a.status,
        game: {
          slug: a.game.slug,
          titleAr: a.game.titleAr,
          titleEn: a.game.titleEn,
        },
      })),
    };
  }
}

export const dashboardUsecase = new DashboardUsecase();
