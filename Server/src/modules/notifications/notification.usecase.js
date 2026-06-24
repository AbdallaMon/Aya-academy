import { forbidden, notFound } from "../../shared/errors/AppError.js";
import { parseBooleanFilter } from "../../shared/utility/helper.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
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
  async list(authUser, params) {
    const { skip, take, page, limit } = paginate({
      page: params.page,
      limit: params.limit,
    });
    const where = { userId: authUser.id };
    const isRead = parseBooleanFilter(params.isRead);
    if (isRead !== undefined) where.isRead = isRead;

    const { items, total } = await notificationRepo.list(where, skip, take);
    return paginatedResult(items, total, page, limit);
  }

  async unreadCount(authUser) {
    const count = await notificationRepo.count({
      userId: authUser.id,
      isRead: false,
    });
    return { count };
  }

  async markRead(authUser, id) {
    const notification = await notificationRepo.getById(id);
    if (!notification) {
      throw notFound(notificationMessagesCodes.NOTIFICATION_NOT_FOUND);
    }
    if (notification.userId !== authUser.id) {
      throw forbidden(notificationMessagesCodes.CANNOT_ACCESS_NOTIFICATION);
    }
    return notificationRepo.markRead(id);
  }

  async markAllRead(authUser) {
    return notificationRepo.markAllRead(authUser.id);
  }

  // ── reusable service (importable by other modules) ──────────
  /** Create a single notification for one user. */
  createNotification(input, tx) {
    return notificationRepo.create(toCreateData(input), tx);
  }

  /** Create one notification per user from a shared payload. */
  createManyForUsers(userIds, input, tx) {
    const data = userIds.map((userId) => toCreateData({ ...input, userId }));
    return notificationRepo.createMany(data, tx);
  }
}

export const notificationUsecase = new NotificationUsecase();
