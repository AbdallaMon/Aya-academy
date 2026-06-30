import { forbidden, notFound } from "../../shared/errors/AppError.js";
import { paginatedResult } from "../../shared/utility/pagination.js";
import { emitToUser } from "../../infra/realtime/socket.js";
import { notificationMessagesCodes } from "./notification.messages.js";
import { notificationRepo } from "./notification.repo.js";

/** Map a public create input onto a Prisma create payload (handles JSON). */
function toCreateData(input) {
  return {
    userId: input.userId,
    type: input.type,
    titleAr: input.titleAr,
    titleEn: input.titleEn,
    bodyAr: input.bodyAr,
    bodyEn: input.bodyEn,
    dataJson: input.dataJson ?? undefined,
    link: input.link,
  };
}

class NotificationUsecase {
  async list({ authUser, page, limit, filters = {} }) {
    // Per-user scope depends on req.auth, so it is threaded into the repo here.
    const { items, total, page: currentPage, pageSize } = await notificationRepo.list({
      userId: authUser.id,
      page,
      limit,
      isRead: filters.isRead,
    });
    return paginatedResult(items, total, currentPage, pageSize);
  }

  async unreadCount({ authUser }) {
    const count = await notificationRepo.count({
      where: { userId: authUser.id, isRead: false },
    });
    return { count };
  }

  async markRead({ authUser, id }) {
    const notification = await notificationRepo.getById({ id });
    if (!notification) {
      throw notFound(notificationMessagesCodes.NOTIFICATION_NOT_FOUND);
    }
    if (notification.userId !== authUser.id) {
      throw forbidden(notificationMessagesCodes.CANNOT_ACCESS_NOTIFICATION);
    }
    return notificationRepo.markRead({ id });
  }

  async markAllRead({ authUser }) {
    return notificationRepo.markAllRead({ userId: authUser.id });
  }

  // ── reusable service (importable by other modules) ──────────
  // FROZEN signatures — called cross-module (badges / games / quizzes /
  // subscriptions / certificates / invoices / auth / reports / messaging).
  /** Create a single notification for one user, then push it over the socket. */
  async createNotification(input, tx) {
    const created = await notificationRepo.create({
      data: toCreateData(input),
      client: tx,
    });
    emitToUser(input.userId, "notification:new", created);
    return created;
  }

  /** Create one notification per user from a shared payload, pushing to each. */
  async createManyForUsers(userIds, input, tx) {
    const data = userIds.map((userId) => toCreateData({ ...input, userId }));
    const result = await notificationRepo.createMany({ data, client: tx });
    // createMany returns a count, not rows — push a lightweight signal so each
    // recipient's client refetches its list + unread badge (and chimes).
    for (const userId of userIds) {
      emitToUser(userId, "notification:new", null);
    }
    return result;
  }
}

export const notificationUsecase = new NotificationUsecase();
export { NotificationUsecase };
