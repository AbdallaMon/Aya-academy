import { Router } from "express";
import { ATTACHMENT_PERMISSIONS } from "@aya/shared";
import { attachmentController } from "./attachment.controller.js";
import { AttachmentValidation } from "./attachment.validation.js";
import { uploadImageFile } from "./attachment.upload.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const attachmentRoutes = Router();

attachmentRoutes.use(authMiddleware.requireAuth);

// Upload a single image (multipart field "file"). multer runs first so that
// req.file and the text body (ownerType) are populated before validation.
attachmentRoutes.post(
  "/",
  authMiddleware.requirePermissions([ATTACHMENT_PERMISSIONS.UPLOAD]),
  uploadImageFile,
  validate(AttachmentValidation.uploadSchema),
  asyncHandler(attachmentController.upload),
);

export default attachmentRoutes;
