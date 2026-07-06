// ===========================================================================
// sessionLog.repo — Prisma I/O only on SessionLog.
// (Reference idiom: single object args with optional `client`; list owns
// pagination and returns { items, total, page, pageSize }. Rows are shaped by
// `toSessionLog` to normalise the Decimal `durationHours`.)
// ===========================================================================

import { prisma } from "@aya/db/prisma.client.js";
import { paginate } from "../../shared/utility/pagination.js";
import {
  sessionLogListSelect,
  sessionLogSelect,
  toSessionLog,
} from "./sessionLog.dto.js";

class SessionLogRepo {
  async listSessionLogs({ where = {}, page, limit, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });
    if (!where.sessionDate) {
      const currentMonth = new Date().getMonth();
      const firstDayOfCurrentMOnth = new Date(
        new Date().getFullYear(),
        currentMonth,
        1,
      );
      const firstDayOfNextMonth = new Date(
        new Date().getFullYear(),
        currentMonth + 1,
        1,
      );
      where.sessionDate = {
        gte: firstDayOfCurrentMOnth,
        lt: firstDayOfNextMonth,
      };
    }
    const [rows, total] = await Promise.all([
      db.sessionLog.findMany({
        where,
        skip,
        take,
        orderBy: [{ sessionDate: "desc" }, { id: "desc" }],
        select: sessionLogListSelect,
      }),
      db.sessionLog.count({ where }),
    ]);
    return {
      items: rows.map(toSessionLog),
      total,
      page: currentPage,
      pageSize: take,
    };
  }

  async findById({ id, client } = {}) {
    const row = await (client ?? prisma).sessionLog.findUnique({
      where: { id },
      select: sessionLogSelect,
    });
    return toSessionLog(row);
  }

  async create({ data, client } = {}) {
    const row = await (client ?? prisma).sessionLog.create({
      data,
      select: sessionLogSelect,
    });
    return toSessionLog(row);
  }

  async update({ id, data, client } = {}) {
    const row = await (client ?? prisma).sessionLog.update({
      where: { id },
      data,
      select: sessionLogSelect,
    });
    return toSessionLog(row);
  }

  deleteSessionLog({ id, client } = {}) {
    return (client ?? prisma).sessionLog.delete({
      where: { id },
      select: { id: true },
    });
  }
}

export const sessionLogRepo = new SessionLogRepo();
export { SessionLogRepo };
