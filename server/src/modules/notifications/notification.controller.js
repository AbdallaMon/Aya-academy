import { generalMessagesCodes } from "@aya/shared";
import { ok } from "../../shared/http/response.js";
import { idParam } from "../../shared/http/params.js";
import { notificationUsecase } from "./notification.usecase.js";

class NotificationController {
  async list(req, res) {
    const { page, limit, ...filters } = req.query;
    const result = await notificationUsecase.list({
      authUser: req.auth,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      filters,
    });
    return ok(res, result);
  }

  async unreadCount(req, res) {
    const result = await notificationUsecase.unreadCount({ authUser: req.auth });
    return ok(res, result);
  }

  async markRead(req, res) {
    const notification = await notificationUsecase.markRead({
      authUser: req.auth,
      id: idParam(req.params.id),
    });
    return ok(res, notification, generalMessagesCodes.UPDATED);
  }

  async markAllRead(req, res) {
    const result = await notificationUsecase.markAllRead({ authUser: req.auth });
    return ok(res, result, generalMessagesCodes.UPDATED);
  }
}

export const notificationController = new NotificationController();
export { NotificationController };
