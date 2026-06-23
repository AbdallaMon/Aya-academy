import {
  NOTIFICATION_TYPES,
  SUBSCRIPTION_STATUSES,
  USER_ROLES,
  messagesNames,
} from "@aya/shared";
import { prisma } from "@aya/db/prisma.client.js";
import { badRequest, conflict, forbidden, notFound } from "../../shared/errors/AppError.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import { userRepo } from "../users/user.repo.js";
import { planRepo } from "../plans/plan.repo.js";
import { planUsecase } from "../plans/plan.usecase.js";
import { couponRepo } from "../coupons/coupon.repo.js";
import { couponUsecase } from "../coupons/coupon.usecase.js";
import { notificationUsecase } from "../notifications/notification.usecase.js";
import { subscriptionRepo } from "./subscription.repo.js";
import { subscriptionMessagesCodes } from "./subscription.messages.js";

class SubscriptionUsecase {
  /** Throws unless `authUser` may access the given subscription (by its studentId). */
  async assertCanAccess(authUser, studentId) {
    if (authUser.role === USER_ROLES.ADMIN) return;
    if (authUser.role === USER_ROLES.STUDENT) {
      if (authUser.id === studentId) return;
    } else if (authUser.role === USER_ROLES.PARENT) {
      const linked = await userRepo.isStudentOfParent(authUser.id, studentId);
      if (linked) return;
    }
    throw forbidden(subscriptionMessagesCodes.CANNOT_ACCESS_SUBSCRIPTION);
  }

  /** Resolve a subscription status from the date window when not provided. */
  resolveStatus(startDate, endDate, now = new Date()) {
    if (now < startDate) return SUBSCRIPTION_STATUSES.UPCOMING;
    if (now > endDate) return SUBSCRIPTION_STATUSES.EXPIRED;
    return SUBSCRIPTION_STATUSES.ACTIVE;
  }

  /**
   * Compute the price a student should be charged for a plan, honouring (1) the
   * plan's best active discount and (2) an optional coupon — whichever yields
   * the lower price wins. Reuses the plan/coupon math (no duplication).
   *
   * Returns the chosen price plus the ids of any consumed promotion so the
   * caller can atomically bump their redemption counters in the same tx.
   *
   * @param {object} plan      plan loaded with its `discounts[]`
   * @param {string=} couponCode  optional coupon code from the request
   * @returns {Promise<{ priceCharged:number, couponId:number|null, discountId:number|null }>}
   */
  async computePricing(plan, couponCode) {
    const now = new Date();
    const basePrice = Number(plan.hourlyRate) * plan.hours;

    let bestPrice = basePrice;
    let chosenDiscountId = null;
    let chosenCouponId = null;

    // (1) best active plan discount
    for (const discount of plan.discounts ?? []) {
      if (!planUsecase.isDiscountActive(discount, now)) continue;
      const candidate = planUsecase.applyDiscount(basePrice, discount);
      if (candidate < bestPrice) {
        bestPrice = candidate;
        chosenDiscountId = discount.id;
        chosenCouponId = null; // a plan discount won so far
      }
    }

    // (2) coupon, if supplied and valid for this plan
    if (couponCode) {
      const result = await couponUsecase.validateCoupon({
        code: couponCode,
        planId: plan.id,
      });
      if (!result.valid) {
        throw badRequest(
          subscriptionMessagesCodes.COUPON_INVALID,
          messagesNames.subscriptionMessages,
        );
      }
      // validateCoupon doesn't return the id; resolve it once for linking + increment.
      const coupon = await couponRepo.getByCode(couponCode);
      const candidate = planUsecase.applyDiscount(basePrice, {
        type: result.discount.type,
        value: result.discount.value,
      });
      if (candidate < bestPrice) {
        bestPrice = candidate;
        chosenCouponId = coupon.id;
        chosenDiscountId = null; // coupon beat the plan discount
      }
    }

    return {
      priceCharged: Math.round(bestPrice * 100) / 100,
      couponId: chosenCouponId,
      discountId: chosenDiscountId,
    };
  }

