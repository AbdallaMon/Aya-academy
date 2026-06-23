import { Router } from "express";
import { USER_PERMISSIONS } from "@aya/shared";
import { userController } from "./user.controller.js";
import { UserValidation } from "./user.validation.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authMiddleware } from "../../shared/middlewares/auth.middleware.js";

const userRoutes = Router();

userRoutes.use(authMiddleware.requireAuth);

userRoutes.get(
  "/",
  authMiddleware.requirePermissions([USER_PERMISSIONS.LIST]),
  asyncHandler(userController.list),
);

userRoutes.get("/my-students", asyncHandler(userController.myStudents));

userRoutes.post(
  "/",
  authMiddleware.requirePermissions([USER_PERMISSIONS.CREATE]),
  validate(UserValidation.createUserSchema),
  asyncHandler(userController.create),
);

userRoutes.post(
  "/students",
  authMiddleware.requirePermissions([USER_PERMISSIONS.CREATE]),
  validate(UserValidation.createStudentSchema),
  asyncHandler(userController.createStudent),
);

userRoutes.get(
  "/:id/children",
  authMiddleware.requirePermissions([USER_PERMISSIONS.VIEW]),
  asyncHandler(userController.children),
);

userRoutes.get(
  "/:id/overview",
  authMiddleware.requirePermissions([USER_PERMISSIONS.VIEW]),
  asyncHandler(userController.overview),
);

userRoutes.get(
  "/:id",
  authMiddleware.requirePermissions([USER_PERMISSIONS.VIEW]),
  asyncHandler(userController.getOne),
);

userRoutes.patch(
  "/:id/level",
  authMiddleware.requirePermissions([USER_PERMISSIONS.SET_LEVEL]),
  validate(UserValidation.setLevelSchema),
  asyncHandler(userController.setLevel),
);

userRoutes.post(
  "/:id/ban",
  authMiddleware.requirePermissions([USER_PERMISSIONS.BAN]),
  validate(UserValidation.banSchema),
  asyncHandler(userController.ban),
);

userRoutes.post(
  "/:id/unban",
  authMiddleware.requirePermissions([USER_PERMISSIONS.BAN]),
  asyncHandler(userController.unban),
);

userRoutes.put(
  "/:id",
  authMiddleware.requirePermissions([USER_PERMISSIONS.EDIT]),
  validate(UserValidation.updateUserSchema),
  asyncHandler(userController.update),
);

userRoutes.delete(
  "/:id",
  authMiddleware.requirePermissions([USER_PERMISSIONS.DELETE]),
  asyncHandler(userController.remove),
);

userRoutes.post(
  "/:studentId/parents/:parentId",
  authMiddleware.requirePermissions([USER_PERMISSIONS.EDIT]),
  validate(UserValidation.linkSchema),
  asyncHandler(userController.link),
);

userRoutes.delete(
  "/:studentId/parents/:parentId",
  authMiddleware.requirePermissions([USER_PERMISSIONS.EDIT]),
  asyncHandler(userController.unlink),
);

export default userRoutes;
