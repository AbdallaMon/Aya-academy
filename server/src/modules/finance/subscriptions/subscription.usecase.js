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
  calendarMonthWindow,
  endOfMonth,
  firstOfNextMonth,
  monthRange,
  previousMonth,
  usageMonthKey,
} from "../../../shared/utility/dates.js";
import { resolveUsageMinutes } from "./usageBilling.js";
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
  priceFromMinutes,
  priceForPeriod,
  roundMoney,
} from "../../../shared/utility/pricing.js";
import {
  legacyValueToMinutes,
  minutesFromHours,
} from "../../../shared/utility/duration.js";
import { userRepo } from "../../users/user.repo.js";
import { planRepo } from "../plans/plan.repo.js";
import { couponRepo } from "../coupons/coupon.repo.js";
import { couponUsecase } from "../coupons/coupon.usecase.js";
import { settingsUsecase } from "../../settings/settings.usecase.js";
import { paymentTemplateUsecase } from "../paymentTemplates/paymentTemplate.usecase.js";
import { notificationUsecase } from "../../notifications/notification.usecase.js";
import { invoiceRepo } from "../invoices/invoice.repo.js";
import { subscriptionRepo } from "./subscription.repo.js";

class SubscriptionUsecase {
  sumSessionRowsMinutes(rows = []) {
    return rows.reduce(
      (total, row) =>
        total +
        (row.durationMinutes != null
          ? Number(row.durationMinutes)
          : (legacyValueToMinutes(row.durationHours) ?? 0)),
      0,
    );
  }

