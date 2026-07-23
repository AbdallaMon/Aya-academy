import test from "node:test";
import assert from "node:assert/strict";
import { SubscriptionUsecase } from "./subscription.usecase.js";
import { subscriptionRepo } from "./subscription.repo.js";
import { planRepo } from "../plans/plan.repo.js";
import { settingsUsecase } from "../../settings/settings.usecase.js";
import { couponRepo } from "../coupons/coupon.repo.js";
import { invoiceRepo } from "../invoices/invoice.repo.js";
import { notificationUsecase } from "../../notifications/notification.usecase.js";

const usecase = new SubscriptionUsecase();

test("PENDING and UPCOMING usage bills remain mutable while unpaid", () => {
  assert.equal(
    usecase.isMutableUsageSubscription({
      status: "PENDING",
      invoice: { status: "UNPAID" },
    }),
    true,
  );
  assert.equal(
    usecase.isMutableUsageSubscription({
      status: "UPCOMING",
      invoice: null,
    }),
    true,
  );
});

test("a paid pending bill is immutable", () => {
  assert.equal(
    usecase.isMutableUsageSubscription({
      status: "PENDING",
      invoice: { status: "PAID" },
    }),
    false,
  );
});

test("monthly subscriptions are aligned to the full calendar month", () => {
  const subject = new SubscriptionUsecase();
  const input = new Date("2026-01-31T18:30:00.000Z");
  assert.equal(
    subject.computeStartDate(input).toISOString(),
    "2026-01-01T00:00:00.000Z",
  );
  assert.equal(
    subject.computeEndDate(input, "MONTHLY").toISOString(),
    "2026-01-31T23:59:59.000Z",
  );
});

test("cancelled and expired usage rows release their month slot", () => {
  const subject = new SubscriptionUsecase();
  const start = new Date("2026-08-01T00:00:00.000Z");
  assert.equal(subject.usageSlotKey(5, start, "CANCELLED"), null);
  assert.equal(subject.usageSlotKey(5, start, "EXPIRED"), null);
  assert.equal(subject.usageSlotKey(5, start, "UPCOMING"), "5:2026-08");
});

test("billing snapshots sum canonical and legacy session durations", () => {
  const subject = new SubscriptionUsecase();
  assert.equal(
    subject.sumSessionRowsMinutes([
      { durationMinutes: 45, durationHours: null },
      { durationMinutes: null, durationHours: 1.5 },
    ]),
    135,
  );
});

test("the best active plan coupon is selected for the billing cycle", () => {
  const coupon = usecase.bestPlanCoupon(
    {
      coupons: [
        {
          coupon: {
            id: 1,
            type: "PERCENT",
            value: 10,
            isActive: true,
            billingPeriod: "MONTHLY",
            redemptionsCount: 0,
            maxRedemptions: null,
          },
        },
        {
          coupon: {
            id: 2,
            type: "PERCENT",
            value: 20,
            isActive: true,
            billingPeriod: "MONTHLY",
            redemptionsCount: 0,
            maxRedemptions: null,
          },
        },
      ],
    },
    "MONTHLY",
    100,
  );
  assert.equal(coupon?.id, 2);
});

test("automatic plan pricing skips a coupon already used by the student", async (t) => {
  const subject = new SubscriptionUsecase();
  const coupons = {
    WELCOME50: {
      id: 1,
      code: "WELCOME50",
      type: "PERCENT",
      value: 50,
      isActive: true,
      billingPeriod: "MONTHLY",
      startsAt: null,
      endsAt: null,
      redemptionsCount: 1,
      maxRedemptions: null,
      plans: [{ planId: 2 }],
    },
    SECOND20: {
      id: 2,
      code: "SECOND20",
      type: "PERCENT",
      value: 20,
      isActive: true,
      billingPeriod: "MONTHLY",
      startsAt: null,
      endsAt: null,
      redemptionsCount: 0,
      maxRedemptions: null,
      plans: [{ planId: 2 }],
    },
  };
  t.mock.method(couponRepo, "getByCode", async (code) => coupons[code]);
  t.mock.method(couponRepo, "findStudentCouponUsage", async ({ couponId }) => ({
    redemption: couponId === 1 ? { subscriptionId: 10 } : null,
    subscription: null,
  }));

  const result = await subject.computeUsagePricing({
    subsMinutes: 60,
    hourlyRate: 100,
    planId: 2,
    studentId: 7,
    plan: {
      coupons: [
        {
          coupon: coupons.WELCOME50,
        },
        {
          coupon: coupons.SECOND20,
        },
      ],
    },
  });

  assert.equal(result.couponId, 2);
  assert.equal(result.priceCharged, 80);
});

