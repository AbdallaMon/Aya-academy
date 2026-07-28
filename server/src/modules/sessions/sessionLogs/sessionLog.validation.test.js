import test from "node:test";
import assert from "node:assert/strict";
import {
  SESSION_ATTENDANCE,
  SESSION_SUBJECTS,
} from "@ayah/shared";
import { SessionLogValidation } from "./sessionLog.validation.js";

const validInput = {
  studentId: 1,
  subjects: [SESSION_SUBJECTS.QURAN_MEMORIZATION],
  durationMinutes: 45,
  attendance: SESSION_ATTENDANCE.PRESENT,
  sessionDate: new Date("2026-07-23T00:00:00.000Z"),
};

test("session create accepts integer minute duration", () => {
  const result =
    SessionLogValidation.createSessionLogSchema.safeParse(validInput);
  assert.equal(result.success, true);
  assert.equal(result.data.durationMinutes, 45);
});

test("session create rejects fractional minutes", () => {
  const result = SessionLogValidation.createSessionLogSchema.safeParse({
    ...validInput,
    durationMinutes: 45.5,
  });
  assert.equal(result.success, false);
});

test("session create temporarily accepts a legacy hour payload", () => {
  const { durationMinutes: _durationMinutes, ...legacyInput } = validInput;
  const result = SessionLogValidation.createSessionLogSchema.safeParse({
    ...legacyInput,
    durationHours: 0.75,
  });
  assert.equal(result.success, true);
});
