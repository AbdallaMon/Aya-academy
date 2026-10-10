import test from "node:test";
import assert from "node:assert/strict";
import { InvoiceUsecase } from "./invoice.usecase.js";
import { invoiceRepo } from "./invoice.repo.js";
import { subscriptionRepo } from "../subscriptions/subscription.repo.js";
import { subscriptionUsecase } from "../subscriptions/subscription.usecase.js";
import { planRepo } from "../plans/plan.repo.js";
import { paymentTemplateUsecase } from "../paymentTemplates/paymentTemplate.usecase.js";
import { settingsUsecase } from "../../settings/settings.usecase.js";
import { InvoiceValidation } from "./invoice.validation.js";
import { getInvoiceDiscountState } from '@ayah/shared';
import { buildInvoicePreview } from '../../../../../web/src/features/invoices/lib/invoiceEditPricing.js';

test("invoice-only pricing is optional and rejects fractional cents", () => {
  assert.equal(InvoiceValidation.updateSchema.safeParse({ notes: "Updated" }).success, true);
  assert.equal(InvoiceValidation.updateSchema.safeParse({
    pricing: {
      minutes: 60,
      hourlyRate: 1.234,
      currency: "USD",
      adjustmentAmount: 0,
      adjustmentReason: "",
    },
  }).success, false);
});

test("manual rebilling snapshots exact sessions and pauses subscription atomically", async (t) => {
  const subject = new InvoiceUsecase();
  const subscription = {
    id: 14,
    studentId: 6,
    planId: 2,
    origin: "USAGE",
    status: "ACTIVE",
    startDate: new Date("2026-08-01T00:00:00Z"),
    subsMinutes: 60,
    coupon: null,
  };
  let subscriptionData;
  let billedIds;
  let invoiceData;

  t.mock.method(subscriptionRepo, "getById", async () => subscription);
  t.mock.method(invoiceRepo, "getBySubscriptionId", async () => ({
    id: 20,
    status: "PAID",
  }));
  t.mock.method(planRepo, "getByIdWithCoupons", async () => ({
    id: 2,
    hours: 8,
    coupons: [],
  }));
  t.mock.method(paymentTemplateUsecase, "get", async () => ({
    configJson: {},
  }));
  t.mock.method(settingsUsecase, "getEffective", async () => ({
    hourlyRate: 12,
    currency: "USD",
  }));
  t.mock.method(subject, "runTransaction", async (work) => work({}));
  t.mock.method(
    subscriptionRepo,
    "listBillableSessionsForStudentMonth",
    async () => [
      { id: 1, durationMinutes: 45 },
      { id: 2, durationMinutes: 45 },
    ],
  );
  t.mock.method(subscriptionUsecase, "sumSessionRowsMinutes", () => 90);
  t.mock.method(subscriptionUsecase, "computeUsagePricing", async () => ({
    priceCharged: 18,
  }));
  t.mock.method(subscriptionUsecase, "usageSlotKey", () => "6:2026-08");
  t.mock.method(
    subscriptionRepo,
    "updateSubscription",
    async (_id, data) => {
      subscriptionData = data;
      return { ...subscription, ...data };
    },
  );
  t.mock.method(
    subscriptionRepo,
    "markSessionIdsBilled",
    async ({ ids }) => {
      billedIds = ids;
      return ids.length;
    },
  );
  t.mock.method(subject, "computeAmounts", async () => ({
    subtotal: 18,
    total: 18,
  }));
  t.mock.method(subject, "computeDiscountSnapshot", async () => null);
  t.mock.method(invoiceRepo, "update", async ({ data }) => {
    invoiceData = data;
    return { id: 20, ...data };
  });

  const result = await subject.rebillForSubscription(14);

  assert.equal(result.rebilled, true);
  assert.deepEqual(billedIds, [1, 2]);
  assert.equal(subscriptionData.status, "PENDING");
  assert.equal(subscriptionData.subsMinutes, 90);
  assert.equal(invoiceData.status, "UNPAID");
  assert.equal(invoiceData.sentAt, null);
});

