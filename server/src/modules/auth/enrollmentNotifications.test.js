import test from "node:test";
import assert from "node:assert/strict";
import { buildEnrollmentAdminNotification } from "./enrollmentNotifications.js";

test("new enrollment creates one parent-linked notification with student email data", () => {
  const notification = buildEnrollmentAdminNotification({
    parent: { name: "Mona" },
    children: [{ name: "Ahmed" }, { name: "Sara" }],
    result: {
      parentId: 10,
      children: [
        { studentId: 21, subscriptionId: 31 },
        { studentId: 22, subscriptionId: 32 },
      ],
    },
  });

  assert.equal(notification.titleEn, "New enrollment: parent Mona");
  assert.equal(notification.link, "/dashboard/users/10");
  assert.deepEqual(notification.dataJson, {
    enrollmentType: "FAMILY",
    parentId: 10,
    students: [
      { id: 21, name: "Ahmed", link: "/dashboard/users/21" },
      { id: 22, name: "Sara", link: "/dashboard/users/22" },
    ],
  });
});
