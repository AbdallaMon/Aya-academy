import { Router } from "express";
import { QURAN_PERMISSIONS } from "@aya/shared";
import { quranController } from "./quran.controller.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { QuranValidation } from "./quran.validation.js";

const quranRoutes = Router();

quranRoutes.use(authMiddleware.requireAuth);

quranRoutes.get(
  "/surahs",
  authMiddleware.requirePermissions([QURAN_PERMISSIONS.READ]),
  asyncHandler(quranController.listSurahs),
);

quranRoutes.get(
  "/juz",
  authMiddleware.requirePermissions([QURAN_PERMISSIONS.READ]),
  asyncHandler(quranController.listJuz),
);

quranRoutes.get(
  "/progress/:studentId",
  authMiddleware.requirePermissions([QURAN_PERMISSIONS.PROGRESS_VIEW]),
  asyncHandler(quranController.getProgress),
);

quranRoutes.put(
  "/progress/:studentId/juz/:juzId",
  authMiddleware.requirePermissions([QURAN_PERMISSIONS.PROGRESS_MANAGE]),
  validate(QuranValidation.setJuzProgressSchema),
  asyncHandler(quranController.setJuzProgress),
);

export default quranRoutes;
