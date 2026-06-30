// ===========================================================================
// paymentTemplate.repo — Prisma I/O only on the singleton PaymentTemplate row.
// (Reference idiom: single object args with optional `client`.)
// ===========================================================================

import { prisma } from "@aya/db/prisma.client.js";
import { paymentTemplateSelect, toPaymentTemplate } from "./paymentTemplate.dto.js";

class PaymentTemplateRepo {
  /** The single global template row (or null when none exists yet). */
  async getSingleton({ client } = {}) {
    const row = await (client ?? prisma).paymentTemplate.findFirst({
      orderBy: { id: "asc" },
      select: paymentTemplateSelect,
    });
    return toPaymentTemplate(row);
  }

  async create({ data, client } = {}) {
    const row = await (client ?? prisma).paymentTemplate.create({
      data,
      select: paymentTemplateSelect,
    });
    return toPaymentTemplate(row);
  }

  async update({ id, data, client } = {}) {
    const row = await (client ?? prisma).paymentTemplate.update({
      where: { id },
      data,
      select: paymentTemplateSelect,
    });
    return toPaymentTemplate(row);
  }
}

export const paymentTemplateRepo = new PaymentTemplateRepo();
export { PaymentTemplateRepo };
