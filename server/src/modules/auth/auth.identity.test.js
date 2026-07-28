import test from "node:test";
import assert from "node:assert/strict";
import {
  USER_ROLES,
  authMessagesCodes,
  userMessagesCodes,
} from "@ayah/shared";
import { AuthValidation } from "./auth.validation.js";
import { UserValidation } from "../users/user.validation.js";

const registerBase = {
  name: "Parent",
  password: "secret123",
  phone: "+201001234567",
};

test("registration accepts email only, username only, or both", () => {
  for (const identity of [
    { email: "Parent@Example.com" },
    { username: "Parent_123" },
    { email: "parent@example.com", username: "parent_123" },
  ]) {
    const result = AuthValidation.registerSchema.safeParse({
      ...registerBase,
      ...identity,
    });
    assert.equal(result.success, true);
  }
});

test("registration requires at least one login identity", () => {
  const result = AuthValidation.registerSchema.safeParse(registerBase);
  assert.equal(result.success, false);
  assert.equal(
    result.error.issues.some(
      (issue) =>
        issue.message === authMessagesCodes.EMAIL_OR_USERNAME_REQUIRED,
    ),
    true,
  );
});

test("registration normalizes and validates usernames", () => {
  const valid = AuthValidation.registerSchema.parse({
    ...registerBase,
    username: " Parent.Name ",
  });
  assert.equal(valid.username, "parent.name");

  const invalid = AuthValidation.registerSchema.safeParse({
    ...registerBase,
    username: "not valid!",
  });
  assert.equal(invalid.success, false);
  assert.equal(
    invalid.error.issues.some(
      (issue) => issue.message === authMessagesCodes.INVALID_USERNAME,
    ),
    true,
  );
});

test("login accepts an email or username identifier and keeps legacy email", () => {
  for (const payload of [
    { identifier: "parent_123", password: "secret123" },
    { identifier: "parent@example.com", password: "secret123" },
    { email: "parent@example.com", password: "secret123" },
  ]) {
    assert.equal(AuthValidation.loginSchema.safeParse(payload).success, true);
  }
});

test("forgot password remains email-only", () => {
  assert.equal(
    AuthValidation.forgotPasswordSchema.safeParse({
      email: "parent@example.com",
    }).success,
    true,
  );
  assert.equal(
    AuthValidation.forgotPasswordSchema.safeParse({
      email: "parent_123",
    }).success,
    false,
  );
});

test("admin and parent user creation use the same identity rule", () => {
  const base = {
    name: "Student",
    password: "secret123",
    role: USER_ROLES.STUDENT,
  };

  assert.equal(
    UserValidation.createUserSchema.safeParse({
      ...base,
      username: "student_1",
    }).success,
    true,
  );

  const missing = UserValidation.createUserSchema.safeParse(base);
  assert.equal(missing.success, false);
  assert.equal(
    missing.error.issues.some(
      (issue) =>
        issue.message === userMessagesCodes.EMAIL_OR_USERNAME_REQUIRED,
    ),
    true,
  );

  assert.equal(
    UserValidation.createStudentSchema.safeParse({
      name: "Child",
      email: "child@example.com",
      password: "secret123",
    }).success,
    true,
  );
});

test("user updates normalize, validate, and allow clearing a username", () => {
  const updated = UserValidation.updateUserSchema.parse({
    username: " New.Parent_Name ",
  });
  assert.equal(updated.username, "new.parent_name");

  const cleared = UserValidation.updateUserSchema.parse({ username: "  " });
  assert.equal(cleared.username, null);

  const invalid = UserValidation.updateUserSchema.safeParse({
    username: "not valid!",
  });
  assert.equal(invalid.success, false);
  assert.equal(
    invalid.error.issues.some(
      (issue) => issue.message === userMessagesCodes.INVALID_USERNAME,
    ),
    true,
  );
});
