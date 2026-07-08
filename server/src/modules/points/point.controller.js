import { messagesNames, pointMessagesCodes } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { badRequest } from "../../shared/errors/AppError.js";
import { pointUsecase } from "./point.usecase.js";

function requiredIntQuery(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

class PointController {
  async list(req, res) {
    const result = await pointUsecase.list({
      authUser: req.auth,
      studentId: requiredIntQuery(req.query.studentId),
      page: req.query.page,
      limit: req.query.limit,
    });
    return ok(res, result);
  }

  async leaderboard(req, res) {
    const range = req.query.range === "week" ? "week" : "all";
    const result = await pointUsecase.leaderboard({ authUser: req.auth, range });
    return ok(res, result);
  }

  async award(req, res) {
    const point = await pointUsecase.award({ ...req.body, authUser: req.auth });
    return created(
      res,
      point,
      pointMessagesCodes.POINTS_GRANTED,
      messagesNames.pointMessages,
    );
  }
}

export const pointController = new PointController();
export { PointController };
