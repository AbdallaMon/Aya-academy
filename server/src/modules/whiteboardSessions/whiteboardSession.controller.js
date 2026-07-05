import { messagesNames, whiteboardMessagesCodes } from "@aya/shared";
import { created, deleted, ok } from "../../shared/http/response.js";
import { idParam } from "../../shared/http/params.js";
import { whiteboardSessionUsecase } from "./whiteboardSession.usecase.js";

const TK = messagesNames.whiteboardMessages;

class WhiteboardSessionController {
  // ── public (no auth) ────────────────────────────────────
  async getPublic(req, res) {
    const session = await whiteboardSessionUsecase.getPublicByToken({
      token: req.params.token,
    });
    return ok(res, session);
  }

  // ── authenticated (admin) ───────────────────────────────
  async list(req, res) {
    const { page, limit, ...filters } = req.query;
    const result = await whiteboardSessionUsecase.list({
      page,
      limit,
      filters,
      authUser: req.auth,
    });
    return ok(res, result);
  }

  async getOne(req, res) {
    const session = await whiteboardSessionUsecase.getById({
      id: idParam(req.params.id),
    });
    return ok(res, session);
  }

  async create(req, res) {
    const session = await whiteboardSessionUsecase.create({
      title: req.body.title,
      authUser: req.auth,
    });
    return created(res, session, whiteboardMessagesCodes.SESSION_CREATED, TK);
  }

  async activate(req, res) {
    const session = await whiteboardSessionUsecase.activate({
      id: idParam(req.params.id),
    });
    return ok(res, session, whiteboardMessagesCodes.SESSION_ACTIVATED, TK);
  }

  async end(req, res) {
    const session = await whiteboardSessionUsecase.end({
      id: idParam(req.params.id),
    });
    return ok(res, session, whiteboardMessagesCodes.SESSION_ENDED, TK);
  }

  async makePublic(req, res) {
    const result = await whiteboardSessionUsecase.makePublic({
      id: idParam(req.params.id),
      locale: req.auth.locale || "ar",
    });
    return ok(res, result, whiteboardMessagesCodes.SESSION_MADE_PUBLIC, TK);
  }

  async makePrivate(req, res) {
    const session = await whiteboardSessionUsecase.makePrivate({
      id: idParam(req.params.id),
    });
    return ok(res, session, whiteboardMessagesCodes.SESSION_MADE_PRIVATE, TK);
  }

  async remove(req, res) {
    await whiteboardSessionUsecase.remove({ id: idParam(req.params.id) });
    return deleted(res, whiteboardMessagesCodes.SESSION_DELETED, TK);
  }

  async addStudent(req, res) {
    const session = await whiteboardSessionUsecase.addStudent({
      id: idParam(req.params.id),
      studentId: req.body.studentId,
    });
    return ok(res, session, whiteboardMessagesCodes.STUDENT_ADDED, TK);
  }

  async removeStudent(req, res) {
    const session = await whiteboardSessionUsecase.removeStudent({
      id: idParam(req.params.id),
      studentId: idParam(req.params.studentId),
    });
    return ok(res, session, whiteboardMessagesCodes.STUDENT_REMOVED, TK);
  }
}

export const whiteboardSessionController = new WhiteboardSessionController();
export { WhiteboardSessionController };
