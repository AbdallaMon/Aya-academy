import { BILLING_PERIODS } from "@aya/shared";
import { notFound } from "../../shared/errors/AppError.js";
import {
  buildSearchQuery,
  parseBooleanFilter,
} from "../../shared/utility/helper.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
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
  buildListWhere({ search, isActive }) {
    const where = {};
    const or = buildSearchQuery({
      search: typeof search === "string" ? search : undefined,
      keys: ["titleAr", "titleEn"],
    });
    if (or) where.OR = or;

    const active = parseBooleanFilter(isActive);
    if (active !== undefined) where.isActive = active;

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
      hours: input.hours,
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
      hours: input.hours,
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
   * Public price quote for one plan/cycle with an optional coupon code. Mirrors
   * `subscriptionUsecase.computePricing` (best of auto plan-coupon vs typed code)
   * but NEVER throws on an invalid code — it reports `{couponValid:false,reason}`
   * so the registration wizard can show an inline error. Money stays
   * server-authoritative; the client only previews.
   */
  async quote({ planId, billingPeriod, couponCode }) {
    const plan = await planRepo.getByIdWithCoupons(planId);
    if (!plan || !plan.isActive) throw notFound(planMessagesCodes.PLAN_NOT_FOUND);

    const settings = await settingsUsecase.getEffective();
    const hourlyRate = Number(settings.hourlyRate);
    const now = new Date();
    const base = roundMoney(priceForPeriod(plan, billingPeriod, hourlyRate));

    // (1) best active plan-linked coupon for this cycle (auto-applied)
    const linked = (plan.coupons ?? [])
      .map((link) => link.coupon)
      .filter(Boolean);
    let net = base;
    let applied = null;
    for (const coupon of linked) {
      if (!isCouponActive(coupon, now)) continue;
      if (!couponAppliesToPeriod(coupon, billingPeriod)) continue;
      const candidate = roundMoney(applyDiscount(base, coupon));
      if (candidate < net) {
        net = candidate;
        applied = { type: coupon.type, value: Number(coupon.value), code: coupon.code };
      }
    }

    // (2) typed coupon code, if supplied
    let couponValid = null;
    let reason = null;
    if (couponCode) {
      const result = await couponUsecase.validateCoupon({
        code: couponCode,
        planId,
        billingPeriod,
      });
      if (!result.valid) {
        couponValid = false;
        reason = result.reason;
      } else {
        couponValid = true;
        const candidate = roundMoney(
          applyDiscount(base, {
            type: result.discount.type,
            value: result.discount.value,
          }),
        );
        if (candidate < net) {
          net = candidate;
          applied = {
            type: result.discount.type,
            value: result.discount.value,
            code: couponCode,
          };
        }
      }
    }

    return {
      currency: settings.currency,
      base,
      net: roundMoney(net),
      discount: applied,
      couponValid,
      reason,
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
