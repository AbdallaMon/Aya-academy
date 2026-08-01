import { forbidden, notFound } from "../../shared/errors/AppError.js";
import { paginatedResult } from "../../shared/utility/pagination.js";
import { emitToUser } from "../../infra/realtime/socket.js";
import { notificationMessagesCodes } from "@ayah/shared";
import { ENV } from "../../config/env.js";
import { mailer } from "../../infra/messaging/providers/mailer.js";
import { buildNotificationEmail } from "../../infra/messaging/templates/notificationEmail.js";
import { userRepo } from "../users/user.repo.js";
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
  constructor({
    repo = notificationRepo,
    recipientRepo = userRepo,
    mailerProvider = mailer,
    emit = emitToUser,
    emailBuilder = buildNotificationEmail,
    logger = console,
  } = {}) {
    this.repo = repo;
    this.recipientRepo = recipientRepo;
    this.mailer = mailerProvider;
    this.emit = emit;
    this.emailBuilder = emailBuilder;
    this.logger = logger;
  }

  async list({ authUser, page, limit, filters = {} }) {
    // Per-user scope depends on req.auth, so it is threaded into the repo here.
    const { items, total, page: currentPage, pageSize } = await this.repo.list({
      userId: authUser.id,
      page,
      limit,
      isRead: filters.isRead,
    });
    return paginatedResult(items, total, currentPage, pageSize);
  }

  async unreadCount({ authUser }) {
    const count = await this.repo.count({
      where: { userId: authUser.id, isRead: false },
    });
    return { count };
  }

  async markRead({ authUser, id }) {
    const notification = await this.repo.getById({ id });
    if (!notification) {
      throw notFound(notificationMessagesCodes.NOTIFICATION_NOT_FOUND);
    }
    if (notification.userId !== authUser.id) {
      throw forbidden(notificationMessagesCodes.CANNOT_ACCESS_NOTIFICATION);
    }
    return this.repo.markRead({ id });
  }

  async markAllRead({ authUser }) {
    return this.repo.markAllRead({ userId: authUser.id });
  }

  async sendEmail(recipient, input) {
    if (!recipient?.emailNotificationsEnabled || !recipient.email) return false;

    try {
      if (!this.mailer.isReady()) return false;
      const email = this.emailBuilder({
        recipient,
        notification: input,
        appUrl: ENV.appUrl,
      });
      await this.mailer.sendMail({ to: recipient.email, ...email });
      return true;
    } catch (error) {
      this.logger.error(
        `[notifications] email delivery failed for user ${recipient.id}:`,
        error?.message ?? error,
      );
      return false;
    }
  }

  // ── reusable service (importable by other modules) ──────────
  // FROZEN signatures — called cross-module (badges / games / quizzes /
  // subscriptions / certificates / invoices / auth / reports / messaging).
  /** Create a single notification for one user, then push it over the socket. */
  async createNotification(input, tx) {
    const [recipient] = await this.recipientRepo.getNotificationRecipients({
      userIds: [input.userId],
      client: tx,
    });
    if (!recipient) return null;

    let created = null;
    let inAppError = null;
    if (recipient.inAppNotificationsEnabled) {
      try {
        created = await this.repo.create({
          data: toCreateData(input),
          client: tx,
        });
        this.emit(input.userId, "notification:new", created);
      } catch (error) {
        inAppError = error;
      }
    }

    await this.sendEmail(recipient, input);
    if (inAppError) throw inAppError;
    return created;
  }

  /** Create one notification per user from a shared payload, pushing to each. */
  async createManyForUsers(userIds, input, tx) {
    const uniqueUserIds = [
      ...new Set(userIds.map(Number).filter(Number.isInteger)),
    ];
    if (!uniqueUserIds.length) return { count: 0, emailCount: 0 };

    const recipients = await this.recipientRepo.getNotificationRecipients({
      userIds: uniqueUserIds,
      client: tx,
    });
    const inAppRecipients = recipients.filter(
      (recipient) => recipient.inAppNotificationsEnabled,
    );

    let result = { count: 0 };
    let inAppError = null;
    if (inAppRecipients.length) {
      try {
        const data = inAppRecipients.map((recipient) =>
          toCreateData({ ...input, userId: recipient.id }),
        );
        result = await this.repo.createMany({ data, client: tx });
      } catch (error) {
        inAppError = error;
      }
    }
    // createMany returns a count, not rows — push a lightweight signal so each
    // recipient's client refetches its list + unread badge (and chimes).
    if (!inAppError) {
      try {
        for (const recipient of inAppRecipients) {
          this.emit(recipient.id, "notification:new", null);
        }
      } catch (error) {
        inAppError = error;
      }
    }

    const emailResults = await Promise.all(
      recipients.map((recipient) => this.sendEmail(recipient, input)),
    );
    if (inAppError) throw inAppError;
    return {
      ...result,
      emailCount: emailResults.filter(Boolean).length,
    };
  }
}

export const notificationUsecase = new NotificationUsecase();
export { NotificationUsecase };
