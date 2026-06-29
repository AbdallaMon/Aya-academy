import { prisma } from "@aya/db/prisma.client.js";
import { activeSubscriptionWhere, SUBSCRIPTION_STATUSES } from "@aya/shared";
import { subscriptionSelect, toSubscription } from "./subscription.dto.js";

class SubscriptionRepo {
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
   * True when the student already has a subscription in PENDING status — used to
   * block duplicate pending renewals (a second renewal while one is awaiting
   * admin review).
   */
  async hasPendingSubscription(studentId) {
    const count = await prisma.subscription.count({
      where: { studentId, status: SUBSCRIPTION_STATUSES.PENDING },
    });
    return count > 0;
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
