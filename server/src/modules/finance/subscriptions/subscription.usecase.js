import {
  BILLING_PERIODS,
  INVOICE_STATUSES,
  NOTIFICATION_TYPES,
  SUBSCRIPTION_ORIGINS,
  SUBSCRIPTION_STATUSES,
  USER_ROLES,
  messagesNames,
  subscriptionMessagesCodes,
} from "@aya/shared";
import { prisma } from "@aya/db/prisma.client.js";
import {
  endOfMonth,
  firstOfNextMonth,
  monthRange,
  previousMonth,
} from "../../../shared/utility/dates.js";
import { resolveUsageHours } from "./usageBilling.js";
import {
  AppError,
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../../shared/errors/AppError.js";
import { paginate, paginatedResult } from "../../../shared/utility/pagination.js";
import {
  applyDiscount,
  couponAppliesToPeriod,
  isCouponActive,
  priceForPeriod,
  roundMoney,
} from "../../../shared/utility/pricing.js";
import { userRepo } from "../../users/user.repo.js";
import { planRepo } from "../plans/plan.repo.js";
import { couponRepo } from "../coupons/coupon.repo.js";
import { couponUsecase } from "../coupons/coupon.usecase.js";
import { settingsUsecase } from "../../settings/settings.usecase.js";
import { paymentTemplateUsecase } from "../paymentTemplates/paymentTemplate.usecase.js";
import { notificationUsecase } from "../../notifications/notification.usecase.js";
import { invoiceRepo } from "../invoices/invoice.repo.js";
import { subscriptionRepo } from "./subscription.repo.js";

/**
 * Charged price derived from the subscription's hours × the global hourly rate.
 * Used when no explicit/coupon-derived price is supplied (admin edits hours →
 * pays more). Rounded via the shared money helper.
 */
function priceFromHours(subsHours, hourlyRate) {
  return roundMoney(Number(subsHours) * Number(hourlyRate));
}

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

  /**
   * Best-effort: ensure a demand invoice exists for a just-created subscription.
   * The invoice is a SNAPSHOT copy of the global template at creation time — later
   * template edits never touch it; only an explicit regenerate re-copies it.
   * Idempotent (generateForSubscription skips when one already exists) and
   * non-fatal — if it fails, the admin can still generate the invoice manually.
   *
   * Uses a dynamic import for invoiceUsecase to avoid the subscription↔invoice
   * circular module dependency (invoice.usecase imports this usecase).
   */
  async ensureInvoice(subscription, { plan } = {}) {
    if (!subscription || subscription.priceCharged == null) return;
    try {
      const [{ invoiceUsecase }, template, settings] = await Promise.all([
        import("../invoices/invoice.usecase.js"),
        paymentTemplateUsecase.get(null),
        settingsUsecase.getEffective(),
      ]);
      await invoiceUsecase.generateForSubscription(subscription, {
        template,
        settings,
        plan,
        createdById: subscription.createdById ?? null,
      });
    } catch {
      // swallow — invoice is best-effort; admin can generate it manually
    }
  }

  /**
   * Adjust coupon redemption counters when a subscription's coupon changes from
   * `oldCouponId` to `newCouponId`. Atomic when given the enclosing `tx`:
   *   - same id (incl. both null)        → no-op
   *   - had a coupon (oldCouponId)       → release one redemption (floored at 0)
   *   - now has a coupon (newCouponId)   → consume one redemption
   * Covers all transitions: old→new, old→none, none→new.
   */
  async swapCouponRedemption(oldCouponId, newCouponId, tx) {
    if (oldCouponId === newCouponId) return;
    if (oldCouponId) {
      await couponRepo.decrementCouponRedemption(oldCouponId, tx);
    }
    if (newCouponId) {
      await couponRepo.incrementCouponRedemption(newCouponId, tx);
    }
  }

  /**
   * Gate + cleanup run at the START of every creation tx (renew/request/create)
   * before a new subscription row is inserted. Enforces the two business rules:
   *
   *   1. ONE active at a time — if the student has a currently-ACTIVE
   *      subscription, refuse (no admin bypass). The teacher must CANCEL it first
   *      (ACTIVE → CANCELLED via cancel()).
   *   2. ONE in-flight at a time — auto-replace: any PENDING subscription(s) are
   *      deleted entirely (their invoice cascades; their coupon redemption is
   *      returned first). No error — the new request simply replaces the old one.
   *
   * Must run INSIDE the enclosing `tx` so the deletes/coupon-decrements are atomic
   * with the subsequent createSubscription.
   */
  async prepareForNewSubscription(studentId, tx) {
    // Rule 1 — block while a currently-active subscription exists.
    // getCurrentlySubscribedStudentIds (usecase wrapper) returns a Set<number>.
    const activeIds = await this.getCurrentlySubscribedStudentIds([studentId]);
    if (activeIds.has(studentId)) {
      throw new AppError({
        statusCode: 409,
        code: subscriptionMessagesCodes.SUBSCRIPTION_STILL_ACTIVE,
        translationKey: messagesNames.subscriptionMessages,
      });
    }

    // Rule 2 — auto-replace any in-flight (PENDING) subscription(s).
    const pendings = await subscriptionRepo.findPendingSubscriptionsByStudent({
      studentId,
    });
    for (const p of pendings) {
      if (p.origin === SUBSCRIPTION_ORIGINS.USAGE) continue; // never delete usage bills
      if (p.couponId) {
        await couponRepo.decrementCouponRedemption(p.couponId, tx);
      }
      await subscriptionRepo.deleteSubscription({ id: p.id, client: tx });
    }
  }

  /** Resolve a subscription status from the date window when not provided. */
  resolveStatus(startDate, endDate, now = new Date()) {
    if (now < startDate) return SUBSCRIPTION_STATUSES.UPCOMING;
    if (now > endDate) return SUBSCRIPTION_STATUSES.EXPIRED;
    return SUBSCRIPTION_STATUSES.ACTIVE;
  }

  /**
   * Compute the price a student is charged for a plan on the chosen billing
   * cycle. The discount is driven SOLELY by the (optional) coupon code: when a
   * valid code is attached the discount is applied; when none is attached the
   * base price is charged. The plan's own coupon is offered by the UI as a
   * removable default code — it is never silently auto-applied here.
   *
   * Returns the price plus the id of any consumed coupon so the caller can
   * atomically bump its redemption counter in the same tx.
   *
   * @param {object}  plan          plan loaded with `coupons[].coupon`
   * @param {string}  billingPeriod MONTHLY | YEARLY
   * @param {string=} couponCode    optional coupon code from the request
   * @returns {Promise<{ priceCharged:number, basePrice:number, couponId:number|null }>}
   */
  async computePricing(plan, billingPeriod, couponCode, hourlyRate) {
    const basePrice = roundMoney(priceForPeriod(plan, billingPeriod, hourlyRate));

    // A plan discount is NOT silently auto-applied: the price is the base price
    // unless an explicit coupon code is attached. The UI defaults the coupon to
    // the plan's own coupon (removable + replaceable), so a discount is always a
    // deliberate choice — removing it yields the base price.
    if (!couponCode) {
      return { priceCharged: basePrice, basePrice, couponId: null };
    }

    const result = await couponUsecase.validateCoupon({
      code: couponCode,
      planId: plan.id,
      billingPeriod,
    });
    if (!result.valid) {
      throw badRequest(
        subscriptionMessagesCodes.COUPON_INVALID,
        messagesNames.subscriptionMessages,
      );
    }
    const coupon = await couponRepo.getByCode(couponCode);
    const priceCharged = roundMoney(
      applyDiscount(basePrice, {
        type: result.discount.type,
        value: result.discount.value,
      }),
    );

    return {
      priceCharged,
      basePrice,
      couponId: coupon.id,
    };
  }

  /**
   * Price a USAGE subscription (hours × rate) with an optional coupon code.
   * Only plan-agnostic coupons validate (validateCoupon with planId: null).
   * Mirrors computePricing but the base is hours-derived, not plan-derived.
   */
  async computeUsagePricing({ subsHours, couponCode, hourlyRate }) {
    const base = priceFromHours(subsHours, hourlyRate);
    if (!couponCode) return { priceCharged: base, couponId: null };

    const result = await couponUsecase.validateCoupon({
      code: couponCode,
      planId: null,
      billingPeriod: BILLING_PERIODS.MONTHLY,
    });
    if (!result.valid) {
      throw badRequest(
        subscriptionMessagesCodes.COUPON_INVALID,
        messagesNames.subscriptionMessages,
      );
    }
    const coupon = await couponRepo.getByCode(couponCode);
    const priceCharged = roundMoney(
      applyDiscount(base, { type: result.discount.type, value: result.discount.value }),
    );
    return { priceCharged, couponId: coupon.id };
  }

  /** End date for a billing cycle (1 month / 1 year) starting at `start`. */
  computeEndDate(start, billingPeriod) {
    const d = new Date(start);
    if (billingPeriod === BILLING_PERIODS.YEARLY) {
      d.setFullYear(d.getFullYear() + 1);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    return d;
  }

  /**
   * Hide an unsent demand invoice from non-admins. A parent/student must not see
   * the invoice until the teacher has requested payment for it (sentAt set), so
   * we strip the embedded invoice projection for them when it hasn't been sent.
   * Admins always see it. Mutates + returns the row for convenience.
   */
  gateInvoiceForViewer(row, authUser) {
    if (!row) return row;
    if (authUser.role !== USER_ROLES.ADMIN && row.invoice && !row.invoice.sentAt) {
      row.invoice = null;
    }
    return row;
  }

  async list({ authUser, page, limit, studentId, status }) {
    const { skip, take, page: p, limit: l } = paginate({ page, limit });
    // Where-building now lives in the repo (reference convention).
    const { items, total } = await subscriptionRepo.listScoped({
      authUser,
      filters: { studentId, status },
      skip,
      take,
    });
    const gated = items.map((row) => this.gateInvoiceForViewer(row, authUser));
    return paginatedResult(gated, total, p, l);
  }

  async listExpiring({ authUser, page, limit, days }) {
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

  async getById({ authUser, id }) {
    const subscription = await subscriptionRepo.getById(id);
    if (!subscription) {
      throw notFound(subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }
    await this.assertCanAccess(authUser, subscription.studentId);
    return this.gateInvoiceForViewer(subscription, authUser);
  }

  /**
   * STORED model (v2): recompute-from-source. On every session mutation, find (or
   * create) the open UPCOMING USAGE subscription for the payment month (M+1) of a
   * session dated in month M, recompute its hours from the ACTUAL session sum for
   * the consumption month M, and STORE `subsHours`/`remainingHours`/`priceCharged`
   * on it. Recompute-from-source means no deltas → no drift.
   *
   * Only ever touches a still-open (UPCOMING) sub: once month-close has frozen it
   * (any other status) the number is settled, so a found non-UPCOMING sub is
   * returned untouched. The price mirrors the freeze's stored-coupon logic — any
   * coupon already attached to the open sub is applied to the hours-based base.
   */
  async recomputeOpenUsageSubscription({ studentId, sessionDate }) {
    const when = new Date(sessionDate);
    const paymentStart = firstOfNextMonth(when);
    const consumption = monthRange(when);
    const settings = await settingsUsecase.getEffective();
    const hourlyRate = Number(settings.hourlyRate);

    const open = await subscriptionRepo.findOpenUsageSubscription({
      studentId,
      paymentStart,
    });
    // Frozen/paid — never rewrite a settled number.
    if (open && open.status !== SUBSCRIPTION_STATUSES.UPCOMING) return open;

    const subsHours = await subscriptionRepo.sumUsageHoursForStudentMonth({
      studentId,
      gte: consumption.gte,
      lt: consumption.lt,
    });

    // price = hours × rate, minus any coupon already attached to the open sub
    // (same stored-coupon logic as the month-close freeze).
    const base = priceFromHours(subsHours, hourlyRate);
    const c = open?.coupon ?? null;
    const priceCharged = c
      ? roundMoney(applyDiscount(base, { type: c.type, value: Number(c.value) }))
      : base;

    if (!open) {
      return subscriptionRepo.createSubscription({
        origin: SUBSCRIPTION_ORIGINS.USAGE,
        status: SUBSCRIPTION_STATUSES.UPCOMING,
        billingPeriod: BILLING_PERIODS.MONTHLY,
        startDate: paymentStart,
        endDate: endOfMonth(paymentStart),
        subsHours,
        remainingHours: subsHours,
        priceCharged,
        currency: settings.currency,
        student: { connect: { id: studentId } },
      });
    }
    return subscriptionRepo.updateSubscription(open.id, {
      subsHours,
      remainingHours: subsHours,
      priceCharged,
    });
  }

  /**
   * Live accumulating-bill preview for a USAGE subscription: the consumed hours
   * in the sub's consumption month (its startDate − 1 month) and the projected
   * price at the current hourly rate. Read-scoped exactly like getById
   * (assertCanAccess by studentId). `frozen` is true once the sub has left the
   * open UPCOMING phase (month-close froze the number).
   */
  async usagePreview({ authUser, id }) {
    const sub = await subscriptionRepo.getById(id);
    if (!sub || sub.origin !== SUBSCRIPTION_ORIGINS.USAGE) {
      throw notFound(subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }
    await this.assertCanAccess(authUser, sub.studentId);

    const consumption = monthRange(previousMonth(sub.startDate)); // start − 1 month
    const hoursMap = await subscriptionRepo.sumUsageHoursByStudent(consumption);
    const usageHours = hoursMap.get(sub.studentId) ?? 0;
    const settings = await settingsUsecase.getEffective();

    return {
      usageHours,
      projectedPrice: priceFromHours(usageHours, Number(settings.hourlyRate)),
      currency: sub.currency,
      frozen: sub.status !== SUBSCRIPTION_STATUSES.UPCOMING,
    };
  }

  async create({ authUser, ...input }) {
    if (input.endDate <= input.startDate) {
      throw badRequest(
        subscriptionMessagesCodes.INVALID_DATE_RANGE,
        messagesNames.subscriptionMessages,
      );
    }

    const status =
      input.status ?? this.resolveStatus(input.startDate, input.endDate);
    const billingPeriod = input.billingPeriod ?? BILLING_PERIODS.MONTHLY;
    const settings = await settingsUsecase.getEffective();

    const data = {
      status,
      billingPeriod,
      startDate: input.startDate,
      endDate: input.endDate,
      subsHours: input.subsHours,
      // remainingHours inherits from subsHours unless explicitly provided.
      remainingHours: input.remainingHours ?? input.subsHours ?? null,
      priceCharged: input.priceCharged,
      currency: settings.currency,
      notes: input.notes,
      student: { connect: { id: input.studentId } },
      createdBy: { connect: { id: authUser.id } },
    };
    if (input.planId !== undefined) {
      data.plan = { connect: { id: input.planId } };
    }

    // A coupon may be linked by id, or by code (validated + discount applied to
    // the charged price so the invoice can show the discount breakdown).
    let couponIdToConsume = null;
    if (input.couponCode && input.planId) {
      const plan = await planRepo.getById(input.planId);
      if (!plan) throw notFound(subscriptionMessagesCodes.PLAN_NOT_FOUND);
      const result = await couponUsecase.validateCoupon({
        code: input.couponCode,
        planId: input.planId,
        billingPeriod,
      });
      if (!result.valid) {
        throw badRequest(
          subscriptionMessagesCodes.COUPON_INVALID,
          messagesNames.subscriptionMessages,
        );
      }
      const coupon = await couponRepo.getByCode(input.couponCode);
      const base = roundMoney(
        priceForPeriod(plan, billingPeriod, Number(settings.hourlyRate)),
      );
      data.priceCharged = roundMoney(
        applyDiscount(base, { type: result.discount.type, value: result.discount.value }),
      );
      data.coupon = { connect: { id: coupon.id } };
      couponIdToConsume = coupon.id;
    } else if (input.couponId !== undefined) {
      data.coupon = { connect: { id: input.couponId } };
    }

    // Price precedence: explicit priceCharged wins; else coupon-derived (set in
    // the branch above); else derive from subsHours × hourly rate.
    if (data.priceCharged == null && input.subsHours != null) {
      data.priceCharged = priceFromHours(
        input.subsHours,
        Number(settings.hourlyRate),
      );
    }

    const subscription = await prisma.$transaction(async (tx) => {
      // Block a 2nd active + clear any in-flight PENDING before creating.
      await this.prepareForNewSubscription(input.studentId, tx);
      const sub = await subscriptionRepo.createSubscription(data, tx);
      if (couponIdToConsume) {
        await couponRepo.incrementCouponRedemption(couponIdToConsume, tx);
      }
      return sub;
    });

    // Auto-create the demand invoice (snapshot of the template) for this sub.
    await this.ensureInvoice(subscription);

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

  async update({ authUser, id, ...input }) {
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
      billingPeriod: input.billingPeriod,
      startDate: input.startDate,
      endDate: input.endDate,
      subsHours: input.subsHours,
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

    // Edit hours → pay more: when hours change without an explicit price, the
    // charged price is recomputed from the new hours × the global hourly rate
    // (EditHoursDialog sends only hours, no price).
    if (input.subsHours !== undefined && input.priceCharged === undefined) {
      const settings = await settingsUsecase.getEffective();
      data.priceCharged = priceFromHours(
        input.subsHours,
        Number(settings.hourlyRate),
      );
    }

    const subscription = await subscriptionRepo.updateSubscription(id, data);

    // If subsHours or the charged price actually changed, best-effort regenerate
    // the demand invoice so its amount matches — mirror changePlan(). Guarded so
    // a notes-only edit doesn't regenerate.
    const hoursChanged =
      input.subsHours !== undefined && input.subsHours !== existing.subsHours;
    const priceChanged =
      data.priceCharged !== undefined &&
      Number(data.priceCharged) !== Number(existing.priceCharged);
    if (hoursChanged || priceChanged) {
      try {
        // Only refresh the demand invoice while it is still UNPAID (or absent):
        // a settled (PAID/VOID) invoice is a fixed record and must not have its
        // amount silently rewritten — regenerate is a full amount reset.
        const invoice = await invoiceRepo.getBySubscriptionId(id);
        if (!invoice || invoice.status === INVOICE_STATUSES.UNPAID) {
          const { invoiceUsecase } = await import(
            "../invoices/invoice.usecase.js"
          );
          await invoiceUsecase.regenerateForSubscription(id, {
            createdById: authUser.id,
          });
        }
      } catch {}
    }

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

  async remove({ authUser, id }) {
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
  async request({ authUser, ...input }) {
    const studentId = input.studentId;

    if (authUser.role === USER_ROLES.PARENT) {
      const linked = await userRepo.isStudentOfParent(authUser.id, studentId);
      if (!linked) throw forbidden(subscriptionMessagesCodes.STUDENT_NOT_LINKED);
    } else if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(subscriptionMessagesCodes.CANNOT_ACCESS_SUBSCRIPTION);
    }

    const plan = await planRepo.getByIdWithCoupons(input.planId);
    if (!plan || !plan.isActive) {
      throw notFound(subscriptionMessagesCodes.PLAN_NOT_FOUND);
    }

    const billingPeriod = input.billingPeriod ?? BILLING_PERIODS.MONTHLY;
    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const endDate = this.computeEndDate(startDate, billingPeriod);

    // Hours scale with the cycle: a yearly subscription bundles 12× the plan's
    // monthly hours.
    const hours =
      billingPeriod === BILLING_PERIODS.YEARLY ? plan.hours * 12 : plan.hours;

    // Price is derived from the single global hourly rate + currency.
    const settings = await settingsUsecase.getEffective();

    // Price for the chosen cycle with the best plan-linked coupon and/or code.
    const { priceCharged, couponId } = await this.computePricing(
      plan,
      billingPeriod,
      input.couponCode,
      Number(settings.hourlyRate),
    );

    const data = {
      status: SUBSCRIPTION_STATUSES.PENDING,
      billingPeriod,
      startDate,
      endDate,
      subsHours: hours,
      remainingHours: hours,
      priceCharged,
      currency: settings.currency,
      notes: input.notes,
      student: { connect: { id: studentId } },
      plan: { connect: { id: plan.id } },
      createdBy: { connect: { id: authUser.id } },
    };
    if (couponId) data.coupon = { connect: { id: couponId } };

    // Create the subscription and consume any coupon atomically.
    const subscription = await prisma.$transaction(async (tx) => {
      // Block while active + auto-replace any in-flight PENDING before creating.
      await this.prepareForNewSubscription(studentId, tx);
      const sub = await subscriptionRepo.createSubscription(data, tx);
      if (couponId) {
        await couponRepo.incrementCouponRedemption(couponId, tx);
      }
      return sub;
    });

    // Auto-create the demand invoice (snapshot of the template) for this sub.
    await this.ensureInvoice(subscription, { plan });

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
  async approve({ authUser, id, ...input }) {
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
  async reject({ authUser, id, ...input }) {
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

    // Release the coupon: a rejected request never materialised, so its
    // redemption must be returned. Atomic with the status update.
    const updated = await prisma.$transaction(async (tx) => {
      const sub = await subscriptionRepo.updateSubscription(
        id,
        { status: SUBSCRIPTION_STATUSES.CANCELLED, notes },
        tx,
      );
      if (existing.couponId) {
        await couponRepo.decrementCouponRedemption(existing.couponId, tx);
      }
      return sub;
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
  async cancel({ authUser, id }) {
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

    // Release the coupon when cancelling — the consumed redemption is returned.
    // Atomic with the status update.
    const updated = await prisma.$transaction(async (tx) => {
      const sub = await subscriptionRepo.updateSubscription(
        id,
        { status: SUBSCRIPTION_STATUSES.CANCELLED },
        tx,
      );
      if (existing.couponId) {
        await couponRepo.decrementCouponRedemption(existing.couponId, tx);
      }
      return sub;
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

  /**
   * Renew a subscription: create a brand-new PENDING subscription for the same
   * student, defaulting plan/period from the source and overridable per input.
   * Mirrors request()/create(): coupon validation + atomic redemption bump in a
   * tx, best-effort demand invoice, best-effort notification.
   *
   * One-active / one-in-flight rules (via prepareForNewSubscription inside the
   * creation tx): renewal is REFUSED while a currently-active subscription exists
   * (no bypass — cancel it first), and any in-flight PENDING subscription is
   * AUTO-REPLACED (deleted, invoice cascades, coupon un-redeemed).
   */
  async renew({ authUser, id, ...input }) {
    // 1. Load the source subscription and scope-check by its studentId.
    //    ADMIN: any; PARENT: only their own child; STUDENT: only self (and they
    //    lack the RENEW/REQUEST permission, so the route already blocks them).
    const source = await subscriptionRepo.getById(id);
    if (!source) {
      throw notFound(subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }
    await this.assertCanAccess(authUser, source.studentId);

    // 2. Resolve studentId + plan/period: default from source, override by input.
    const studentId = source.studentId;
    const planId = input.planId ?? source.planId;
    if (!planId) {
      throw badRequest(
        subscriptionMessagesCodes.PLAN_REQUIRED,
        messagesNames.subscriptionMessages,
      );
    }
    const billingPeriod =
      input.billingPeriod ?? source.billingPeriod ?? BILLING_PERIODS.MONTHLY;

    // 3. Active/in-flight handling now lives in prepareForNewSubscription, run
    //    inside the creation tx below: it BLOCKS while a currently-active
    //    subscription exists (no admin bypass — the teacher must cancel it first)
    //    and AUTO-REPLACES any PENDING subscription (deletes it, invoice cascades,
    //    coupon un-redeemed). No allowWhileActive override anymore.

    const plan = await planRepo.getByIdWithCoupons(planId);
    if (!plan || !plan.isActive) {
      throw notFound(subscriptionMessagesCodes.PLAN_NOT_FOUND);
    }

    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const endDate = this.computeEndDate(startDate, billingPeriod);

    // Hours scale with the cycle (yearly bundles 12× the monthly hours).
    const hours =
      billingPeriod === BILLING_PERIODS.YEARLY ? plan.hours * 12 : plan.hours;

    const settings = await settingsUsecase.getEffective();

    // 4. Price the chosen cycle with the (optional) coupon code.
    const { priceCharged, couponId } = await this.computePricing(
      plan,
      billingPeriod,
      input.couponCode,
      Number(settings.hourlyRate),
    );

    const data = {
      status: SUBSCRIPTION_STATUSES.PENDING,
      billingPeriod,
      startDate,
      endDate,
      subsHours: hours,
      remainingHours: hours,
      priceCharged,
      currency: settings.currency,
      student: { connect: { id: studentId } },
      plan: { connect: { id: plan.id } },
      createdBy: { connect: { id: authUser.id } },
    };
    if (couponId) data.coupon = { connect: { id: couponId } };

    // Create the new subscription and consume any coupon atomically.
    const subscription = await prisma.$transaction(async (tx) => {
      // Block while active + auto-replace any in-flight PENDING before creating.
      await this.prepareForNewSubscription(studentId, tx);
      const sub = await subscriptionRepo.createSubscription(data, tx);
      if (couponId) {
        await couponRepo.incrementCouponRedemption(couponId, tx);
      }
      return sub;
    });

    // 5. Auto-create the demand invoice (snapshot of the template) — best-effort.
    await this.ensureInvoice(subscription, { plan });

    // 6. Notify: a parent-initiated renewal pings admins to review; otherwise the
    //    student is told their subscription was renewed. Best-effort.
    try {
      if (authUser.role === USER_ROLES.PARENT) {
        const adminIds = await userRepo.findAdminIds();
        if (adminIds.length) {
          await notificationUsecase.createManyForUsers(adminIds, {
            type: NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED,
            titleAr: "طلب تجديد اشتراك بانتظار الموافقة",
            titleEn: "Subscription renewal request pending approval",
            link: "/dashboard/subscriptions",
          });
        }
      } else {
        await notificationUsecase.createNotification({
          userId: studentId,
          type: NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED,
          titleAr: "تم تجديد اشتراكك",
          titleEn: "Your subscription has been renewed",
          link: "/dashboard",
        });
      }
    } catch {
      // swallow — notification is best-effort
    }

    return subscription;
  }

  /**
   * Change the plan/period/coupon of a not-yet-paid subscription. Only allowed
   * while the demand invoice is unpaid (or absent). Recomputes price/hours/dates
   * for the new plan, then regenerates the invoice so its amounts match.
   */
  async changePlan({ authUser, id, ...input }) {
    // 1. TEACHER-ONLY. Changing an existing subscription's plan is an admin-only
    //    action — a parent can never switch a plan (they only request/renew a
    //    plan, which creates a NEW subscription). The route already requires the
    //    admin-only EDIT permission; this is the explicit belt-and-suspenders.
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(subscriptionMessagesCodes.CANNOT_ACCESS_SUBSCRIPTION);
    }
    const existing = await subscriptionRepo.getById(id);
    if (!existing) {
      throw notFound(subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }

    // An ACTIVE subscription is settled — its plan/period/coupon must not change.
    // Cancel it first, then create a fresh one. This is in ADDITION to the
    // invoice-UNPAID guard below.
    if (existing.status === SUBSCRIPTION_STATUSES.ACTIVE) {
      throw new AppError({
        statusCode: 409,
        code: subscriptionMessagesCodes.CANNOT_CHANGE_PLAN_PAID,
        translationKey: messagesNames.subscriptionMessages,
      });
    }

    // 2. Block the change once the demand invoice has been paid (or voided): the
    //    charged amounts are then settled and must not silently shift.
    const invoice = await invoiceRepo.getBySubscriptionId(id);
    if (invoice && invoice.status !== INVOICE_STATUSES.UNPAID) {
      throw new AppError({
        statusCode: 409,
        code: subscriptionMessagesCodes.CANNOT_CHANGE_PLAN_PAID,
        translationKey: messagesNames.subscriptionMessages,
      });
    }

    const plan = await planRepo.getByIdWithCoupons(input.planId);
    if (!plan || !plan.isActive) {
      throw notFound(subscriptionMessagesCodes.PLAN_NOT_FOUND);
    }

    const billingPeriod =
      input.billingPeriod ?? existing.billingPeriod ?? BILLING_PERIODS.MONTHLY;
    const settings = await settingsUsecase.getEffective();

    // 3. Recompute price/hours/dates for the new plan + period + coupon.
    const { priceCharged, couponId } = await this.computePricing(
      plan,
      billingPeriod,
      input.couponCode,
      Number(settings.hourlyRate),
    );
    const hours =
      billingPeriod === BILLING_PERIODS.YEARLY ? plan.hours * 12 : plan.hours;
    const startDate = existing.startDate;
    const endDate = this.computeEndDate(startDate, billingPeriod);

    const data = {
      billingPeriod,
      endDate,
      subsHours: hours,
      remainingHours: hours,
      priceCharged,
      plan: { connect: { id: plan.id } },
      coupon: couponId ? { connect: { id: couponId } } : { disconnect: true },
    };

    // 4. Persist the change + correct the coupon redemption accounting atomically.
    //    The new coupon (couponId) may differ from the sub's current one
    //    (existing.couponId): old->new, old->none, none->new are all handled by
    //    swapCouponRedemption. Without this the old coupon stays burned and the
    //    new one is never counted.
    const updated = await prisma.$transaction(async (tx) => {
      await this.swapCouponRedemption(existing.couponId, couponId, tx);
      return subscriptionRepo.updateSubscription(id, data, tx);
    });

    // 5. Regenerate the demand invoice so its amounts AND discount snapshot match
    //    the new plan/coupon. Uses the system regenerate (no admin gate) so a
    //    PARENT changing the plan also refreshes the invoice. Dynamic import
    //    avoids the subscription↔invoice circular import. Best-effort.
    try {
      const { invoiceUsecase } = await import("../invoices/invoice.usecase.js");
      await invoiceUsecase.regenerateForSubscription(id, {
        createdById: authUser.id,
      });
    } catch {
      // swallow — invoice regeneration is best-effort
    }

    // 6. Notify the student the plan changed (best-effort).
    try {
      await notificationUsecase.createNotification({
        userId: updated.studentId,
        type: NOTIFICATION_TYPES.SUBSCRIPTION_CREATED,
        titleAr: "تم تغيير خطة اشتراكك",
        titleEn: "Your subscription plan has been changed",
        link: "/dashboard",
      });
    } catch {
      // swallow — notification is best-effort
    }

    return updated;
  }

  /**
   * Apply, replace, or remove the SINGLE coupon on a not-yet-paid subscription
   * without changing its plan/period. An empty/absent couponCode REMOVES the
   * coupon (charges the base price). Recomputes the charged price for the SAME
   * plan + billing period with the new code, swaps the coupon redemption
   * accounting atomically (old->new / old->none / none->new), then regenerates
   * the demand invoice so its amounts match.
   */
  async applyCoupon({ authUser, id, ...input }) {
    // 1. Load + object-scope check (ADMIN any, PARENT own child, STUDENT self).
    const existing = await subscriptionRepo.getById(id);
    if (!existing) {
      throw notFound(subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }
    await this.assertCanAccess(authUser, existing.studentId);

    // An ACTIVE subscription is settled — its coupon must not change (no admin
    // bypass). This is in ADDITION to the invoice-UNPAID guard below.
    if (existing.status === SUBSCRIPTION_STATUSES.ACTIVE) {
      throw new AppError({
        statusCode: 409,
        code: subscriptionMessagesCodes.CANNOT_CHANGE_PLAN_PAID,
        translationKey: messagesNames.subscriptionMessages,
      });
    }

    // 2. Block once the demand invoice is settled (paid/voided): the charged
    //    amounts are fixed and must not silently shift.
    const invoice = await invoiceRepo.getBySubscriptionId(id);
    if (invoice && invoice.status !== INVOICE_STATUSES.UNPAID) {
      throw new AppError({
        statusCode: 409,
        code: subscriptionMessagesCodes.CANNOT_CHANGE_PLAN_PAID,
        translationKey: messagesNames.subscriptionMessages,
      });
    }

    // 3. Recompute the price with the new code. A falsy code (empty/null/absent)
    //    yields couponId null = coupon removed. USAGE subs are hours-based and
    //    plan-agnostic; MANUAL subs stay plan-based (unchanged).
    const settings = await settingsUsecase.getEffective();
    let priceCharged;
    let couponId;

    if (existing.origin === SUBSCRIPTION_ORIGINS.USAGE) {
      if (existing.subsHours == null) {
        // Accumulating (not frozen): attach the coupon now; the discount is
        // computed at month-close freeze. Validate the code so a bad code is
        // rejected immediately; price stays null (derived until freeze).
        if (input.couponCode) {
          const result = await couponUsecase.validateCoupon({
            code: input.couponCode,
            planId: null,
            billingPeriod: BILLING_PERIODS.MONTHLY,
          });
          if (!result.valid) {
            throw badRequest(
              subscriptionMessagesCodes.COUPON_INVALID,
              messagesNames.subscriptionMessages,
            );
          }
          const coupon = await couponRepo.getByCode(input.couponCode);
          couponId = coupon.id;
        } else {
          couponId = null;
        }
        priceCharged = existing.priceCharged ?? null; // unchanged / still derived
      } else {
        // Frozen (PENDING, pre-activation): recompute hours-based price now.
        ({ priceCharged, couponId } = await this.computeUsagePricing({
          subsHours: existing.subsHours,
          couponCode: input.couponCode,
          hourlyRate: Number(settings.hourlyRate),
        }));
      }
    } else {
      // MANUAL path — unchanged (plan-based).
      if (!existing.planId) {
        throw badRequest(
          subscriptionMessagesCodes.PLAN_REQUIRED,
          messagesNames.subscriptionMessages,
        );
      }
      const plan = await planRepo.getByIdWithCoupons(existing.planId);
      if (!plan) throw notFound(subscriptionMessagesCodes.PLAN_NOT_FOUND);
      const billingPeriod = existing.billingPeriod ?? BILLING_PERIODS.MONTHLY;
      ({ priceCharged, couponId } = await this.computePricing(
        plan,
        billingPeriod,
        input.couponCode,
        Number(settings.hourlyRate),
      ));
    }

    // 4. Persist price + coupon link and correct redemption accounting atomically.
    const updated = await prisma.$transaction(async (tx) => {
      await this.swapCouponRedemption(existing.couponId, couponId, tx);
      return subscriptionRepo.updateSubscription(
        id,
        {
          priceCharged,
          coupon: couponId
            ? { connect: { id: couponId } }
            : { disconnect: true },
        },
        tx,
      );
    });

    // 5. Regenerate the demand invoice so its amounts AND discount snapshot match
    //    the new coupon. Uses the system regenerate (no admin gate) so a PARENT
    //    applying/removing a coupon also refreshes the invoice. Dynamic import
    //    avoids the subscription<->invoice circular dependency. Best-effort.
    try {
      const { invoiceUsecase } = await import("../invoices/invoice.usecase.js");
      await invoiceUsecase.regenerateForSubscription(id, {
        createdById: authUser.id,
      });
    } catch {
      // swallow — invoice regeneration is best-effort
    }

    return updated;
  }

  /**
   * Admin activates a not-yet-started subscription. Only PENDING/UPCOMING may be
   * activated; the resulting status is resolved from the date window (ACTIVE if
   * the window is current, UPCOMING if it starts later). Optionally marks the
   * demand invoice paid via the invoice usecase's transition-guarded path.
   *
   * The reverse direction (paying the invoice activates the subscription) lives
   * in invoice.usecase and is intentionally left untouched.
   */
  async activate({ authUser, id, ...input }) {
    // 1. ADMIN-only — the route's ACTIVATE permission enforces this; we re-assert
    //    object scope (ADMIN passes for any subscription).
    const existing = await subscriptionRepo.getById(id);
    if (!existing) {
      throw notFound(subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }
    await this.assertCanAccess(authUser, existing.studentId);

    // 2. Transition guard: only a not-yet-started subscription can be activated.
    //    Reusing NOT_PENDING here — the same code the approve/reject actions use
    //    for "the subscription is not in a state this action accepts". There is
    //    no dedicated invalid-activation code, and minting one would be noise;
    //    SUBSCRIPTION_ACTIVATED is the success message, so it can't double as the
    //    error.
    const activatable = [
      SUBSCRIPTION_STATUSES.PENDING,
      SUBSCRIPTION_STATUSES.UPCOMING,
    ];
    if (!activatable.includes(existing.status)) {
      throw new AppError({
        statusCode: 409,
        code: subscriptionMessagesCodes.NOT_PENDING,
        translationKey: messagesNames.subscriptionMessages,
      });
    }

    // 3. Resolve the new status from the date window and persist.
    const status = this.resolveStatus(existing.startDate, existing.endDate);
    const updated = await subscriptionRepo.updateSubscription(id, { status });

    // 4. Optionally mark the demand invoice paid using the SAME transition-guarded
    //    path the invoice edit uses (UNPAID → PAID). We do NOT pass
    //    activateSubscription, since we have already activated here. Dynamic
    //    import avoids the circular dependency. Best-effort.
    if (input.markInvoicePaid) {
      try {
        const invoice = await invoiceRepo.getBySubscriptionId(id);
        if (invoice && invoice.status === INVOICE_STATUSES.UNPAID) {
          const { invoiceUsecase } = await import(
            "../invoices/invoice.usecase.js"
          );
          await invoiceUsecase.update(authUser, invoice.id, {
            status: INVOICE_STATUSES.PAID,
          });
        }
      } catch {
        // swallow — invoice payment is best-effort
      }
    }

    // 5. Notify the student's PARENT(s) — they manage the subscription and pay
    //    for it, so the activation notice goes to them, not to the student
    //    (best-effort). The parent's notification deep-links to the subscription.
    try {
      const parentIds = await userRepo.getParentIdsForStudent(updated.studentId);
      if (parentIds.length) {
        await notificationUsecase.createManyForUsers(parentIds, {
          type: NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED,
          titleAr: "تم تفعيل اشتراك ابنك/ابنتك 🎉",
          titleEn: "Your child's subscription has been activated 🎉",
          link: `/dashboard/subscriptions/${updated.id}`,
          dataJson: { subscriptionId: updated.id, studentId: updated.studentId },
        });
      }
    } catch {
      // swallow — notification is best-effort
    }

    return updated;
  }

  /**
   * End-of-month usage billing — invoked by subscriptionScheduler on the last
   * day of the month. For every active student: freeze the consumed hours (or
   * plan / lowest-plan fallback), stamp the billed sessions, generate + send the
   * invoice, and expire the closing month's sub. Idempotent per (student, month)
   * via the one-open-USAGE-sub invariant. Never throws over the edge.
   *
   * @param {Date} [now] last day of month M (the month being closed).
   * @returns {Promise<{ invoiced:number, skipped:number, failed:number }>}
   */
  async generateMonthlyUsageInvoices(now = new Date()) {
    const consumption = monthRange(now);            // [1/M, 1/(M+1)) — closing month
    const paymentStart = consumption.lt;            // 1/(M+1)
    const paymentEnd = endOfMonth(paymentStart);
    const settings = await settingsUsecase.getEffective();
    const hourlyRate = Number(settings.hourlyRate);

    const [usageByStudent, activeStudents, lowestPlanHours] = await Promise.all([
      subscriptionRepo.sumUsageHoursByStudent(consumption),
      subscriptionRepo.listActiveStudentsWithPlan(now),
      subscriptionRepo.lowestActivePlanHours(),
    ]);

    let invoiced = 0;
    let skipped = 0;
    let failed = 0;

    for (const { studentId, planHours } of activeStudents) {
      try {
        const usageHours = usageByStudent.get(studentId) ?? 0;
        const subsHours = resolveUsageHours({ usageHours, planHours, lowestPlanHours });

        if (!subsHours || subsHours <= 0) {
          skipped += 1; // only when the system has no plans at all
          continue;
        }

        // Resolve the open sub first — this drives BOTH idempotency and pricing.
        // Idempotency: a re-run sees the closing month's sessions already stamped
        // billed (sumUsageHoursByStudent → 0) and would fall back to plan hours,
        // clobbering the already-frozen number and reverting an ACTIVE/paid sub
        // back to PENDING. So freeze ONLY subs that are still open (UPCOMING) or
        // are freshly created in this run: an existing open sub that has already
        // left UPCOMING was frozen by a prior run → skip it (true no-op).
        const existingOpen = await subscriptionRepo.findOpenUsageSubscription({
          studentId,
          paymentStart,
        });
        if (
          existingOpen &&
          existingOpen.status !== SUBSCRIPTION_STATUSES.UPCOMING
        ) {
          skipped += 1; // already billed by a prior run
          continue;
        }

        // Freeze price from the coupon ALREADY attached to the open sub. Its
        // redemption was booked at attach time, so we do NOT re-validate it here:
        // re-validating can now return invalid (redemption consumed / window
        // elapsed) and abort the whole run. Apply the stored discount directly.
        const base = priceFromHours(subsHours, hourlyRate);
        const storedCoupon = existingOpen?.coupon ?? null;
        const priceCharged = storedCoupon
          ? roundMoney(
              applyDiscount(base, {
                type: storedCoupon.type,
                value: storedCoupon.value,
              }),
            )
          : base;

        const sub = await prisma.$transaction(async (tx) => {
          let open = await subscriptionRepo.findOpenUsageSubscription({
            studentId,
            paymentStart,
            client: tx,
          });
          if (!open) {
            open = await subscriptionRepo.createSubscription(
              {
                origin: SUBSCRIPTION_ORIGINS.USAGE,
                status: SUBSCRIPTION_STATUSES.PENDING,
                billingPeriod: BILLING_PERIODS.MONTHLY,
                startDate: paymentStart,
                endDate: paymentEnd,
                currency: settings.currency,
                student: { connect: { id: studentId } },
              },
              tx,
            );
          }
          // freeze the final number + price, mark it awaiting payment.
          const frozen = await subscriptionRepo.updateSubscription(
            open.id,
            {
              subsHours,
              remainingHours: subsHours,
              priceCharged,
              status: SUBSCRIPTION_STATUSES.PENDING,
            },
            tx,
          );
          // stamp the sessions that were just billed (only when real usage).
          if (usageHours > 0) {
            await subscriptionRepo.markSessionsBilled({
              studentId,
              gte: consumption.gte,
              lt: consumption.lt,
              subscriptionId: frozen.id,
              client: tx,
            });
          }
          return frozen;
        });

        await this.ensureInvoice(sub);     // existing idempotent invoice generator
        invoiced += 1;
      } catch (err) {
        // Per-student isolation: one student's failure must not abort the whole
        // month-close run. Count it, log the studentId + code/message, move on.
        failed += 1;
        console.error(
          `generateMonthlyUsageInvoices: student ${studentId} failed`,
          err?.code || err?.message,
        );
        continue;
      }
    }

    return { invoiced, skipped, failed };
  }
}

export const subscriptionUsecase = new SubscriptionUsecase();
export { SubscriptionUsecase };
