import { randomBytes } from "node:crypto";
import { badRequest, conflict, notFound } from "../../../shared/errors/AppError.js";
import { couponMessagesCodes, messagesNames } from "@aya/shared";
import { couponRepo } from "./coupon.repo.js";

class CouponUsecase {
  couponAvailabilityReason(coupon, now = new Date()) {
    if (!coupon?.isActive) return couponMessagesCodes.COUPON_INVALID;
    if (coupon.startsAt && now < coupon.startsAt) {
      return couponMessagesCodes.COUPON_NOT_ACTIVE_YET;
    }
    if (coupon.endsAt && now > coupon.endsAt) {
      return couponMessagesCodes.COUPON_EXPIRED;
    }
    if (
      coupon.maxRedemptions !== null &&
      coupon.redemptionsCount >= coupon.maxRedemptions
    ) {
      return couponMessagesCodes.COUPON_USAGE_LIMIT_REACHED;
    }
    return null;
  }

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

    // Empty planIds means a global coupon; otherwise persist the explicit plan
    // links. A null billing period applies to both monthly and yearly cycles.
    const data = {
      code,
      type: input.type,
      value: input.value,
      source: input.source,
      billingPeriod: input.billingPeriod ?? null,
      maxRedemptions: input.maxRedemptions,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isActive: input.isActive,
    };
    return couponRepo.createCoupon({ data, planIds: input.planIds });
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

    // planIds is optional on update: omitted preserves links, [] makes it global.
    const data = {
      code: input.code,
      type: input.type,
      value: input.value,
      source: input.source,
      billingPeriod: input.billingPeriod,
      maxRedemptions: input.maxRedemptions,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isActive: input.isActive,
    };
    return couponRepo.updateCoupon({ id, data, planIds: input.planIds });
  }

  async remove({ id, authUser }) {
    await this.getById(id);
    return couponRepo.deactivateCoupon({ id });
  }

  // ── validation (any authenticated user) ─────────────────────
  async validateCoupon({
    code,
    planId,
    billingPeriod,
    studentId,
    currentSubscriptionId = null,
  }) {
    const coupon = await couponRepo.getByCode(code);
    if (!coupon) {
      return { valid: false, reason: couponMessagesCodes.COUPON_NOT_FOUND };
    }
    const now = new Date();
    let alreadyAppliedToCurrent = false;
    if (studentId) {
      const usage = await couponRepo.findStudentCouponUsage({
        couponId: coupon.id,
        studentId: Number(studentId),
      });
      const usedSubscriptionId =
        usage.redemption?.subscriptionId ?? usage.subscription?.id ?? null;
      alreadyAppliedToCurrent =
        Boolean(currentSubscriptionId) &&
        Boolean(usage.redemption || usage.subscription) &&
        usedSubscriptionId === Number(currentSubscriptionId);
      if (
        Boolean(usage.redemption || usage.subscription) &&
        !alreadyAppliedToCurrent
      ) {
        return {
          valid: false,
          reason: couponMessagesCodes.COUPON_ALREADY_USED_BY_STUDENT,
        };
      }
    }

    // Re-submitting the coupon already attached to this same subscription is an
    // idempotent no-op. It stays valid after its window/cap has elapsed.
    if (!alreadyAppliedToCurrent) {
      const availabilityReason = this.couponAvailabilityReason(coupon, now);
      if (availabilityReason) {
        return { valid: false, reason: availabilityReason };
      }
    }

    const scopedPlanIds = (coupon.plans ?? []).map((link) => link.planId);
    if (
      scopedPlanIds.length > 0 &&
      (!planId || !scopedPlanIds.includes(Number(planId)))
    ) {
      return {
        valid: false,
        reason: couponMessagesCodes.COUPON_NOT_APPLICABLE,
      };
    }
    if (coupon.billingPeriod && coupon.billingPeriod !== billingPeriod) {
      return {
        valid: false,
        reason: couponMessagesCodes.COUPON_NOT_APPLICABLE,
      };
    }

    return {
      valid: true,
      reason: null,
      discount: {
        couponId: coupon.id,
        type: coupon.type,
        value: Number(coupon.value),
        billingPeriod: coupon.billingPeriod ?? null,
      },
    };
  }

  /**
   * Permanently consume a coupon once per student.
   *
   * The append-only ledger and guarded global counter update happen in the
   * caller's transaction. Replacing/removing/cancelling never releases usage.
   */
  async consumeOnce({
    couponId,
    studentId,
    subscriptionId,
    previousCouponId = null,
    client,
    now = new Date(),
  }) {
    if (!couponId || Number(previousCouponId) === Number(couponId)) return null;

    const usage = await couponRepo.findStudentCouponUsage({
      couponId: Number(couponId),
      studentId: Number(studentId),
      client,
    });
    const usedSubscriptionId =
      usage.redemption?.subscriptionId ?? usage.subscription?.id ?? null;
    if (
      (usage.redemption || usage.subscription) &&
      usedSubscriptionId !== Number(subscriptionId)
    ) {
      throw badRequest(
        couponMessagesCodes.COUPON_ALREADY_USED_BY_STUDENT,
        messagesNames.couponMessages,
      );
    }
    if (usage.redemption) return usage.redemption;

    let redemption;
    try {
      redemption = await couponRepo.createCouponRedemption({
        couponId: Number(couponId),
        studentId: Number(studentId),
        subscriptionId: Number(subscriptionId),
        client,
      });
    } catch (error) {
      if (error?.code === "P2002") {
        throw badRequest(
          couponMessagesCodes.COUPON_ALREADY_USED_BY_STUDENT,
          messagesNames.couponMessages,
        );
      }
      throw error;
    }

    const consumed = await couponRepo.incrementCouponRedemptionWithinLimit(
      Number(couponId),
      now,
      client,
    );
    if (!consumed.count) {
      const coupon = await couponRepo.getById({
        id: Number(couponId),
        client,
      });
      throw badRequest(
        this.couponAvailabilityReason(coupon, now) ??
          couponMessagesCodes.COUPON_USAGE_LIMIT_REACHED,
        messagesNames.couponMessages,
      );
    }

    return redemption;
  }

  /** Preserve proof from a legacy subscription before that row is deleted. */
  async preserveLegacyRedemption({
    couponId,
    studentId,
    subscriptionId,
    client,
  }) {
    if (!couponId) return null;
    const usage = await couponRepo.findStudentCouponUsage({
      couponId: Number(couponId),
      studentId: Number(studentId),
      client,
    });
    if (usage.redemption) return usage.redemption;
    try {
      return await couponRepo.createCouponRedemption({
        couponId: Number(couponId),
        studentId: Number(studentId),
        subscriptionId: Number(subscriptionId),
        client,
      });
    } catch (error) {
      if (error?.code === "P2002") return null;
      throw error;
    }
  }
}

export const couponUsecase = new CouponUsecase();
export { CouponUsecase };
