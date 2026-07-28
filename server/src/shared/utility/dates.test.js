import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calendarMonthWindow,
  endOfMonth,
  firstOfNextMonth,
  monthRange,
  previousMonth,
  usageMonthKey,
} from "./dates.js";

test("monthRange spans the whole UTC month", () => {
  const { gte, lt } = monthRange(new Date("2026-07-15T10:00:00Z"));
  assert.equal(gte.toISOString(), "2026-07-01T00:00:00.000Z");
  assert.equal(lt.toISOString(), "2026-08-01T00:00:00.000Z");
});

test("firstOfNextMonth rolls over year boundary", () => {
  assert.equal(
    firstOfNextMonth(new Date("2026-12-31T23:00:00Z")).toISOString(),
    "2027-01-01T00:00:00.000Z",
  );
});

test("endOfMonth is the last instant of the month", () => {
  assert.equal(
    endOfMonth(new Date("2026-08-01T00:00:00Z")).toISOString(),
    "2026-08-31T23:59:59.000Z",
  );
});

test("previousMonth returns the 1st of the prior month", () => {
  assert.equal(
    previousMonth(new Date("2026-08-01T00:00:00Z")).toISOString(),
    "2026-07-01T00:00:00.000Z",
  );
});

test("calendarMonthWindow always starts on day one and ends in the same month", () => {
  const window = calendarMonthWindow(new Date("2026-02-28T18:00:00Z"));
  assert.equal(window.startDate.toISOString(), "2026-02-01T00:00:00.000Z");
  assert.equal(window.endDate.toISOString(), "2026-02-28T23:59:59.000Z");
});

test("usageMonthKey is stable for every day in the same month", () => {
  assert.equal(
    usageMonthKey(17, new Date("2026-07-31T23:59:59Z")),
    "17:2026-07",
  );
});
