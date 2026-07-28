import { generalMessagesCodes } from "@ayah/shared";
import { created, ok } from "../../../shared/http/response.js";
import { idParam, optionalIntQuery } from "../../../shared/http/params.js";
import { sessionLogUsecase } from "./sessionLog.usecase.js";

class SessionLogController {
  async list(req, res) {
    const { page, limit, ...filters } = req.query;
    const result = await sessionLogUsecase.list({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      filters: {
        month: filters.month,
        studentId: optionalIntQuery(filters.studentId),
        parentId: optionalIntQuery(filters.parentId),
      },
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async getOne(req, res) {
    const sessionLog = await sessionLogUsecase.getById({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, sessionLog);
  }

  async create(req, res) {
    const sessionLog = await sessionLogUsecase.create({
      ...req.body,
      authUser: req.auth,
    });
    return created(res, sessionLog, generalMessagesCodes.CREATED);
  }

  async update(req, res) {
    const sessionLog = await sessionLogUsecase.update({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, sessionLog, generalMessagesCodes.UPDATED);
  }

  async remove(req, res) {
    const sessionLog = await sessionLogUsecase.remove({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, sessionLog, generalMessagesCodes.DELETED);
  }
}

export const sessionLogController = new SessionLogController();
export { SessionLogController };
