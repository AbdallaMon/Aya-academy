import { prisma } from "@aya/db/prisma.client.js";
import {
  activeSubscriptionWhere,
  currentSubscriptionWhere,
  SESSION_ATTENDANCE,
  SUBSCRIPTION_ORIGINS,
  SUBSCRIPTION_STATUSES,
  USER_ROLES,
} from "@aya/shared";
import { userRepo } from "../../users/user.repo.js";
import { subscriptionSelect, toSubscription } from "./subscription.dto.js";

class SubscriptionRepo {
  /**
   * Build the scoped Prisma `where` for the subscription list.
   * Where-building lives in the repo (reference convention) — the usecase only
   * forwards the raw filters + the auth context.
   *   ADMIN  → optional studentId filter over everyone
   *   PARENT → their linked students (narrowed to studentId when it's theirs)
   *   other  → just themselves
   */
  async buildListWhere(authUser, { studentId, status } = {}) {
    const where = {};

    if (status) where.status = status;

    if (authUser.role === USER_ROLES.ADMIN) {
      if (studentId) where.studentId = studentId;
    } else if (authUser.role === USER_ROLES.PARENT) {
      const studentIds = await userRepo.getStudentIdsForParent(authUser.id);
      const scoped =
        studentId && studentIds.includes(studentId) ? [studentId] : studentIds;
      where.studentId = { in: scoped };
    } else {
      where.studentId = authUser.id;
    }
    return where;
  }

  // Scoped list — builds the where from (authUser, filters). When a studentId is
  // in scope (a student's page) it returns ALL that student's subs newest-first
  // (no latest-per-student collapse, so current + next both surface, V2-5);
  // otherwise it falls back to the latest-per-student view.
  async listScoped({ authUser, filters = {}, skip, take } = {}) {
    const where = await this.buildListWhere(authUser, filters);
    if (filters.studentId) {
      return this.listSubscriptionsForStudent({ where, skip, take });
    }
    return this.listLatestPerStudent({ where, skip, take });
  }