test("paying and activating update invoice and subscription in one transaction", async (t) => {
  const subject = new InvoiceUsecase();
  let transactionCalls = 0;
  let invoiceStatus;
  let subscriptionStatus;

  t.mock.method(invoiceRepo, "getById", async () => ({
    id: 8,
    status: "UNPAID",
    subscriptionId: 3,
    subtotal: 10,
    previousCredit: 0,
    previousDebt: 0,
    configJson: {},
  }));
  t.mock.method(subject, "runTransaction", async (work) => {
    transactionCalls += 1;
    return work({});
  });
  t.mock.method(invoiceRepo, "update", async ({ data }) => {
    invoiceStatus = data.status;
    return { id: 8, ...data };
  });
  t.mock.method(subscriptionRepo, "getById", async () => ({
    id: 3,
    studentId: 7,
    origin: "MANUAL",
    status: "PENDING",
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }));
  t.mock.method(
    subscriptionRepo,
    "getCurrentlySubscribedStudentIds",
    async () => [],
  );
  t.mock.method(
    subscriptionRepo,
    "updateSubscription",
    async (_id, data) => {
      subscriptionStatus = data.status;
      return { id: 3, ...data };
    },
  );

  await subject.update({ role: "ADMIN" }, 8, {
    status: "PAID",
    activateSubscription: true,
  });

  assert.equal(transactionCalls, 1);
  assert.equal(invoiceStatus, "PAID");
  assert.equal(subscriptionStatus, "ACTIVE");
});

test("optional invoice pricing edit recalculates only the invoice", async (t) => {
  const subject = new InvoiceUsecase();
  const existing = {
    id: 8,
    subscriptionId: 3,
    status: "UNPAID",
    sentAt: null,
    minutes: 120,
    hourlyRate: 10,
    currency: "USD",
    subtotal: 20,
    previousCredit: 0,
    previousDebt: 0,
    configJson: { fees: { transferFeePercent: 5, transferFeeFixed: 1 } },
  };
  let invoiceData;
  t.mock.method(invoiceRepo, "getById", async () => existing);
  t.mock.method(invoiceRepo, "update", async ({ data }) => {
    invoiceData = data;
    return { ...existing, ...data };
  });
  t.mock.method(subject, "runTransaction", async (work) => work({}));
  t.mock.method(subscriptionRepo, "updateSubscription", () => {
    assert.fail("invoice pricing must not edit the subscription");
  });

  await subject.update({ role: "ADMIN" }, 8, {
    pricing: {
      minutes: 90,
      hourlyRate: 12,
      currency: "GBP",
      adjustmentAmount: -2,
      adjustmentReason: "Agreed reduction",
    },
  });

  assert.equal(invoiceData.minutes, 90);
  assert.equal(invoiceData.hourlyRate, 12);
  assert.equal(invoiceData.currency, "GBP");
  assert.equal(invoiceData.subtotal, 18);
  assert.equal(invoiceData.transferFee, 1.9);
  assert.equal(invoiceData.total, 17.9);
  assert.equal(invoiceData.configJson.invoicePricingOverride, true);
  assert.deepEqual(invoiceData.configJson.invoiceAdjustment, {
    amount: -2,
    reason: "Agreed reduction",
  });
});

test("invoice pricing cannot change after the first send", async (t) => {
  const subject = new InvoiceUsecase();
  t.mock.method(invoiceRepo, "getById", async () => ({
    id: 8,
    status: "UNPAID",
    sentAt: new Date("2026-10-01T00:00:00Z"),
    minutes: 60,
    hourlyRate: 10,
    currency: "USD",
    configJson: {},
  }));
  t.mock.method(invoiceRepo, "update", () => {
    assert.fail("sent invoice pricing must not be saved");
  });

  await assert.rejects(
    subject.update({ role: "ADMIN" }, 8, {
      pricing: {
        minutes: 120,
        hourlyRate: 10,
        currency: "USD",
        adjustmentAmount: 0,
        adjustmentReason: "",
      },
    }),
    { code: "INVOICE_CANNOT_EDIT_PRICING" },
  );
});

