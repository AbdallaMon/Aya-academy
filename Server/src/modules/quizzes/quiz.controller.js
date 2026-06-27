import { generalMessagesCodes } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { idParam, optionalIntQuery, authUser } from "../../shared/http/params.js";
import { badRequest } from "../../shared/errors/AppError.js";
import { quizUsecase } from "./quiz.usecase.js";

function tokenParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || raw.length === 0) throw badRequest();
  return raw;
}

class QuizController {
  // ── categories ──────────────────────────────────────────
  listCategories = async (_req, res) => {
    const result = await quizUsecase.listCategories();
    return ok(res, result);
  };

  createCategory = async (req, res) => {
    const result = await quizUsecase.createCategory(authUser(req), req.body);
    return created(res, result, generalMessagesCodes.CREATED);
  };

  updateCategory = async (req, res) => {
    const result = await quizUsecase.updateCategory(
      idParam(req.params.id),
      req.body,
    );
    return ok(res, result, generalMessagesCodes.UPDATED);
  };

  removeCategory = async (req, res) => {
    const result = await quizUsecase.removeCategory(idParam(req.params.id));
    return ok(res, result, generalMessagesCodes.DELETED);
  };

  // ── bank ────────────────────────────────────────────────
  listBank = async (req, res) => {
    const result = await quizUsecase.listBank({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      categoryId: optionalIntQuery(req.query.categoryId),
      isActive: req.query.isActive,
    });
    return ok(res, result);
  };

  createBankQuestion = async (req, res) => {
    const result = await quizUsecase.createBankQuestion(authUser(req), req.body);
    return created(res, result, generalMessagesCodes.CREATED);
  };

  getBankQuestion = async (req, res) => {
    const result = await quizUsecase.getBankQuestion(idParam(req.params.id));
    return ok(res, result);
  };

  updateBankQuestion = async (req, res) => {
    const result = await quizUsecase.updateBankQuestion(
      idParam(req.params.id),
      req.body,
    );
    return ok(res, result, generalMessagesCodes.UPDATED);
  };

  removeBankQuestion = async (req, res) => {
    const result = await quizUsecase.removeBankQuestion(idParam(req.params.id));
    return ok(res, result, generalMessagesCodes.DELETED);
  };

  // ── invites ─────────────────────────────────────────────
  createInvite = async (req, res) => {
    const result = await quizUsecase.createInvite(authUser(req), req.body);
    return created(res, result, generalMessagesCodes.CREATED);
  };

  listInvites = async (req, res) => {
    const result = await quizUsecase.listInvites(authUser(req), {
      page: req.query.page,
      limit: req.query.limit,
    });
    return ok(res, result);
  };

  getInviteByToken = async (req, res) => {
    const result = await quizUsecase.getInviteByToken(
      authUser(req),
      tokenParam(req.params.token),
    );
    return ok(res, result);
  };

  buildQuiz = async (req, res) => {
    const result = await quizUsecase.buildQuiz(
      authUser(req),
      tokenParam(req.params.token),
      req.body,
    );
    return created(res, result, generalMessagesCodes.CREATED);
  };

  // ── quizzes ─────────────────────────────────────────────
  listQuizzes = async (req, res) => {
    const result = await quizUsecase.listQuizzes(authUser(req), {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status,
      studentId: optionalIntQuery(req.query.studentId),
    });
    return ok(res, result);
  };

  getQuiz = async (req, res) => {
    const result = await quizUsecase.getQuizById(
      authUser(req),
      idParam(req.params.id),
    );
    return ok(res, result);
  };

  // ── attempts ────────────────────────────────────────────
  attempt = async (req, res) => {
    const result = await quizUsecase.attempt(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return created(res, result, generalMessagesCodes.CREATED);
  };
}

export const quizController = new QuizController();
