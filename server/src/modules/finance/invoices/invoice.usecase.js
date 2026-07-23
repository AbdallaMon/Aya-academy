import {
  INVOICE_STATUSES,
  NOTIFICATION_TYPES,
  SUBSCRIPTION_STATUSES,
  USER_ROLES,
  invoiceMessagesCodes,
  messagesNames,
} from "@aya/shared";
import { AppError, badRequest, forbidden, notFound } from "../../../shared/errors/AppError.js";
import { messagingService } from "../../../infra/messaging/messagingService.js";
import {
  priceFromMinutes,
  priceForPeriod,
  roundMoney,
} from "../../../shared/utility/pricing.js";
import { hoursFromMinutes } from "../../../shared/utility/duration.js";
import { userRepo } from "../../users/user.repo.js";
import { planRepo } from "../plans/plan.repo.js";
import { subscriptionRepo } from "../subscriptions/subscription.repo.js";
import { subscriptionUsecase } from "../subscriptions/subscription.usecase.js";
import { paymentTemplateUsecase } from "../paymentTemplates/paymentTemplate.usecase.js";
import { settingsUsecase } from "../../settings/settings.usecase.js";
import { notificationUsecase } from "../../notifications/notification.usecase.js";
import { invoiceRepo } from "./invoice.repo.js";

class InvoiceUsecase {
  /** Stable, human-friendly invoice number derived from the subscription id. */
  invoiceNumberFor(subscriptionId) {
    return `INV-${String(subscriptionId).padStart(6, "0")}`;
  }

  /**
   * Compute the snapshot amounts for a subscription. Hours/subtotal come straight
   * from the subscription (the charged amount is authoritative); the hourly rate
   * and currency come from the single global settings; the transfer fee comes
   * from the template; previous credit/debt are admin figures.
   */
  async computeAmounts(subscription, adjust, template, settings) {
    const minutes = subscription.subsMinutes ?? null;
    const hours = hoursFromMinutes(minutes);
    const subtotal = roundMoney(subscription.priceCharged ?? 0);

    let hourlyRate = settings?.hourlyRate != null ? roundMoney(settings.hourlyRate) : null;
    if (hourlyRate == null && hours) hourlyRate = roundMoney(subtotal / hours);

    const fees = template?.configJson?.fees ?? {};
    const transferFee = roundMoney(
      subtotal * (Number(fees.transferFeePercent) || 0) / 100 +
        (Number(fees.transferFeeFixed) || 0),
    );

    const previousCredit = roundMoney(adjust?.previousCredit ?? 0);
    const previousDebt = roundMoney(adjust?.previousDebt ?? 0);

    const total = roundMoney(subtotal + transferFee + previousDebt - previousCredit);

    return {
      currency: settings?.currency ?? subscription.currency ?? "USD",
      minutes,
      hours,
      hourlyRate,
      subtotal,
      transferFee,
      total,
      previousCredit,
      previousDebt,
    };
  }

  /**
   * Render-only discount snapshot for the invoice: the pre-discount base price
   * for the subscription's cycle, the discount amount, and the coupon that was
   * applied. Stored under `configJson.discount` so the printable document can
   * show the full discount breakdown even if the plan price changes later.
   */
  async computeDiscountSnapshot(subscription, hourlyRate, plan) {
    if (!subscription || subscription.priceCharged == null) return null;
    let base = null;
    if (subscription.subsMinutes != null) {
      base = priceFromMinutes(subscription.subsMinutes, hourlyRate);
    } else if (subscription.planId) {
      const planRow = plan ?? (await planRepo.getById(subscription.planId));
      if (planRow) {
        base = roundMoney(
          priceForPeriod(planRow, subscription.billingPeriod, hourlyRate),
        );
      }
    }
    if (base == null) return null;
    const net = roundMoney(subscription.priceCharged);
    const amount = roundMoney(Math.max(0, base - net));
    if (amount <= 0) return null;

    const coupon = subscription.coupon ?? null;
    return {
      base,
      amount,
      code: coupon?.code ?? null,
      type: coupon?.type ?? null,
      value: coupon != null ? Number(coupon.value) : null,
      billingPeriod: subscription.billingPeriod ?? null,
    };
  }

  /** Due date = issue date + template.dueDays (null when no dueDays configured). */
  computeDueDate(issueDate, template) {
    const days = Number(template?.configJson?.dueDays);
    if (!Number.isFinite(days) || days <= 0) return null;
    const d = new Date(issueDate);
    d.setDate(d.getDate() + days);
    return d;
  }

