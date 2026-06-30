import { gameMessagesCodes, messagesNames } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { idParam } from "../../shared/http/params.js";
import { gameUsecase } from "./game.usecase.js";

const TK = messagesNames.gameMessages;

class GameController {
  // ── public (no auth) ────────────────────────────────────
  async listPublic(req, res) {
    const result = await gameUsecase.listPublic();
    return ok(res, result);
  }

  async getPublicBySlug(req, res) {
    const game = await gameUsecase.getPublicBySlug({ slug: req.params.slug });
    return ok(res, game);
  }

  async getPublicFree(req, res) {
    const game = await gameUsecase.getPublicFree();
    return ok(res, game);
  }

  // ── authenticated ───────────────────────────────────────
  async list(req, res) {
    const { page, limit, ...filters } = req.query;
    const result = await gameUsecase.list({
      page,
      limit,
      filters,
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async getOne(req, res) {
    const game = await gameUsecase.getById({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, game);
  }

  async getBySlug(req, res) {
    const game = await gameUsecase.getBySlugAuth({
      slug: req.params.slug,
      authUser: req.auth,
    });
    return ok(res, game);
  }

  async setFree(req, res) {
    const game = await gameUsecase.setFree({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, game, gameMessagesCodes.FREE_GAME_UPDATED, TK);
  }

  async setBadge(req, res) {
    const badgeId = req.body.badgeId ?? null;
    const game = await gameUsecase.setBadge({
      id: idParam(req.params.id),
      badgeId,
      authUser: req.auth,
    });
    const code =
      badgeId == null
        ? gameMessagesCodes.GAME_BADGE_UNLINKED
        : gameMessagesCodes.GAME_BADGE_LINKED;
    return ok(res, game, code, TK);
  }

  async assign(req, res) {
    const result = await gameUsecase.assign({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return created(res, result);
  }

  async myAssignments(req, res) {
    const result = await gameUsecase.myAssignments({ authUser: req.auth });
    return ok(res, result);
  }

  async studentAssignments(req, res) {
    const result = await gameUsecase.studentAssignments({
      studentId: idParam(req.params.studentId),
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async myFreeGame(req, res) {
    const result = await gameUsecase.getMyFreeGame();
    return ok(res, result);
  }

  async listAssignments(req, res) {
    const result = await gameUsecase.listAssignments({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async unassign(req, res) {
    const result = await gameUsecase.unassign({
      id: idParam(req.params.id),
      studentId: idParam(req.params.studentId),
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async attempt(req, res) {
    const result = await gameUsecase.attempt({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return created(res, result);
  }

  async listAttempts(req, res) {
    const { page, limit } = req.query;
    const result = await gameUsecase.listAttempts({
      id: idParam(req.params.id),
      page,
      limit,
      authUser: req.auth,
    });
    return ok(res, result);
  }
}

export const gameController = new GameController();
export { GameController };
