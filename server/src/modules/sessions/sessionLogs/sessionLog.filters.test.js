import assert from "node:assert/strict";
import test from "node:test";
import { USER_ROLES } from "@ayah/shared";
import { userRepo } from "../../users/user.repo.js";
import { sessionLogRepo } from "./sessionLog.repo.js";

test("admin can filter sessions by all children of a parent", async (t) => {
  const original = userRepo.getStudentIdsForParent;
  userRepo.getStudentIdsForParent = async (parentId) => {
    assert.equal(parentId, 7);
    return [11, 12];
  };
  t.after(() => {
    userRepo.getStudentIdsForParent = original;
  });

  const where = await sessionLogRepo.buildListWhere(
    { id: 1, role: USER_ROLES.ADMIN },
    { parentId: 7 },
  );

  assert.deepEqual(where.studentId, { in: [11, 12] });
});

test("student and parent session filters are intersected", async (t) => {
  const original = userRepo.getStudentIdsForParent;
  userRepo.getStudentIdsForParent = async () => [11, 12];
  t.after(() => {
    userRepo.getStudentIdsForParent = original;
  });

  const allowed = await sessionLogRepo.buildListWhere(
    { id: 1, role: USER_ROLES.ADMIN },
    { parentId: 7, studentId: 12 },
  );
  const denied = await sessionLogRepo.buildListWhere(
    { id: 1, role: USER_ROLES.ADMIN },
    { parentId: 7, studentId: 99 },
  );

  assert.equal(allowed.studentId, 12);
  assert.deepEqual(denied.studentId, { in: [] });
});

test("a parent cannot use parentId to leave their own session scope", async (t) => {
  const original = userRepo.getStudentIdsForParent;
  userRepo.getStudentIdsForParent = async () => [11, 12];
  t.after(() => {
    userRepo.getStudentIdsForParent = original;
  });

  const where = await sessionLogRepo.buildListWhere(
    { id: 7, role: USER_ROLES.PARENT },
    { parentId: 8 },
  );

  assert.deepEqual(where.studentId, { in: [] });
});
