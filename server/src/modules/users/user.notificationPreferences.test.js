import test from "node:test";
import assert from "node:assert/strict";
import { UserValidation } from "./user.validation.js";

test("notification preference validation requires both boolean values", () => {
  assert.equal(
    UserValidation.notificationPreferencesSchema.safeParse({
      inAppNotificationsEnabled: true,
      emailNotificationsEnabled: false,
    }).success,
    true,
  );
  assert.equal(
    UserValidation.notificationPreferencesSchema.safeParse({
      inAppNotificationsEnabled: true,
    }).success,
    false,
  );
  assert.equal(
    UserValidation.notificationPreferencesSchema.safeParse({
      inAppNotificationsEnabled: "false",
      emailNotificationsEnabled: true,
    }).success,
    false,
  );
});
