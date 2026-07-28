import test from "node:test";
import assert from "node:assert/strict";
import {
  hoursFromMinutes,
  legacyValueToMinutes,
  minutesFromHours,
  resolveStoredMinutes,
} from "./duration.js";
import { priceFromMinutes } from "./pricing.js";

test("converts between hours and integer minutes", () => {
  assert.equal(minutesFromHours(0.75), 45);
  assert.equal(minutesFromHours(1.5), 90);
  assert.equal(hoursFromMinutes(525), 8.75);
});

test("legacy values from 30 upward are already minutes", () => {
  assert.equal(legacyValueToMinutes(12), 720);
  assert.equal(legacyValueToMinutes(30), 30);
  assert.equal(legacyValueToMinutes(31), 31);
});

test("canonical minutes always win over the legacy value", () => {
  assert.equal(resolveStoredMinutes(45, 1), 45);
  assert.equal(resolveStoredMinutes(null, 1), 60);
});

test("prices minute durations from the hourly rate", () => {
  assert.equal(priceFromMinutes(30, 8), 4);
  assert.equal(priceFromMinutes(45, 8), 6);
  assert.equal(priceFromMinutes(60, 8), 8);
  assert.equal(priceFromMinutes(90, 8), 12);
  assert.equal(priceFromMinutes(525, 8), 70);
});
