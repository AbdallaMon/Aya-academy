import { generalMessagesCodes } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { idParam } from "../../shared/http/params.js";
import { planUsecase } from "./plan.usecase.js";

class PlanController {
  async listPublic(_req, res) {
    const result = await planUsecase.listPublic();
    return ok(res, result);
  }

  async quote(req, res) {
    const result = await planUsecase.quote(req.body);
    return ok(res, result);
  }

  async list(req, res) {
    const { page, limit, ...filters } = req.query;
    const result = await planUsecase.list({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      filters,
    });
    return ok(res, result);
  }

  async getOne(req, res) {
    const plan = await planUsecase.getById(idParam(req.params.id));
    return ok(res, plan);
  }

  async create(req, res) {
    const plan = await planUsecase.create({ ...req.body, authUser: req.auth });
    return created(res, plan, generalMessagesCodes.CREATED);
  }

  async update(req, res) {
    const plan = await planUsecase.update({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, plan, generalMessagesCodes.UPDATED);
  }

  async remove(req, res) {
    const plan = await planUsecase.remove({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, plan, generalMessagesCodes.DELETED);
  }
}

export const planController = new PlanController();
export { PlanController };
