// ===========================================================================
// notification.repo — Prisma I/O only on Notification. (Reference idiom:
// single object args with optional `client`, list owns filtering + pagination
// and returns { items, total, page, pageSize }.)
// ===========================================================================

import { prisma } from "@ayah/db/prisma.client.js";
import { paginate } from "../../shared/utility/pagination.js";
import { parseBooleanFilter } from "../../shared/utility/queryBuilders.js";
import { notificationSelect } from "./notification.dto.js";

class NotificationRepo {
  async list({ userId, page, limit, isRead, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });

    const where = { userId };
    // `isRead` is a plain read/unread flag (NOT an isActive filter).
    const readFilter = parseBooleanFilter(isRead);
    if (readFilter !== undefined) where.isRead = readFilter;

    const [items, total] = await Promise.all([
      db.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: notificationSelect,
      }),
      db.notification.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  count({ where, client } = {}) {
    return (client ?? prisma).notification.count({ where });
  }

  getById({ id, client } = {}) {
    return (client ?? prisma).notification.findUnique({
      where: { id },
      select: notificationSelect,
    });
  }

  create({ data, client } = {}) {
    return (client ?? prisma).notification.create({ data, select: notificationSelect });
  }

  createMany({ data, client } = {}) {
    return (client ?? prisma).notification.createMany({ data });
  }

  markRead({ id, client } = {}) {
    return (client ?? prisma).notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
      select: notificationSelect,
    });
  }

  markAllRead({ userId, client } = {}) {
    return (client ?? prisma).notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}

export const notificationRepo = new NotificationRepo();
export { NotificationRepo };
