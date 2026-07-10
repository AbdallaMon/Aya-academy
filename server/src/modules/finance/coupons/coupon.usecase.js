import { randomBytes } from "node:crypto";
import { badRequest, conflict, notFound } from "../../../shared/errors/AppError.js";
import { couponMessagesCodes, messagesNames } from "@aya/shared";
import { couponRepo } from "./coupon.repo.js";

class CouponUsecase {
  async list({ page, limit, filters = {} }) {
    return couponRepo.listCoupons({
      page,
      limit,
      search: filters.search,
      isActive: filters.isActive,
      status: filters.status,
      source: filters.source,
      planId: filters.planId,
    });
  }

  async getById(id) {
    const coupon = await couponRepo.getById({ id });
    if (!coupon) throw notFound(couponMessagesCodes.COUPON_NOT_FOUND);
    return coupon;
  }

  /** Generate a unique, human-friendly coupon code (e.g. AYA-3F9A2C). */
  async generateUniqueCode(prefix = "AYA") {
    for (let i = 0; i < 8; i += 1) {
      const token = randomBytes(3).toString("hex").toUpperCase();
      const code = `${prefix}-${token}`;
      const existing = await couponRepo.getByCode(code);
      if (!existing) return code;
    }
    throw conflict(couponMessagesCodes.COUPON_CODE_TAKEN);
  }

  async create({ authUser, ...input }) {
    const code = input.code?.trim()
      ? input.code.trim()
      : await this.generateUniqueCode();

    const existing = await couponRepo.getByCode(code);
    if (existing) throw conflict(couponMessagesCodes.COUPON_CODE_TAKEN);

    // Coupons are GLOBAL: they apply to any plan and any billing period. We no
    // longer scope by plan (planIds ignored → no CouponPlan links) or by cycle
    // (billingPeriod forced null = "applies to both/any"). The Prisma
    // billingPeriod/CouponPlan fields are kept but left unwritten/unused.
    const data = {
      code,
      type: input.type,
      value: input.value,
      source: input.source,
      billingPeriod: null,
      maxRedemptions: input.maxRedemptions,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isActive: input.isActive,
    };
    return couponRepo.createCoupon({ data });
  }

  async update({ id, authUser, ...input }) {
    const coupon = await this.getById(id);

    if (input.code) {
      const existing = await couponRepo.getByCode(input.code);
      if (existing && existing.id !== id) {
        throw conflict(couponMessagesCodes.COUPON_CODE_TAKEN);
      }
    }

    // A coupon's usage cap can't be set below the times it was already redeemed.
    if (
      input.maxRedemptions !== undefined &&
      input.maxRedemptions !== null &&
      input.maxRedemptions < coupon.redemptionsCount
    ) {
      throw badRequest(
        couponMessagesCodes.COUPON_MAX_BELOW_USAGE,
        messagesNames.couponMessages,
      );
    }

    // Coupons are GLOBAL now: plan links (planIds) and cycle scope (billingPeriod)
    // are no longer written — both inputs are ignored so an updated coupon stays
    // applicable to any plan and any billing period.
    const data = {
      code: input.code,
      type: input.type,
      value: input.value,
      source: input.source,
      maxRedemptions: input.maxRedemptions,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isActive: input.isActive,
    };
    return couponRepo.updateCoupon({ id, data });
  }

  async remove({ id, authUser }) {
    await this.getById(id);
    return couponRepo.deactivateCoupon({ id });
  }

  // ── validation (any authenticated user) ─────────────────────
  async validateCoupon({ code, planId, billingPeriod }) {
    const coupon = await couponRepo.getByCode(code);
    if (!coupon) {
      return { valid: false, reason: couponMessagesCodes.COUPON_NOT_FOUND };
    }
    if (!coupon.isActive) {
      return { valid: false, reason: couponMessagesCodes.COUPON_INVALID };
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return { valid: false, reason: couponMessagesCodes.COUPON_INVALID };
    }
    if (coupon.endsAt && now > coupon.endsAt) {
      return { valid: false, reason: couponMessagesCodes.COUPON_EXPIRED };
    }
    if (
      coupon.maxRedemptions !== null &&
      coupon.redemptionsCount >= coupon.maxRedemptions
    ) {
      return { valid: false, reason: couponMessagesCodes.COUPON_EXPIRED };
    }

    // Coupons are GLOBAL: a valid, in-window, under-cap coupon applies to ANY
    // plan and ANY billing period. Plan-scope and cycle-scope are no longer
    // enforced (the `planId`/`billingPeriod` args are accepted but ignored, and
    // any legacy CouponPlan/billingPeriod data is disregarded).
    return {
      valid: true,
      reason: null,
      discount: {
        type: coupon.type,
        value: Number(coupon.value),
        billingPeriod: coupon.billingPeriod ?? null,
      },
    };
  }
}

export const couponUsecase = new CouponUsecase();
export { CouponUsecase };
