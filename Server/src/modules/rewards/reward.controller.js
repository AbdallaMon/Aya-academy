import { generalMessagesCodes } from "@aya/shared";
import { ok } from "../../shared/http/response.js";
import { idParam, optionalIntQuery } from "../../shared/http/params.js";
import { rewardUsecase } from "./reward.usecase.js";

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