test("repricing in the same currency keeps the invoice coupon breakdown consistent", async (t) => {
  const subject = new InvoiceUsecase();
  const existing = {
    id: 9,
    status: "UNPAID",
    sentAt: null,
    minutes: 60,
    hourlyRate: 10,
    currency: "USD",
    subtotal: 9,
    previousCredit: 0,
    previousDebt: 0,
    configJson: {
      fees: {},
      discount: { type: "PERCENT", value: 10, base: 10, amount: 1, code: "SAVE10" },
    },
  };
  let saved;
  t.mock.method(invoiceRepo, "getById", async () => existing);
  t.mock.method(invoiceRepo, "update", async ({ data }) => {
    saved = data;
    return { ...existing, ...data };
  });
  t.mock.method(subject, "runTransaction", async (work) => work({}));

  await subject.update({ role: "ADMIN" }, 9, {
    pricing: {
      minutes: 120,
      hourlyRate: 10,
      currency: "USD",
      adjustmentAmount: 0,
      adjustmentReason: "",
    },
  });

  assert.equal(saved.configJson.discount.base, 20);
  assert.equal(saved.configJson.discount.amount, 2);
  assert.equal(saved.subtotal, 18);
  assert.equal(saved.total, 18);
});

test("subscription refresh leaves a manually priced invoice intact", async (t) => {
  const subject = new InvoiceUsecase();
  const invoice = {
    id: 8,
    status: "UNPAID",
    configJson: { invoicePricingOverride: true },
  };
  t.mock.method(subscriptionRepo, "getById", async () => ({ id: 3 }));
  t.mock.method(invoiceRepo, "getBySubscriptionId", async () => invoice);
  t.mock.method(settingsUsecase, "getEffective", async () => ({ hourlyRate: 10 }));
  t.mock.method(invoiceRepo, "update", () => {
    assert.fail("automatic refresh must not overwrite the invoice override");
  });

  assert.equal(await subject.refreshAmountsForSubscription(3), invoice);
});

test("editing invoice notes keeps a prior adjustment in the total", async (t) => {
  const subject = new InvoiceUsecase();
  const existing = {
    id: 10,
    status: "UNPAID",
    sentAt: null,
    subtotal: 20,
    previousCredit: 0,
    previousDebt: 0,
    configJson: {
      fees: {},
      invoicePricingOverride: true,
      invoiceAdjustment: { amount: -3, reason: "Agreed reduction" },
    },
  };
  let saved;
  t.mock.method(invoiceRepo, "getById", async () => existing);
  t.mock.method(invoiceRepo, "update", async ({ data }) => {
    saved = data;
    return { ...existing, ...data };
  });
  t.mock.method(subject, "runTransaction", async (work) => work({}));

  await subject.update({ role: "ADMIN" }, 10, {
    configJson: { fees: {}, notes: [{ ar: "تم التعديل" }] },
  });

  assert.equal(saved.total, 17);
  assert.equal(saved.configJson.invoicePricingOverride, true);
  assert.deepEqual(saved.configJson.invoiceAdjustment, existing.configJson.invoiceAdjustment);
});

function editableInvoice(discount = { type: 'PERCENT', value: 10, code: 'SAVE10', base: 20, amount: 2 }) {
  return {
    id: 30, subscriptionId: 3, status: 'UNPAID', sentAt: null,
    minutes: 120, hours: 2, hourlyRate: 10, currency: 'GBP',
    subtotal: discount ? 20 - discount.amount : 20, previousCredit: 0, previousDebt: 0,
    configJson: { discount, fees: {} },
  };
}

function mockInvoiceUpdates(t, subject, initial) {
  let current = initial;
  t.mock.method(invoiceRepo, 'getById', async () => current);
  t.mock.method(invoiceRepo, 'update', async ({ data }) => {
    current = { ...current, ...data };
    return current;
  });
  t.mock.method(subject, 'runTransaction', async work => work({}));
  t.mock.method(subscriptionRepo, 'updateSubscription', () => assert.fail('Invoice editing must not change the subscription'));
  return () => current;
}

