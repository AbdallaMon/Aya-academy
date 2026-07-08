import crypto from "node:crypto";
import fs from "node:fs";
import { prisma } from "@aya/db/prisma.client.js";
import {
  USER_ROLES,
  WHITEBOARD_SESSION_STATUSES,
  WHITEBOARD_VISIBILITIES,
} from "@aya/shared";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../shared/errors/AppError.js";
import { ENV } from "../../config/env.js";
import { userRepo } from "../users/user.repo.js";
import { whiteboardSessionRepo } from "./whiteboardSession.repo.js";
import { whiteboardImagePath } from "./whiteboardImage.storage.js";
import { toPublicSession } from "./whiteboardSession.dto.js";
import { whiteboardMessagesCodes } from "./whiteboardSession.messages.js";

// Best-effort unlink of a stored image file (never throws — the DB row is the
// source of truth; a missing file just means it's already gone).
function unlinkQuiet(storageKey) {
  try {
    fs.unlinkSync(whiteboardImagePath(storageKey));
  } catch {
    /* already gone / not on this host */
  }
}

// Raw token shown once to the admin; only its SHA-256 hash is stored.
function generateShareToken() {
  return crypto.randomBytes(24).toString("hex"); // 48 hex chars, unguessable
}
function hashShareToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

class WhiteboardSessionUsecase {
  async list({ page, limit, filters = {}, authUser }) {
    // Where-building now lives in the repo (reference convention).
    return whiteboardSessionRepo.listScoped({ authUser, filters, page, limit });
  }

  async getById({ id }) {
    const session = await whiteboardSessionRepo.getByIdWithStudents({ id });
    if (!session) throw notFound(whiteboardMessagesCodes.SESSION_NOT_FOUND);
    return session;
  }

  // Create a session that is READY TO USE: it opens (ACTIVE) immediately, with
  // the chosen students attached and optionally made public in one step.
  async create({
    title,
    studentIds = [],
    isPublic = false,
    locale = "ar",
    authUser,
  }) {
    const clean = typeof title === "string" ? title.trim() : "";
    if (!clean) throw badRequest(whiteboardMessagesCodes.TITLE_REQUIRED);

    const ids = [
      ...new Set(
        (studentIds || []).filter((n) => Number.isInteger(n) && n > 0),
      ),
    ];
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
          whiteboardSessionRepo.addStudent({
            sessionId: session.id,
            studentId,
            client: tx,
          }),
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

    const detail = await whiteboardSessionRepo.getByIdWithStudents({
      id: created,
    });
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
    // Reclaim the session's image files before the rows cascade away.
    const images = await whiteboardSessionRepo.listImagesForSession({
      sessionId: id,
    });
    await whiteboardSessionRepo.remove({ id });
    for (const img of images) unlinkQuiet(img.storageKey);
    return { id };
  }

  // ── board images ────────────────────────────────────────
  // The teacher inserts an image on the board; the file is stored on disk and we
  // keep only the reference, linked to the session.
  async uploadImage({ id, file, isAdmin, token }) {
    console.log(id, file, isAdmin, token, "uploadImage");
    await this.checkIfCanAccessBoardSession({ isAdmin, id, token });

    if (!file) throw badRequest(whiteboardMessagesCodes.IMAGE_REQUIRED);
    const image = await whiteboardSessionRepo.createImage({
      sessionId: id,
      storageKey: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    });
    return { id: image.id, sessionId: id };
  }

  // Serve an image ONLY when it is linked to the session AND the caller is an
  // admin OR presents a valid token for that exact PUBLIC session.
  async serveImage({ sessionId, imageId, token, isAdmin }) {
    const image = await whiteboardSessionRepo.getImageById({ id: imageId });
    if (!image || image.sessionId !== sessionId) {
      throw notFound(whiteboardMessagesCodes.IMAGE_NOT_FOUND);
    }

    await this.checkIfCanAccessBoardSession({ isAdmin, id: sessionId, token });

    return {
      absolutePath: whiteboardImagePath(image.storageKey),
      mimeType: image.mimeType,
    };
  }

  // Retention sweep — delete images older than `retentionDays` (files + rows).
  async purgeExpiredImages({ retentionDays }) {
    const days = Number(retentionDays) > 0 ? Number(retentionDays) : 30;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const expired = await whiteboardSessionRepo.listExpiredImages({ cutoff });
    let count = 0;
    for (const img of expired) {
      unlinkQuiet(img.storageKey);
      await whiteboardSessionRepo.deleteImageById({ id: img.id });
      count += 1;
    }
    return { count };
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

  // ── board data persistence ─────────────────────────────
  // Save the full drawing scene (elements, appState, imageMap) to the DB.
  // Called silently from the client on every debounced change batch.
  async saveBoardData({ id, boardData, token, isAdmin }) {
    await this.checkIfCanAccessBoardSession({ isAdmin, id, token });
    await whiteboardSessionRepo.saveBoardData({ id, boardData });
    return { id };
  }
  async checkIfCanAccessBoardSession({ isAdmin, id, token }) {
    if (!isAdmin) {
      const session = token
        ? await whiteboardSessionRepo.getByTokenHash({
            tokenHash: hashShareToken(token),
          })
        : null;
      const ok =
        session &&
        session.id === id &&
        session.visibility === WHITEBOARD_VISIBILITIES.PUBLIC;
      if (!ok) throw forbidden(whiteboardMessagesCodes.IMAGE_FORBIDDEN);
      return true;
    } else if (isAdmin) {
      return true;
    } else {
      throw forbidden(whiteboardMessagesCodes.IMAGE_FORBIDDEN);
    }
    return true;
  }
  // Load the saved drawing scene so the board can restore its state on open.
  // Admin access (isAdmin) OR public access with a valid token.
  async getBoardData({ id, token, isAdmin }) {
    await this.checkIfCanAccessBoardSession({ isAdmin, id, token });
    const row = await whiteboardSessionRepo.getBoardData({ id });
    return row?.boardData ?? null;
  }

  async #assertExists(id) {
    const session = await whiteboardSessionRepo.getById({ id });
    if (!session) throw notFound(whiteboardMessagesCodes.SESSION_NOT_FOUND);
    return session;
  }
}

export const whiteboardSessionUsecase = new WhiteboardSessionUsecase();
export { WhiteboardSessionUsecase };
