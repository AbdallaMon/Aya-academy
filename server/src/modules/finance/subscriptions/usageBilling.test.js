import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveUsageHours } from "./usageBilling.js";

test("actual usage wins even when below plan", () => {
  assert.equal(resolveUsageHours({ usageHours: 5, planHours: 8, lowestPlanHours: 4 }), 5);
});

test("zero usage falls back to the student's plan hours", () => {
  assert.equal(resolveUsageHours({ usageHours: 0, planHours: 8, lowestPlanHours: 4 }), 8);
});

test("zero usage + no plan falls back to lowest active plan", () => {
  assert.equal(resolveUsageHours({ usageHours: 0, planHours: null, lowestPlanHours: 4 }), 4);
});

test("no usage, no plan, no plans in system → null (caller skips)", () => {
  assert.equal(resolveUsageHours({ usageHours: 0, planHours: null, lowestPlanHours: null }), null);
});
