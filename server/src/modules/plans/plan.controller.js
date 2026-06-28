import { generalMessagesCodes } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { idParam } from "../../shared/http/params.js";
import { planUsecase } from "./plan.usecase.js";

class PlanController {
  listPublic = async (_req, res) => {
    const result = await planUsecase.listPublic();
    return ok(res, result);
  };

  quote = async (req, res) => {
    const result = await planUsecase.quote(req.body);
    return ok(res, result);
  };

  list = async (req, res) => {
    const result = await planUsecase.list({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      isActive: req.query.isActive,
    });
    return ok(res, result);
  };

  getOne = async (req, res) => {
    const plan = await planUsecase.getById(idParam(req.params.id));
    return ok(res, plan);
  };

  create = async (req, res) => {
    const plan = await planUsecase.create(req.body);
    return created(res, plan, generalMessagesCodes.CREATED);
  };

  update = async (req, res) => {
    const plan = await planUsecase.update(idParam(req.params.id), req.body);
    return ok(res, plan, generalMessagesCodes.UPDATED);
  };

  remove = async (req, res) => {
    const plan = await planUsecase.remove(idParam(req.params.id));
    return ok(res, plan, generalMessagesCodes.DELETED);
  };
}

export const planController = new PlanController();
