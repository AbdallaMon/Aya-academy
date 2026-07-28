import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@ayah/db/prisma.client.js";
import {
  USER_ROLES,
  messagesNames,
  userMessagesCodes,
} from "@ayah/shared";
import { UserUsecase } from "./user.usecase.js";
import { userRepo } from "./user.repo.js";

const admin = { id: 1, role: USER_ROLES.ADMIN };
const currentIdentity = {
  id: 20,
  role: USER_ROLES.STUDENT,
  email: "student@example.com",
  username: "student_old",
};

function mockTransaction(t, implementation) {
  const original = prisma.$transaction;
  prisma.$transaction = implementation;
  t.after(() => {
    prisma.$transaction = original;
  });
}

test("updating a username rejects an existing username with a field error", async (t) => {
  t.mock.method(userRepo, "getIdentityById", async () => currentIdentity);
  t.mock.method(userRepo, "findByUsername", async () => ({
    id: 99,
    username: "student_taken",
  }));
  const usecase = new UserUsecase();

  await assert.rejects(
    () =>
      usecase.update({
        id: currentIdentity.id,
        authUser: admin,
        username: "student_taken",
      }),
    (error) =>
      error.statusCode === 409 &&
      error.code === userMessagesCodes.USERNAME_ALREADY_EXISTS &&
      error.translationKey === messagesNames.userMessages &&
      error.details?.[0]?.field === "username",
  );
});

test("updating a username stores it and invalidates existing sessions", async (t) => {
  t.mock.method(userRepo, "getIdentityById", async () => currentIdentity);
  t.mock.method(userRepo, "findByUsername", async () => null);
  mockTransaction(t, async (work) => work({}));

  let updateInput;
  t.mock.method(userRepo, "updateUser", async (input) => {
    updateInput = input;
    return {
      ...currentIdentity,
      ...input.data,
      username: input.data.username,
    };
  });
  const usecase = new UserUsecase();

  const updated = await usecase.update({
    id: currentIdentity.id,
    authUser: admin,
    username: "student_new",
  });

  assert.equal(updated.username, "student_new");
  assert.equal(updateInput.id, currentIdentity.id);
  assert.equal(updateInput.data.username, "student_new");
  assert.deepEqual(updateInput.data.sessionVersion, { increment: 1 });
});

test("the final identity must keep an email or username", async (t) => {
  t.mock.method(userRepo, "getIdentityById", async () => ({
    ...currentIdentity,
    email: null,
  }));
  const usecase = new UserUsecase();

  await assert.rejects(
    () =>
      usecase.update({
        id: currentIdentity.id,
        authUser: admin,
        username: null,
      }),
    (error) =>
      error.statusCode === 422 &&
      error.code === userMessagesCodes.EMAIL_OR_USERNAME_REQUIRED &&
      error.details?.some((detail) => detail.field === "email") &&
      error.details?.some((detail) => detail.field === "username"),
  );
});

test("a parent can update only a linked child's username", async (t) => {
  const parent = { id: 7, role: USER_ROLES.PARENT };
  const usecase = new UserUsecase();

  t.mock.method(userRepo, "isStudentOfParent", async (_parentId, studentId) =>
    studentId === currentIdentity.id,
  );
  await assert.doesNotReject(() =>
    usecase.assertCanAccess(parent, currentIdentity.id),
  );
  await assert.rejects(
    () => usecase.assertCanAccess(parent, 999),
    (error) =>
      error.statusCode === 403 &&
      error.code === userMessagesCodes.CANNOT_ACCESS_USER,
  );
});

test("a database uniqueness race still returns the username conflict", async (t) => {
  t.mock.method(userRepo, "getIdentityById", async () => currentIdentity);
  t.mock.method(userRepo, "findByUsername", async () => null);
  mockTransaction(t, async (work) => work({}));
  t.mock.method(userRepo, "updateUser", async () => {
    throw { code: "P2002", meta: { target: ["username"] } };
  });
  const usecase = new UserUsecase();

  await assert.rejects(
    () =>
      usecase.update({
        id: currentIdentity.id,
        authUser: admin,
        username: "student_new",
      }),
    (error) =>
      error.statusCode === 409 &&
      error.code === userMessagesCodes.USERNAME_ALREADY_EXISTS &&
      error.details?.[0]?.field === "username",
  );
});