  /** End date for a plan period (1 month / 1 year) starting at `start`. */
  computeEndDate(start, billingPeriod) {
    const d = new Date(start);
    if (billingPeriod === "YEARLY") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d;
  }

  async buildListWhere(authUser, { studentId, status }) {
    const where = {};

    if (status) where.status = status;

    if (authUser.role === USER_ROLES.ADMIN) {
      if (studentId) where.studentId = studentId;
    } else if (authUser.role === USER_ROLES.PARENT) {
      const studentIds = await userRepo.getStudentIdsForParent(authUser.id);
      const scoped =
        studentId && studentIds.includes(studentId) ? [studentId] : studentIds;
      where.studentId = { in: scoped };
    } else {
      where.studentId = authUser.id;
    }
    return where;
  }

  async list(authUser, params) {
    const { skip, take, page, limit } = paginate({
      page: params.page,
      limit: params.limit,
    });
    const where = await this.buildListWhere(authUser, params);
    const { items, total } = await subscriptionRepo.listSubscriptions(
      where,
      skip,
      take,
    );
    return paginatedResult(items, total, page, limit);
  }

  async listExpiring(authUser, { page, limit, days }) {
    const { skip, take, page: p, limit: l } = paginate({ page, limit });

    // ADMIN only — others get an empty paginated list.
    if (authUser.role !== USER_ROLES.ADMIN) {
      return paginatedResult([], 0, p, l);
    }

    const windowDays = Number.isInteger(days) && days > 0 ? days : 7;
    const now = new Date();
    const until = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

    const where = {
      status: SUBSCRIPTION_STATUSES.ACTIVE,
      endDate: { gte: now, lte: until },
    };
    const { items, total } = await subscriptionRepo.listSubscriptions(
      where,
      skip,
      take,
    );
    return paginatedResult(items, total, p, l);
  }

  /**
   * GOAL 2 — for a set of studentIds, return the subset that is currently
   * subscribed (status ACTIVE AND now within [startDate, endDate]). Batched,
   * no N+1. Returns a `Set<number>` for O(1) membership checks by callers.
   */
  async getCurrentlySubscribedStudentIds(studentIds) {
    const ids =
      await subscriptionRepo.getCurrentlySubscribedStudentIds(studentIds);
    return new Set(ids);
  }

