import { generalMessagesCodes } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { badRequest } from "../../shared/errors/AppError.js";
import { sessionUsecase } from "./session.usecase.js";

function authUser(req) {
  return req.auth;
}

function idParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

function optionalIntQuery(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

function optionalDateQuery(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null || raw === "") return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) throw badRequest();
  return d;
}

class SessionController {
  list = async (req, res) => {
    const result = await sessionUsecase.list(authUser(req), {
      page: req.query.page,
      limit: req.query.limit,
      studentId: optionalIntQuery(req.query.studentId),
      status: req.query.status,
      from: optionalDateQuery(req.query.from),
      to: optionalDateQuery(req.query.to),
    });
    return ok(res, result);
  };

  getOne = async (req, res) => {
    const session = await sessionUsecase.getById(
      authUser(req),
      idParam(req.params.id),
    );
    return ok(res, session);
  };

  create = async (req, res) => {
    const session = await sessionUsecase.create(authUser(req), req.body);
    return created(res, session, generalMessagesCodes.CREATED);
  };

  update = async (req, res) => {
    const session = await sessionUsecase.update(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return ok(res, session, generalMessagesCodes.UPDATED);
  };

  remove = async (req, res) => {
    const session = await sessionUsecase.remove(
      authUser(req),
      idParam(req.params.id),
    );
    return ok(res, session, generalMessagesCodes.DELETED);
  };

  setPlan = async (req, res) => {
    const session = await sessionUsecase.setPlan(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return ok(res, session, generalMessagesCodes.UPDATED);
  };
}

export const sessionController = new SessionController();
