import { gameMessagesCodes, messagesNames } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { idParam } from "../../shared/http/params.js";
import { gameUsecase } from "./game.usecase.js";

const TK = messagesNames.gameMessages;

class GameController {
  // ── public (no auth) ────────────────────────────────────
  listPublic = async (_req, res) => {
    const result = await gameUsecase.listPublic();
    return ok(res, result);
  };

  getPublicBySlug = async (req, res) => {
    const game = await gameUsecase.getPublicBySlug(req.params.slug);
    return ok(res, game);
  };

  getPublicFree = async (_req, res) => {
    const game = await gameUsecase.getPublicFree();
    return ok(res, game);
  };

  // ── authenticated ───────────────────────────────────────
  list = async (req, res) => {
    const result = await gameUsecase.list(req.auth, {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      isActive: req.query.isActive,
      isPublic: req.query.isPublic,
      type: req.query.type,
    });
    return ok(res, result);
  };

  getOne = async (req, res) => {
    const game = await gameUsecase.getById(req.auth, idParam(req.params.id));
    return ok(res, game);
  };

  getBySlug = async (req, res) => {
    const game = await gameUsecase.getBySlugAuth(req.auth, req.params.slug);
    return ok(res, game);
  };

  setFree = async (req, res) => {
    const game = await gameUsecase.setFree(req.auth, idParam(req.params.id));
    return ok(res, game, gameMessagesCodes.FREE_GAME_UPDATED, TK);
  };

  setBadge = async (req, res) => {
    const badgeId = req.body.badgeId ?? null;
    const game = await gameUsecase.setBadge(
      req.auth,
      idParam(req.params.id),
      badgeId,
    );
    const code =
      badgeId == null
        ? gameMessagesCodes.GAME_BADGE_UNLINKED
        : gameMessagesCodes.GAME_BADGE_LINKED;
    return ok(res, game, code, TK);
  };

  assign = async (req, res) => {
    const result = await gameUsecase.assign(
      req.auth,
      idParam(req.params.id),
      req.body,
    );
    return created(res, result);
  };

  myAssignments = async (req, res) => {
    const result = await gameUsecase.myAssignments(req.auth);
    return ok(res, result);
  };

  studentAssignments = async (req, res) => {
    const result = await gameUsecase.studentAssignments(
      req.auth,
      idParam(req.params.studentId),
    );
    return ok(res, result);
  };

  myFreeGame = async (_req, res) => {
    const result = await gameUsecase.getMyFreeGame();
    return ok(res, result);
  };

  listAssignments = async (req, res) => {
    const result = await gameUsecase.listAssignments(
      req.auth,
      idParam(req.params.id),
    );
    return ok(res, result);
  };

  unassign = async (req, res) => {
    const result = await gameUsecase.unassign(
      req.auth,
      idParam(req.params.id),
      idParam(req.params.studentId),
    );
    return ok(res, result);
  };

  attempt = async (req, res) => {
    const result = await gameUsecase.attempt(
      req.auth,
      idParam(req.params.id),
      req.body,
    );
    return created(res, result);
  };

  listAttempts = async (req, res) => {
    const result = await gameUsecase.listAttempts(
      req.auth,
      idParam(req.params.id),
      { page: req.query.page, limit: req.query.limit },
    );
    return ok(res, result);
  };
}

export const gameController = new GameController();
