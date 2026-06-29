import { generalMessagesCodes } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { idParam, optionalIntQuery } from "../../shared/http/params.js";
import { reportUsecase } from "./report.usecase.js";

class ReportController {
  async list(req, res) {
    const { page, limit, ...filters } = req.query;
    const result = await reportUsecase.list({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      filters: {
        ...filters,
        studentId: optionalIntQuery(filters.studentId),
      },
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async getOne(req, res) {
    const report = await reportUsecase.getById({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, report);
  }

  async create(req, res) {
    const report = await reportUsecase.create({ ...req.body, authUser: req.auth });
    return created(res, report, generalMessagesCodes.CREATED);
  }

  async update(req, res) {
    const report = await reportUsecase.update({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, report, generalMessagesCodes.UPDATED);
  }

  async remove(req, res) {
    const report = await reportUsecase.remove({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, report, generalMessagesCodes.DELETED);
  }
}

export const reportController = new ReportController();
export { ReportController };
