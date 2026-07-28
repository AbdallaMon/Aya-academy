// ===========================================================================
// invoice.repo — Prisma I/O only on Invoice. (Reference idiom: single object
// args with optional `client`, list owns pagination and returns
// { items, total, page, pageSize }.) Rows are shaped by `toInvoice`.
//
// NOTE: getBySubscriptionId keeps its POSITIONAL `subscriptionId` arg — it is
// consumed cross-module (subscriptions) and its signature is frozen.
// ===========================================================================

import { prisma } from "@ayah/db/prisma.client.js";
import { USER_ROLES } from "@ayah/shared";
import { paginate } from "../../../shared/utility/pagination.js";
import { userRepo } from "../../users/user.repo.js";
import { invoiceSelect, toInvoice } from "./invoice.dto.js";

class InvoiceRepo {
  /**
   * Build the auth-scoped Prisma `where` for the invoice list.
   * Where-building lives in the repo (reference convention) — the usecase only
   * forwards the raw filters + the auth context.
   *   ADMIN   → optional status filter over all invoices
   *   PARENT  → their students' invoices, only those the teacher has sent
   *   STUDENT → their own invoices, only those the teacher has sent
   */
  async buildListWhere(authUser, { status } = {}) {
    const where = {};
    if (status) where.status = status;

    if (authUser.role === USER_ROLES.PARENT) {
      const studentIds = await userRepo.getStudentIdsForParent(authUser.id);
      where.subscription = { studentId: { in: studentIds } };
      // Non-admins only see invoices the teacher has requested payment for.
      where.sentAt = { not: null };
    } else if (authUser.role === USER_ROLES.STUDENT) {
      where.subscription = { studentId: authUser.id };
      where.sentAt = { not: null };
    }
    return where;
  }

  // Scoped list — builds the where from (authUser, filters) then pages.
  async listScoped({ authUser, filters = {}, page, limit, client } = {}) {
    const where = await this.buildListWhere(authUser, filters);
    return this.list({ page, limit, where, client });
  }

  async list({ page, limit, where = {}, client } = {}) {
    const db = client ?? prisma;
    const { skip, take, page: currentPage } = paginate({ page, limit });

    const [rows, total] = await Promise.all([
      db.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: invoiceSelect,
      }),
      db.invoice.count({ where }),
    ]);
    return { items: rows.map(toInvoice), total, page: currentPage, pageSize: take };
  }

  async getById({ id, client } = {}) {
    const row = await (client ?? prisma).invoice.findUnique({
      where: { id },
      select: invoiceSelect,
    });
    return toInvoice(row);
  }

  // Positional `subscriptionId` — frozen (called cross-module from subscriptions).
  async getBySubscriptionId(subscriptionId, client) {
    const row = await (client ?? prisma).invoice.findUnique({
      where: { subscriptionId },
      select: invoiceSelect,
    });
    return toInvoice(row);
  }

  async create({ data, client } = {}) {
    const row = await (client ?? prisma).invoice.create({
      data,
      select: invoiceSelect,
    });
    return toInvoice(row);
  }

  async update({ id, data, client } = {}) {
    const row = await (client ?? prisma).invoice.update({
      where: { id },
      data,
      select: invoiceSelect,
    });
    return toInvoice(row);
  }
}

export const invoiceRepo = new InvoiceRepo();
export { InvoiceRepo };
