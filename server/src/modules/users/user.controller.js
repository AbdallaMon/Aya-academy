import {
  attachmentMessagesCodes,
  generalMessagesCodes,
  messagesNames,
  userMessagesCodes,
} from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { idParam } from "../../shared/http/params.js";
import { userUsecase } from "./user.usecase.js";

class UserController {
  async list(req, res) {
    const { page, limit, ...filters } = req.query;
    const result = await userUsecase.list({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      filters,
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async myStudents(req, res) {
    const result = await userUsecase.listMyStudents({ authUser: req.auth });
    return ok(res, result);
  }

  async getOne(req, res) {
    const user = await userUsecase.getById({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, user);
  }

  async children(req, res) {
    const result = await userUsecase.getChildren({
      parentId: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(
      res,
      result,
      userMessagesCodes.USER_CHILDREN_FETCHED,
      messagesNames.userMessages,
    );
  }

  async create(req, res) {
    const user = await userUsecase.create({ ...req.body, authUser: req.auth });
    return created(res, user, generalMessagesCodes.CREATED);
  }

  async createStudent(req, res) {
    const user = await userUsecase.createStudent({
      ...req.body,
      authUser: req.auth,
    });
    return created(res, user, generalMessagesCodes.CREATED);
  }

  async update(req, res) {
    const user = await userUsecase.update({
      ...req.body,
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, user, generalMessagesCodes.UPDATED);
  }

  async remove(req, res) {
    const user = await userUsecase.remove({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, user, generalMessagesCodes.DELETED);
  }

  async link(req, res) {
    const result = await userUsecase.linkParent({
      studentId: idParam(req.params.studentId),
      parentId: idParam(req.params.parentId),
      relation: req.body?.relation,
      authUser: req.auth,
    });
    return ok(res, result, generalMessagesCodes.UPDATED);
  }

  async unlink(req, res) {
    const result = await userUsecase.unlinkParent({
      studentId: idParam(req.params.studentId),
      parentId: idParam(req.params.parentId),
      authUser: req.auth,
    });
    return ok(res, result, generalMessagesCodes.DELETED);
  }

  async overview(req, res) {
    const result = await userUsecase.overview({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async setLevel(req, res) {
    const user = await userUsecase.setLevel({
      id: idParam(req.params.id),
      studentLevel: req.body.studentLevel,
      authUser: req.auth,
    });
    return ok(
      res,
      user,
      userMessagesCodes.LEVEL_UPDATED,
      messagesNames.userMessages,
    );
  }

  async ban(req, res) {
    const user = await userUsecase.ban({
      id: idParam(req.params.id),
      reason: req.body?.reason,
      authUser: req.auth,
    });
    return ok(
      res,
      user,
      userMessagesCodes.USER_BANNED,
      messagesNames.userMessages,
    );
  }

  async unban(req, res) {
    const user = await userUsecase.unban({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(
      res,
      user,
      userMessagesCodes.USER_UNBANNED,
      messagesNames.userMessages,
    );
  }

  async setAvatar(req, res) {
    const user = await userUsecase.setAvatar({
      id: idParam(req.params.id),
      attachmentId: req.body.attachmentId,
      authUser: req.auth,
    });
    return ok(
      res,
      user,
      attachmentMessagesCodes.AVATAR_UPDATED,
      messagesNames.attachmentMessages,
    );
  }

  async removeAvatar(req, res) {
    const user = await userUsecase.removeAvatar({
      id: idParam(req.params.id),
      authUser: req.auth,
    });
    return ok(
      res,
      user,
      attachmentMessagesCodes.AVATAR_UPDATED,
      messagesNames.attachmentMessages,
    );
  }
}

export const userController = new UserController();
export { UserController };
