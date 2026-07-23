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
import { legacyValueToMinutes } from "../../../shared/utility/duration.js";
import {
  firstOfNextMonth,
  monthRange,
} from "../../../shared/utility/dates.js";

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
    const now = new Date();
    const nextMonth = monthRange(firstOfNextMonth(now));
    const slotWhere = {
      ...scopeWhere,
      OR: [
        {
          ...currentSubscriptionWhere(now),
          ...(status ? { status } : {}),
        },
        {
          origin: SUBSCRIPTION_ORIGINS.USAGE,
          startDate: { gte: nextMonth.gte, lt: nextMonth.lt },
          status: status
            ? status
            : {
                in: [
                  SUBSCRIPTION_STATUSES.PENDING,
                  SUBSCRIPTION_STATUSES.UPCOMING,
                ],
              },
        },
      ],
    };

    const [pageGroups, allGroups] = await Promise.all([
      prisma.subscription.groupBy({
        by: ["studentId"],
        where: slotWhere,
        _max: { id: true },
        orderBy: { _max: { id: "desc" } },
        skip,
        take,
      }),
      prisma.subscription.groupBy({ by: ["studentId"], where: slotWhere }),
    ]);

    const total = allGroups.length;
    const studentIds = pageGroups.map((g) => g.studentId);
    if (!studentIds.length) return { items: [], total };

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
          status: {
            in: [
              SUBSCRIPTION_STATUSES.PENDING,
              SUBSCRIPTION_STATUSES.UPCOMING,
            ],
          },
          startDate: { gte: nextMonth.gte, lt: nextMonth.lt },
        },
        orderBy: [{ startDate: "desc" }, { id: "desc" }],
        select: subscriptionSelect,
      }),
    ]);

    // First row per student wins (both queries are ordered so the pick is stable).
    const firstByStudent = (rows, statusRank = {}) => {
      const m = new Map();
      for (const row of rows) {
        const current = m.get(row.studentId);
        if (
          !current ||
          (statusRank[row.status] ?? 99) <
            (statusRank[current.status] ?? 99)
        ) {
          m.set(row.studentId, row);
        }
      }
      return m;
    };
    const currentBy = firstByStudent(currents, {
      [SUBSCRIPTION_STATUSES.ACTIVE]: 0,
      [SUBSCRIPTION_STATUSES.PENDING]: 1,
      [SUBSCRIPTION_STATUSES.UPCOMING]: 2,
      [SUBSCRIPTION_STATUSES.CANCELLED]: 3,
      [SUBSCRIPTION_STATUSES.EXPIRED]: 4,
    });
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

  async getById(id, client) {
    const row = await (client ?? prisma).subscription.findUnique({
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
  async getCurrentlySubscribedStudentIds(
    studentIds,
    now = new Date(),
    client,
  ) {
    if (!studentIds?.length) return [];
    const subs = await (client ?? prisma).subscription.findMany({
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
   * the demand invoice is removed with it. The caller preserves any legacy
   * coupon proof in CouponRedemption before deleting.
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

  /** Map<studentId, minutes> of UNBILLED PRESENT sessions in a month window. */
  async sumUsageMinutesByStudent({ gte, lt }) {
    const commonWhere = {
      sessionDate: { gte, lt },
      attendance: SESSION_ATTENDANCE.PRESENT,
      billedSubscriptionId: null,
    };
    const [minuteRows, legacyRows] = await Promise.all([
      prisma.sessionLog.groupBy({
        by: ["studentId"],
        where: { ...commonWhere, durationMinutes: { not: null } },
        _sum: { durationMinutes: true },
      }),
      prisma.sessionLog.findMany({
        where: { ...commonWhere, durationMinutes: null },
        select: { studentId: true, durationHours: true },
      }),
    ]);

    const totals = new Map();
    for (const row of minuteRows) {
      totals.set(row.studentId, Number(row._sum.durationMinutes ?? 0));
    }
    for (const row of legacyRows) {
      const legacyMinutes = legacyValueToMinutes(row.durationHours) ?? 0;
      totals.set(row.studentId, (totals.get(row.studentId) ?? 0) + legacyMinutes);
    }
    return totals;
  }

  /**
   * UNBILLED PRESENT session minutes for ONE student in a month window. New
   * minute rows and not-yet-backfilled legacy hour rows are summed separately so
   * a partially migrated database cannot double count a session.
   */
  async sumUsageMinutesForStudentMonth({
    studentId,
    gte,
    lt,
    includeBilledSubscriptionId = null,
    client,
  } = {}) {
    const db = client ?? prisma;
    const commonWhere = {
      studentId,
      sessionDate: { gte, lt },
      attendance: SESSION_ATTENDANCE.PRESENT,
      ...(includeBilledSubscriptionId
        ? {
            OR: [
              { billedSubscriptionId: null },
              { billedSubscriptionId: includeBilledSubscriptionId },
            ],
          }
        : { billedSubscriptionId: null }),
    };
    const [minuteAgg, legacyRows] = await Promise.all([
      db.sessionLog.aggregate({
        where: { ...commonWhere, durationMinutes: { not: null } },
        _sum: { durationMinutes: true },
      }),
      db.sessionLog.findMany({
        where: { ...commonWhere, durationMinutes: null },
        select: { durationHours: true },
      }),
    ]);
    const minutes = Number(minuteAgg._sum.durationMinutes ?? 0);
    const legacyMinutes = legacyRows.reduce(
      (total, row) => total + (legacyValueToMinutes(row.durationHours) ?? 0),
      0,
    );
    return minutes + legacyMinutes;
  }

  /** The open (UPCOMING) USAGE subscription for a student's payment month, or null. */
  async findOpenUsageSubscription({ studentId, paymentStart, client } = {}) {
    const row = await (client ?? prisma).subscription.findFirst({
      where: {
        studentId,
        origin: SUBSCRIPTION_ORIGINS.USAGE,
        startDate: paymentStart,
        status: {
          in: [
            SUBSCRIPTION_STATUSES.PENDING,
            SUBSCRIPTION_STATUSES.UPCOMING,
            SUBSCRIPTION_STATUSES.ACTIVE,
          ],
        },
      },
      orderBy: { id: "desc" },
      select: subscriptionSelect,
    });
    return toSubscription(row);
  }

  /** Exact session snapshot used by month close/manual rebilling. */
  listBillableSessionsForStudentMonth({
    studentId,
    gte,
    lt,
    includeBilledSubscriptionId = null,
    client,
  } = {}) {
    return (client ?? prisma).sessionLog.findMany({
      where: {
        studentId,
        sessionDate: { gte, lt },
        attendance: SESSION_ATTENDANCE.PRESENT,
        ...(includeBilledSubscriptionId
          ? {
              OR: [
                { billedSubscriptionId: null },
                { billedSubscriptionId: includeBilledSubscriptionId },
              ],
            }
          : { billedSubscriptionId: null }),
      },
      select: {
        id: true,
        durationMinutes: true,
        durationHours: true,
        billedSubscriptionId: true,
      },
      orderBy: { id: "asc" },
    });
  }

  /** Distinct students with sessions in a month, independent of subscription status. */
  async listSessionStudentsForMonth({ gte, lt, client } = {}) {
    const rows = await (client ?? prisma).sessionLog.groupBy({
      by: ["studentId"],
      where: {
        sessionDate: { gte, lt },
        attendance: SESSION_ATTENDANCE.PRESENT,
      },
      _max: { updatedAt: true },
    });
    return rows.map((row) => ({
      studentId: row.studentId,
      latestSessionAt: row._max.updatedAt,
    }));
  }

  findLatestCancelledUsageSubscription({
    studentId,
    paymentStart,
    client,
  } = {}) {
    return (client ?? prisma).subscription.findFirst({
      where: {
        studentId,
        origin: SUBSCRIPTION_ORIGINS.USAGE,
        status: SUBSCRIPTION_STATUSES.CANCELLED,
        startDate: paymentStart,
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: { id: true, updatedAt: true },
    });
  }

  /**
   * Every billable student with a subscription covering the current period.
   * PENDING/UPCOMING remain included so awaiting approval/payment does not hide
   * the next bucket; cancelled/expired subscriptions do not seed future bills.
   */
  async listCurrentPeriodStudents(now = new Date()) {
    const subs = await prisma.subscription.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
        status: {
          in: [
            SUBSCRIPTION_STATUSES.ACTIVE,
            SUBSCRIPTION_STATUSES.PENDING,
            SUBSCRIPTION_STATUSES.UPCOMING,
          ],
        },
      },
      select: { studentId: true },
      distinct: ["studentId"],
    });
    return subs.map((s) => ({ studentId: s.studentId }));
  }

  async listOpenUsageStudentsForPaymentMonth(paymentStart, client) {
    const rows = await (client ?? prisma).subscription.findMany({
      where: {
        origin: SUBSCRIPTION_ORIGINS.USAGE,
        startDate: paymentStart,
        status: {
          in: [
            SUBSCRIPTION_STATUSES.PENDING,
            SUBSCRIPTION_STATUSES.UPCOMING,
          ],
        },
      },
      select: { studentId: true },
      distinct: ["studentId"],
    });
    return rows.map((row) => ({ studentId: row.studentId }));
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

  /** Stamp only the rows included in the exact billing snapshot. */
  async markSessionIdsBilled({ ids, subscriptionId, client } = {}) {
    if (!ids?.length) return 0;
    const res = await (client ?? prisma).sessionLog.updateMany({
      where: { id: { in: ids } },
      data: { billedSubscriptionId: subscriptionId },
    });
    return res.count;
  }
}

export const subscriptionRepo = new SubscriptionRepo();
export { SubscriptionRepo };
