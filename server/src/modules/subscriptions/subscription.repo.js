import { prisma } from "@aya/db/prisma.client.js";
import { activeSubscriptionWhere } from "@aya/shared";
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

  async updateSubscription(id, data) {
    const row = await prisma.subscription.update({
      where: { id },
      data,
      select: subscriptionSelect,
    });
    return toSubscription(row);
  }
}

export const subscriptionRepo = new SubscriptionRepo();