  /**
   * All subscriptions matching `where`, newest-first (startDate desc, then id
   * desc for same-day ties). Same `{ items, total }` shape as listSubscriptions.
   * Used by the student-scoped list so current + next both surface.
   */
  async listSubscriptionsForStudent({ where = {}, skip = 0, take = 20 } = {}) {
    const [rows, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take,
        orderBy: [{ startDate: "desc" }, { id: "desc" }],
        select: subscriptionSelect,
      }),
      prisma.subscription.count({ where }),
    ]);
    return { items: rows.map(toSubscription), total };
  }

  /**
   * One summary per student in scope: `{ studentId, current, next }` where
   * `current` is the active sub (activeSubscriptionWhere) and `next` is the open
   * UPCOMING USAGE sub — both full subscription rows or null. Mirrors the
   * dashboard card's current+next idea, paginated by DISTINCT student.
   *
   * Pagination uses groupBy (DB-level LIMIT/OFFSET on MySQL, unlike
   * findMany+distinct which post-processes) ordered newest-activity-first. The
   * status filter narrows nothing here — current/next carry their own status
   * semantics — so it is intentionally dropped from the student scope.
   * Returns `{ items, total }` where total = distinct students in scope.
   */
  async summariesByStudent({ authUser, filters = {}, skip = 0, take = 20 } = {}) {
    const where = await this.buildListWhere(authUser, filters);
    const { status, ...scopeWhere } = where;

    const [pageGroups, allGroups] = await Promise.all([
      prisma.subscription.groupBy({
        by: ["studentId"],
        where: scopeWhere,
        _max: { id: true },
        orderBy: { _max: { id: "desc" } },
        skip,
        take,
      }),
      prisma.subscription.groupBy({ by: ["studentId"], where: scopeWhere }),
    ]);

    const total = allGroups.length;
    const studentIds = pageGroups.map((g) => g.studentId);
    if (!studentIds.length) return { items: [], total };

    const now = new Date();
    const [currents, nexts] = await Promise.all([
      prisma.subscription.findMany({
        // Current-period sub even if not yet activated (shown with its status).
        where: { studentId: { in: studentIds }, ...currentSubscriptionWhere(now) },
        orderBy: [{ status: "asc" }, { endDate: "desc" }],
        select: subscriptionSelect,
      }),
      prisma.subscription.findMany({
        where: {
          studentId: { in: studentIds },
          origin: SUBSCRIPTION_ORIGINS.USAGE,
          status: SUBSCRIPTION_STATUSES.UPCOMING,
        },
        orderBy: { startDate: "desc" },
        select: subscriptionSelect,
      }),
    ]);

    // First row per student wins (both queries are ordered so the pick is stable).
    const firstByStudent = (rows) => {
      const m = new Map();
      for (const r of rows) if (!m.has(r.studentId)) m.set(r.studentId, r);
      return m;
    };
    const currentBy = firstByStudent(currents);
    const nextBy = firstByStudent(nexts);

    const items = studentIds.map((studentId) => ({
      studentId,
      current: toSubscription(currentBy.get(studentId) ?? null),
      next: toSubscription(nextBy.get(studentId) ?? null),
    }));
    return { items, total };
  }

  async listSubscriptions(where, skip, take) {
    const [rows, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: subscriptionSelect,
      }),
      prisma.subscription.count({ where }),
    ]);
    return { items: rows.map(toSubscription), total };
  }

  /**
   * Return only the latest subscription per student (highest id = newest renewal)
   * that matches the given scope, optionally filtered by status.
   *
   * Strategy:
   *  1. groupBy studentId WITHOUT status → picks the latest id per student in
   *     scope. Applying status here would pick the newest *within that status*,
   *     which is wrong — we want newest overall, then filter.
   *  2. Build latestWhere = { id: { in: latestIds } } and add status if provided.
   *  3. count + findMany against latestWhere.
   *
   * Returns { items, total } — same shape as listSubscriptions.
   *
   * @param {{ where?: object, skip?: number, take?: number }} opts
   */
  async listLatestPerStudent({ where = {}, skip = 0, take = 20 } = {}) {
    // Separate status from scope so groupBy uses scope only.
    const { status, ...scopeWhere } = where;

    // Step 1: find the newest subscription id per student within scope.
    const groups = await prisma.subscription.groupBy({
      by: ["studentId"],
      where: scopeWhere,
      _max: { id: true },
    });

    if (!groups.length) {
      return { items: [], total: 0 };
    }

    const latestIds = groups.map((g) => g._max.id).filter(Boolean);

    if (!latestIds.length) {
      return { items: [], total: 0 };
    }

    // Step 2: filter by those ids, applying status only here.
    const latestWhere = { id: { in: latestIds } };
    if (status !== undefined) latestWhere.status = status;

    // Step 3: count + fetch.
    const [rows, total] = await Promise.all([
      prisma.subscription.findMany({
        where: latestWhere,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: subscriptionSelect,
      }),
      prisma.subscription.count({ where: latestWhere }),
    ]);

    return { items: rows.map(toSubscription), total };
  }

  async getById(id) {
    const row = await prisma.subscription.findUnique({
      where: { id },
      select: subscriptionSelect,
    });
    return toSubscription(row);
  }

  async createSubscription(data, client) {
    const row = await (client ?? prisma).subscription.create({
      data,
      select: subscriptionSelect,
    });
    return toSubscription(row);
  }

  /**
   * Distinct studentIds (within `studentIds`) that are currently subscribed:
   * status ACTIVE AND now within [startDate, endDate]. Single batched query —
   * no N+1. Returns an array of ids.
   */
  async getCurrentlySubscribedStudentIds(studentIds, now = new Date()) {
    if (!studentIds?.length) return [];
    const subs = await prisma.subscription.findMany({
      where: {
        studentId: { in: studentIds },
        ...activeSubscriptionWhere(now),
      },
      select: { studentId: true },
      distinct: ["studentId"],
    });
    return subs.map((s) => s.studentId);
  }

  /**
   * All PENDING (in-flight) subscriptions for a student. Returns the minimal
   * shape needed to auto-replace them when a new subscription is created:
   * `{ id, couponId }` so the caller can un-redeem the coupon then delete the row.
   */
  findPendingSubscriptionsByStudent({ studentId, client } = {}) {
    return (client ?? prisma).subscription.findMany({
      where: { studentId, status: SUBSCRIPTION_STATUSES.PENDING },
      select: { id: true, couponId: true, origin: true },
    });
  }

  /**
   * Hard-delete a subscription. The invoice FK cascades (onDelete: Cascade), so
   * the demand invoice is removed with it. Coupon redemption is NOT touched here
   * — the caller un-redeems before deleting, in the same tx.
   */
  deleteSubscription({ id, client } = {}) {
    return (client ?? prisma).subscription.delete({ where: { id } });
  }

  async updateSubscription(id, data, client) {
    const row = await (client ?? prisma).subscription.update({
      where: { id },
      data,
      select: subscriptionSelect,
    });
    return toSubscription(row);
  }

  /** Map<studentId, hours> of UNBILLED PRESENT session hours in a month window. */
  async sumUsageHoursByStudent({ gte, lt }) {
    const rows = await prisma.sessionLog.groupBy({
      by: ["studentId"],
      where: {
        sessionDate: { gte, lt },
        attendance: SESSION_ATTENDANCE.PRESENT,
        billedSubscriptionId: null,
      },
      _sum: { durationHours: true },
    });
    return new Map(rows.map((r) => [r.studentId, Number(r._sum.durationHours ?? 0)]));
  }

  /**
   * UNBILLED PRESENT session hours for ONE student in a month window. Same filter
   * as sumUsageHoursByStudent but scoped to a single studentId and returning a
   * plain number (0 when none) — used by the recompute-from-source hook.
   */
  async sumUsageHoursForStudentMonth({ studentId, gte, lt, client } = {}) {
    const agg = await (client ?? prisma).sessionLog.aggregate({
      where: {
        studentId,
        sessionDate: { gte, lt },
        attendance: SESSION_ATTENDANCE.PRESENT,
        billedSubscriptionId: null,
      },
      _sum: { durationHours: true },
    });
    return Number(agg._sum.durationHours ?? 0);
  }

  /** The open (UPCOMING) USAGE subscription for a student's payment month, or null. */
  async findOpenUsageSubscription({ studentId, paymentStart, client } = {}) {
    const row = await (client ?? prisma).subscription.findFirst({
      where: {
        studentId,
        origin: SUBSCRIPTION_ORIGINS.USAGE,
        startDate: paymentStart,
      },
      select: subscriptionSelect,
    });
    return toSubscription(row);
  }

  /** Every currently-active student + their current plan's hours (for fallback). */
  async listActiveStudentsWithPlan(now = new Date()) {
    const subs = await prisma.subscription.findMany({
      where: activeSubscriptionWhere(now),
      select: { studentId: true, plan: { select: { hours: true } } },
      distinct: ["studentId"],
    });
    return subs.map((s) => ({ studentId: s.studentId, planHours: s.plan?.hours ?? null }));
  }

  /**
   * The planId a new monthly sub should inherit for a student (v3 §5):
   * the student's currently-active plan-linked sub, else their most-recent
   * plan-linked sub, else null. Only subs with a non-null planId are considered.
   */
  async currentPlanIdForStudent(studentId, now = new Date()) {
    const active = await prisma.subscription.findFirst({
      where: { studentId, planId: { not: null }, ...activeSubscriptionWhere(now) },
      orderBy: { endDate: "desc" },
      select: { planId: true },
    });
    if (active) return active.planId;
    const latest = await prisma.subscription.findFirst({
      where: { studentId, planId: { not: null } },
      orderBy: [{ startDate: "desc" }, { id: "desc" }],
      select: { planId: true },
    });
    return latest?.planId ?? null;
  }

  /** Hours of the cheapest active plan (min hours), or null if none exist. */
  async lowestActivePlanHours() {
    const plan = await prisma.plan.findFirst({
      where: { isActive: true },
      orderBy: { hours: "asc" },
      select: { hours: true },
    });
    return plan?.hours ?? null;
  }

  /** Stamp a student's unbilled PRESENT sessions in a window as billed. Returns count. */
  async markSessionsBilled({ studentId, gte, lt, subscriptionId, client } = {}) {
    const res = await (client ?? prisma).sessionLog.updateMany({
      where: {
        studentId,
        sessionDate: { gte, lt },
        attendance: SESSION_ATTENDANCE.PRESENT,
        billedSubscriptionId: null,
      },
      data: { billedSubscriptionId: subscriptionId },
    });
    return res.count;
  }
}

export const subscriptionRepo = new SubscriptionRepo();
export { SubscriptionRepo };
