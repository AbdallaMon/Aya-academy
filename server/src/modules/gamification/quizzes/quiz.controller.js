import { generalMessagesCodes } from "@aya/shared";
import { created, ok } from "../../../shared/http/response.js";
import { idParam, optionalIntQuery } from "../../../shared/http/params.js";
import { badRequest } from "../../../shared/errors/AppError.js";
import { quizUsecase } from "./quiz.usecase.js";

function tokenParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || raw.length === 0) throw badRequest();
  return raw;
}

class QuizController {
  // ── categories ──────────────────────────────────────────
  async listCategories(_req, res) {
    const result = await quizUsecase.listCategories();
    return ok(res, result);
  }

  async createCategory(req, res) {
    const result = await quizUsecase.createCategory({
      ...req.body,
      authUser: req.auth,
    });
    return created(res, result, generalMessagesCodes.CREATED);
  }

  async updateCategory(req, res) {
    const result = await quizUsecase.updateCategory({
      ...req.body,
      id: idParam(req.params.id),
    });
    return ok(res, result, generalMessagesCodes.UPDATED);
  }

  async removeCategory(req, res) {
    const result = await quizUsecase.removeCategory({
      id: idParam(req.params.id),
    });
    return ok(res, result, generalMessagesCodes.DELETED);
  }

  // ── bank ────────────────────────────────────────────────
  async listBank(req, res) {
    const { page, limit, categoryId, ...filters } = req.query;
    const result = await quizUsecase.listBank({
      page,
      limit,
      filters: {
        ...filters,
        categoryId: optionalIntQuery(categoryId),
      },
    });
    return ok(res, result);
  }

  async createBankQuestion(req, res) {
    const result = await quizUsecase.createBankQuestion({
      ...req.body,
      authUser: req.auth,
    });
    return created(res, result, generalMessagesCodes.CREATED);
  }

  async getBankQuestion(req, res) {
    const result = await quizUsecase.getBankQuestion({
      id: idParam(req.params.id),
    });
    return ok(res, result);
  }

  async updateBankQuestion(req, res) {
    const result = await quizUsecase.updateBankQuestion({
      ...req.body,
      id: idParam(req.params.id),
    });
    return ok(res, result, generalMessagesCodes.UPDATED);
  }

  async removeBankQuestion(req, res) {
    const result = await quizUsecase.removeBankQuestion({
      id: idParam(req.params.id),
    });
    return ok(res, result, generalMessagesCodes.DELETED);
  }

  // ── invites ─────────────────────────────────────────────
  async createInvite(req, res) {
    const result = await quizUsecase.createInvite({
      ...req.body,
      authUser: req.auth,
    });
    return created(res, result, generalMessagesCodes.CREATED);
  }

  async listInvites(req, res) {
    const { page, limit } = req.query;
    const result = await quizUsecase.listInvites({
      page,
      limit,
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async getInviteByToken(req, res) {
    const result = await quizUsecase.getInviteByToken({
      authUser: req.auth,
      token: tokenParam(req.params.token),
    });
    return ok(res, result);
  }

  async buildQuiz(req, res) {
    const result = await quizUsecase.buildQuiz({
      ...req.body,
      token: tokenParam(req.params.token),
      authUser: req.auth,
    });
    return created(res, result, generalMessagesCodes.CREATED);
  }

  // ── quizzes ─────────────────────────────────────────────
  async listQuizzes(req, res) {
    const { page, limit, studentId, ...filters } = req.query;
    const result = await quizUsecase.listQuizzes({
      page,
      limit,
      filters: {
        ...filters,
        studentId: optionalIntQuery(studentId),
      },
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async getQuiz(req, res) {
    const result = await quizUsecase.getQuizById({
      authUser: req.auth,
      id: idParam(req.params.id),
    });
    return ok(res, result);
  }

  // ── attempts ────────────────────────────────────────────
  async attempt(req, res) {
    const result = await quizUsecase.attempt({
      ...req.body,
      quizId: idParam(req.params.id),
      authUser: req.auth,
    });
    return created(res, result, generalMessagesCodes.CREATED);
  }
}

export const quizController = new QuizController();
export { QuizController };
