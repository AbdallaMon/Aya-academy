// ===========================================================================
// certificate.repo — Prisma I/O only on Certificate. (Reference idiom: single
// object args with optional `client`, list owns pagination and returns
// { items, total, page, pageSize }. The auth-scoped `where` is built in the
// usecase and threaded in.)
// ===========================================================================

import { prisma } from "@aya/db/prisma.client.js";
import { paginate } from "../../shared/utility/pagination.js";
import { certificateSelect } from "./certificate.dto.js";

class CertificateRepo {
  async list({ page, limit, where = {}, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });

    const [items, total] = await Promise.all([
      db.certificate.findMany({
        where,
        skip,
        take,
        orderBy: { issuedAt: "desc" },
        select: certificateSelect,
      }),
      db.certificate.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: take };
  }

  getById({ id, client } = {}) {
    return (client ?? prisma).certificate.findUnique({
      where: { id },
      select: certificateSelect,
    });
  }

  /**
   * The student's earliest GAME certificate for a given game (via the attempt
   * link), or null. Used to tell whether the game was already completed so a
   * replay doesn't re-issue, and to re-surface the existing certificate.
   */
  findForGame({ studentId, gameId, client } = {}) {
    return (client ?? prisma).certificate.findFirst({
      where: { studentId, gameAttempt: { gameId } },
      orderBy: { issuedAt: "asc" },
      select: certificateSelect,
    });
  }

  create({ data, client } = {}) {
    return (client ?? prisma).certificate.create({
      data,
      select: certificateSelect,
    });
  }
}

export const certificateRepo = new CertificateRepo();
export { CertificateRepo };
