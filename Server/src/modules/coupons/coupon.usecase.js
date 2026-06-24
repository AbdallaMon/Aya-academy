import { conflict, notFound } from "../../shared/errors/AppError.js";
import {
  buildSearchQuery,
  parseBooleanFilter,
} from "../../shared/utility/helper.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import { couponRepo } from "./coupon.repo.js";
import { couponMessagesCodes } from "./coupon.messages.js";

class CouponUsecase {
  buildListWhere({ search, isActive, source }) {
    const where = {};
    const or = buildSearchQuery({
      search: typeof search === "string" ? search : undefined,
      keys: ["code"],
    });
    if (or) where.OR = or;

    const active = parseBooleanFilter(isActive);
    if (active !== undefined) where.isActive = active;

    if (source && source !== "ALL") where.source = source;

    return where;
  }

  async list(params) {
    const { skip, take, page, limit } = paginate({
      page: params.page,
      limit: params.limit,
    });
    const where = this.buildListWhere(params);
    const { items, total } = await couponRepo.listCoupons(where, skip, take);
    return paginatedResult(items, total, page, limit);
  }

  async getById(id) {
    const coupon = await couponRepo.getById(id);
    if (!coupon) throw notFound(couponMessagesCodes.COUPON_NOT_FOUND);
    return coupon;
  }

  async create(input) {
    const existing = await couponRepo.getByCode(input.code);
    if (existing) throw conflict(couponMessagesCodes.COUPON_CODE_TAKEN);

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
    return couponRepo.createCoupon(data, input.planIds);
  }

  async update(id, input) {
    await this.getById(id);

    if (input.code) {
      const existing = await couponRepo.getByCode(input.code);
      if (existing && existing.id !== id) {
        throw conflict(couponMessagesCodes.COUPON_CODE_TAKEN);
      }
    }

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
    return couponRepo.updateCoupon(id, data, input.planIds);
  }

  async remove(id) {
    await this.getById(id);
    return couponRepo.deactivateCoupon(id);
  }

  // ── validation (any authenticated user) ─────────────────────
  async validateCoupon({ code, planId }) {
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

    if (coupon.plans && coupon.plans.length) {
      const linkedPlanIds = coupon.plans.map((link) => link.planId);
      if (!planId || !linkedPlanIds.includes(planId)) {
        return {
          valid: false,
          reason: couponMessagesCodes.COUPON_NOT_APPLICABLE,
        };
      }
    }

    return {
      valid: true,
      reason: null,
      discount: { type: coupon.type, value: Number(coupon.value) },
    };
  }
}

export const couponUsecase = new CouponUsecase();
