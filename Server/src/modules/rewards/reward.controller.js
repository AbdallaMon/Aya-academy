import { generalMessagesCodes } from "@aya/shared";
import { ok } from "../../shared/http/response.js";
import { badRequest } from "../../shared/errors/AppError.js";
import { rewardUsecase } from "./reward.usecase.js";

function idParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

function optionalIntQuery(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

class RewardController {
  list = async (req, res) => {
    const result = await rewardUsecase.list(req.auth, {
      page: req.query.page,
      limit: req.query.limit,
      userId: optionalIntQuery(req.query.userId),
      status: req.query.status,
    });
    return ok(res, result);
  };

  getOne = async (req, res) => {
    const reward = await rewardUsecase.getById(req.auth, idParam(req.params.id));
    return ok(res, reward);
  };

  claim = async (req, res) => {
    const reward = await rewardUsecase.claim(req.auth, idParam(req.params.id));
    return ok(res, reward, generalMessagesCodes.UPDATED);
  };
}

export const rewardController = new RewardController();