const invoicePricingInput = (extra = {}) => ({
  minutes: 120, hourlyRate: 10, currency: 'GBP', discountMode: 'APPLIED',
  manualDiscountAmount: 0, adjustmentAmount: 0, adjustmentReason: '', ...extra,
});

test('switching coupon to manual and back preserves the original coupon after reload', async t => {
  const subject = new InvoiceUsecase();
  const current = mockInvoiceUpdates(t, subject, editableInvoice());
  await subject.update({ role: 'ADMIN' }, 30, {
    pricing: invoicePricingInput({ discountMode: 'MANUAL', manualDiscountAmount: 5 }),
  });
  assert.equal(current().subtotal, 15);
  assert.equal(current().configJson.discount.source, 'MANUAL');
  assert.equal(current().configJson.discount.code, null);
  assert.equal(getInvoiceDiscountState(current()).manualAmount, 5);
  assert.equal(getInvoiceDiscountState(current()).applied.code, 'SAVE10');
  await subject.update({ role: 'ADMIN' }, 30, {
    pricing: invoicePricingInput({ minutes: 180, hourlyRate: 12 }),
  });
  assert.equal(current().subtotal, 32.4);
  assert.equal(current().configJson.discount.amount, 3.6);
  assert.equal(current().configJson.discount.code, 'SAVE10');
});

test('fixed manual discount stays fixed when hours change and can be cleared to zero', async t => {
  const subject = new InvoiceUsecase();
  const current = mockInvoiceUpdates(t, subject, editableInvoice(null));
  const manual = invoicePricingInput({ discountMode: 'MANUAL', manualDiscountAmount: 3 });
  await subject.update({ role: 'ADMIN' }, 30, { pricing: manual });
  await subject.update({ role: 'ADMIN' }, 30, { pricing: { ...manual, minutes: 180 } });
  assert.equal(current().configJson.discount.amount, 3);
  assert.equal(current().subtotal, 27);
  await subject.update({ role: 'ADMIN' }, 30, { pricing: { ...manual, minutes: 180, manualDiscountAmount: 0 } });
  assert.equal(current().subtotal, 30);
});

test('linked coupon repairs a missing legacy discount snapshot on edit', async t => {
  const subject = new InvoiceUsecase();
  const initial = editableInvoice(null);
  initial.subscription = { currency: 'GBP', coupon: { code: 'SAVE10', type: 'PERCENT', value: 10 } };
  const current = mockInvoiceUpdates(t, subject, initial);
  await subject.update({ role: 'ADMIN' }, 30, { pricing: invoicePricingInput({ minutes: 180 }) });
  assert.equal(current().subtotal, 27);
  assert.equal(current().configJson.discount.amount, 3);
});

test('percentage coupon survives a currency change', async t => {
  const subject = new InvoiceUsecase();
  const current = mockInvoiceUpdates(t, subject, editableInvoice());
  await subject.update({ role: 'ADMIN' }, 30, { pricing: invoicePricingInput({ currency: 'USD' }) });
  assert.equal(current().subtotal, 18);
  assert.equal(current().configJson.discount.amount, 2);
});

test('fixed applied coupon is capped at the base and cannot be silently converted', async t => {
  const subject = new InvoiceUsecase();
  const current = mockInvoiceUpdates(t, subject, editableInvoice({ type: 'FIXED', value: 5, base: 20, amount: 5, code: 'FIVE' }));
  await assert.rejects(subject.update({ role: 'ADMIN' }, 30, {
    pricing: invoicePricingInput({ currency: 'USD' }),
  }), { code: 'INVOICE_DISCOUNT_CURRENCY_MISMATCH' });
  await subject.update({ role: 'ADMIN' }, 30, { pricing: invoicePricingInput({ minutes: 6 }) });
  assert.equal(current().subtotal, 0);
  assert.equal(current().configJson.discount.amount, 1);
  await subject.update({ role: 'ADMIN' }, 30, {
    pricing: invoicePricingInput({ currency: 'USD', discountMode: 'MANUAL', manualDiscountAmount: 2 }),
  });
  assert.equal(current().subtotal, 18);
});

