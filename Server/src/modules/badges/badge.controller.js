import { generalMessagesCodes, messagesNames } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { badRequest } from "../../shared/errors/AppError.js";
import { badgeUsecase } from "./badge.usecase.js";
import { badgeMessagesCodes } from "./badge.messages.js";

function authUser(req) {
  return req.auth;
}

function idParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

class BadgeController {
  list = async (req, res) => {
    const result = await badgeUsecase.list(authUser(req), {
      page: req.query.page,
      limit: req.query.limit,
    });
    return ok(res, result);
  };

  getOne = async (req, res) => {
    const badge = await badgeUsecase.getById(idParam(req.params.id));
    return ok(res, badge);
  };

  create = async (req, res) => {
    const badge = await badgeUsecase.create(authUser(req), req.body);
    return created(res, badge, generalMessagesCodes.CREATED);
  };

  update = async (req, res) => {
    const badge = await badgeUsecase.update(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return ok(res, badge, generalMessagesCodes.UPDATED);
  };

  remove = async (req, res) => {
    const badge = await badgeUsecase.remove(authUser(req), idParam(req.params.id));
    return ok(res, badge, generalMessagesCodes.DELETED);
  };

  studentBadges = async (req, res) => {
    const result = await badgeUsecase.listStudentBadges(
      authUser(req),
      idParam(req.params.studentId),
    );
    return ok(res, result);
  };

  award = async (req, res) => {
    const result = await badgeUsecase.award(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return created(
      res,
      result,
      badgeMessagesCodes.BADGE_AWARDED,
      messagesNames.badgeMessages,
    );
  };

  revoke = async (req, res) => {
    const result = await badgeUsecase.revoke(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return ok(
      res,
      result,
      badgeMessagesCodes.BADGE_REVOKED,
      messagesNames.badgeMessages,
    );
  };
}

export const badgeController = new BadgeController();
