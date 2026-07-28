import assert from "node:assert/strict";
import test from "node:test";
import { USER_ROLES } from "@ayah/shared";
import { userRepo } from "../../users/user.repo.js";
import { subscriptionRepo } from "./subscription.repo.js";

test("admin can filter subscriptions by all children of a parent", async (t) => {
  const original = userRepo.getStudentIdsForParent;
  userRepo.getStudentIdsForParent = async (parentId) => {
    assert.equal(parentId, 7);
    return [11, 12];
  };
  t.after(() => {
    userRepo.getStudentIdsForParent = original;
  });

  const where = await subscriptionRepo.buildListWhere(
    { id: 1, role: USER_ROLES.ADMIN },
    { parentId: 7 },
  );

  assert.deepEqual(where, { studentId: { in: [11, 12] } });
});

test("student and parent subscription filters are intersected", async (t) => {
  const original = userRepo.getStudentIdsForParent;
  userRepo.getStudentIdsForParent = async () => [11, 12];
  t.after(() => {
    userRepo.getStudentIdsForParent = original;
  });

  const allowed = await subscriptionRepo.buildListWhere(
    { id: 1, role: USER_ROLES.ADMIN },
    { parentId: 7, studentId: 11 },
  );
  const denied = await subscriptionRepo.buildListWhere(
    { id: 1, role: USER_ROLES.ADMIN },
    { parentId: 7, studentId: 99 },
  );

  assert.deepEqual(allowed, { studentId: 11 });
  assert.deepEqual(denied, { studentId: { in: [] } });
});

test("subscription status is not part of the list filter contract", async () => {
  const where = await subscriptionRepo.buildListWhere(
    { id: 1, role: USER_ROLES.ADMIN },
    { status: "CANCELLED" },
  );

  assert.deepEqual(where, {});
});
