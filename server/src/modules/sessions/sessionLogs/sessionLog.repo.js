// ===========================================================================
// sessionLog.repo — Prisma I/O only on SessionLog.
// (Reference idiom: single object args with optional `client`; list owns
// pagination and returns { items, total, page, pageSize }. Rows are shaped by
// `toSessionLog` to normalise the Decimal `durationHours`.)
// ===========================================================================

import { USER_ROLES } from "@aya/shared";
import { prisma } from "@aya/db/prisma.client.js";
import { paginate } from "../../../shared/utility/pagination.js";
import { userRepo } from "../../users/user.repo.js";
import {
  sessionLogListSelect,
  sessionLogSelect,
  toSessionLog,
} from "./sessionLog.dto.js";

/** Parse "YYYY-MM" into a { gte, lt } UTC month range; null when malformed. */
function parseMonthRange(month) {
  if (typeof month !== "string") return null;
  const match = /^(\d{4})-(\d{2})$/.exec(month.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const gte = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const lt = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0));
  if (Number.isNaN(gte.getTime()) || Number.isNaN(lt.getTime())) return null;
  return { gte, lt };
}

class SessionLogRepo {
  async buildListWhere(authUser, { month, studentId } = {}) {
    const where = {};
    const range = parseMonthRange(month);
    if (range) where.sessionDate = { gte: range.gte, lt: range.lt };

    if (authUser.role === USER_ROLES.ADMIN) {
      if (studentId) where.studentId = studentId;
    } else if (authUser.role === USER_ROLES.PARENT) {
      const studentIds = await userRepo.getStudentIdsForParent(authUser.id);
      const scoped =
        studentId && studentIds.includes(studentId) ? [studentId] : studentIds;
      where.studentId = { in: scoped };
    } else {
      // Students (and any other role) are never exposed to session logs.
      where.studentId = { in: [] };
    }
    return where;
  }

  // Scoped list — builds the where from (authUser, filters) then pages.
  async listScoped({ authUser, filters = {}, page, limit, client } = {}) {
    const where = await this.buildListWhere(authUser, {
      month: filters.month,
      studentId: filters.studentId,
    });
    return this.listSessionLogs({ where, page, limit, client });
  }

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
