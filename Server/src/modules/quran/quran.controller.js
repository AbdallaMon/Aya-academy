import { ok } from "../../shared/http/response.js";
import { quranUsecase } from "./quran.usecase.js";

class QuranController {
  listSurahs = async (_req, res) => {
    return ok(res, await quranUsecase.listSurahs());
  };

  listJuz = async (_req, res) => {
    return ok(res, await quranUsecase.listJuz());
  };
}

export const quranController = new QuranController();
