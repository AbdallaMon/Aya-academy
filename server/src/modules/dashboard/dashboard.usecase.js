import { USER_ROLES, SUBSCRIPTION_STATUSES } from "@aya/shared";
import { forbidden } from "../../shared/errors/AppError.js";
import { userRepo } from "../users/user.repo.js";
import { dashboardRepo } from "./dashboard.repo.js";
import { dashboardMessagesCodes } from "./dashboard.messages.js";
import {
  hasActiveSubscription,
  filterActiveStudentIds,
} from "../../shared/access/subscriptionAccess.js";

const LEADERBOARD_DEFAULT_LIMIT = 10;
const LEADERBOARD_MAX_LIMIT = 50;
const RECENT_LIMIT = 5;

// Decimal | null → Number (0 when absent). Prisma Decimal stringifies safely.
function toNumber(value) {
  return value === null || value === undefined ? 0 : Number(value);
}

class DashboardUsecase {
  // ── admin ──────────────────────────────────────────────────
  async getAdminDashboard({ authUser }) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(dashboardMessagesCodes.DASHBOARD_FORBIDDEN);
    }

    const [counts, byStatus, revenueAgg, recentCertificates] =
      await Promise.all([
        dashboardRepo.adminCounts(),
        dashboardRepo.subscriptionsByStatus(),
        dashboardRepo.revenueSum(),
        dashboardRepo.recentCertificates({ limit: RECENT_LIMIT }),
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
        titleAr: c.titleAr ?? c.reasonAr,
        titleEn: c.titleEn ?? c.reasonEn,
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
    const rows = await dashboardRepo.leaderboard({ limit: take });
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
  async getParentDashboard({ authUser }) {
    if (authUser.role !== USER_ROLES.PARENT) {
      throw forbidden(dashboardMessagesCodes.NOT_A_PARENT);
    }

    const studentIds = await userRepo.getStudentIdsForParent(authUser.id);

    if (studentIds.length === 0) {
      return {
        children: [],
        recentCertificates: [],
        recentReports: [],
      };
    }

    const [children, recentCertificates, recentReports] = await Promise.all([
      dashboardRepo.parentChildren({ studentIds }),
      dashboardRepo.recentCertificatesForStudents({ studentIds, limit: RECENT_LIMIT }),
      dashboardRepo.recentReports({ studentIds, limit: RECENT_LIMIT }),
    ]);

    const activeIds = new Set(await filterActiveStudentIds(studentIds));

    const childrenWithSubscription = await Promise.all(
      children.map(async (child) => {
        const isActive = activeIds.has(child.id);
        const [sub, rank, latest] = await Promise.all([
          dashboardRepo.activeSubscriptionForStudent({ studentId: child.id }),
          isActive
            ? dashboardRepo.studentRank({ points: child.points ?? 0 })
            : Promise.resolve(null),
          dashboardRepo.latestSubscriptionForStudent({ studentId: child.id }),
        ]);

        let subscriptionState;
        if (isActive) {
          subscriptionState = SUBSCRIPTION_STATUSES.ACTIVE;
        } else if (
          latest &&
          (latest.status === SUBSCRIPTION_STATUSES.PENDING ||
            latest.status === SUBSCRIPTION_STATUSES.UPCOMING)
        ) {
          subscriptionState = SUBSCRIPTION_STATUSES.PENDING;
        } else if (latest) {
          // EXPIRED or CANCELLED — parent needs to renew
          subscriptionState = SUBSCRIPTION_STATUSES.EXPIRED;
        } else {
          subscriptionState = "NONE";
        }

        return {
          id: child.id,
          name: child.name,
          nickname: child.nickname,
          isActive,
          // Stats/achievements hidden for an inactive child; identity +
          // subscription state remain so the parent can renew.
          points: isActive ? child.points : null,
          level: isActive ? child.level : null,
          rank,
          badgeCount: isActive ? child._count?.studentBadges ?? 0 : null,
          activeSubscription: sub
            ? {
                id: sub.id,
                planId: sub.planId,
                endDate: sub.endDate,
                remainingHours: sub.remainingHours,
              }
            : null,
          subscriptionState,
          latestSubscriptionId: latest?.id ?? null,
        };
      }),
    );

    return {
      children: childrenWithSubscription,
      recentCertificates: recentCertificates.map((c) => ({
        id: c.id,
        type: c.type,
        studentName: c.studentName,
        titleAr: c.titleAr ?? c.reasonAr,
        titleEn: c.titleEn ?? c.reasonEn,
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
  async getStudentDashboard({ authUser }) {
    if (authUser.role !== USER_ROLES.STUDENT) {
      throw forbidden(dashboardMessagesCodes.NOT_A_STUDENT);
    }

    const studentId = authUser.id;
    const profile = await dashboardRepo.studentProfile({ studentId });

    const [rank, activeSubscription, badges, certificates, assignedGames] =
      await Promise.all([
        dashboardRepo.studentRank({ points: profile?.points ?? 0 }),
        dashboardRepo.activeSubscriptionForStudent({ studentId }),
        dashboardRepo.studentBadges({ studentId }),
        dashboardRepo.studentCertificates({ studentId, limit: RECENT_LIMIT }),
        dashboardRepo.studentAssignedGames({ studentId }),
      ]);

    const active = await hasActiveSubscription(studentId);

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
      rank: active ? rank : null,
      activeSubscription: activeSubscription
        ? {
            id: activeSubscription.id,
            planId: activeSubscription.planId,
            endDate: activeSubscription.endDate,
            remainingHours: activeSubscription.remainingHours,
          }
        : null,
      badges: active
        ? badges.map((b) => ({
            id: b.badge.id,
            code: b.badge.code,
            nameAr: b.badge.nameAr,
            nameEn: b.badge.nameEn,
            icon: b.badge.icon,
            awardedAt: b.awardedAt,
          }))
        : [],
      certificates: certificates.map((c) => ({
        id: c.id,
        type: c.type,
        studentName: c.studentName,
        titleAr: c.titleAr ?? c.reasonAr,
        titleEn: c.titleEn ?? c.reasonEn,
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
export { DashboardUsecase };