  usageSlotKey(
    studentId,
    startDate,
    status = SUBSCRIPTION_STATUSES.UPCOMING,
  ) {
    if (
      [
        SUBSCRIPTION_STATUSES.CANCELLED,
        SUBSCRIPTION_STATUSES.EXPIRED,
      ].includes(status)
    ) {
      return null;
    }
    return usageMonthKey(studentId, startDate);
  }

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
    } catch (error) {
      console.error("[subscription-invoice-sync] invoice creation failed", {
        subscriptionId: subscription.id,
        code: error?.code,
        message: error?.message,
      });
      // swallow — invoice is best-effort; admin can generate it manually
    }
  }

  /**
   * Keep an existing unpaid invoice financially synchronized without replacing
   * its admin-edited template/notes. If no invoice exists yet, create it.
   */
  async refreshOrEnsureInvoice(subscription, { plan } = {}) {
    if (!subscription || subscription.priceCharged == null) return;
    try {
      const existing = await invoiceRepo.getBySubscriptionId(subscription.id);
      if (!existing) {
        await this.ensureInvoice(subscription, { plan });
        return;
      }
      if (existing.status !== INVOICE_STATUSES.UNPAID) return;
      const { invoiceUsecase } = await import("../invoices/invoice.usecase.js");
      await invoiceUsecase.refreshAmountsForSubscription(subscription.id);
    } catch (error) {
      console.error("[subscription-invoice-sync] invoice refresh failed", {
        subscriptionId: subscription.id,
        code: error?.code,
        message: error?.message,
      });
      // best-effort; the subscription remains the source of truth
    }
  }

  /** A next-month usage bill remains editable until its invoice is settled. */
  isMutableUsageSubscription(subscription) {
    if (!subscription) return true;
    if (
      ![
        SUBSCRIPTION_STATUSES.PENDING,
        SUBSCRIPTION_STATUSES.UPCOMING,
      ].includes(subscription.status)
    ) {
      return false;
    }
    return (
      !subscription.invoice ||
      subscription.invoice.status === INVOICE_STATUSES.UNPAID
    );
  }

  /**
   * Resolve the usage bill's plan in priority order:
   * existing link -> student's inherited link -> featured/default active plan.
   */
  async resolveUsagePlan(studentId, open = null) {
    if (open?.planId) {
      const linked = await planRepo.getByIdWithCoupons(open.planId);
      if (linked) return linked;
    }
    const inheritedPlanId =
      await subscriptionRepo.currentPlanIdForStudent(studentId);
    if (inheritedPlanId) {
      const inherited = await planRepo.getByIdWithCoupons(inheritedPlanId);
      if (inherited) return inherited;
    }
    return planRepo.getDefaultActiveWithCoupons();
  }

  /** Immediately materialize the next calendar bucket for a new current sub. */
  async ensureNextUsageForCurrentSubscription(subscription, now = new Date()) {
    if (!subscription) return;
    const start = new Date(subscription.startDate);
    const end = new Date(subscription.endDate);
    if (start > now || end < now) return;
    try {
      await this.recomputeOpenUsageSubscription({
        studentId: subscription.studentId,
        sessionDate: now,
      });
    } catch {
      // best-effort; the daily seed retries
    }
  }

  runTransaction(work) {
    return prisma.$transaction(work);
  }

  /** Permanently consume a newly attached coupon inside the enclosing tx. */
  async consumeCoupon({
    previousCouponId = null,
    couponId,
    studentId,
    subscriptionId,
    tx,
  }) {
    return couponUsecase.consumeOnce({
      previousCouponId,
      couponId,
      studentId,
      subscriptionId,
      client: tx,
    });
  }

  /**
   * Gate + cleanup run at the START of every creation tx (renew/request/create)
   * before a new subscription row is inserted. Enforces the two business rules:
   *
   *   1. ONE active at a time — if the student has a currently-ACTIVE
   *      subscription, refuse (no admin bypass). The teacher must CANCEL it first
   *      (ACTIVE → CANCELLED via cancel()).
   *   2. ONE in-flight at a time — auto-replace: any PENDING subscription(s) are
   *      deleted entirely (their invoice cascades). Coupon consumption remains
   *      permanent. No error — the new request simply replaces the old one.
   *
   * Must run INSIDE the enclosing `tx` so deletes and creation stay atomic.
   */
  async prepareForNewSubscription(studentId, tx) {
    // Rule 1 — block while a currently-active subscription exists.
    // getCurrentlySubscribedStudentIds (usecase wrapper) returns a Set<number>.
    const activeIds = await this.getCurrentlySubscribedStudentIds(
      [studentId],
      tx,
    );
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
      client: tx,
    });
    for (const p of pendings) {
      if (p.origin === SUBSCRIPTION_ORIGINS.USAGE) continue; // never delete usage bills
      await couponUsecase.preserveLegacyRedemption({
        couponId: p.couponId,
        studentId,
        subscriptionId: p.id,
        client: tx,
      });
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
   * cycle. An explicit code is validated for the student; otherwise the best
   * unused plan coupon may be applied automatically when that option is enabled.
   *
   * Returns the price plus the coupon id; the caller consumes it atomically in
   * the same transaction that creates/updates the subscription.
   *
   * @param {object}  plan          plan loaded with `coupons[].coupon`
   * @param {string}  billingPeriod MONTHLY | YEARLY
   * @param {string=} couponCode    optional coupon code from the request
   * @returns {Promise<{ priceCharged:number, basePrice:number, couponId:number|null }>}
   */
  async computePricing(
    plan,
    billingPeriod,
    couponCode,
    hourlyRate,
    {
      studentId = null,
      currentSubscriptionId = null,
      autoPlanCoupon = true,
    } = {},
  ) {
    const periodHours =
      billingPeriod === BILLING_PERIODS.YEARLY
        ? Number(plan.hours) * 12
        : Number(plan.hours);
    return this.computeUsagePricing({
      subsMinutes: minutesFromHours(periodHours),
      couponCode,
      hourlyRate,
      planId: plan.id,
      plan,
      billingPeriod,
      studentId,
      currentSubscriptionId,
      autoPlanCoupon,
    });
  }

  /** Best currently-active discount linked to a plan for the requested cycle. */
  bestPlanCoupon(plan, billingPeriod, basePrice, now = new Date()) {
    const linked = (plan?.coupons ?? [])
      .map((link) => link.coupon)
      .filter(
        (coupon) =>
          isCouponActive(coupon, now) &&
          couponAppliesToPeriod(coupon, billingPeriod),
      );
    if (!linked.length) return null;
    return linked.reduce((best, coupon) => {
      const net = roundMoney(
        applyDiscount(basePrice, {
          type: coupon.type,
          value: Number(coupon.value),
        }),
      );
      return !best || net < best.net ? { coupon, net } : best;
    }, null)?.coupon;
  }

  /**
   * Price a subscription STRICTLY from its own minutes:
   * base = subsMinutes × hourlyRate ÷ 60,
   * then the coupon discount is applied to THAT total (never the plan's hours).
   * `planId` (optional) is used ONLY to validate a plan-scoped coupon code — it
   * never affects the base. This is the single pricing path for every
   * subscription (create, apply-coupon, recompute, freeze).
   */
  async computeUsagePricing({
    subsMinutes,
    couponCode,
    hourlyRate,
    planId = null,
    plan = null,
    existingCoupon = null,
    billingPeriod = BILLING_PERIODS.MONTHLY,
    autoPlanCoupon = true,
    studentId = null,
    currentSubscriptionId = null,
  }) {
    const base = priceFromMinutes(subsMinutes, hourlyRate);
    let coupon = existingCoupon;

    if (couponCode !== undefined && couponCode !== null) {
      const code = String(couponCode).trim();
      coupon = null;
      if (code) {
        const result = await couponUsecase.validateCoupon({
          code,
          planId,
          billingPeriod,
          studentId,
          currentSubscriptionId,
        });
        if (!result.valid) {
          throw badRequest(result.reason, messagesNames.couponMessages);
        }
        coupon = await couponRepo.getByCode(code);
      }
    } else if (!coupon && autoPlanCoupon) {
      const candidates = (plan?.coupons ?? [])
        .map((link) => link.coupon)
        .filter(
          (candidate) =>
            isCouponActive(candidate) &&
            couponAppliesToPeriod(candidate, billingPeriod),
        )
        .sort((left, right) => {
          const leftNet = applyDiscount(base, {
            type: left.type,
            value: Number(left.value),
          });
          const rightNet = applyDiscount(base, {
            type: right.type,
            value: Number(right.value),
          });
          return leftNet - rightNet;
        });

      for (const candidate of candidates) {
        if (!studentId) {
          coupon = candidate;
          break;
        }
        const result = await couponUsecase.validateCoupon({
          code: candidate.code,
          planId,
          billingPeriod,
          studentId,
          currentSubscriptionId,
        });
        if (result.valid) {
          coupon = candidate;
          break;
        }
      }
    }

    if (!coupon) {
      return { priceCharged: base, basePrice: base, couponId: null };
    }
    const priceCharged = roundMoney(
      applyDiscount(base, {
        type: coupon.type,
        value: Number(coupon.value),
      }),
    );
    return {
      priceCharged,
      basePrice: base,
      couponId: coupon.id,
    };
  }

  /**
   * Calendar-aligned end date. Monthly subscriptions always cover one complete
   * calendar month. Yearly compatibility covers twelve complete months.
   */
  computeEndDate(start, billingPeriod) {
    const { startDate } = calendarMonthWindow(start);
    if (billingPeriod === BILLING_PERIODS.YEARLY) {
      return endOfMonth(
        new Date(
          Date.UTC(
            startDate.getUTCFullYear(),
            startDate.getUTCMonth() + 11,
            1,
          ),
        ),
      );
    }
    return endOfMonth(startDate);
  }

  computeStartDate(start) {
    return calendarMonthWindow(start).startDate;
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

  /**
   * Subscriptions list — two shapes, both paginated `{ items, total, page,
   * pageSize }` (V2-5):
   *
   *   • studentId provided (a student's page) → items are RAW subscription rows,
   *     ALL of that student's subs newest-first. No latest-per-student collapse,
   *     so the current (being paid) + next (accumulating) sub both surface.
   *
   *   • no studentId (global admin/parent list) → items are ONE summary per
   *     student: `{ studentId, current, next }` where `current` is the active sub
   *     and `next` is the open UPCOMING USAGE sub (either may be null). The card
   *     grid renders current + next together.
   */
  async list({ authUser, page, limit, studentId, status }) {
    const { skip, take, page: p, limit: l } = paginate({ page, limit });

    if (studentId) {
      // Student-scoped: all rows newest-first (bypasses the latest collapse).
      const { items, total } = await subscriptionRepo.listScoped({
        authUser,
        filters: { studentId, status },
        skip,
        take,
      });
      const gated = items.map((row) => this.gateInvoiceForViewer(row, authUser));
      return paginatedResult(gated, total, p, l);
    }

    // Global: one { studentId, current, next } summary per student.
    const { items, total } = await subscriptionRepo.summariesByStudent({
      authUser,
      filters: { status },
      skip,
      take,
    });
    const gated = items.map((s) => ({
      studentId: s.studentId,
      current: this.gateInvoiceForViewer(s.current, authUser),
      next: this.gateInvoiceForViewer(s.next, authUser),
    }));
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
  async getCurrentlySubscribedStudentIds(studentIds, client) {
    const ids =
      await subscriptionRepo.getCurrentlySubscribedStudentIds(
        studentIds,
        new Date(),
        client,
      );
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

  async planOptions({ authUser, studentId }) {
    await this.assertCanAccess(authUser, studentId);
    const [plans, settings] = await Promise.all([
      planRepo.listActiveWithCoupons(),
      settingsUsecase.getEffective(),
    ]);
    const hourlyRate = Number(settings.hourlyRate);

    return Promise.all(
      plans.map(async (plan) => {
        const buildCycle = async (billingPeriod, multiplier) => {
          const minutes = minutesFromHours(Number(plan.hours) * multiplier);
          const pricing = await this.computeUsagePricing({
            subsMinutes: minutes,
            hourlyRate,
            planId: plan.id,
            plan,
            billingPeriod,
            studentId,
          });
          const coupon = (plan.coupons ?? [])
            .map((link) => link.coupon)
            .find((candidate) => candidate.id === pricing.couponId);
          return {
            base: pricing.basePrice,
            effective: pricing.priceCharged,
            discount: coupon
              ? {
                  type: coupon.type,
                  value: Number(coupon.value),
                  code: coupon.code,
                }
              : null,
          };
        };

        const [monthly, yearly] = await Promise.all([
          buildCycle(BILLING_PERIODS.MONTHLY, 1),
          buildCycle(BILLING_PERIODS.YEARLY, 12),
        ]);
        return {
          id: plan.id,
          titleAr: plan.titleAr,
          titleEn: plan.titleEn,
          descriptionAr: plan.descriptionAr,
          descriptionEn: plan.descriptionEn,
          hours: Number(plan.hours),
          hourlyRate,
          currency: settings.currency,
          isFeatured: plan.isFeatured,
          monthly,
          yearly,
        };
      }),
    );
  }

  async planQuote({
    authUser,
    studentId,
    planId,
    couponCode,
    currentSubscriptionId,
  }) {
    await this.assertCanAccess(authUser, studentId);
    if (currentSubscriptionId) {
      const subscription = await subscriptionRepo.getById(currentSubscriptionId);
      if (!subscription || subscription.studentId !== studentId) {
        throw forbidden(subscriptionMessagesCodes.CANNOT_ACCESS_SUBSCRIPTION);
      }
    }
    const [plan, settings] = await Promise.all([
      planRepo.getByIdWithCoupons(planId),
      settingsUsecase.getEffective(),
    ]);
    if (!plan || !plan.isActive) {
      throw notFound(subscriptionMessagesCodes.PLAN_NOT_FOUND);
    }
    const base = priceFromMinutes(
      minutesFromHours(plan.hours),
      Number(settings.hourlyRate),
    );
    const code = String(couponCode ?? "").trim();
    if (!code) {
      return {
        currency: settings.currency,
        base,
        net: base,
        discount: null,
        couponValid: null,
        reason: null,
      };
    }
    const validation = await couponUsecase.validateCoupon({
      code,
      planId,
      billingPeriod: BILLING_PERIODS.MONTHLY,
      studentId,
      currentSubscriptionId,
    });
    if (!validation.valid) {
      return {
        currency: settings.currency,
        base,
        net: base,
        discount: null,
        couponValid: false,
        reason: validation.reason,
      };
    }
    return {
      currency: settings.currency,
      base,
      net: roundMoney(applyDiscount(base, validation.discount)),
      discount: { ...validation.discount, code },
      couponValid: true,
      reason: null,
    };
  }

  /**
   * STORED model (v2): recompute-from-source. On every session mutation, find (or
   * create) the open UPCOMING USAGE subscription for the payment month (M+1) of a
   * session dated in month M, recompute its minutes from the ACTUAL session sum for
   * the consumption month M, and STORE `subsMinutes`/`remainingMinutes`/`priceCharged`
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
    if (!this.isMutableUsageSubscription(open)) return open;

    const usageMinutes = await subscriptionRepo.sumUsageMinutesForStudentMonth({
      studentId,
      gte: consumption.gte,
      lt: consumption.lt,
      includeBilledSubscriptionId: open?.id ?? null,
    });

    const plan = await this.resolveUsagePlan(studentId, open);
    const resolvedMinutes = resolveUsageMinutes({
      usageMinutes,
      planMinutes: minutesFromHours(plan?.hours) ?? 0,
    });
    if (!resolvedMinutes || resolvedMinutes <= 0) return open;
    const pricing = await this.computeUsagePricing({
      subsMinutes: resolvedMinutes,
      hourlyRate,
      planId: plan?.id ?? null,
      plan,
      existingCoupon: open?.coupon ?? null,
      studentId,
      currentSubscriptionId: open?.id ?? null,
    });

    if (!open) {
      // New open sub — inherit the student's current/most-recent sub's plan (v3
      // §5). Zero sessions fall back to THAT inherited plan's minutes.
      const data = {
        origin: SUBSCRIPTION_ORIGINS.USAGE,
        status: SUBSCRIPTION_STATUSES.UPCOMING,
        billingPeriod: BILLING_PERIODS.MONTHLY,
        startDate: paymentStart,
        endDate: endOfMonth(paymentStart),
        usageMonthKey: this.usageSlotKey(studentId, paymentStart),
        subsMinutes: resolvedMinutes,
        remainingMinutes: resolvedMinutes,
        // Fresh sub carries no coupon yet, so price is the plain hours × rate.
        priceCharged: pricing.priceCharged,
        currency: settings.currency,
        student: { connect: { id: studentId } },
      };
      if (plan) data.plan = { connect: { id: plan.id } };
      if (pricing.couponId) {
        data.coupon = { connect: { id: pricing.couponId } };
      }
      const subscription = await this.runTransaction(async (tx) => {
        const created = await subscriptionRepo.createSubscription(data, tx);
        await this.consumeCoupon({
          couponId: pricing.couponId,
          studentId,
          subscriptionId: created.id,
          tx,
        });
        return created;
      });
      await this.refreshOrEnsureInvoice(subscription, { plan });
      return subscription;
    }

    // Existing open (UPCOMING) — recompute using its OWN linked plan minutes as
    // the zero-session fallback. Price = minutes × hourly rate ÷ 60, minus any coupon already
    // attached to the open sub (same stored-coupon logic as the month-close freeze).
    const subscription = await this.runTransaction(async (tx) => {
      await this.consumeCoupon({
        previousCouponId: open.couponId,
        couponId: pricing.couponId,
        studentId,
        subscriptionId: open.id,
        tx,
      });
      return subscriptionRepo.updateSubscription(
        open.id,
        {
          subsMinutes: resolvedMinutes,
          remainingMinutes: resolvedMinutes,
          priceCharged: pricing.priceCharged,
          usageMonthKey: this.usageSlotKey(studentId, paymentStart),
          plan: plan ? { connect: { id: plan.id } } : undefined,
          coupon: pricing.couponId
            ? { connect: { id: pricing.couponId } }
            : { disconnect: true },
        },
        tx,
      );
    });
    await this.refreshOrEnsureInvoice(subscription, { plan });
    return subscription;
  }

  /**
   * On-demand "promotion": ensure every currently-active student has their
   * next-month open USAGE subscription, with hours recomputed from this month's
   * sessions. Runs the SAME orderly path as the per-session hook
   * (recomputeOpenUsageSubscription) — it does NOT freeze or invoice (that is
   * generateMonthlyUsageInvoices' job at month-close). Idempotent: a student who
   * already has an open next-month sub just gets it refreshed; a frozen one is
   * left untouched. Per-student errors are isolated so one failure never aborts
   * the run.
   *
   * @param {Date} [now] the reference day; the created sub covers next month.
   * @returns {Promise<{ processed:number, failed:number }>}
   */
  async seedOpenUsageSubscriptions(now = new Date()) {
    const range = monthRange(now);
    const [activeStudents, sessionStudents] = await Promise.all([
      subscriptionRepo.listCurrentPeriodStudents(now),
      subscriptionRepo.listSessionStudentsForMonth(range),
    ]);
    const activeStudentIds = new Set(
      activeStudents.map((row) => row.studentId),
    );
    const retrySessionStudents = [];
    for (const row of sessionStudents) {
      if (activeStudentIds.has(row.studentId)) continue;
      const cancelled =
        await subscriptionRepo.findLatestCancelledUsageSubscription({
          studentId: row.studentId,
          paymentStart: firstOfNextMonth(now),
        });
      // A cancelled bill stays cancelled until a session is created/edited
      // after that cancellation. This preserves the user's explicit cancel
      // while still giving failed immediate syncs a deterministic retry.
      if (
        !cancelled ||
        (row.latestSessionAt &&
          new Date(row.latestSessionAt) > new Date(cancelled.updatedAt))
      ) {
        retrySessionStudents.push(row);
      }
    }
    const students = [
      ...new Map(
        [...activeStudents, ...retrySessionStudents].map((row) => [
          row.studentId,
          row,
        ]),
      ).values(),
    ];
    let processed = 0;
    let failed = 0;
    for (const { studentId } of students) {
      try {
        await this.recomputeOpenUsageSubscription({ studentId, sessionDate: now });
        processed += 1;
      } catch (err) {
        failed += 1;
        // eslint-disable-next-line no-console
        console.error(
          `seedOpenUsageSubscriptions: student ${studentId} failed`,
          err?.code || err?.message || err,
        );
      }
    }
    return { processed, failed };
  }

  /**
   * Live accumulating-bill preview for a USAGE subscription: the consumed minutes
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
    const usageMinutes = await subscriptionRepo.sumUsageMinutesForStudentMonth({
      studentId: sub.studentId,
      gte: consumption.gte,
      lt: consumption.lt,
      includeBilledSubscriptionId: sub.id,
    });
    const settings = await settingsUsecase.getEffective();

    return {
      usageMinutes,
      // Temporary read compatibility for old clients.
      usageHours: usageMinutes / 60,
      projectedPrice: priceFromMinutes(
        usageMinutes,
        Number(settings.hourlyRate),
      ),
      currency: sub.currency,
      frozen: sub.status !== SUBSCRIPTION_STATUSES.UPCOMING,
    };
  }

  /**
   * Create-by-month (USAGE arrears): an admin adds a subscription for ONE month.
   * Per the arrears bucketing, the sub dated month X bills month X-1's PRESENT
   * sessions — so `startDate = 1st of the chosen month`, `endDate = last day`,
   * `origin = USAGE`, `subsMinutes = the sum of that student's unbilled PRESENT
   * minutes in the consumption month (previousMonth(startDate))`, and
   * `priceCharged = minutes × hourly rate ÷ 60`. Refuses a duplicate USAGE sub for the
   * same (studentId, startDate) — reusing the status-agnostic
   * findOpenUsageSubscription lookup (origin + startDate only).
   *
   * Intentionally does NOT run prepareForNewSubscription: a USAGE bill coexists
   * with the student's active plan (same as the month-close cron path), so it is
   * never gated by the one-active / one-in-flight rules.
   */
  async createByMonth({ authUser, ...input }) {
    const studentId = input.studentId;
    const startDate = monthRange(input.month).gte; // 1st of the chosen month (UTC)
    const endDate = endOfMonth(startDate);
    const status = this.resolveStatus(startDate, endDate);

    // One USAGE bill per (student, month).
    const existing = await subscriptionRepo.findOpenUsageSubscription({
      studentId,
      paymentStart: startDate,
    });
    if (existing) {
      throw conflict(
        subscriptionMessagesCodes.USAGE_SUBSCRIPTION_EXISTS,
        messagesNames.subscriptionMessages,
      );
    }

    // Arrears: the month-X sub bills month X-1's sessions.
    const consumption = monthRange(previousMonth(startDate));
    const settings = await settingsUsecase.getEffective();
    const usageMinutes = await subscriptionRepo.sumUsageMinutesForStudentMonth({
      studentId,
      gte: consumption.gte,
      lt: consumption.lt,
    });
    const plan = await this.resolveUsagePlan(studentId);
    const subsMinutes = resolveUsageMinutes({
      usageMinutes,
      planMinutes: minutesFromHours(plan?.hours) ?? 0,
    });
    const { priceCharged, couponId } = await this.computeUsagePricing({
      subsMinutes,
      couponCode: input.couponCode,
      hourlyRate: Number(settings.hourlyRate),
      planId: plan?.id ?? null,
      plan,
      studentId,
      autoPlanCoupon: input.applyPlanCoupon ?? true,
    });

    const data = {
      origin: SUBSCRIPTION_ORIGINS.USAGE,
      status,
      billingPeriod: BILLING_PERIODS.MONTHLY,
      startDate,
      endDate,
      usageMonthKey: this.usageSlotKey(studentId, startDate, status),
      subsMinutes,
      remainingMinutes: subsMinutes,
      priceCharged,
      currency: settings.currency,
      notes: input.notes,
      student: { connect: { id: studentId } },
      createdBy: { connect: { id: authUser.id } },
      plan: plan ? { connect: { id: plan.id } } : undefined,
      coupon: couponId ? { connect: { id: couponId } } : undefined,
    };
    const subscription = await this.runTransaction(async (tx) => {
      const created = await subscriptionRepo.createSubscription(data, tx);
      await this.consumeCoupon({
        couponId,
        studentId,
        subscriptionId: created.id,
        tx,
      });
      return created;
    });

    // Auto-create the demand invoice (snapshot of the template) — best-effort.
    await this.ensureInvoice(subscription, { plan });

    // Notify the student — failure must not fail the request.
    try {
      await notificationUsecase.createNotification({
        userId: studentId,
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

  /**
   * Create-by-plan(+month) (v3 §2): the admin form sends `{ studentId, planId,
   * month, couponCode? }`. Dates derive from the month (1st → last day); hours +
   * price come from the PLAN at creation time (subsHours = plan.hours, price via
   * computePricing). The sub is a plan-linked USAGE sub so the monthly usage
   * machinery (recompute / freeze / inheritance) operates on it uniformly and a
   * later zero-session month falls back to this sub's own plan hours.
   *
   * origin = USAGE (not MANUAL): the same lookup that guarantees one bill per
   * (student, month) — findOpenUsageSubscription (origin USAGE + startDate) — is
   * reused as the duplicate guard, and USAGE subs coexist with the student's plan
   * (mirrors createByMonth: no prepareForNewSubscription gate).
   */
  async createByPlanMonth({ authUser, ...input }) {
    const studentId = input.studentId;
    const startDate = monthRange(input.month).gte; // 1st of the chosen month (UTC)
    const endDate = endOfMonth(startDate);
    const status = this.resolveStatus(startDate, endDate);

    // Load + validate the plan (hours + price come from it).
    const plan = await planRepo.getByIdWithCoupons(input.planId);
    if (!plan || !plan.isActive) {
      throw notFound(subscriptionMessagesCodes.PLAN_NOT_FOUND);
    }

    // One sub per (student, month) — status-agnostic USAGE lookup by startDate.
    const existing = await subscriptionRepo.findOpenUsageSubscription({
      studentId,
      paymentStart: startDate,
    });
    if (existing) {
      throw conflict(
        subscriptionMessagesCodes.USAGE_SUBSCRIPTION_EXISTS,
        messagesNames.subscriptionMessages,
      );
    }

    const settings = await settingsUsecase.getEffective();
    const subsMinutes = minutesFromHours(plan.hours);
    // Price from the subscription's OWN minutes, NOT the plan's
    // period price. planId is passed only so a plan-scoped coupon still validates.
    const { priceCharged, couponId } = await this.computeUsagePricing({
      subsMinutes,
      couponCode: input.couponCode,
      hourlyRate: Number(settings.hourlyRate),
      planId: plan.id,
      plan,
      studentId,
      autoPlanCoupon: input.applyPlanCoupon ?? true,
    });

    const data = {
      origin: SUBSCRIPTION_ORIGINS.USAGE,
      status,
      billingPeriod: BILLING_PERIODS.MONTHLY,
      startDate,
      endDate,
      usageMonthKey: this.usageSlotKey(studentId, startDate, status),
      subsMinutes,
      remainingMinutes: subsMinutes,
      priceCharged,
      currency: settings.currency,
      notes: input.notes,
      student: { connect: { id: studentId } },
      plan: { connect: { id: plan.id } },
      createdBy: { connect: { id: authUser.id } },
    };
    if (couponId) data.coupon = { connect: { id: couponId } };

    const subscription = await this.runTransaction(async (tx) => {
      const sub = await subscriptionRepo.createSubscription(data, tx);
      await this.consumeCoupon({
        couponId,
        studentId,
        subscriptionId: sub.id,
        tx,
      });
      return sub;
    });

    // Auto-create the demand invoice (snapshot of the template) — best-effort.
    await this.ensureInvoice(subscription, { plan });

    // Notify the student — failure must not fail the request.
    try {
      await notificationUsecase.createNotification({
        userId: studentId,
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

  async create({ authUser, ...input }) {
    // Create-by-plan(+month) path (v3 §2 — the admin form): a plan + month yields
    // a plan-linked USAGE sub whose hours + price come from the PLAN at creation.
    if (input.month != null && input.planId != null) {
      return this.createByPlanMonth({ authUser, ...input });
    }
    // Legacy create-by-month (USAGE arrears) path: month only, hours from sessions.
    if (input.month != null) {
      return this.createByMonth({ authUser, ...input });
    }

    const billingPeriod = input.billingPeriod ?? BILLING_PERIODS.MONTHLY;
    const startDate = this.computeStartDate(input.startDate);
    const endDate = this.computeEndDate(startDate, billingPeriod);
    const status = input.status ?? this.resolveStatus(startDate, endDate);
    const settings = await settingsUsecase.getEffective();
    const subsMinutes =
      input.subsMinutes ?? minutesFromHours(input.subsHours);
    const remainingMinutes =
      input.remainingMinutes ??
      minutesFromHours(input.remainingHours) ??
      subsMinutes ??
      null;

    const data = {
      status,
      billingPeriod,
      startDate,
      endDate,
      subsMinutes,
      // Remaining duration inherits from the billed duration unless explicit.
      remainingMinutes,
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
    if (input.couponCode) {
      const plan = input.planId
        ? await planRepo.getById(input.planId)
        : null;
      if (input.planId && !plan) {
        throw notFound(subscriptionMessagesCodes.PLAN_NOT_FOUND);
      }
      const result = await couponUsecase.validateCoupon({
        code: input.couponCode,
        planId: input.planId ?? null,
        billingPeriod,
        studentId: input.studentId,
      });
      if (!result.valid) {
        throw badRequest(result.reason, messagesNames.couponMessages);
      }
      const coupon = await couponRepo.getByCode(input.couponCode);
      const base =
        data.priceCharged ??
        (subsMinutes != null
          ? priceFromMinutes(subsMinutes, Number(settings.hourlyRate))
          : plan
            ? roundMoney(
                priceForPeriod(plan, billingPeriod, Number(settings.hourlyRate)),
              )
            : null);
      if (base != null) {
        data.priceCharged = roundMoney(
          applyDiscount(base, {
            type: result.discount.type,
            value: result.discount.value,
          }),
        );
      }
      data.coupon = { connect: { id: coupon.id } };
      couponIdToConsume = coupon.id;
    } else if (input.couponId !== undefined) {
      const coupon = await couponRepo.getById({ id: input.couponId });
      if (!coupon) {
        throw badRequest(
          subscriptionMessagesCodes.COUPON_INVALID,
          messagesNames.subscriptionMessages,
        );
      }
      const result = await couponUsecase.validateCoupon({
        code: coupon.code,
        planId: input.planId ?? null,
        billingPeriod,
        studentId: input.studentId,
      });
      if (!result.valid) {
        throw badRequest(result.reason, messagesNames.couponMessages);
      }
      data.coupon = { connect: { id: coupon.id } };
      couponIdToConsume = coupon.id;
      if (data.priceCharged == null && subsMinutes != null) {
        const base = priceFromMinutes(
          subsMinutes,
          Number(settings.hourlyRate),
        );
        data.priceCharged = roundMoney(
          applyDiscount(base, {
            type: result.discount.type,
            value: result.discount.value,
          }),
        );
      }
    }

    // Price precedence: explicit priceCharged wins; else coupon-derived (set in
    // the branch above); else derive from subsMinutes × hourly rate ÷ 60.
    if (data.priceCharged == null && subsMinutes != null) {
      data.priceCharged = priceFromMinutes(
        subsMinutes,
        Number(settings.hourlyRate),
      );
    }

    const subscription = await this.runTransaction(async (tx) => {
      // Block a 2nd active + clear any in-flight PENDING before creating.
      await this.prepareForNewSubscription(input.studentId, tx);
      const sub = await subscriptionRepo.createSubscription(data, tx);
      await this.consumeCoupon({
        couponId: couponIdToConsume,
        studentId: input.studentId,
        subscriptionId: sub.id,
        tx,
      });
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
    const workflowFields = [
      "studentId",
      "planId",
      "billingPeriod",
      "status",
      "startDate",
      "endDate",
      "priceCharged",
      "couponId",
    ];
    if (workflowFields.some((field) => input[field] !== undefined)) {
      throw badRequest(
        subscriptionMessagesCodes.NO_EDITABLE_FIELDS,
        messagesNames.subscriptionMessages,
      );
    }

    const startDate = input.startDate ?? existing.startDate;
    const endDate = input.endDate ?? existing.endDate;
    if (endDate <= startDate) {
      throw badRequest(
        subscriptionMessagesCodes.INVALID_DATE_RANGE,
        messagesNames.subscriptionMessages,
      );
    }

    // subsMinutes (the invoiced duration) is NOT editable via the manual edit path:
    // it is set ONLY by the automatic hours writes (createByPlanMonth from the
    // plan, recompute/freeze from sessions). Any billed duration in the input is
    // ignored here — the price is never recomputed from it. Only remainingMinutes
    // is manually editable.
    const remainingMinutes =
      input.remainingMinutes !== undefined
        ? input.remainingMinutes
        : input.remainingHours !== undefined
          ? minutesFromHours(input.remainingHours)
          : undefined;
    if (
      remainingMinutes !== undefined &&
      existing.subsMinutes != null &&
      remainingMinutes > existing.subsMinutes
    ) {
      throw badRequest(
        subscriptionMessagesCodes.REMAINING_EXCEEDS_TOTAL,
        messagesNames.subscriptionMessages,
      );
    }
    const data = { remainingMinutes, notes: input.notes };
    const subscription = await subscriptionRepo.updateSubscription(id, data);

    // If the charged price was explicitly changed, best-effort regenerate the
    // demand invoice so its amount matches. Guarded so a notes-only edit doesn't
    // regenerate. (subsHours is no longer editable here, so hours never change.)
    const priceChanged =
      data.priceCharged !== undefined &&
      Number(data.priceCharged) !== Number(existing.priceCharged);
    if (priceChanged) {
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
    return this.cancel({ authUser, id });
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
    const startDate = this.computeStartDate(input.startDate ?? new Date());
    const endDate = this.computeEndDate(startDate, billingPeriod);

    // Minutes scale with the cycle: a yearly subscription bundles 12× the plan.
    const subsMinutes =
      billingPeriod === BILLING_PERIODS.YEARLY ? plan.hours * 12 : plan.hours;
    const billedMinutes = minutesFromHours(subsMinutes);

    // Price is derived from the single global hourly rate + currency.
    const settings = await settingsUsecase.getEffective();

    // Price for the chosen cycle with the best plan-linked coupon and/or code.
    const { priceCharged, couponId } = await this.computePricing(
      plan,
      billingPeriod,
      input.couponCode,
      Number(settings.hourlyRate),
      {
        studentId,
        autoPlanCoupon: input.applyPlanCoupon ?? true,
      },
    );

    const data = {
      status: SUBSCRIPTION_STATUSES.PENDING,
      billingPeriod,
      startDate,
      endDate,
      subsMinutes: billedMinutes,
      remainingMinutes: billedMinutes,
      priceCharged,
      currency: settings.currency,
      notes: input.notes,
      student: { connect: { id: studentId } },
      plan: { connect: { id: plan.id } },
      createdBy: { connect: { id: authUser.id } },
    };
    if (couponId) data.coupon = { connect: { id: couponId } };

    // Create the subscription and consume any coupon atomically.
    const subscription = await this.runTransaction(async (tx) => {
      // Block while active + auto-replace any in-flight PENDING before creating.
      await this.prepareForNewSubscription(studentId, tx);
      const sub = await subscriptionRepo.createSubscription(data, tx);
      await this.consumeCoupon({
        couponId,
        studentId,
        subscriptionId: sub.id,
        tx,
      });
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
          link: `/dashboard/subscriptions/${subscription.id}`,
          dataJson: { subscriptionId: subscription.id, studentId },
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

    // Rejection never restores coupon eligibility for this student.
    const updated = await this.runTransaction(async (tx) => {
      const cancelled = await subscriptionRepo.updateSubscription(
        id,
        {
          status: SUBSCRIPTION_STATUSES.CANCELLED,
          usageMonthKey: null,
          notes,
        },
        tx,
      );
      const invoice = await invoiceRepo.getBySubscriptionId(id, tx);
      if (invoice?.status === INVOICE_STATUSES.UNPAID) {
        await invoiceRepo.update({
          id: invoice.id,
          data: { status: INVOICE_STATUSES.VOID, sentAt: null },
          client: tx,
        });
      }
      return cancelled;
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

    // Cancellation never restores coupon eligibility for this student.
    const updated = await this.runTransaction(async (tx) => {
      const cancelled = await subscriptionRepo.updateSubscription(
        id,
        {
          status: SUBSCRIPTION_STATUSES.CANCELLED,
          usageMonthKey: null,
        },
        tx,
      );
      const invoice = await invoiceRepo.getBySubscriptionId(id, tx);
      if (invoice?.status === INVOICE_STATUSES.UNPAID) {
        await invoiceRepo.update({
          id: invoice.id,
          data: { status: INVOICE_STATUSES.VOID, sentAt: null },
          client: tx,
        });
      }
      return cancelled;
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
   * Mirrors request()/create(): coupon validation + atomic permanent redemption in a
   * tx, best-effort demand invoice, best-effort notification.
   *
   * One-active / one-in-flight rules (via prepareForNewSubscription inside the
   * creation tx): renewal is REFUSED while a currently-active subscription exists
   * (no bypass — cancel it first), and any in-flight PENDING subscription is
   * AUTO-REPLACED (deleted, invoice cascades, coupon remains consumed).
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
    //    and AUTO-REPLACES any PENDING subscription (deletes it and its invoice;
    //    coupon consumption remains permanent). No active bypass exists.

    const plan = await planRepo.getByIdWithCoupons(planId);
    if (!plan || !plan.isActive) {
      throw notFound(subscriptionMessagesCodes.PLAN_NOT_FOUND);
    }

    const startDate = this.computeStartDate(input.startDate ?? new Date());
    const endDate = this.computeEndDate(startDate, billingPeriod);

    // Minutes scale with the cycle (yearly bundles 12× the monthly plan).
    const planHours =
      billingPeriod === BILLING_PERIODS.YEARLY ? plan.hours * 12 : plan.hours;
    const subsMinutes = minutesFromHours(planHours);

    const settings = await settingsUsecase.getEffective();

    // 4. Price the chosen cycle with the (optional) coupon code.
    const { priceCharged, couponId } = await this.computePricing(
      plan,
      billingPeriod,
      input.couponCode,
      Number(settings.hourlyRate),
      {
        studentId,
        autoPlanCoupon: input.applyPlanCoupon ?? true,
      },
    );

    const data = {
      status: SUBSCRIPTION_STATUSES.PENDING,
      billingPeriod,
      startDate,
      endDate,
      subsMinutes,
      remainingMinutes: subsMinutes,
      priceCharged,
      currency: settings.currency,
      student: { connect: { id: studentId } },
      plan: { connect: { id: plan.id } },
      createdBy: { connect: { id: authUser.id } },
    };
    if (couponId) data.coupon = { connect: { id: couponId } };

    // Create the new subscription and consume any coupon atomically.
    const subscription = await this.runTransaction(async (tx) => {
      // Block while active + auto-replace any in-flight PENDING before creating.
      await this.prepareForNewSubscription(studentId, tx);
      const sub = await subscriptionRepo.createSubscription(data, tx);
      await this.consumeCoupon({
        couponId,
        studentId,
        subscriptionId: sub.id,
        tx,
      });
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
            link: `/dashboard/subscriptions/${subscription.id}`,
            dataJson: { subscriptionId: subscription.id, studentId },
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
   * Re-link the plan of a not-yet-paid subscription (v3 §3). RE-LINK ONLY: it
   * NEVER recomputes subsHours / priceCharged / dates and NEVER regenerates the
   * invoice — the inherited hours + price stay exactly as they were. Only allowed
   * while the sub is not ACTIVE and its demand invoice is unpaid (or absent).
   * A coupon change is a separate action (applyCoupon).
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

    // An ACTIVE subscription is settled — its plan must not change. Cancel it
    // first, then create a fresh one. This is in ADDITION to the invoice-UNPAID
    // guard below.
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

    // 3. Validate the target plan exists + is active.
    const plan = await planRepo.getByIdWithCoupons(input.planId);
    if (!plan || !plan.isActive) {
      throw notFound(subscriptionMessagesCodes.PLAN_NOT_FOUND);
    }

    // 4. Determine whether the sub has any ACTUAL usage in its consumption month
    //    (arrears: the month-X sub bills month X-1's sessions — the same window
    //    usagePreview/recompute pick: monthRange(previousMonth(startDate))).
    //      - usage === 0 → the hours came from the plan, not sessions, so the new
    //        plan's hours + price flow through: reset subsHours/remainingHours to
    //        the new plan's hours and re-price from those hours (keeping the sub's
    //        existing coupon, if any).
    //      - usage  >  0 → real logged sessions drive the hours; RE-LINK ONLY,
    //        leaving subsHours/remainingHours/price as-is.
    const consumption = monthRange(previousMonth(existing.startDate));
    const usageMinutes = await subscriptionRepo.sumUsageMinutesForStudentMonth({
      studentId: existing.studentId,
      gte: consumption.gte,
      lt: consumption.lt,
      includeBilledSubscriptionId: existing.id,
    });

    const data = { plan: { connect: { id: plan.id } } };
    const settings = await settingsUsecase.getEffective();
    const planMinutes = minutesFromHours(plan.hours);
    const pricingMinutes =
      usageMinutes > 0 ? existing.subsMinutes ?? usageMinutes : planMinutes;
    const { priceCharged, couponId } = await this.computeUsagePricing({
      subsMinutes: pricingMinutes,
      couponCode: input.couponCode,
      hourlyRate: Number(settings.hourlyRate),
      planId: plan.id,
      plan,
      autoPlanCoupon: input.applyPlanCoupon ?? true,
      studentId: existing.studentId,
      currentSubscriptionId: existing.id,
    });
    const priceChanged =
      Number(priceCharged) !== Number(existing.priceCharged) ||
      couponId !== existing.couponId;

    if (usageMinutes === 0) {
      data.subsMinutes = planMinutes;
      data.remainingMinutes = planMinutes;
    }
    data.priceCharged = priceCharged;
    data.coupon = couponId
      ? { connect: { id: couponId } }
      : { disconnect: true };

    const updated = await this.runTransaction(async (tx) => {
      await this.consumeCoupon({
        previousCouponId: existing.couponId,
        couponId,
        studentId: existing.studentId,
        subscriptionId: existing.id,
        tx,
      });
      return subscriptionRepo.updateSubscription(id, data, tx);
    });

    // 4b. When the hours/price were reset from the new plan, best-effort
    //     regenerate the still-unpaid demand invoice so its amount matches (the
    //     change-plan guard already ensured the invoice is UNPAID or absent).
    if (priceChanged) {
      try {
        const currentInvoice =
          invoice ?? (await invoiceRepo.getBySubscriptionId(id));
        if (
          !currentInvoice ||
          currentInvoice.status === INVOICE_STATUSES.UNPAID
        ) {
          const { invoiceUsecase } = await import(
            "../invoices/invoice.usecase.js"
          );
          await invoiceUsecase.regenerateForSubscription(id, {
            createdById: authUser.id,
          });
        }
      } catch {
        // swallow — invoice regeneration is best-effort
      }
    }

    // 5. Notify the student the plan changed (best-effort).
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
   * plan + billing period with the new code, permanently consumes a newly
   * attached code atomically, then refreshes the invoice amounts.
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
    //    yields couponId null = coupon removed. Pricing is ALWAYS from the
    //    subscription's own hours (subsHours × rate); the coupon discounts THAT
    //    total, never the plan. The sub's planId is passed only so a plan-scoped
    //    coupon still validates.
    const settings = await settingsUsecase.getEffective();
    let priceCharged;
    let couponId;

    if (existing.subsMinutes == null) {
      // Accumulating (not frozen): attach the coupon now; the discount is
      // computed at month-close freeze. Validate the code so a bad code is
      // rejected immediately; price stays null (derived until freeze).
      if (input.couponCode) {
        const result = await couponUsecase.validateCoupon({
          code: input.couponCode,
          planId: existing.planId ?? null,
          billingPeriod: BILLING_PERIODS.MONTHLY,
          studentId: existing.studentId,
          currentSubscriptionId: existing.id,
        });
        if (!result.valid) {
          throw badRequest(result.reason, messagesNames.couponMessages);
        }
        const coupon = await couponRepo.getByCode(input.couponCode);
        couponId = coupon.id;
      } else {
        couponId = null;
      }
      priceCharged = existing.priceCharged ?? null; // unchanged / still derived
    } else {
      // Priced from the sub's own minutes minus the coupon.
      ({ priceCharged, couponId } = await this.computeUsagePricing({
        subsMinutes: existing.subsMinutes,
        couponCode: input.couponCode,
        hourlyRate: Number(settings.hourlyRate),
        planId: existing.planId ?? null,
        autoPlanCoupon: false,
        studentId: existing.studentId,
        currentSubscriptionId: existing.id,
      }));
    }

    // 4. Persist the link and permanently consume a newly attached coupon.
    const updated = await this.runTransaction(async (tx) => {
      await this.consumeCoupon({
        previousCouponId: existing.couponId,
        couponId,
        studentId: existing.studentId,
        subscriptionId: existing.id,
        tx,
      });
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
    await this.refreshOrEnsureInvoice(updated);

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
    // PENDING/UPCOMING (not yet started) OR CANCELLED (re-activate a cancelled
    // sub — cancelling no longer removes it, it just flips to CANCELLED and can
    // be turned back on).
    const activatable = [
      SUBSCRIPTION_STATUSES.PENDING,
      SUBSCRIPTION_STATUSES.UPCOMING,
      SUBSCRIPTION_STATUSES.CANCELLED,
    ];
    if (!activatable.includes(existing.status)) {
      throw new AppError({
        statusCode: 409,
        code: subscriptionMessagesCodes.NOT_PENDING,
        translationKey: messagesNames.subscriptionMessages,
      });
    }

    // 2b. Time guard: a subscription may only be activated once its month has
    //     essentially arrived — from the LAST DAY of the preceding month onwards
    //     (endOfMonth(previousMonth(startDate))). This blocks pre-activating the
    //     next-month accumulating bill early; only the current/imminent
    //     subscription is activatable.
    const activationOpensAt = endOfMonth(previousMonth(existing.startDate));
    if (new Date() < activationOpensAt) {
      throw new AppError({
        statusCode: 409,
        code: subscriptionMessagesCodes.ACTIVATION_TOO_EARLY,
        translationKey: messagesNames.subscriptionMessages,
      });
    }

    const activeIds = await this.getCurrentlySubscribedStudentIds([
      existing.studentId,
    ]);
    if (activeIds.has(existing.studentId)) {
      throw new AppError({
        statusCode: 409,
        code: subscriptionMessagesCodes.SUBSCRIPTION_STILL_ACTIVE,
        translationKey: messagesNames.subscriptionMessages,
      });
    }
    if (existing.origin === SUBSCRIPTION_ORIGINS.USAGE) {
      const replacement = await subscriptionRepo.findOpenUsageSubscription({
        studentId: existing.studentId,
        paymentStart: existing.startDate,
      });
      if (replacement && replacement.id !== existing.id) {
        throw conflict(
          subscriptionMessagesCodes.USAGE_SUBSCRIPTION_EXISTS,
          messagesNames.subscriptionMessages,
        );
      }
    }

    // 3. Resolve the new status from the date window and persist.
    const status = this.resolveStatus(existing.startDate, existing.endDate);
    const updated = await this.runTransaction(async (tx) => {
      const activated = await subscriptionRepo.updateSubscription(
        id,
        {
          status,
          usageMonthKey:
            existing.origin === SUBSCRIPTION_ORIGINS.USAGE
              ? this.usageSlotKey(existing.studentId, existing.startDate)
              : undefined,
        },
        tx,
      );
      if (input.markInvoicePaid) {
        const invoice = await invoiceRepo.getBySubscriptionId(id, tx);
        if (invoice?.status === INVOICE_STATUSES.UNPAID) {
          await invoiceRepo.update({
            id: invoice.id,
            data: { status: INVOICE_STATUSES.PAID },
            client: tx,
          });
        }
      }
      return activated;
    });

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
   * day of the month. For every active student: freeze the consumed hours (or,
   * for a zero-session month, the OPEN sub's own linked plan hours), stamp the
   * billed sessions, generate + send the invoice, and expire the closing month's
   * sub. Idempotent per (student, month)
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

    const [currentStudents, openUsageStudents] = await Promise.all([
      subscriptionRepo.listCurrentPeriodStudents(now),
      subscriptionRepo.listOpenUsageStudentsForPaymentMonth(paymentStart),
    ]);
    const activeStudents = [
      ...new Map(
        [...currentStudents, ...openUsageStudents].map((row) => [
          row.studentId,
          row,
        ]),
      ).values(),
    ];

    let invoiced = 0;
    let skipped = 0;
    let failed = 0;

    for (const { studentId } of activeStudents) {
      try {
        // Resolve the open sub first — this drives idempotency, the plan-hours
        // fallback, AND pricing.
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
        if (!this.isMutableUsageSubscription(existingOpen)) {
          skipped += 1; // already billed by a prior run
          continue;
        }

        const usageMinutes =
          await subscriptionRepo.sumUsageMinutesForStudentMonth({
            studentId,
            gte: consumption.gte,
            lt: consumption.lt,
            includeBilledSubscriptionId: existingOpen?.id ?? null,
          });

        // Zero-session fallback hours:
        //  - existing open sub → its OWN linked plan hours (v3 §4).
        //  - to-be-created sub (none open yet) → the student's INHERITED plan
        //    (v3 §5). Mirrors recomputeOpenUsageSubscription's new-sub branch so
        //    month-close never mints a plan-less sub (which would break the
        //    inheritance chain: currentPlanIdForStudent skips planId: null subs).
        const plan = await this.resolveUsagePlan(studentId, existingOpen);
        const planMinutes = minutesFromHours(plan?.hours) ?? 0;
        const subsMinutes = resolveUsageMinutes({
          usageMinutes,
          planMinutes,
        });

        if (!subsMinutes || subsMinutes <= 0) {
          skipped += 1; // no usage and no linked plan → nothing to bill
          continue;
        }

        // Freeze price from the coupon ALREADY attached to the open sub. Its
        // redemption was booked at attach time, so we do NOT re-validate it here:
        // re-validating can now return invalid (redemption consumed / window
        // elapsed) and abort the whole run. Apply the stored discount directly.
        const { couponId } =
          await this.computeUsagePricing({
            subsMinutes,
            hourlyRate,
            planId: plan?.id ?? null,
            plan,
            existingCoupon: existingOpen?.coupon ?? null,
            studentId,
            currentSubscriptionId: existingOpen?.id ?? null,
          });

        const sub = await this.runTransaction(async (tx) => {
          let open = await subscriptionRepo.findOpenUsageSubscription({
            studentId,
            paymentStart,
            client: tx,
          });
          if (open && !this.isMutableUsageSubscription(open)) return null;
          const sessionRows =
            await subscriptionRepo.listBillableSessionsForStudentMonth({
              studentId,
              gte: consumption.gte,
              lt: consumption.lt,
              includeBilledSubscriptionId: open?.id ?? null,
              client: tx,
            });
          const frozenUsageMinutes = this.sumSessionRowsMinutes(sessionRows);
          const frozenSubsMinutes = resolveUsageMinutes({
            usageMinutes: frozenUsageMinutes,
            planMinutes,
          });
          if (!frozenSubsMinutes || frozenSubsMinutes <= 0) return null;

          const selectedCoupon =
            existingOpen?.coupon ??
            (plan?.coupons ?? [])
              .map((link) => link.coupon)
              .find((coupon) => coupon.id === couponId) ??
            null;
          const frozenPricing = await this.computeUsagePricing({
            subsMinutes: frozenSubsMinutes,
            hourlyRate,
            planId: plan?.id ?? null,
            plan,
            existingCoupon: selectedCoupon,
            autoPlanCoupon: false,
            studentId,
            currentSubscriptionId: open?.id ?? null,
          });
          if (!open) {
            open = await subscriptionRepo.createSubscription(
              {
                origin: SUBSCRIPTION_ORIGINS.USAGE,
                status: SUBSCRIPTION_STATUSES.PENDING,
                billingPeriod: BILLING_PERIODS.MONTHLY,
                startDate: paymentStart,
                endDate: paymentEnd,
                usageMonthKey: this.usageSlotKey(studentId, paymentStart),
                currency: settings.currency,
                student: { connect: { id: studentId } },
                // Inherit the student's plan so the sub is never plan-less and
                // stays in the inheritance chain once it becomes ACTIVE.
                plan: plan ? { connect: { id: plan.id } } : undefined,
                coupon: couponId
                  ? { connect: { id: couponId } }
                  : undefined,
              },
              tx,
            );
          }
          await this.consumeCoupon({
            previousCouponId: existingOpen?.couponId ?? null,
            couponId,
            studentId,
            subscriptionId: open.id,
            tx,
          });
          // freeze the final number + price, mark it awaiting payment.
          const frozen = await subscriptionRepo.updateSubscription(
            open.id,
            {
              subsMinutes: frozenSubsMinutes,
              remainingMinutes: frozenSubsMinutes,
              priceCharged: frozenPricing.priceCharged,
              status: SUBSCRIPTION_STATUSES.PENDING,
              usageMonthKey: this.usageSlotKey(studentId, paymentStart),
              plan: plan ? { connect: { id: plan.id } } : undefined,
              coupon: couponId
                ? { connect: { id: couponId } }
                : { disconnect: true },
            },
            tx,
          );
          // stamp the sessions that were just billed (only when real usage).
          if (frozenUsageMinutes > 0) {
            await subscriptionRepo.markSessionIdsBilled({
              ids: sessionRows.map((row) => row.id),
              subscriptionId: frozen.id,
              client: tx,
            });
          }
          return frozen;
        });

        if (!sub) {
          skipped += 1;
          continue;
        }
        await this.refreshOrEnsureInvoice(sub, { plan });
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
