// ===========================================================================
// whiteboardSession.repo — Prisma I/O only on WhiteboardSession /
// WhiteboardSessionStudent. Single object args with an optional `client`.
// ===========================================================================

import { prisma } from "@aya/db/prisma.client.js";
import { paginate } from "../../shared/utility/pagination.js";
import { sessionDetailSelect, sessionListSelect } from "./whiteboardSession.dto.js";

class WhiteboardSessionRepo {
  async list({ where, page, limit, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });
    const [items, total] = await Promise.all([
      db.whiteboardSession.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: sessionListSelect,
      }),
      db.whiteboardSession.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  getById({ id, client } = {}) {
    return (client ?? prisma).whiteboardSession.findUnique({ where: { id } });
  }

  getByIdWithStudents({ id, client } = {}) {
    return (client ?? prisma).whiteboardSession.findUnique({
      where: { id },
      select: sessionDetailSelect,
    });
  }

  getByTokenHash({ tokenHash, client } = {}) {
    return (client ?? prisma).whiteboardSession.findUnique({
      where: { publicTokenHash: tokenHash },
      select: sessionDetailSelect,
    });
  }

  create({ title, createdById, client } = {}) {
    return (client ?? prisma).whiteboardSession.create({
      data: { title, createdById },
      select: sessionDetailSelect,
    });
  }

  updateStatus({ id, status, client } = {}) {
    return (client ?? prisma).whiteboardSession.update({
      where: { id },
      data: { status },
      select: sessionDetailSelect,
    });
  }

  setPublic({ id, tokenHash, client } = {}) {
    return (client ?? prisma).whiteboardSession.update({
      where: { id },
      data: { visibility: "PUBLIC", publicTokenHash: tokenHash },
      select: sessionDetailSelect,
    });
  }

  setPrivate({ id, client } = {}) {
    return (client ?? prisma).whiteboardSession.update({
      where: { id },
      data: { visibility: "PRIVATE", publicTokenHash: null },
      select: sessionDetailSelect,
    });
  }

  remove({ id, client } = {}) {
    return (client ?? prisma).whiteboardSession.delete({ where: { id } });
  }

  findStudentLink({ sessionId, studentId, client } = {}) {
    return (client ?? prisma).whiteboardSessionStudent.findUnique({
      where: { sessionId_studentId: { sessionId, studentId } },
    });
  }

  addStudent({ sessionId, studentId, client } = {}) {
    return (client ?? prisma).whiteboardSessionStudent.create({
      data: { sessionId, studentId },
    });
  }

  removeStudent({ sessionId, studentId, client } = {}) {
    return (client ?? prisma).whiteboardSessionStudent.deleteMany({
      where: { sessionId, studentId },
    });
  }

  // ── board images ────────────────────────────────────────
  createImage({ sessionId, storageKey, mimeType, size, client } = {}) {
    return (client ?? prisma).whiteboardImage.create({
      data: { sessionId, storageKey, mimeType, size },
    });
  }

  getImageById({ id, client } = {}) {
    return (client ?? prisma).whiteboardImage.findUnique({ where: { id } });
  }

  listImagesForSession({ sessionId, client } = {}) {
    return (client ?? prisma).whiteboardImage.findMany({ where: { sessionId } });
  }

  // Images older than `cutoff` — reclaimed by the retention cron.
  listExpiredImages({ cutoff, take = 500, client } = {}) {
    return (client ?? prisma).whiteboardImage.findMany({
      where: { createdAt: { lt: cutoff } },
      take,
      orderBy: { createdAt: "asc" },
    });
  }

  deleteImageById({ id, client } = {}) {
    return (client ?? prisma).whiteboardImage.delete({ where: { id } });
  }

  deleteImagesForSession({ sessionId, client } = {}) {
    return (client ?? prisma).whiteboardImage.deleteMany({ where: { sessionId } });
  }
}

export const whiteboardSessionRepo = new WhiteboardSessionRepo();
export { WhiteboardSessionRepo };
