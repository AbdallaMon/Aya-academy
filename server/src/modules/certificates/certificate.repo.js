import { prisma } from "@aya/db/prisma.client.js";
import { certificateSelect } from "./certificate.dto.js";

class CertificateRepo {
  async list(where, skip, take) {
    const [items, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        skip,
        take,
        orderBy: { issuedAt: "desc" },
        select: certificateSelect,
      }),
      prisma.certificate.count({ where }),
    ]);
    return { items, total };
  }

  getById(id) {
    return prisma.certificate.findUnique({
      where: { id },
      select: certificateSelect,
    });
  }

  /**
   * The student's earliest GAME certificate for a given game (via the attempt
   * link), or null. Used to tell whether the game was already completed so a
   * replay doesn't re-issue, and to re-surface the existing certificate.
   */
  findForGame(studentId, gameId) {
    return prisma.certificate.findFirst({
      where: { studentId, gameAttempt: { gameId } },
      orderBy: { issuedAt: "asc" },
      select: certificateSelect,
    });
  }

  create(data, tx) {
    const client = tx ?? prisma;
    return client.certificate.create({ data, select: certificateSelect });
  }
}

export const certificateRepo = new CertificateRepo();
