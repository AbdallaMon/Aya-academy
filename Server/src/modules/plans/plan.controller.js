import { generalMessagesCodes } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { badRequest } from "../../shared/errors/AppError.js";
import { planUsecase } from "./plan.usecase.js";

function idParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

class PlanController {
  listPublic = async (_req, res) => {
    const result = await planUsecase.listPublic();
    return ok(res, result);
  };

  list = async (req, res) => {
    const result = await planUsecase.list({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      isActive: req.query.isActive,
      billingPeriod: req.query.billingPeriod,
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

  createDiscount = async (req, res) => {
    const discount = await planUsecase.createDiscount(
      idParam(req.params.planId),
      req.body,
    );
    return created(res, discount, generalMessagesCodes.CREATED);
  };

  updateDiscount = async (req, res) => {
    const discount = await planUsecase.updateDiscount(
      idParam(req.params.planId),
      idParam(req.params.id),
      req.body,
    );
    return ok(res, discount, generalMessagesCodes.UPDATED);
  };

  removeDiscount = async (req, res) => {
    const discount = await planUsecase.removeDiscount(
      idParam(req.params.planId),
      idParam(req.params.id),
    );
    return ok(res, discount, generalMessagesCodes.DELETED);
  };
}

export const planController = new PlanController();
