import { Router } from "express";
import { messagesNames, PERMISSIONS } from "@ayah/shared";
import { whiteboardSessionController } from "./whiteboardSession.controller.js";
import { WhiteboardSessionValidation } from "./whiteboardSession.validation.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { uploadWhiteboardImage } from "../../../infra/upload/whiteboardImage.storage.js";

const whiteboardSessionRoutes = Router();

whiteboardSessionRoutes.get(
  "/public/token-verifyAccess",
  asyncHandler(whiteboardSessionController.verifyAccessViaToken),
);

whiteboardSessionRoutes.get(
  "/public/:token",
  asyncHandler(whiteboardSessionController.getPublic),
);
whiteboardSessionRoutes.put(
  "/:id/board-data",
  validate(WhiteboardSessionValidation.saveBoardDataSchema),
  asyncHandler(whiteboardSessionController.saveBoardData),
);

whiteboardSessionRoutes.get(
  "/:sessionId/images/:imageId/raw",
  asyncHandler(whiteboardSessionController.serveImage),
);
// Upload a board image (multipart "file"). Stored on disk + linked to the session.
whiteboardSessionRoutes.post(
  "/:id/images",
  uploadWhiteboardImage,
  asyncHandler(whiteboardSessionController.uploadImage),
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
  "/library",
  ...requireManage,
  asyncHandler(whiteboardSessionController.getLibrary),
);
whiteboardSessionRoutes.put(
  "/library",
  ...requireManage,
  validate(
    WhiteboardSessionValidation.saveLibrarySchema,
    "body",
    messagesNames.whiteboardMessages,
  ),
  asyncHandler(whiteboardSessionController.saveLibrary),
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

// Load the drawing scene — PUBLIC-mounted (admin cookie OR public token header).
// Allows a public board viewer to restore the saved drawing state.
whiteboardSessionRoutes.get(
  "/:id/board-data",
  asyncHandler(whiteboardSessionController.getBoardData),
);

export default whiteboardSessionRoutes;
