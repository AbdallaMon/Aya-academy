import { prisma } from "@aya/db/prisma.client.js";
import { invoiceSelect, toInvoice } from "./invoice.dto.js";

class InvoiceRepo {
  async listInvoices(where, skip, take) {
    const [rows, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: invoiceSelect,
      }),
      prisma.invoice.count({ where }),
    ]);
    return { items: rows.map(toInvoice), total };
  }

  async getById(id) {
    const row = await prisma.invoice.findUnique({
      where: { id },
      select: invoiceSelect,
    });
    return toInvoice(row);
  }

  async getBySubscriptionId(subscriptionId) {
    const row = await prisma.invoice.findUnique({
      where: { subscriptionId },
      select: invoiceSelect,
    });
    return toInvoice(row);
  }

  async create(data, client) {
    const row = await (client ?? prisma).invoice.create({
      data,
      select: invoiceSelect,
    });
    return toInvoice(row);
  }

  async update(id, data) {
    const row = await prisma.invoice.update({
      where: { id },
      data,
      select: invoiceSelect,
    });
    return toInvoice(row);
  }
}

export const invoiceRepo = new InvoiceRepo();