  async getById(authUser, id) {
    const subscription = await subscriptionRepo.getById(id);
    if (!subscription) {
      throw notFound(subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }
    await this.assertCanAccess(authUser, subscription.studentId);
    return subscription;
  }

  async create(authUser, input) {
    if (input.endDate <= input.startDate) {
      throw badRequest(
        subscriptionMessagesCodes.INVALID_DATE_RANGE,
        messagesNames.subscriptionMessages,
      );
    }

    const status =
      input.status ?? this.resolveStatus(input.startDate, input.endDate);

    const data = {
      status,
      startDate: input.startDate,
      endDate: input.endDate,
      totalHours: input.totalHours,
      remainingHours: input.remainingHours,
      priceCharged: input.priceCharged,
      notes: input.notes,
      student: { connect: { id: input.studentId } },
      createdBy: { connect: { id: authUser.id } },
    };
    if (input.planId !== undefined) {
      data.plan = { connect: { id: input.planId } };
    }
    if (input.couponId !== undefined) {
      data.coupon = { connect: { id: input.couponId } };
    }

    const subscription = await subscriptionRepo.createSubscription(data);

    // Notify the student — failure must not fail the request.
    try {
      await notificationUsecase.createNotification({
        userId: input.studentId,
        type: NOTIFICATION_TYPES.SUBSCRIPTION_CREATED,
        titleAr: "تم إنشاء اشتراك جديد",
        titleEn: "A new subscription has been created",
        link: "/dashboard",
      });
    } catch {
      // swallow — notification is best-effort
    }

    return subscription;
  }

  async update(authUser, id, input) {
    const existing = await subscriptionRepo.getById(id);
    if (!existing) {
      throw notFound(subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }

    const startDate = input.startDate ?? existing.startDate;
    const endDate = input.endDate ?? existing.endDate;
    if (endDate <= startDate) {
      throw badRequest(
        subscriptionMessagesCodes.INVALID_DATE_RANGE,
        messagesNames.subscriptionMessages,
      );
    }

    const data = {
      status: input.status,
      startDate: input.startDate,
      endDate: input.endDate,
      totalHours: input.totalHours,
      remainingHours: input.remainingHours,
      priceCharged: input.priceCharged,
      notes: input.notes,
    };
    if (input.studentId !== undefined) {
      data.student = { connect: { id: input.studentId } };
    }
    if (input.planId !== undefined) {
      data.plan = { connect: { id: input.planId } };
    }
    if (input.couponId !== undefined) {
      data.coupon = { connect: { id: input.couponId } };
    }

    const subscription = await subscriptionRepo.updateSubscription(id, data);

    // If the endDate was extended, notify the student of the renewal (best-effort).
    if (input.endDate && new Date(input.endDate) > new Date(existing.endDate)) {
      try {
        await notificationUsecase.createNotification({
          userId: subscription.studentId,
          type: NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED,
          titleAr: "تم تجديد اشتراكك",
          titleEn: "Your subscription has been renewed",
          link: "/dashboard",
        });
      } catch {
        // swallow — notification is best-effort
      }
    }

    return subscription;
  }

  async remove(authUser, id) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(subscriptionMessagesCodes.CANNOT_ACCESS_SUBSCRIPTION);
    }
    const existing = await subscriptionRepo.getById(id);
    if (!existing) {
      throw notFound(subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }
    return subscriptionRepo.updateSubscription(id, {
      status: SUBSCRIPTION_STATUSES.CANCELLED,
    });
  }

  /**
   * Parent (or admin on their behalf) requests a plan for a child.
   * Always creates a PENDING subscription; dates/hours/price are derived from
   * the chosen plan. Admins are notified to review it.
   */
  async request(authUser, input) {
    const studentId = input.studentId;

    if (authUser.role === USER_ROLES.PARENT) {
      const linked = await userRepo.isStudentOfParent(authUser.id, studentId);
      if (!linked) throw forbidden(subscriptionMessagesCodes.STUDENT_NOT_LINKED);
    } else if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(subscriptionMessagesCodes.CANNOT_ACCESS_SUBSCRIPTION);
    }

    const plan = await planRepo.getById(input.planId);
    if (!plan || !plan.isActive) {
      throw notFound(subscriptionMessagesCodes.PLAN_NOT_FOUND);
    }

    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const endDate = this.computeEndDate(startDate, plan.billingPeriod);

    // Apply the plan's best active discount and/or a valid coupon.
    const { priceCharged, couponId, discountId } = await this.computePricing(
      plan,
      input.couponCode,
    );

    const data = {
      status: SUBSCRIPTION_STATUSES.PENDING,
      startDate,
      endDate,
      totalHours: plan.hours,
      remainingHours: plan.hours,
      priceCharged,
      currency: plan.currency,
      notes: input.notes,
      student: { connect: { id: studentId } },
      plan: { connect: { id: plan.id } },
      createdBy: { connect: { id: authUser.id } },
    };
    if (couponId) data.coupon = { connect: { id: couponId } };

    // Create the subscription and consume any promotion atomically.
    const subscription = await prisma.$transaction(async (tx) => {
      const sub = await subscriptionRepo.createSubscription(data, tx);
      if (couponId) {
        await couponRepo.incrementCouponRedemption(couponId, tx);
      } else if (discountId) {
        await planRepo.incrementDiscountRedemption(discountId, tx);
      }
      return sub;
    });

    // Notify admins to review the pending request (best-effort).
    try {
      const adminIds = await userRepo.findAdminIds();
      if (adminIds.length) {
        await notificationUsecase.createManyForUsers(adminIds, {
          type: NOTIFICATION_TYPES.SUBSCRIPTION_CREATED,
          titleAr: "طلب اشتراك جديد بانتظار الموافقة",
          titleEn: "New subscription request pending approval",
          link: "/dashboard/subscriptions",
        });
      }
    } catch {
      // swallow — notification is best-effort
    }

    return subscription;
  }

