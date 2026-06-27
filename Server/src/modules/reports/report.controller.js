import { generalMessagesCodes } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { idParam, optionalIntQuery, authUser } from "../../shared/http/params.js";
import { reportUsecase } from "./report.usecase.js";

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
