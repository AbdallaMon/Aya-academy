import test from "node:test";
import assert from "node:assert/strict";
import { selectSubscriptionPeriods } from "./subscriptionPeriods.js";

const now = new Date("2026-07-23T12:00:00.000Z");

test("selects a current subscription regardless of pending payment", () => {
  const pending = {
    id: 1,
    status: "PENDING",
    origin: "MANUAL",
    startDate: "2026-07-01T00:00:00.000Z",
    endDate: "2026-07-31T23:59:59.000Z",
  };
  assert.equal(selectSubscriptionPeriods([pending], now).current?.id, 1);
});

test("selects PENDING or UPCOMING only from the next calendar month", () => {
  const rows = [
    {
      id: 2,
      status: "UPCOMING",
      origin: "USAGE",
      startDate: "2026-12-01T00:00:00.000Z",
      endDate: "2026-12-31T23:59:59.000Z",
    },
    {
      id: 3,
      status: "PENDING",
      origin: "USAGE",
      startDate: "2026-08-01T00:00:00.000Z",
      endDate: "2026-08-31T23:59:59.000Z",
    },
  ];
  assert.equal(selectSubscriptionPeriods(rows, now).next?.id, 3);
});

test("does not treat a paid active future usage subscription as the open next bill", () => {
  const row = {
    id: 4,
    status: "ACTIVE",
    origin: "USAGE",
    startDate: "2026-08-01T00:00:00.000Z",
    endDate: "2026-08-31T23:59:59.000Z",
  };
  assert.equal(selectSubscriptionPeriods([row], now).next, null);
});
