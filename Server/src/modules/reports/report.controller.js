import { generalMessagesCodes } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { badRequest } from "../../shared/errors/AppError.js";
import { reportUsecase } from "./report.usecase.js";

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

class ReportController {
  list = async (req, res) => {
    const result = await reportUsecase.list(authUser(req), {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      studentId: optionalIntQuery(req.query.studentId),
    });
    return ok(res, result);
  };

  getOne = async (req, res) => {
    const report = await reportUsecase.getById(
      authUser(req),
      idParam(req.params.id),
    );
    return ok(res, report);
  };

  create = async (req, res) => {
    const report = await reportUsecase.create(authUser(req), req.body);
    return created(res, report, generalMessagesCodes.CREATED);
  };

  update = async (req, res) => {
    const report = await reportUsecase.update(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return ok(res, report, generalMessagesCodes.UPDATED);
  };

  remove = async (req, res) => {
    const report = await reportUsecase.remove(
      authUser(req),
      idParam(req.params.id),
    );
    return ok(res, report, generalMessagesCodes.DELETED);
  };
}

export const reportController = new ReportController();
