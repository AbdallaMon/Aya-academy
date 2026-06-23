import { messagesNames } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { badRequest } from "../../shared/errors/AppError.js";
import { pointUsecase } from "./point.usecase.js";
import { pointMessagesCodes } from "./point.messages.js";

function authUser(req) {
  return req.auth;
}

function requiredIntQuery(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

class PointController {
  list = async (req, res) => {
    const result = await pointUsecase.list(authUser(req), {
      studentId: requiredIntQuery(req.query.studentId),
      page: req.query.page,
      limit: req.query.limit,
    });
    return ok(res, result);
  };

  leaderboard = async (req, res) => {
    const range = req.query.range === "week" ? "week" : "all";
    const result = await pointUsecase.leaderboard(authUser(req), { range });
    return ok(res, result);
  };

  award = async (req, res) => {
    const point = await pointUsecase.award(authUser(req), req.body);
    return created(
      res,
      point,
      pointMessagesCodes.POINTS_GRANTED,
      messagesNames.pointMessages,
    );
  };
}

export const pointController = new PointController();
