import test from "node:test";
import assert from "node:assert/strict";
import { couponMessagesCodes, messagesNames } from "@aya/shared";
import { CouponUsecase } from "./coupon.usecase.js";
import { couponRepo } from "./coupon.repo.js";

function scopedCoupon() {
  return {
    id: 1,
    code: "PLAN20",
    type: "PERCENT",
    value: 20,
    isActive: true,
    billingPeriod: "MONTHLY",
    startsAt: null,
    endsAt: null,
    maxRedemptions: null,
    redemptionsCount: 0,
    plans: [{ planId: 2 }],
  };
}

test("a plan-linked coupon only validates for its linked plan and cycle", async (t) => {
  t.mock.method(couponRepo, "getByCode", async () => scopedCoupon());
  const usecase = new CouponUsecase();

  assert.equal(
    (
      await usecase.validateCoupon({
        code: "PLAN20",
        planId: 2,
        billingPeriod: "MONTHLY",
      })
    ).valid,
    true,
  );
  assert.equal(
    (
      await usecase.validateCoupon({
        code: "PLAN20",
        planId: 3,
        billingPeriod: "MONTHLY",
      })
    ).valid,
    false,
  );
  assert.equal(
    (
      await usecase.validateCoupon({
        code: "PLAN20",
        planId: 2,
        billingPeriod: "YEARLY",
      })
    ).valid,
    false,
  );
});

test("coupon time window and global usage cap return distinct reasons", async (t) => {
  const usecase = new CouponUsecase();
  const coupon = scopedCoupon();
  t.mock.method(couponRepo, "getByCode", async () => coupon);

  coupon.startsAt = new Date(Date.now() + 60_000);
  let result = await usecase.validateCoupon({
    code: coupon.code,
    planId: 2,
    billingPeriod: "MONTHLY",
  });
  assert.equal(result.reason, couponMessagesCodes.COUPON_NOT_ACTIVE_YET);

  coupon.startsAt = null;
  coupon.endsAt = new Date(Date.now() - 60_000);
  result = await usecase.validateCoupon({
    code: coupon.code,
    planId: 2,
    billingPeriod: "MONTHLY",
  });
  assert.equal(result.reason, couponMessagesCodes.COUPON_EXPIRED);

  coupon.endsAt = null;
  coupon.maxRedemptions = 3;
  coupon.redemptionsCount = 3;
  result = await usecase.validateCoupon({
    code: coupon.code,
    planId: 2,
    billingPeriod: "MONTHLY",
  });
  assert.equal(result.reason, couponMessagesCodes.COUPON_USAGE_LIMIT_REACHED);
});

test("the same student cannot validate the same coupon for another subscription", async (t) => {
  t.mock.method(couponRepo, "getByCode", async () => scopedCoupon());
  t.mock.method(couponRepo, "findStudentCouponUsage", async () => ({
    redemption: { subscriptionId: 10 },
    subscription: null,
  }));
  const usecase = new CouponUsecase();

  const repeated = await usecase.validateCoupon({
    code: "PLAN20",
    planId: 2,
    billingPeriod: "MONTHLY",
    studentId: 7,
    currentSubscriptionId: 11,
  });
  assert.equal(repeated.valid, false);
  assert.equal(
    repeated.reason,
    couponMessagesCodes.COUPON_ALREADY_USED_BY_STUDENT,
  );

  const idempotent = await usecase.validateCoupon({
    code: "PLAN20",
    planId: 2,
    billingPeriod: "MONTHLY",
    studentId: 7,
    currentSubscriptionId: 10,
  });
  assert.equal(idempotent.valid, true);
});

test("consumeOnce writes the permanent ledger and increments one guarded slot", async (t) => {
  t.mock.method(couponRepo, "findStudentCouponUsage", async () => ({
    redemption: null,
    subscription: { id: 55 },
  }));
  t.mock.method(couponRepo, "createCouponRedemption", async (input) => ({
    id: 9,
    ...input,
  }));
  t.mock.method(
    couponRepo,
    "incrementCouponRedemptionWithinLimit",
    async () => ({ count: 1 }),
  );
  const usecase = new CouponUsecase();

  const result = await usecase.consumeOnce({
    couponId: 1,
    studentId: 7,
    subscriptionId: 55,
    client: {},
  });
  assert.equal(result.id, 9);
  assert.equal(result.studentId, 7);
});

test("consumeOnce rejects an older student redemption", async (t) => {
  t.mock.method(couponRepo, "findStudentCouponUsage", async () => ({
    redemption: { id: 1, subscriptionId: 44 },
    subscription: null,
  }));
  const usecase = new CouponUsecase();

  await assert.rejects(
    () =>
      usecase.consumeOnce({
        couponId: 1,
        studentId: 7,
        subscriptionId: 55,
        client: {},
      }),
    (error) =>
      error.code === couponMessagesCodes.COUPON_ALREADY_USED_BY_STUDENT &&
      error.translationKey === messagesNames.couponMessages,
  );
});

test("consumeOnce reports the global cap when the atomic reservation loses", async (t) => {
  t.mock.method(couponRepo, "findStudentCouponUsage", async () => ({
    redemption: null,
    subscription: { id: 55 },
  }));
  t.mock.method(couponRepo, "createCouponRedemption", async () => ({ id: 9 }));
  t.mock.method(
    couponRepo,
    "incrementCouponRedemptionWithinLimit",
    async () => ({ count: 0 }),
  );
  t.mock.method(couponRepo, "getById", async () => ({
    ...scopedCoupon(),
    maxRedemptions: 1,
    redemptionsCount: 1,
  }));
  const usecase = new CouponUsecase();

  await assert.rejects(
    () =>
      usecase.consumeOnce({
        couponId: 1,
        studentId: 7,
        subscriptionId: 55,
        client: {},
      }),
    (error) =>
      error.code === couponMessagesCodes.COUPON_USAGE_LIMIT_REACHED &&
      error.translationKey === messagesNames.couponMessages,
  );
});
