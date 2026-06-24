import { Router } from "express";
import { QURAN_PERMISSIONS } from "@aya/shared";
import { quranController } from "./quran.controller.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

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

export default quranRoutes;