test('discount edits reject negative, excessive and fractional-cent amounts and unavailable coupons', async t => {
  const subject = new InvoiceUsecase();
  const current = mockInvoiceUpdates(t, subject, editableInvoice(null));
  for (const manualDiscountAmount of [-1, 21, 1.234]) {
    await assert.rejects(subject.update({ role: 'ADMIN' }, 30, {
      pricing: invoicePricingInput({ discountMode: 'MANUAL', manualDiscountAmount }),
    }), { code: 'INVOICE_INVALID_DISCOUNT' });
  }
  await assert.rejects(subject.update({ role: 'ADMIN' }, 30, { pricing: invoicePricingInput() }), { code: 'INVOICE_DISCOUNT_UNAVAILABLE' });
  assert.equal(current().subtotal, 20);
});

test('discount-only edits retain the unpaid and first-send guards', async t => {
  const subject = new InvoiceUsecase();
  const initial = { ...editableInvoice(), sentAt: new Date() };
  mockInvoiceUpdates(t, subject, initial);
  await assert.rejects(subject.update({ role: 'ADMIN' }, 30, {
    pricing: invoicePricingInput({ discountMode: 'MANUAL', manualDiscountAmount: 5 }),
  }), { code: 'INVOICE_CANNOT_EDIT_PRICING' });
});

test('template config cannot replace server-owned coupon definitions or discount mode', async t => {
  const subject = new InvoiceUsecase();
  const current = mockInvoiceUpdates(t, subject, editableInvoice());
  await subject.update({ role: 'ADMIN' }, 30, {
    configJson: { fees: {}, discount: { type: 'PERCENT', value: 100 }, invoiceDiscount: { mode: 'APPLIED', applied: { type: 'PERCENT', value: 100 } } },
    pricing: invoicePricingInput({ minutes: 180 }),
  });
  assert.equal(current().subtotal, 27);
  assert.equal(current().configJson.invoiceDiscount.applied.value, 10);
});

test('live preview and saved invoice agree including fees, balances and adjustment', async t => {
  const subject = new InvoiceUsecase();
  const initial = editableInvoice();
  const current = mockInvoiceUpdates(t, subject, initial);
  const values = {
    hours: 3, hourlyRate: 12, currency: 'GBP', discountMode: 'APPLIED', manualDiscountAmount: 0,
    transferFeePercent: 5, transferFeeFixed: 1, previousDebt: 3, previousCredit: 2,
    adjustmentAmount: -1, adjustmentReason: 'Agreed reduction',
  };
  const preview = buildInvoicePreview(values, initial);
  await subject.update({ role: 'ADMIN' }, 30, {
    pricing: invoicePricingInput({ minutes: 180, hourlyRate: 12, adjustmentAmount: -1, adjustmentReason: 'Agreed reduction' }),
    configJson: { fees: { transferFeePercent: 5, transferFeeFixed: 1 } }, previousDebt: 3, previousCredit: 2,
  });
  assert.equal(current().subtotal, preview.subtotal);
  assert.equal(current().transferFee, preview.transferFee);
  assert.equal(current().total, preview.total);
  assert.equal(current().total, 35.02);
});

test('discount API validation accepts optional modes and rejects invalid enum, negative or sub-cent amounts', () => {
  assert.equal(InvoiceValidation.updateSchema.safeParse({ pricing: invoicePricingInput() }).success, true);
  for (const input of [
    { discountMode: 'OTHER' }, { manualDiscountAmount: -1 }, { manualDiscountAmount: 1.001 },
  ]) {
    assert.equal(InvoiceValidation.updateSchema.safeParse({ pricing: invoicePricingInput(input) }).success, false);
  }
});
