import test from "node:test";
import assert from "node:assert/strict";
import { SubscriptionUsecase } from "./subscription.usecase.js";
import { subscriptionRepo } from "./subscription.repo.js";
import { planRepo } from "../plans/plan.repo.js";
import { settingsUsecase } from "../../settings/settings.usecase.js";
import { couponRepo } from "../coupons/coupon.repo.js";

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
