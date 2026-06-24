import { DISCOUNT_TYPES } from "@aya/shared";
import { notFound } from "../../shared/errors/AppError.js";
import {
  buildSearchQuery,
  parseBooleanFilter,
} from "../../shared/utility/helper.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import { planRepo } from "./plan.repo.js";
import { planMessagesCodes } from "./plan.messages.js";

class PlanUsecase {
  buildListWhere({ search, isActive, billingPeriod }) {
    const where = {};
    const or = buildSearchQuery({
      search: typeof search === "string" ? search : undefined,
      keys: ["titleAr", "titleEn"],
    });
    if (or) where.OR = or;

    const active = parseBooleanFilter(isActive);
    if (active !== undefined) where.isActive = active;

    if (billingPeriod && billingPeriod !== "ALL") {
      where.billingPeriod = billingPeriod;
    }
    return where;
  }

  async list(params) {
    const { skip, take, page, limit } = paginate({
      page: params.page,
      limit: params.limit,
    });
    const where = this.buildListWhere(params);
    const { items, total } = await planRepo.listPlans(where, skip, take);
    return paginatedResult(items, total, page, limit);
  }

  async getById(id) {
    const plan = await planRepo.getById(id);
    if (!plan) throw notFound(planMessagesCodes.PLAN_NOT_FOUND);
    return plan;
  }

  async create(input) {
    const data = {
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      descriptionAr: input.descriptionAr,
      descriptionEn: input.descriptionEn,
      billingPeriod: input.billingPeriod,
      hours: input.hours,
      hourlyRate: input.hourlyRate,
      currency: input.currency,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      sortOrder: input.sortOrder,
    };
    return planRepo.createPlan(data);
  }

  async update(id, input) {
    await this.getById(id);
    const data = {
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      descriptionAr: input.descriptionAr,
      descriptionEn: input.descriptionEn,
      billingPeriod: input.billingPeriod,
      hours: input.hours,
      hourlyRate: input.hourlyRate,
      currency: input.currency,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      sortOrder: input.sortOrder,
    };
    return planRepo.updatePlan(id, data);
  }

  async remove(id) {
    await this.getById(id);
    return planRepo.deactivatePlan(id);
  }

  // ── discounts ───────────────────────────────────────────
  async createDiscount(planId, input) {
    await this.getById(planId);
    return planRepo.createDiscount({
      planId,
      type: input.type,
      value: input.value,
      constraint: input.constraint,
      maxRedemptions: input.maxRedemptions,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isActive: input.isActive,
    });
  }

  async updateDiscount(planId, id, input) {
    const existing = await planRepo.getDiscount(id, planId);
    if (!existing) throw notFound(planMessagesCodes.DISCOUNT_NOT_FOUND);
    const data = {
      type: input.type,
      value: input.value,
      constraint: input.constraint,
      maxRedemptions: input.maxRedemptions,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isActive: input.isActive,
    };
    return planRepo.updateDiscount(id, data);
  }

  async removeDiscount(planId, id) {
    const existing = await planRepo.getDiscount(id, planId);
    if (!existing) throw notFound(planMessagesCodes.DISCOUNT_NOT_FOUND);
    return planRepo.deleteDiscount(id);
  }

  // ── public pricing ──────────────────────────────────────
  isDiscountActive(discount, now) {
    if (!discount.isActive) return false;
    if (discount.startsAt && now < discount.startsAt) return false;
    if (discount.endsAt && now > discount.endsAt) return false;
    if (
      discount.maxRedemptions !== null &&
      discount.redemptionsCount >= discount.maxRedemptions
    ) {
      return false;
    }
    return true;
  }

  applyDiscount(price, discount) {
    const value = Number(discount.value);
    if (discount.type === DISCOUNT_TYPES.PERCENT) {
      return price * (1 - value / 100);
    }
    return Math.max(0, price - value);
  }

  async listPublic() {
    const plans = await planRepo.listActiveWithDiscounts();
    const now = new Date();

    return plans.map((plan) => {
      const hourlyRate = Number(plan.hourlyRate);
      const basePrice = plan.hours * hourlyRate;

      let bestPrice = basePrice;
      let bestDiscount = null;
      for (const discount of plan.discounts) {
        if (!this.isDiscountActive(discount, now)) continue;
        const candidate = this.applyDiscount(basePrice, discount);
        if (candidate < bestPrice) {
          bestPrice = candidate;
          bestDiscount = discount;
        }
      }

      return {
        id: plan.id,
        titleAr: plan.titleAr,
        titleEn: plan.titleEn,
        descriptionAr: plan.descriptionAr,
        descriptionEn: plan.descriptionEn,
        billingPeriod: plan.billingPeriod,
        hours: plan.hours,
        hourlyRate,
        currency: plan.currency,
        basePrice,
        effectivePrice: bestPrice,
        discount: bestDiscount
          ? {
              type: bestDiscount.type,
              value: Number(bestDiscount.value),
            }
          : null,
        isFeatured: plan.isFeatured,
      };
    });
  }
}

export const planUsecase = new PlanUsecase();
