import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveUsageHours } from "./usageBilling.js";

test("actual usage wins even when below plan", () => {
  assert.equal(resolveUsageHours({ usageHours: 5, planHours: 8 }), 5);
});

test("zero usage falls back to the sub's own plan hours", () => {
  assert.equal(resolveUsageHours({ usageHours: 0, planHours: 8 }), 8);
});

test("zero usage + no linked plan → null (caller skips)", () => {
  assert.equal(resolveUsageHours({ usageHours: 0, planHours: null }), null);
});
