import { BILLING_PERIODS } from "@aya/shared";
import { notFound } from "../../shared/errors/AppError.js";
import {
  applyDiscount,
  couponAppliesToPeriod,
  effectiveMonthlyPrice,
  effectiveYearlyPrice,
  isCouponActive,
  priceForPeriod,
  roundMoney,
} from "../../shared/utility/pricing.js";
import { settingsUsecase } from "../settings/settings.usecase.js";
import { couponUsecase } from "../coupons/coupon.usecase.js";
import { planRepo } from "./plan.repo.js";
import { planMessagesCodes } from "./plan.messages.js";

class PlanUsecase {
  async list({ page, limit, filters = {} }) {
    return planRepo.listPlans({
      page,
      limit,
      search: filters.search,
      isActive: filters.isActive,
    });
  }

  async getById(id) {
    const plan = await planRepo.getById(id);
    if (!plan) throw notFound(planMessagesCodes.PLAN_NOT_FOUND);
    return plan;
  }

  async create({ authUser, ...input }) {
    const data = {
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      descriptionAr: input.descriptionAr,
      descriptionEn: input.descriptionEn,
      hours: input.hours,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      sortOrder: input.sortOrder,
    };
    return planRepo.createPlan({ data });
  }

  async update({ id, authUser, ...input }) {
    await this.getById(id);
    const data = {
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      descriptionAr: input.descriptionAr,
      descriptionEn: input.descriptionEn,
      hours: input.hours,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      sortOrder: input.sortOrder,
    };
    return planRepo.updatePlan({ id, data });
  }

  async remove({ id, authUser }) {
    await this.getById(id);
    return planRepo.deactivatePlan({ id });
  }

  // ── public pricing ──────────────────────────────────────
  // Pick the cheapest active coupon that applies to a billing cycle.
  bestCoupon(coupons, base, period, now) {
    let bestPrice = base;
    let bestCoupon = null;
    for (const coupon of coupons) {
      if (!isCouponActive(coupon, now)) continue;
      if (!couponAppliesToPeriod(coupon, period)) continue;
      const candidate = applyDiscount(base, coupon);
      if (candidate < bestPrice) {
        bestPrice = candidate;
        bestCoupon = coupon;
      }
    }
    return { price: roundMoney(bestPrice), coupon: bestCoupon };
  }

  // Monthly + yearly base/effective prices with the best plan-linked discount.
  pricingFor(plan, coupons = [], hourlyRate, now = new Date()) {
    const monthlyBase = roundMoney(effectiveMonthlyPrice(plan, hourlyRate));
    const yearlyBase = roundMoney(effectiveYearlyPrice(plan, hourlyRate));
    const m = this.bestCoupon(coupons, monthlyBase, BILLING_PERIODS.MONTHLY, now);
    const y = this.bestCoupon(coupons, yearlyBase, BILLING_PERIODS.YEARLY, now);
    const summarize = (base, picked) => ({
      base,
      effective: picked.price,
      discount: picked.coupon
        ? {
            type: picked.coupon.type,
            value: Number(picked.coupon.value),
            code: picked.coupon.code,
          }
        : null,
    });
    return {
      monthly: summarize(monthlyBase, m),
      yearly: summarize(yearlyBase, y),
    };
  }

  /**
   * Public price quote for verifying a coupon CODE against one plan/cycle. The
   * discount is driven solely by the supplied code (the plan's own coupon is the
   * UI's removable default, surfaced via `/plans/public`, not auto-applied here).
   * Never throws on an invalid code — reports `{couponValid:false, reason}` so the
   * UI can show an inline error. Money stays server-authoritative (preview only).
   */
  async quote({ planId, billingPeriod, couponCode }) {
    const plan = await planRepo.getByIdWithCoupons(planId);
    if (!plan || !plan.isActive) throw notFound(planMessagesCodes.PLAN_NOT_FOUND);

    const settings = await settingsUsecase.getEffective();
    const hourlyRate = Number(settings.hourlyRate);
    const base = roundMoney(priceForPeriod(plan, billingPeriod, hourlyRate));

    // No code → base price (no discount).
    if (!couponCode) {
      return {
        currency: settings.currency,
        base,
        net: base,
        discount: null,
        couponValid: null,
        reason: null,
      };
    }

    const result = await couponUsecase.validateCoupon({
      code: couponCode,
      planId,
      billingPeriod,
    });
    if (!result.valid) {
      return {
        currency: settings.currency,
        base,
        net: base,
        discount: null,
        couponValid: false,
        reason: result.reason,
      };
    }

    const net = roundMoney(
      applyDiscount(base, {
        type: result.discount.type,
        value: result.discount.value,
      }),
    );
    return {
      currency: settings.currency,
      base,
      net,
      discount: {
        type: result.discount.type,
        value: result.discount.value,
        code: couponCode,
      },
      couponValid: true,
      reason: null,
    };
  }

  async listPublic() {
    const plans = await planRepo.listActiveWithCoupons();
    const settings = await settingsUsecase.getEffective();
    const hourlyRate = Number(settings.hourlyRate);
    const now = new Date();

    return plans.map((plan) => {
      const coupons = (plan.coupons || [])
        .map((link) => link.coupon)
        .filter(Boolean);
      const pricing = this.pricingFor(plan, coupons, hourlyRate, now);

      return {
        id: plan.id,
        titleAr: plan.titleAr,
        titleEn: plan.titleEn,
        descriptionAr: plan.descriptionAr,
        descriptionEn: plan.descriptionEn,
        hours: plan.hours,
        hourlyRate,
        currency: settings.currency,
        isFeatured: plan.isFeatured,
        monthly: pricing.monthly,
        yearly: pricing.yearly,
      };
    });
  }
}

export const planUsecase = new PlanUsecase();
export { PlanUsecase };
