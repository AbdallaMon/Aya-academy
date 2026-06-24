import { ok } from "../../shared/http/response.js";
import { generalMessagesCodes } from "@aya/shared";
import { badRequest } from "../../shared/errors/AppError.js";
import { quranUsecase } from "./quran.usecase.js";

function authUser(req) {
  return req.auth;
}

function idParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

class QuranController {
  listSurahs = async (_req, res) => {
    return ok(res, await quranUsecase.listSurahs());
  };

  listJuz = async (_req, res) => {
    return ok(res, await quranUsecase.listJuz());
  };

  getProgress = async (req, res) => {
    const data = await quranUsecase.getProgress(authUser(req), idParam(req.params.studentId));
    return ok(res, data);
  };

  setJuzProgress = async (req, res) => {
    const data = await quranUsecase.setJuzProgress(
      authUser(req),
      idParam(req.params.studentId),
      idParam(req.params.juzId),
      req.body.items,
    );
    return ok(res, data, generalMessagesCodes.UPDATED);
  };
}

export const quranController = new QuranController();
