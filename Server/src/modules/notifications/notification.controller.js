import { generalMessagesCodes } from "@aya/shared";
import { ok } from "../../shared/http/response.js";
import { badRequest } from "../../shared/errors/AppError.js";
import { notificationUsecase } from "./notification.usecase.js";

function authUser(req) {
  return req.auth;
}

function idParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

class NotificationController {
  list = async (req, res) => {
    const result = await notificationUsecase.list(authUser(req), {
      page: req.query.page,
      limit: req.query.limit,
      isRead: req.query.isRead,
    });
    return ok(res, result);
  };

  unreadCount = async (req, res) => {
    const result = await notificationUsecase.unreadCount(authUser(req));
    return ok(res, result);
  };

  markRead = async (req, res) => {
    const notification = await notificationUsecase.markRead(
      authUser(req),
      idParam(req.params.id),
    );
    return ok(res, notification, generalMessagesCodes.UPDATED);
  };

  markAllRead = async (req, res) => {
    const result = await notificationUsecase.markAllRead(authUser(req));
    return ok(res, result, generalMessagesCodes.UPDATED);
  };
}

export const notificationController = new NotificationController();
