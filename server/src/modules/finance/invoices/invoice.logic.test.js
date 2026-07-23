import test from "node:test";
import assert from "node:assert/strict";
import { InvoiceUsecase } from "./invoice.usecase.js";
import { invoiceRepo } from "./invoice.repo.js";
import { subscriptionRepo } from "../subscriptions/subscription.repo.js";
import { subscriptionUsecase } from "../subscriptions/subscription.usecase.js";
import { planRepo } from "../plans/plan.repo.js";
import { paymentTemplateUsecase } from "../paymentTemplates/paymentTemplate.usecase.js";
import { settingsUsecase } from "../../settings/settings.usecase.js";

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
    startDate: new Date("2026-07-01T00:00:00Z"),
    endDate: new Date("2026-07-31T23:59:59Z"),
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
