import { DEFAULT_PAYMENT_TEMPLATE } from "@aya/shared";
import { paymentTemplateRepo } from "./paymentTemplate.repo.js";

class PaymentTemplateUsecase {
  /**
   * Read the global template, auto-creating the default row the first time it's
   * requested. The template is a singleton — there is only ever one row.
   */
  async get(authUser) {
    let template = await paymentTemplateRepo.getSingleton();
    if (!template) {
      template = await paymentTemplateRepo.create({
        configJson: DEFAULT_PAYMENT_TEMPLATE,
        updatedById: authUser?.id ?? null,
      });
    }
    return template;
  }

  /** Replace the global template's config (admin only — gated at the route). */
  async update(authUser, configJson) {
    const existing = await paymentTemplateRepo.getSingleton();
    if (!existing) {
      return paymentTemplateRepo.create({
        configJson,
        updatedById: authUser?.id ?? null,
      });
    }
    return paymentTemplateRepo.update(existing.id, {
      configJson,
      updatedById: authUser?.id ?? null,
    });
  }
}

export const paymentTemplateUsecase = new PaymentTemplateUsecase();
