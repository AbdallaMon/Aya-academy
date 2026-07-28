import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveUsageMinutes } from "./usageBilling.js";

test("actual usage wins even when below plan", () => {
  assert.equal(
    resolveUsageMinutes({ usageMinutes: 45, planMinutes: 480 }),
    45,
  );
});

test("zero usage falls back to the sub's own plan minutes", () => {
  assert.equal(
    resolveUsageMinutes({ usageMinutes: 0, planMinutes: 480 }),
    480,
  );
});

test("zero usage + no linked plan → null (caller skips)", () => {
  assert.equal(
    resolveUsageMinutes({ usageMinutes: 0, planMinutes: null }),
    null,
  );
});
