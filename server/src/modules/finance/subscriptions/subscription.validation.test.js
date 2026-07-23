import test from "node:test";
import assert from "node:assert/strict";
import { SubscriptionValidation } from "./subscription.validation.js";

test("generic subscription edit accepts only remaining duration and notes", () => {
  assert.equal(
    SubscriptionValidation.updateSubscriptionSchema.safeParse({
      remainingMinutes: 45,
      notes: "manual adjustment",
    }).success,
    true,
  );
});

test("generic subscription edit rejects workflow-owned fields", () => {
  for (const payload of [
    { status: "ACTIVE" },
    { planId: 3 },
    { priceCharged: 1 },
    { couponId: 2 },
    { startDate: new Date() },
  ]) {
    assert.equal(
      SubscriptionValidation.updateSubscriptionSchema.safeParse(payload)
        .success,
      false,
    );
  }
});
