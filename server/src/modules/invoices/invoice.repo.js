// ===========================================================================
// invoice.repo — Prisma I/O only on Invoice. (Reference idiom: single object
// args with optional `client`, list owns pagination and returns
// { items, total, page, pageSize }.) Rows are shaped by `toInvoice`.
//
// NOTE: getBySubscriptionId keeps its POSITIONAL `subscriptionId` arg — it is
// consumed cross-module (subscriptions) and its signature is frozen.
// ===========================================================================

import { prisma } from "@aya/db/prisma.client.js";
import { paginate } from "../../shared/utility/pagination.js";
import { invoiceSelect, toInvoice } from "./invoice.dto.js";

class InvoiceRepo {
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
