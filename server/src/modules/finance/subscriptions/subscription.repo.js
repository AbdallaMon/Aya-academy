import { prisma } from "@aya/db/prisma.client.js";
import { activeSubscriptionWhere, SUBSCRIPTION_STATUSES, USER_ROLES } from "@aya/shared";
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

  // Scoped list — builds the where from (authUser, filters) then pages the
  // latest-per-student query.
  async listScoped({ authUser, filters = {}, skip, take } = {}) {
    const where = await this.buildListWhere(authUser, filters);
    return this.listLatestPerStudent({ where, skip, take });
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
      select: { id: true, couponId: true },
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
}

export const subscriptionRepo = new SubscriptionRepo();
export { SubscriptionRepo };
