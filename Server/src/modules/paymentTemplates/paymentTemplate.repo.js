import { prisma } from "@aya/db/prisma.client.js";
import { paymentTemplateSelect, toPaymentTemplate } from "./paymentTemplate.dto.js";

class PaymentTemplateRepo {
  /** The single global template row (or null when none exists yet). */
  async getSingleton() {
    const row = await prisma.paymentTemplate.findFirst({
      orderBy: { id: "asc" },
      select: paymentTemplateSelect,
    });
    return toPaymentTemplate(row);
  }

  async create(data) {
    const row = await prisma.paymentTemplate.create({
      data,
      select: paymentTemplateSelect,
    });
    return toPaymentTemplate(row);
  }

  async update(id, data) {
    const row = await prisma.paymentTemplate.update({
      where: { id },
      data,
      select: paymentTemplateSelect,
    });
    return toPaymentTemplate(row);
  }
}

export const paymentTemplateRepo = new PaymentTemplateRepo();
