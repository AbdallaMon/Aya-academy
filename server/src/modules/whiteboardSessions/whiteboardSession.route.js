import { Router } from "express";
import { PERMISSIONS } from "@aya/shared";
import { whiteboardSessionController } from "./whiteboardSession.controller.js";
import { WhiteboardSessionValidation } from "./whiteboardSession.validation.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { uploadWhiteboardImage } from "./whiteboardImage.storage.js";

const whiteboardSessionRoutes = Router();

// PUBLIC — token viewer. Declared before the authenticated routes; "/public/:token"
// can never collide with "/:id" because "public" is a fixed segment.
whiteboardSessionRoutes.get(
  "/public/:token",
  asyncHandler(whiteboardSessionController.getPublic),
);

// PUBLIC-mounted image serve — access is enforced inside the handler (image must
// be linked to the session AND caller is admin OR holds a valid public token).
whiteboardSessionRoutes.get(
  "/:sessionId/images/:imageId/raw",
  asyncHandler(whiteboardSessionController.serveImage),
);

const requireManage = [
  authMiddleware.requireAuth,
  authMiddleware.requirePermissions([PERMISSIONS.WHITEBOARD.MANAGE]),
];

whiteboardSessionRoutes.get(
  "/",
  ...requireManage,
  asyncHandler(whiteboardSessionController.list),
);
whiteboardSessionRoutes.post(
  "/",
  ...requireManage,
  validate(WhiteboardSessionValidation.createSchema),
  asyncHandler(whiteboardSessionController.create),
);
whiteboardSessionRoutes.get(
  "/:id",
  ...requireManage,
  asyncHandler(whiteboardSessionController.getOne),
);
whiteboardSessionRoutes.delete(
  "/:id",
  ...requireManage,
  asyncHandler(whiteboardSessionController.remove),
);

whiteboardSessionRoutes.post(
  "/:id/actions/activate",
  ...requireManage,
  asyncHandler(whiteboardSessionController.activate),
);
whiteboardSessionRoutes.post(
  "/:id/actions/end",
  ...requireManage,
  asyncHandler(whiteboardSessionController.end),
);
whiteboardSessionRoutes.post(
  "/:id/actions/make-public",
  ...requireManage,
  asyncHandler(whiteboardSessionController.makePublic),
);
whiteboardSessionRoutes.post(
  "/:id/actions/make-private",
  ...requireManage,
  asyncHandler(whiteboardSessionController.makePrivate),
);

whiteboardSessionRoutes.post(
  "/:id/students",
  ...requireManage,
  validate(WhiteboardSessionValidation.addStudentSchema),
  asyncHandler(whiteboardSessionController.addStudent),
);
whiteboardSessionRoutes.delete(
  "/:id/students/:studentId",
  ...requireManage,
  asyncHandler(whiteboardSessionController.removeStudent),
);

// Upload a board image (multipart "file"). Stored on disk + linked to the session.
whiteboardSessionRoutes.post(
  "/:id/images",
  ...requireManage,
  uploadWhiteboardImage,
  asyncHandler(whiteboardSessionController.uploadImage),
);

export default whiteboardSessionRoutes;
