import { generalMessagesCodes, messagesNames, userMessagesCodes } from "@aya/shared";
import { created, ok } from "../../shared/http/response.js";
import { badRequest } from "../../shared/errors/AppError.js";
import { userUsecase } from "./user.usecase.js";

function authUser(req) {
  return req.auth;
}

function idParam(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest();
  return n;
}

class UserController {
  list = async (req, res) => {
    const result = await userUsecase.list(authUser(req), {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      role: req.query.role,
      isActive: req.query.isActive,
    });
    return ok(res, result);
  };

  myStudents = async (req, res) => {
    return ok(res, await userUsecase.listMyStudents(authUser(req)));
  };

  getOne = async (req, res) => {
    const user = await userUsecase.getById(authUser(req), idParam(req.params.id));
    return ok(res, user);
  };

  children = async (req, res) => {
    const result = await userUsecase.getChildren(
      authUser(req),
      idParam(req.params.id),
    );
    return ok(
      res,
      result,
      userMessagesCodes.USER_CHILDREN_FETCHED,
      messagesNames.userMessages,
    );
  };

  create = async (req, res) => {
    const user = await userUsecase.create(authUser(req), req.body);
    return created(res, user, generalMessagesCodes.CREATED);
  };

  createStudent = async (req, res) => {
    const user = await userUsecase.createStudent(authUser(req), req.body);
    return created(res, user, generalMessagesCodes.CREATED);
  };

  update = async (req, res) => {
    const user = await userUsecase.update(
      authUser(req),
      idParam(req.params.id),
      req.body,
    );
    return ok(res, user, generalMessagesCodes.UPDATED);
  };

  remove = async (req, res) => {
    const user = await userUsecase.remove(authUser(req), idParam(req.params.id));
    return ok(res, user, generalMessagesCodes.DELETED);
  };

  link = async (req, res) => {
    const result = await userUsecase.linkParent(
      authUser(req),
      idParam(req.params.studentId),
      idParam(req.params.parentId),
      req.body?.relation,
    );
    return ok(res, result, generalMessagesCodes.UPDATED);
  };

  unlink = async (req, res) => {
    const result = await userUsecase.unlinkParent(
      authUser(req),
      idParam(req.params.studentId),
      idParam(req.params.parentId),
    );
    return ok(res, result, generalMessagesCodes.DELETED);
  };

  overview = async (req, res) => {
    const result = await userUsecase.overview(
      authUser(req),
      idParam(req.params.id),
    );
    return ok(res, result);
  };

  setLevel = async (req, res) => {
    const user = await userUsecase.setLevel(
      authUser(req),
      idParam(req.params.id),
      req.body.studentLevel,
    );
    return ok(
      res,
      user,
      userMessagesCodes.LEVEL_UPDATED,
      messagesNames.userMessages,
    );
  };

  ban = async (req, res) => {
    const user = await userUsecase.ban(
      authUser(req),
      idParam(req.params.id),
      req.body?.reason,
    );
    return ok(
      res,
      user,
      userMessagesCodes.USER_BANNED,
      messagesNames.userMessages,
    );
  };

  unban = async (req, res) => {
    const user = await userUsecase.unban(authUser(req), idParam(req.params.id));
    return ok(
      res,
      user,
      userMessagesCodes.USER_UNBANNED,
      messagesNames.userMessages,
    );
  };
}

export const userController = new UserController();
