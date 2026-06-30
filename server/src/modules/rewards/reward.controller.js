import { generalMessagesCodes } from "@aya/shared";
import { ok } from "../../shared/http/response.js";
import { idParam, optionalIntQuery } from "../../shared/http/params.js";
import { rewardUsecase } from "./reward.usecase.js";

class RewardController {
  async list(req, res) {
    const { page, limit, ...filters } = req.query;
    const result = await rewardUsecase.list({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      filters: {
        userId: optionalIntQuery(filters.userId),
        status: filters.status,
      },
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async getOne(req, res) {
    const reward = await rewardUsecase.getById({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, reward);
  }

  async claim(req, res) {
    const reward = await rewardUsecase.claim({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, reward, generalMessagesCodes.UPDATED);
  }
}

export const rewardController = new RewardController();
export { RewardController };
