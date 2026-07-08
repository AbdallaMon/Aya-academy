import { badgeMessagesCodes, generalMessagesCodes, messagesNames } from "@aya/shared";
import { created, ok, updated } from "../../shared/http/response.js";
import { idParam } from "../../shared/http/params.js";
import { badgeUsecase } from "./badge.usecase.js";

class BadgeController {
  async list(req, res) {
    const { page, limit, ...filters } = req.query;
    const result = await badgeUsecase.list({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      filters,
    });
    return ok(res, result);
  }

  async getOne(req, res) {
    const badge = await badgeUsecase.getById(idParam(req.params.id));
    return ok(res, badge);
  }

  async create(req, res) {
    const badge = await badgeUsecase.create({ ...req.body, authUser: req.auth });
    return created(res, badge, generalMessagesCodes.CREATED);
  }

  async update(req, res) {
    const badge = await badgeUsecase.update({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return updated(res, badge, generalMessagesCodes.UPDATED);
  }

  async remove(req, res) {
    const badge = await badgeUsecase.remove({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, badge, generalMessagesCodes.DELETED);
  }

  async studentBadges(req, res) {
    const result = await badgeUsecase.listStudentBadges({
      authUser: req.auth,
      studentId: idParam(req.params.studentId),
    });
    return ok(res, result);
  }

  async award(req, res) {
    const result = await badgeUsecase.award({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return created(
      res,
      result,
      badgeMessagesCodes.BADGE_AWARDED,
      messagesNames.badgeMessages,
    );
  }

  async revoke(req, res) {
    const result = await badgeUsecase.revoke({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(
      res,
      result,
      badgeMessagesCodes.BADGE_REVOKED,
      messagesNames.badgeMessages,
    );
  }
}

export const badgeController = new BadgeController();
export { BadgeController };