  /** Admin approves a PENDING subscription → resolves status by date window. */
  async approve(authUser, id, input = {}) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(subscriptionMessagesCodes.CANNOT_ACCESS_SUBSCRIPTION);
    }
    const existing = await subscriptionRepo.getById(id);
    if (!existing) {
      throw notFound(subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }
    if (existing.status !== SUBSCRIPTION_STATUSES.PENDING) {
      throw badRequest(
        subscriptionMessagesCodes.NOT_PENDING,
        messagesNames.subscriptionMessages,
      );
    }

    const data = {
      status: this.resolveStatus(existing.startDate, existing.endDate),
    };
    if (input.priceCharged !== undefined) data.priceCharged = input.priceCharged;
    if (input.notes !== undefined) data.notes = input.notes;

    const updated = await subscriptionRepo.updateSubscription(id, data);

    try {
      await notificationUsecase.createNotification({
        userId: updated.studentId,
        type: NOTIFICATION_TYPES.SUBSCRIPTION_CREATED,
        titleAr: "تمت الموافقة على اشتراكك 🎉",
        titleEn: "Your subscription has been approved 🎉",
        link: "/dashboard",
      });
    } catch {
      // swallow — notification is best-effort
    }

    return updated;
  }

  /** Admin rejects a PENDING subscription → CANCELLED (with an optional reason). */
  async reject(authUser, id, input = {}) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(subscriptionMessagesCodes.CANNOT_ACCESS_SUBSCRIPTION);
    }
    const existing = await subscriptionRepo.getById(id);
    if (!existing) {
      throw notFound(subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }
    if (existing.status !== SUBSCRIPTION_STATUSES.PENDING) {
      throw badRequest(
        subscriptionMessagesCodes.NOT_PENDING,
        messagesNames.subscriptionMessages,
      );
    }

    const notes = input.reason
      ? `${existing.notes ? `${existing.notes} | ` : ""}مرفوض: ${input.reason}`
      : existing.notes;

    const updated = await subscriptionRepo.updateSubscription(id, {
      status: SUBSCRIPTION_STATUSES.CANCELLED,
      notes,
    });

    try {
      await notificationUsecase.createNotification({
        userId: updated.studentId,
        type: NOTIFICATION_TYPES.GENERIC,
        titleAr: "تم رفض طلب الاشتراك",
        titleEn: "Your subscription request was declined",
        link: "/dashboard",
      });
    } catch {
      // swallow — notification is best-effort
    }

    return updated;
  }

  /**
   * Admin cancels a subscription. Only allowed from PENDING / UPCOMING / ACTIVE;
   * already-expired/cancelled subscriptions can't be cancelled.
   */
  async cancel(authUser, id) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(subscriptionMessagesCodes.CANNOT_ACCESS_SUBSCRIPTION);
    }
    const existing = await subscriptionRepo.getById(id);
    if (!existing) {
      throw notFound(subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }

    const cancellable = [
      SUBSCRIPTION_STATUSES.PENDING,
      SUBSCRIPTION_STATUSES.UPCOMING,
      SUBSCRIPTION_STATUSES.ACTIVE,
    ];
    if (!cancellable.includes(existing.status)) {
      throw conflict(
        subscriptionMessagesCodes.CANNOT_CANCEL,
        messagesNames.subscriptionMessages,
      );
    }

    const updated = await subscriptionRepo.updateSubscription(id, {
      status: SUBSCRIPTION_STATUSES.CANCELLED,
    });

    try {
      await notificationUsecase.createNotification({
        userId: updated.studentId,
        type: NOTIFICATION_TYPES.GENERIC,
        titleAr: "تم إلغاء اشتراكك",
        titleEn: "Your subscription has been cancelled",
        link: "/dashboard",
      });
    } catch {
      // swallow — notification is best-effort
    }

    return updated;
  }
}

export const subscriptionUsecase = new SubscriptionUsecase();
