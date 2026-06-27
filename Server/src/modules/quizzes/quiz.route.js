import { Router } from "express";
import { PERMISSIONS } from "@aya/shared";
import { quizController } from "./quiz.controller.js";
import { QuizValidation } from "./quiz.validation.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const quizRoutes = Router();

quizRoutes.use(authMiddleware.requireAuth);

// ════════════════════════════════════════════════════════════
// CATEGORIES (admin) — declared before "/:id" style bank routes
// ════════════════════════════════════════════════════════════
quizRoutes.get(
  "/categories",
  authMiddleware.requirePermissions([PERMISSIONS.QUIZ.LIST_BANK]),
  asyncHandler(quizController.listCategories),
);

quizRoutes.post(
  "/categories",
  authMiddleware.requirePermissions([PERMISSIONS.QUIZ.CREATE_BANK]),
  validate(QuizValidation.createCategorySchema),
  asyncHandler(quizController.createCategory),
);

quizRoutes.put(
  "/categories/:id",
  authMiddleware.requirePermissions([PERMISSIONS.QUIZ.EDIT_BANK]),
  validate(QuizValidation.updateCategorySchema),
  asyncHandler(quizController.updateCategory),
);

quizRoutes.delete(
  "/categories/:id",
  authMiddleware.requirePermissions([PERMISSIONS.QUIZ.DELETE_BANK]),
  asyncHandler(quizController.removeCategory),
);

// ════════════════════════════════════════════════════════════
// BANK (admin)
// ════════════════════════════════════════════════════════════
quizRoutes.get(
  "/bank",
  authMiddleware.requirePermissions([PERMISSIONS.QUIZ.LIST_BANK]),
  asyncHandler(quizController.listBank),
);

quizRoutes.post(
  "/bank",
  authMiddleware.requirePermissions([PERMISSIONS.QUIZ.CREATE_BANK]),
  validate(QuizValidation.createBankQuestionSchema),
  asyncHandler(quizController.createBankQuestion),
);

quizRoutes.get(
  "/bank/:id",
  authMiddleware.requirePermissions([PERMISSIONS.QUIZ.LIST_BANK]),
  asyncHandler(quizController.getBankQuestion),
);

quizRoutes.put(
  "/bank/:id",
  authMiddleware.requirePermissions([PERMISSIONS.QUIZ.EDIT_BANK]),
  validate(QuizValidation.updateBankQuestionSchema),
  asyncHandler(quizController.updateBankQuestion),
);

quizRoutes.delete(
  "/bank/:id",
  authMiddleware.requirePermissions([PERMISSIONS.QUIZ.DELETE_BANK]),
  asyncHandler(quizController.removeBankQuestion),
);

// ════════════════════════════════════════════════════════════
// INVITES — token routes declared before "/:id" quiz routes
// ════════════════════════════════════════════════════════════
quizRoutes.post(
  "/invites",
  authMiddleware.requirePermissions([PERMISSIONS.QUIZ.CREATE_INVITE]),
  validate(QuizValidation.createInviteSchema),
  asyncHandler(quizController.createInvite),
);

quizRoutes.get(
  "/invites",
  authMiddleware.requirePermissions([PERMISSIONS.QUIZ.LIST]),
  asyncHandler(quizController.listInvites),
);

quizRoutes.get(
  "/invites/:token",
  authMiddleware.requireAnyPermission([
    PERMISSIONS.QUIZ.LIST,
    PERMISSIONS.QUIZ.BUILD,
  ]),
  asyncHandler(quizController.getInviteByToken),
);

quizRoutes.post(
  "/invites/:token/build",
  authMiddleware.requirePermissions([PERMISSIONS.QUIZ.BUILD]),
  validate(QuizValidation.buildQuizSchema),
  asyncHandler(quizController.buildQuiz),
);

// ════════════════════════════════════════════════════════════
// QUIZZES
// ════════════════════════════════════════════════════════════
quizRoutes.get(
  "/",
  // Admin/parent reach the list via QUIZ.LIST; a student reaches *their own*
  // assigned quizzes via QUIZ.VIEW (row-scoping is enforced in the usecase).
  authMiddleware.requireAnyPermission([
    PERMISSIONS.QUIZ.LIST,
    PERMISSIONS.QUIZ.VIEW,
  ]),
  asyncHandler(quizController.listQuizzes),
);

quizRoutes.get(
  "/:id",
  authMiddleware.requirePermissions([PERMISSIONS.QUIZ.VIEW]),
  asyncHandler(quizController.getQuiz),
);

// ════════════════════════════════════════════════════════════
// ATTEMPTS (student)
// ════════════════════════════════════════════════════════════
quizRoutes.post(
  "/:id/attempt",
  authMiddleware.requirePermissions([PERMISSIONS.QUIZ.ATTEMPT]),
  validate(QuizValidation.attemptSchema),
  asyncHandler(quizController.attempt),
);

export default quizRoutes;
