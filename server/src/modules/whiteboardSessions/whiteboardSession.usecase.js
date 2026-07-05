import crypto from "node:crypto";
import { prisma } from "@aya/db/prisma.client.js";
import {
  USER_ROLES,
  WHITEBOARD_SESSION_STATUSES,
  WHITEBOARD_VISIBILITIES,
} from "@aya/shared";
import { badRequest, conflict, notFound } from "../../shared/errors/AppError.js";
import { buildSearchQuery } from "../../shared/utility/helper.js";
import { ENV } from "../../config/env.js";
import { userRepo } from "../users/user.repo.js";
import { whiteboardSessionRepo } from "./whiteboardSession.repo.js";
import { toPublicSession } from "./whiteboardSession.dto.js";
import { whiteboardMessagesCodes } from "./whiteboardSession.messages.js";

// Raw token shown once to the admin; only its SHA-256 hash is stored.
function generateShareToken() {
  return crypto.randomBytes(24).toString("hex"); // 48 hex chars, unguessable
}
function hashShareToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

class WhiteboardSessionUsecase {
  buildListWhere(authUser, { search } = {}) {
    const where = {};
    // ADMIN scope: for now admins manage every session. (Scope hook kept here so
    // a future "own sessions only" rule slots in cleanly.)
    const or = buildSearchQuery({
      search: typeof search === "string" ? search : undefined,
      keys: ["title"],
    });
    if (or) where.OR = or;
    return where;
  }

  async list({ page, limit, filters = {}, authUser }) {
    const where = this.buildListWhere(authUser, filters);
    return whiteboardSessionRepo.list({ where, page, limit });
  }

  async getById({ id }) {
    const session = await whiteboardSessionRepo.getByIdWithStudents({ id });
    if (!session) throw notFound(whiteboardMessagesCodes.SESSION_NOT_FOUND);
    return session;
  }

  // Create a session that is READY TO USE: it opens (ACTIVE) immediately, with
  // the chosen students attached and optionally made public in one step.
  async create({ title, studentIds = [], isPublic = false, locale = "ar", authUser }) {
    const clean = typeof title === "string" ? title.trim() : "";
    if (!clean) throw badRequest(whiteboardMessagesCodes.TITLE_REQUIRED);

    const ids = [...new Set((studentIds || []).filter((n) => Number.isInteger(n) && n > 0))];
    // Validate every chosen account is really a STUDENT before we write anything.
    for (const studentId of ids) {
      const role = await userRepo.getRoleById(studentId);
      if (!role || role.role !== USER_ROLES.STUDENT) {
        throw badRequest(whiteboardMessagesCodes.NOT_A_STUDENT);
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const session = await whiteboardSessionRepo.create({
        title: clean,
        createdById: authUser.id,
        client: tx,
      });
      await Promise.all(
        ids.map((studentId) =>
          whiteboardSessionRepo.addStudent({ sessionId: session.id, studentId, client: tx }),
        ),
      );
      // Opens immediately — the teacher can start the board right away.
      await whiteboardSessionRepo.updateStatus({
        id: session.id,
        status: WHITEBOARD_SESSION_STATUSES.ACTIVE,
        client: tx,
      });
      return session.id;
    });

    let publicUrl = null;
    if (isPublic) {
      const result = await this.makePublic({ id: created, locale });
      publicUrl = result.url;
    }

    const detail = await whiteboardSessionRepo.getByIdWithStudents({ id: created });
    return { ...detail, publicUrl };
  }

  async activate({ id }) {
    await this.#assertExists(id);
    return whiteboardSessionRepo.updateStatus({
      id,
      status: WHITEBOARD_SESSION_STATUSES.ACTIVE,
    });
  }

  async end({ id }) {
    await this.#assertExists(id);
    return whiteboardSessionRepo.updateStatus({
      id,
      status: WHITEBOARD_SESSION_STATUSES.ENDED,
    });
  }

  async makePublic({ id, locale = "ar" }) {
    await this.#assertExists(id);
    const token = generateShareToken();
    const session = await whiteboardSessionRepo.setPublic({
      id,
      tokenHash: hashShareToken(token),
    });
    const url = `${ENV.appUrl}/${locale}/w/${token}`;
    return { session, token, url };
  }

  async makePrivate({ id }) {
    await this.#assertExists(id);
    return whiteboardSessionRepo.setPrivate({ id });
  }

  async remove({ id }) {
    await this.#assertExists(id);
    await whiteboardSessionRepo.remove({ id });
    return { id };
  }

  async addStudent({ id, studentId }) {
    await this.#assertExists(id);
    const role = await userRepo.getRoleById(studentId);
    if (!role || role.role !== USER_ROLES.STUDENT) {
      throw badRequest(whiteboardMessagesCodes.NOT_A_STUDENT);
    }
    const existing = await whiteboardSessionRepo.findStudentLink({
      sessionId: id,
      studentId,
    });
    if (existing) throw conflict(whiteboardMessagesCodes.STUDENT_ALREADY_ADDED);
    await whiteboardSessionRepo.addStudent({ sessionId: id, studentId });
    return whiteboardSessionRepo.getByIdWithStudents({ id });
  }

  async removeStudent({ id, studentId }) {
    await this.#assertExists(id);
    const result = await whiteboardSessionRepo.removeStudent({
      sessionId: id,
      studentId,
    });
    if (!result || result.count === 0) {
      throw notFound(whiteboardMessagesCodes.STUDENT_NOT_IN_SESSION);
    }
    return whiteboardSessionRepo.getByIdWithStudents({ id });
  }

  // Public token viewer — returns a minimal payload ONLY for PUBLIC sessions.
  async getPublicByToken({ token }) {
    if (!token || typeof token !== "string") {
      throw notFound(whiteboardMessagesCodes.SESSION_NOT_FOUND);
    }
    const session = await whiteboardSessionRepo.getByTokenHash({
      tokenHash: hashShareToken(token),
    });
    if (!session || session.visibility !== WHITEBOARD_VISIBILITIES.PUBLIC) {
      throw notFound(whiteboardMessagesCodes.SESSION_NOT_FOUND);
    }
    return toPublicSession(session);
  }

  async #assertExists(id) {
    const session = await whiteboardSessionRepo.getById({ id });
    if (!session) throw notFound(whiteboardMessagesCodes.SESSION_NOT_FOUND);
    return session;
  }
}

export const whiteboardSessionUsecase = new WhiteboardSessionUsecase();
export { WhiteboardSessionUsecase };