  /**
   * Generate the demand invoice for a subscription, or re-generate it if one
   * already exists. Regenerate is a FULL reset: it re-copies the CURRENT global
   * template, recomputes amounts, resets the admin figures (previous credit/debt)
   * to zero, refreshes the issue/due dates and re-derives the billing period from
   * the subscription. Only the stable invoice number and the payment status are
   * kept.
   */
  async generate(authUser, subscriptionId) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(invoiceMessagesCodes.CANNOT_ACCESS_INVOICE);
    }
    return this.regenerateForSubscription(subscriptionId, {
      createdById: authUser.id,
    });
  }

  /**
   * System (no auth-gate) invoice (re)generation for a subscription — the shared
   * core behind the admin `generate` and the automatic refresh after a
   * coupon/plan change. A FULL reset: re-copies the current template, recomputes
   * amounts AND the discount snapshot (so the coupon code + discount always match
   * the subscription's current coupon), refreshes the dates, keeps only the
   * stable invoice number + payment status. Use this from server-side flows where
   * the actor may be a parent (e.g. apply-coupon) — never expose it to a route.
   */
  async regenerateForSubscription(subscriptionId, { createdById = null } = {}) {
    const subscription = await subscriptionRepo.getById(subscriptionId);
    if (!subscription) {
      throw notFound(invoiceMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }
    if (subscription.priceCharged == null) {
      throw badRequest(
        invoiceMessagesCodes.SUBSCRIPTION_NOT_PRICED,
        messagesNames.invoiceMessages,
      );
    }

    const template = await paymentTemplateUsecase.get(null);
    const settings = await settingsUsecase.getEffective();
    const existing = await invoiceRepo.getBySubscriptionId(subscriptionId);

    // Regenerate is a FULL reset back to the parent template + subscription:
    // amounts, fees, colors, notes, payment instructions, previous credit/debt,
    // issue/due dates and the billing period all revert. Only the stable invoice
    // number and the payment status are kept (re-pulling must not un-pay a paid
    // invoice). Admin figures start fresh at zero.
    const amounts = await this.computeAmounts(
      subscription,
      { previousCredit: 0, previousDebt: 0 },
      template,
      settings,
    );

    // Snapshot the discount breakdown alongside the copied template config.
    const discount = await this.computeDiscountSnapshot(
      subscription,
      Number(settings.hourlyRate),
    );
    const configJson = { ...template.configJson, discount };

    const issueDate = new Date();

    if (existing) {
      const updated = await invoiceRepo.update({
        id: existing.id,
        data: {
          ...amounts,
          configJson,
          issueDate,
          dueDate: this.computeDueDate(issueDate, template),
          // Clear any manual label so the period derives from the subscription.
          billingPeriodLabel: null,
        },
      });
      return { invoice: updated, regenerated: true };
    }

    const created = await invoiceRepo.create({
      data: {
        subscriptionId,
        invoiceNumber: this.invoiceNumberFor(subscriptionId),
        status: INVOICE_STATUSES.UNPAID,
        ...amounts,
        configJson,
        issueDate,
        dueDate: this.computeDueDate(issueDate, template),
        createdById,
      },
    });
    return { invoice: created, regenerated: false };
  }

  /**
   * Refresh only derived financial amounts for an existing unpaid invoice.
   * Per-invoice template overrides, notes, dates, send state and admin credit/
   * debt are preserved; the subscription duration/price and discount snapshot
   * are synchronized.
   */
  async refreshAmountsForSubscription(subscriptionId) {
    const [subscription, existing, settings] = await Promise.all([
      subscriptionRepo.getById(subscriptionId),
      invoiceRepo.getBySubscriptionId(subscriptionId),
      settingsUsecase.getEffective(),
    ]);
    if (!subscription || !existing) return null;
    if (existing.status !== INVOICE_STATUSES.UNPAID) return existing;

    const amounts = await this.computeAmounts(
      subscription,
      {
        previousCredit: existing.previousCredit,
        previousDebt: existing.previousDebt,
      },
      { configJson: existing.configJson ?? {} },
      settings,
    );
    const discount = await this.computeDiscountSnapshot(
      subscription,
      Number(settings.hourlyRate),
    );
    return invoiceRepo.update({
      id: existing.id,
      data: {
        ...amounts,
        configJson: {
          ...(existing.configJson ?? {}),
          discount,
        },
      },
    });
  }

  /**
   * System-initiated invoice creation (no admin gate) — used by the public
   * family-enrollment flow. Always creates a fresh UNPAID invoice for a
   * just-created subscription. `template` + `settings` are passed in (loaded
   * once by the caller); `plan` lets us skip a DB read inside the caller's tx.
   * Pass `tx` to run inside the caller's transaction.
   */
  async generateForSubscription(
    subscription,
    { template, settings, plan, createdById = null, tx } = {},
  ) {
    if (!subscription || subscription.priceCharged == null) return null;

    // Idempotent: one demand invoice per subscription. If it already exists
    // (e.g. this is a re-approval, or the caller is retrying), return it as-is
    // instead of violating the unique subscriptionId constraint.
    const already = await invoiceRepo.getBySubscriptionId(subscription.id);
    if (already) return already;

    const amounts = await this.computeAmounts(
      subscription,
      { previousCredit: 0, previousDebt: 0 },
      template,
      settings,
    );
    const discount = await this.computeDiscountSnapshot(
      subscription,
      Number(settings.hourlyRate),
      plan,
    );
    const configJson = { ...template.configJson, discount };
    const issueDate = new Date();

    return invoiceRepo.create({
      data: {
        subscriptionId: subscription.id,
        invoiceNumber: this.invoiceNumberFor(subscription.id),
        status: INVOICE_STATUSES.UNPAID,
        ...amounts,
        configJson,
        issueDate,
        dueDate: this.computeDueDate(issueDate, template),
        createdById,
      },
      client: tx,
    });
  }

  async getById({ id, authUser }) {
    const invoice = await invoiceRepo.getById({ id });
    if (!invoice) throw notFound(invoiceMessagesCodes.INVOICE_NOT_FOUND);
    await subscriptionUsecase.assertCanAccess(
      authUser,
      invoice.subscription?.studentId,
    );
    // A non-admin (parent/student) only sees an invoice once the teacher has
    // requested payment for it (sentAt set). Before that it does not exist for
    // them — same 404 as a missing invoice, so its existence is not leaked.
    if (authUser.role !== USER_ROLES.ADMIN && !invoice.sentAt) {
      throw notFound(invoiceMessagesCodes.INVOICE_NOT_FOUND);
    }
    return invoice;
  }

  /** Invoice for a subscription (scoped). Returns null when none exists yet. */
  async getBySubscription({ subscriptionId, authUser }) {
    const subscription = await subscriptionRepo.getById(subscriptionId);
    if (!subscription) {
      throw notFound(invoiceMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }
    await subscriptionUsecase.assertCanAccess(authUser, subscription.studentId);
    const invoice = await invoiceRepo.getBySubscriptionId(subscriptionId);
    // Hide an unsent invoice from non-admins (see getById) — to a parent/student
    // the subscription simply has no invoice until the teacher requests payment.
    if (authUser.role !== USER_ROLES.ADMIN && invoice && !invoice.sentAt) {
      return null;
    }
    return invoice;
  }

  /**
   * Paginated invoice list. The auth-scoped `where` (parent → their students,
   * student → self, admin → all) now lives in the repo (reference convention);
   * generic pagination lives in the repo too.
   */
  async list({ page, limit, filters = {}, authUser }) {
    return invoiceRepo.listScoped({ authUser, filters, page, limit });
  }

  /**
   * Admin edits the editable fields of an invoice: per-invoice config overrides,
   * the admin figures, notes, billing label, due date and payment status.
   * Hours / rate / subtotal are never editable (they come from the subscription).
   *
   * When the status moves to PAID and `activateSubscription` is true, the linked
   * subscription is activated (PENDING/UPCOMING → resolved by its date window).
   */
  async update(authUser, id, input) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(invoiceMessagesCodes.CANNOT_ACCESS_INVOICE);
    }
    const existing = await invoiceRepo.getById({ id });
    if (!existing) throw notFound(invoiceMessagesCodes.INVOICE_NOT_FOUND);

    const data = {};
    if (input.configJson !== undefined) {
      // Keep the render-only discount snapshot even if the edit form omits it.
      data.configJson = {
        ...input.configJson,
        discount:
          input.configJson.discount ?? existing.configJson?.discount ?? null,
      };
    }
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.billingPeriodLabel !== undefined) {
      data.billingPeriodLabel = input.billingPeriodLabel;
    }
    if (input.dueDate !== undefined) data.dueDate = input.dueDate;
    if (input.status !== undefined && input.status !== existing.status) {
      // Guard the payment-status workflow: a generic field edit must not jump the
      // invoice into an arbitrary state. UNPAID can be paid or voided; a PAID
      // invoice can only be voided; VOID is terminal.
      const ALLOWED_STATUS_TRANSITIONS = {
        [INVOICE_STATUSES.UNPAID]: [INVOICE_STATUSES.PAID, INVOICE_STATUSES.VOID],
        [INVOICE_STATUSES.PAID]: [INVOICE_STATUSES.VOID],
        [INVOICE_STATUSES.VOID]: [],
      };
      const allowed = ALLOWED_STATUS_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(input.status)) {
        throw badRequest(invoiceMessagesCodes.INVALID_STATUS_TRANSITION);
      }
      data.status = input.status;
    }

    // If any financial figure changed, recompute the dependent amounts using the
    // invoice's own (possibly overridden) fees and the immutable subtotal.
    const figuresChanged =
      input.previousCredit !== undefined ||
      input.previousDebt !== undefined ||
      input.configJson !== undefined;

    if (figuresChanged) {
      const previousCredit = roundMoney(
        input.previousCredit ?? existing.previousCredit,
      );
      const previousDebt = roundMoney(input.previousDebt ?? existing.previousDebt);
      const subtotal = roundMoney(existing.subtotal);
      const fees = (data.configJson ?? existing.configJson)?.fees ?? {};
      const transferFee = roundMoney(
        subtotal * (Number(fees.transferFeePercent) || 0) / 100 +
          (Number(fees.transferFeeFixed) || 0),
      );
      data.previousCredit = previousCredit;
      data.previousDebt = previousDebt;
      data.transferFee = transferFee;
      data.total = roundMoney(subtotal + transferFee + previousDebt - previousCredit);
    }

    const becomingPaid =
      input.status === INVOICE_STATUSES.PAID &&
      existing.status !== INVOICE_STATUSES.PAID;

    const updated = await invoiceRepo.update({ id, data });

    // Demand-invoice flow: paying the invoice can activate the subscription.
    if (becomingPaid && input.activateSubscription) {
      await this.activateSubscription(existing.subscriptionId);
    }

    return updated;
  }

  /**
   * Send the invoice to the student's parents via in-app notification and
   * (when configured) WhatsApp. Admin-only. Records sentAt on the invoice.
   * Messaging is best-effort: failures in the messaging layer never fail this
   * request (handled inside messagingService).
   */
  async send({ id, authUser }) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw new AppError({
        statusCode: 403,
        code: invoiceMessagesCodes.CANNOT_SEND_INVOICE,
        translationKey: messagesNames.invoiceMessages,
      });
    }
    const invoice = await invoiceRepo.getById({ id });
    if (!invoice) {
      throw new AppError({
        statusCode: 404,
        code: invoiceMessagesCodes.INVOICE_NOT_FOUND,
        translationKey: messagesNames.invoiceMessages,
      });
    }

    const student = invoice.subscription?.student ?? null;
    const parents = (student?.parents ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
    }));

    // Nothing to send to: the student has no linked parents. Refuse up-front
    // rather than stamping sentAt for a delivery that never happened.
    if (parents.length === 0) {
      throw new AppError({
        statusCode: 409,
        code: invoiceMessagesCodes.NO_PARENT_LINKED,
        translationKey: messagesNames.invoiceMessages,
      });
    }

    const link = `/dashboard/invoices/${invoice.id}`;

    const delivered = await messagingService.notifyInvoiceSent({
      parents,
      student,
      invoice,
      subscriptionId: invoice.subscriptionId,
      link,
    });

    // Only mark the invoice sent when at least one in-app notification was
    // actually created. If every creation failed, surface a 502 and leave
    // sentAt untouched so the admin can retry.
    if (delivered === 0) {
      throw new AppError({
        statusCode: 502,
        code: invoiceMessagesCodes.INVOICE_SEND_FAILED,
        translationKey: messagesNames.invoiceMessages,
      });
    }

    const updated = await invoiceRepo.update({
      id: invoice.id,
      data: { sentAt: new Date() },
    });
    return updated;
  }

  /**
   * Activate a subscription after its demand invoice is paid. Only promotes from
   * a not-yet-started state (PENDING/UPCOMING); CANCELLED/EXPIRED are left alone.
   */
  async activateSubscription(subscriptionId) {
    const subscription = await subscriptionRepo.getById(subscriptionId);
    if (!subscription) return;
    const promotable = [
      SUBSCRIPTION_STATUSES.PENDING,
      SUBSCRIPTION_STATUSES.UPCOMING,
    ];
    if (!promotable.includes(subscription.status)) return;

    const status = subscriptionUsecase.resolveStatus(
      subscription.startDate,
      subscription.endDate,
    );
    const updated = await subscriptionRepo.updateSubscription(subscriptionId, {
      status,
    });

    // Notify the student's PARENT(s) — they pay for and manage the subscription,
    // so the payment-confirmed/activation notice goes to them, not the student.
    try {
      const parentIds = await userRepo.getParentIdsForStudent(updated.studentId);
      if (parentIds.length) {
        await notificationUsecase.createManyForUsers(parentIds, {
          type: NOTIFICATION_TYPES.SUBSCRIPTION_CREATED,
          titleAr: "تم تأكيد الدفع وتفعيل اشتراك ابنك/ابنتك 🎉",
          titleEn: "Payment confirmed — your child's subscription is now active 🎉",
          link: `/dashboard/subscriptions/${updated.id}`,
          dataJson: { subscriptionId: updated.id, studentId: updated.studentId },
        });
      }
    } catch {
      // swallow — notification is best-effort
    }

    return updated;
  }
}

export const invoiceUsecase = new InvoiceUsecase();
export { InvoiceUsecase };