test("recomputes an unpaid PENDING next-month bill from its actual sessions", async (t) => {
  const subject = new SubscriptionUsecase();
  const open = {
    id: 99,
    studentId: 5,
    planId: 2,
    status: "PENDING",
    origin: "USAGE",
    couponId: null,
    coupon: null,
    invoice: { status: "UNPAID" },
  };
  const plan = { id: 2, hours: 8, coupons: [] };
  let usageArgs;
  let updateData;

  t.mock.method(settingsUsecase, "getEffective", async () => ({
    hourlyRate: 12,
    currency: "USD",
  }));
  t.mock.method(
    subscriptionRepo,
    "findOpenUsageSubscription",
    async () => open,
  );
  t.mock.method(
    subscriptionRepo,
    "sumUsageMinutesForStudentMonth",
    async (args) => {
      usageArgs = args;
      return 60;
    },
  );
  t.mock.method(planRepo, "getByIdWithCoupons", async () => plan);
  t.mock.method(subject, "runTransaction", async (run) => run({}));
  t.mock.method(subject, "consumeCoupon", async () => {});
  t.mock.method(
    subscriptionRepo,
    "updateSubscription",
    async (_id, data) => {
      updateData = data;
      return { ...open, ...data, plan };
    },
  );
  t.mock.method(subject, "refreshOrEnsureInvoice", async () => {});

  const result = await subject.recomputeOpenUsageSubscription({
    studentId: 5,
    sessionDate: new Date("2026-07-23T12:00:00.000Z"),
  });

  assert.equal(usageArgs.includeBilledSubscriptionId, 99);
  assert.equal(updateData.subsMinutes, 60);
  assert.equal(updateData.remainingMinutes, 60);
  assert.equal(updateData.priceCharged, 12);
  assert.equal(result.subsMinutes, 60);
});

test("changing a plan keeps session-derived minutes and processes the chosen coupon", async (t) => {
  const subject = new SubscriptionUsecase();
  const existing = {
    id: 41,
    studentId: 7,
    planId: 1,
    status: "UPCOMING",
    origin: "USAGE",
    startDate: new Date("2026-07-01T00:00:00Z"),
    subsMinutes: 75,
    remainingMinutes: 75,
    priceCharged: 15,
    couponId: 9,
    coupon: { id: 9 },
  };
  let usageArgs;
  let pricingArgs;
  let updateData;

  t.mock.method(subscriptionRepo, "getById", async () => existing);
  t.mock.method(invoiceRepo, "getBySubscriptionId", async () => ({
    id: 5,
    status: "UNPAID",
  }));
  t.mock.method(planRepo, "getByIdWithCoupons", async () => ({
    id: 2,
    hours: 8,
    isActive: true,
    coupons: [],
  }));
  t.mock.method(
    subscriptionRepo,
    "sumUsageMinutesForStudentMonth",
    async (args) => {
      usageArgs = args;
      return 75;
    },
  );
  t.mock.method(settingsUsecase, "getEffective", async () => ({
    hourlyRate: 12,
  }));
  t.mock.method(subject, "computeUsagePricing", async (args) => {
    pricingArgs = args;
    return { priceCharged: 15, couponId: 9 };
  });
  t.mock.method(subject, "runTransaction", async (work) => work({}));
  t.mock.method(subject, "consumeCoupon", async () => {});
  t.mock.method(
    subscriptionRepo,
    "updateSubscription",
    async (_id, data) => {
      updateData = data;
      return { ...existing, ...data };
    },
  );
  t.mock.method(notificationUsecase, "createNotification", async () => {});

  await subject.changePlan({
    authUser: { id: 1, role: "ADMIN" },
    id: 41,
    planId: 2,
    couponCode: "SAVE20",
  });

  assert.equal(usageArgs.includeBilledSubscriptionId, 41);
  assert.equal(pricingArgs.couponCode, "SAVE20");
  assert.equal(updateData.subsMinutes, undefined);
  assert.equal(updateData.remainingMinutes, undefined);
  assert.deepEqual(updateData.plan, { connect: { id: 2 } });
});

test("cancelling voids an unpaid invoice and releases the usage month slot atomically", async (t) => {
  const subject = new SubscriptionUsecase();
  const existing = {
    id: 52,
    studentId: 7,
    status: "UPCOMING",
    origin: "USAGE",
  };
  let subscriptionData;
  let invoiceData;

  t.mock.method(subscriptionRepo, "getById", async () => existing);
  t.mock.method(subject, "runTransaction", async (work) => work({}));
  t.mock.method(
    subscriptionRepo,
    "updateSubscription",
    async (_id, data) => {
      subscriptionData = data;
      return { ...existing, ...data };
    },
  );
  t.mock.method(invoiceRepo, "getBySubscriptionId", async () => ({
    id: 8,
    status: "UNPAID",
  }));
  t.mock.method(invoiceRepo, "update", async ({ data }) => {
    invoiceData = data;
    return { id: 8, ...data };
  });
  t.mock.method(notificationUsecase, "createNotification", async () => {});

  await subject.cancel({
    authUser: { id: 1, role: "ADMIN" },
    id: 52,
  });

  assert.deepEqual(subscriptionData, {
    status: "CANCELLED",
    usageMonthKey: null,
  });
  assert.deepEqual(invoiceData, {
    status: "VOID",
    sentAt: null,
  });
});
