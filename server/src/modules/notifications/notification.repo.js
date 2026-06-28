import { prisma } from "@aya/db/prisma.client.js";
import { notificationSelect } from "./notification.dto.js";

class NotificationRepo {
  async list(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: notificationSelect,
      }),
      prisma.notification.count({ where }),
    ]);
    return { items, total };
  }

  count(where) {
    return prisma.notification.count({ where });
  }

  getById(id) {
    return prisma.notification.findUnique({
      where: { id },
      select: notificationSelect,
    });
  }

  create(data, tx) {
    const client = tx ?? prisma;
    return client.notification.create({ data, select: notificationSelect });
  }

  createMany(data, tx) {
    const client = tx ?? prisma;
    return client.notification.createMany({ data });
  }

  markRead(id) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
      select: notificationSelect,
    });
  }

  markAllRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}

export const notificationRepo = new NotificationRepo();
