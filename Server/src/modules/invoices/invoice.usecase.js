import {
  INVOICE_STATUSES,
  NOTIFICATION_TYPES,
  SUBSCRIPTION_STATUSES,
  USER_ROLES,
  messagesNames,
} from "@aya/shared";
import { badRequest, forbidden, notFound } from "../../shared/errors/AppError.js";
import { paginate, paginatedResult } from "../../shared/utility/pagination.js";
import { userRepo } from "../users/user.repo.js";
import { planRepo } from "../plans/plan.repo.js";
import { subscriptionRepo } from "../subscriptions/subscription.repo.js";
import { subscriptionUsecase } from "../subscriptions/subscription.usecase.js";
import { paymentTemplateUsecase } from "../paymentTemplates/paymentTemplate.usecase.js";
import { notificationUsecase } from "../notifications/notification.usecase.js";
import { invoiceRepo } from "./invoice.repo.js";
import { invoiceMessagesCodes } from "./invoice.messages.js";

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

class InvoiceUsecase {
  /** Stable, human-friendly invoice number derived from the subscription id. */
  invoiceNumberFor(subscriptionId) {
    return `INV-${String(subscriptionId).padStart(6, "0")}`;
  }

  /**
   * Compute the snapshot amounts for a subscription. Hours/rate/subtotal come
   * straight from the subscription (the charged amount is authoritative); the
   * transfer fee comes from the template; previous credit/debt are admin figures.
   */
  async computeAmounts(subscription, adjust, template) {
    const hours = subscription.totalHours ?? null;
    const subtotal = round2(subscription.priceCharged ?? 0);

    let hourlyRate = null;
    if (subscription.planId) {
      const plan = await planRepo.getById(subscription.planId);
      if (plan?.hourlyRate != null) hourlyRate = round2(plan.hourlyRate);
    }
    if (hourlyRate == null && hours) hourlyRate = round2(subtotal / hours);

    const fees = template?.configJson?.fees ?? {};
    const transferFee = round2(
      subtotal * (Number(fees.transferFeePercent) || 0) / 100 +
        (Number(fees.transferFeeFixed) || 0),
    );

    const freeHours = round2(adjust?.freeHours ?? 0);
    const previousCredit = round2(adjust?.previousCredit ?? 0);
    const previousDebt = round2(adjust?.previousDebt ?? 0);

    const total = round2(subtotal + transferFee + previousDebt - previousCredit);

    return {
      currency: subscription.currency ?? "GBP",
      hours,
      hourlyRate,
      subtotal,
      transferFee,
      total,
      freeHours,
      previousCredit,
      previousDebt,
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
   * already exists. Regenerate re-copies the CURRENT global template and
   * recomputes amounts, preserving the invoice number, payment status and the
   * admin-entered figures (freeHours / previousCredit / previousDebt).
   */
  async generate(authUser, subscriptionId) {
    if (authUser.role !== USER_ROLES.ADMIN) {
      throw forbidden(invoiceMessagesCodes.CANNOT_ACCESS_INVOICE);
    }
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

    const template = await paymentTemplateUsecase.get(authUser);
    const existing = await invoiceRepo.getBySubscriptionId(subscriptionId);

    const amounts = await this.computeAmounts(
      subscription,
      {
        freeHours: existing?.freeHours,
        previousCredit: existing?.previousCredit,
        previousDebt: existing?.previousDebt,
      },
      template,
    );

    if (existing) {
      const updated = await invoiceRepo.update(existing.id, {
        ...amounts,
        configJson: template.configJson,
        dueDate: this.computeDueDate(existing.issueDate, template),
      });
      return { invoice: updated, regenerated: true };
    }

    const issueDate = new Date();
    const created = await invoiceRepo.create({
      subscriptionId,
      invoiceNumber: this.invoiceNumberFor(subscriptionId),
      status: INVOICE_STATUSES.UNPAID,
      ...amounts,
      configJson: template.configJson,
      issueDate,
      dueDate: this.computeDueDate(issueDate, template),
      createdById: authUser.id,
    });
    return { invoice: created, regenerated: false };
  }

  async getById(authUser, id) {
    const invoice = await invoiceRepo.getById(id);
    if (!invoice) throw notFound(invoiceMessagesCodes.INVOICE_NOT_FOUND);
    await subscriptionUsecase.assertCanAccess(
      authUser,
      invoice.subscription?.studentId,
    );
    return invoice;
  }

  /** Invoice for a subscription (scoped). Returns null when none exists yet. */
  async getBySubscription(authUser, subscriptionId) {
    const subscription = await subscriptionRepo.getById(subscriptionId);
    if (!subscription) {
      throw notFound(invoiceMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }
    await subscriptionUsecase.assertCanAccess(authUser, subscription.studentId);
    return invoiceRepo.getBySubscriptionId(subscriptionId);
  }

  async list(authUser, { page, limit, status }) {
    const { skip, take, page: p, limit: l } = paginate({ page, limit });

    const where = {};
    if (status) where.status = status;

    if (authUser.role === USER_ROLES.PARENT) {
      const studentIds = await userRepo.getStudentIdsForParent(authUser.id);
      where.subscription = { studentId: { in: studentIds } };
    } else if (authUser.role === USER_ROLES.STUDENT) {
      where.subscription = { studentId: authUser.id };
    }

    const { items, total } = await invoiceRepo.listInvoices(where, skip, take);
    return paginatedResult(items, total, p, l);
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
    const existing = await invoiceRepo.getById(id);
    if (!existing) throw notFound(invoiceMessagesCodes.INVOICE_NOT_FOUND);

    const data = {};
    if (input.configJson !== undefined) data.configJson = input.configJson;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.billingPeriodLabel !== undefined) {
      data.billingPeriodLabel = input.billingPeriodLabel;
    }
    if (input.dueDate !== undefined) data.dueDate = input.dueDate;
    if (input.status !== undefined) data.status = input.status;

    // If any financial figure changed, recompute the dependent amounts using the
    // invoice's own (possibly overridden) fees and the immutable subtotal.
    const figuresChanged =
      input.freeHours !== undefined ||
      input.previousCredit !== undefined ||
      input.previousDebt !== undefined ||
      input.configJson !== undefined;

    if (figuresChanged) {
      const freeHours = round2(input.freeHours ?? existing.freeHours);
      const previousCredit = round2(
        input.previousCredit ?? existing.previousCredit,
      );
      const previousDebt = round2(input.previousDebt ?? existing.previousDebt);
      const subtotal = round2(existing.subtotal);
      const fees = (data.configJson ?? existing.configJson)?.fees ?? {};
      const transferFee = round2(
        subtotal * (Number(fees.transferFeePercent) || 0) / 100 +
          (Number(fees.transferFeeFixed) || 0),
      );
      data.freeHours = freeHours;
      data.previousCredit = previousCredit;
      data.previousDebt = previousDebt;
      data.transferFee = transferFee;
      data.total = round2(subtotal + transferFee + previousDebt - previousCredit);
    }

    const becomingPaid =
      input.status === INVOICE_STATUSES.PAID &&
      existing.status !== INVOICE_STATUSES.PAID;

    const updated = await invoiceRepo.update(id, data);

    // Demand-invoice flow: paying the invoice can activate the subscription.
    if (becomingPaid && input.activateSubscription) {
      await this.activateSubscription(existing.subscriptionId);
    }

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

    try {
      await notificationUsecase.createNotification({
        userId: updated.studentId,
        type: NOTIFICATION_TYPES.SUBSCRIPTION_CREATED,
        titleAr: "تم تأكيد الدفع وتفعيل اشتراكك 🎉",
        titleEn: "Payment confirmed — your subscription is now active 🎉",
        link: "/dashboard",
      });
    } catch {
      // swallow — notification is best-effort
    }

    return updated;
  }
}

export const invoiceUsecase = new InvoiceUsecase();
