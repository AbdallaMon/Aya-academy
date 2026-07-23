import test from "node:test";
import assert from "node:assert/strict";
import { resolveCoupon } from "./couponPricing.js";

const plan = {
  currency: "USD",
  monthly: {
    base: 100,
    effective: 80,
    discount: {
      code: "AYA-WELCOME15",
      type: "PERCENT",
      value: 20,
    },
  },
};

test("plan discount is marked automatic while a typed coupon remains explicit", () => {
  const automatic = resolveCoupon(plan, "MONTHLY", { status: "plan" });
  assert.equal(automatic.applyPlanCoupon, true);
  assert.equal(automatic.applied, "plan");

  const manual = resolveCoupon(plan, "MONTHLY", {
    status: "custom",
    code: "MANUAL10",
    quote: { net: 90 },
  });
  assert.equal(manual.applyPlanCoupon, false);
  assert.equal(manual.codeToSend, "MANUAL10");
  assert.equal(manual.applied, "custom");
});

test("removing the plan discount disables automatic application", () => {
  const removed = resolveCoupon(plan, "MONTHLY", { status: "none" });
  assert.equal(removed.applyPlanCoupon, false);
  assert.equal(removed.codeToSend, undefined);
  assert.equal(removed.net, 100);
});
