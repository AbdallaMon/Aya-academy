import {
  getPermissionsForRole,
  messagesNames,
  PERMISSIONS,
  whiteboardMessagesCodes,
} from "@aya/shared";
import { created, deleted, ok } from "../../../shared/http/response.js";
import { idParam } from "../../../shared/http/params.js";
import { AUTH_COOKIE, JwtService } from "../../../infra/security/jwt.js";
import { getAuthUserById } from "../../../infra/auth/authUser.repo.js";
import { whiteboardSessionUsecase } from "./whiteboardSession.usecase.js";

const TK = messagesNames.whiteboardMessages;

// Optional auth for the public-mounted image serve route: resolve the caller
// from the access cookie/bearer WITHOUT rejecting anonymous requests, and report
// whether they may manage whiteboards (admin). Never throws.
async function resolveIsAdmin(req) {
  try {
    const cookieToken = req.cookies?.[AUTH_COOKIE];
    const header = req.headers.authorization ?? "";
    const token =
      cookieToken || (header.startsWith("Bearer ") ? header.slice(7) : null);
    if (!token) return false;
    const payload = JwtService.verifyAccess(token);
    const user = await getAuthUserById(payload.id);
    if (!user || !user.isActive) return false;
    return getPermissionsForRole(user.role).includes(
      PERMISSIONS.WHITEBOARD.MANAGE,
    );
  } catch {
    return false;
  }
}

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

  async getLibrary(req, res) {
    const data = await whiteboardSessionUsecase.getLibrary({
      authUser: req.auth,
    });
    return ok(res, data, whiteboardMessagesCodes.LIBRARY_LOADED, TK);
  }

  async saveLibrary(req, res) {
    const data = await whiteboardSessionUsecase.saveLibrary({
      authUser: req.auth,
      libraryItems: req.body.libraryItems,
    });
    return ok(res, data, whiteboardMessagesCodes.LIBRARY_SAVED, TK);
  }

  async create(req, res) {
    const session = await whiteboardSessionUsecase.create({
      title: req.body.title,
      studentIds: req.body.studentIds,
      isPublic: req.body.isPublic,
      locale: req.auth.locale || "en",
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
      locale: req.auth.locale || "en",
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

  // ── board images ────────────────────────────────────────
  async uploadImage(req, res) {
    const isAdmin = await resolveIsAdmin(req);
    // Prefer the token from a header (kept out of URLs/logs); fall back to the
    // query param for any legacy caller.
    const headerToken = req.headers["x-whiteboard-token"];
    const token =
      (typeof headerToken === "string" && headerToken) ||
      (typeof req.query.token === "string" ? req.query.token : null);
    const result = await whiteboardSessionUsecase.uploadImage({
      id: idParam(req.params.id),
      file: req.file,
      isAdmin,
      token,
    });
    return created(res, result);
  }

  // ── board data persistence ──────────────────────────────
  // Save the full drawing scene — called silently by the client on every
  // debounced change batch. The caller is always an authenticated admin.
  async saveBoardData(req, res) {
    const isAdmin = await resolveIsAdmin(req);
    const headerToken = req.headers["x-whiteboard-token"];
    const token =
      typeof headerToken === "string" && headerToken ? headerToken : null;
    const result = await whiteboardSessionUsecase.saveBoardData({
      id: idParam(req.params.id),
      boardData: req.body.boardData,
      token,
      isAdmin,
    });
    return ok(res, result, whiteboardMessagesCodes.BOARD_DATA_SAVED, TK);
  }

  // Load the saved drawing scene so the board can restore its state on open.
  // Admin access (cookie) OR public access with a valid token header.
  async getBoardData(req, res) {
    const isAdmin = await resolveIsAdmin(req);
    const headerToken = req.headers["x-whiteboard-token"];
    const token =
      typeof headerToken === "string" && headerToken ? headerToken : null;
    const data = await whiteboardSessionUsecase.getBoardData({
      id: idParam(req.params.id),
      token,
      isAdmin,
    });
    return ok(res, data);
  }

  // PUBLIC-mounted: admin (cookie) OR a valid public-session token may view.
  async serveImage(req, res) {
    const isAdmin = await resolveIsAdmin(req);
    // Prefer the token from a header (kept out of URLs/logs); fall back to the
    // query param for any legacy caller.
    const headerToken = req.headers["x-whiteboard-token"];
    const token =
      (typeof headerToken === "string" && headerToken) ||
      (typeof req.query.token === "string" ? req.query.token : null);
    const { absolutePath, mimeType } =
      await whiteboardSessionUsecase.serveImage({
        sessionId: idParam(req.params.sessionId),
        imageId: idParam(req.params.imageId),
        token,
        isAdmin,
      });
    if (mimeType) res.type(mimeType);
    // Defense-in-depth: never let the browser sniff a stored file into an
    // executable type (raster mimes are enforced at upload; SVG is disallowed).
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, max-age=86400");
    return res.sendFile(absolutePath);
  }
  async verifyAccessViaToken(req, res) {
    const isAdmin = await resolveIsAdmin(req);
    const headerToken = req.headers["x-whiteboard-token"];
    const token =
      typeof headerToken === "string" && headerToken ? headerToken : null;
    const session = await whiteboardSessionUsecase.getPublicByToken({
      token: token,
    });
    return ok(res, session);
  }
}
export const whiteboardSessionController = new WhiteboardSessionController();
export { WhiteboardSessionController };
