import test from "node:test";
import assert from "node:assert/strict";
import { NotificationUsecase } from "./notification.usecase.js";

function setup(recipients, { mailFails = false } = {}) {
  const calls = { create: [], createMany: [], emails: [], emits: [], errors: [] };
  const usecase = new NotificationUsecase({
    repo: {
      async create(args) {
        calls.create.push(args);
        return { id: 99, ...args.data };
      },
      async createMany(args) {
        calls.createMany.push(args);
        return { count: args.data.length };
      },
    },
    recipientRepo: {
      async getNotificationRecipients({ userIds }) {
        return recipients.filter((recipient) => userIds.includes(recipient.id));
      },
    },
    mailerProvider: {
      isReady: () => true,
      async sendMail(email) {
        calls.emails.push(email);
        if (mailFails) throw new Error("SMTP unavailable");
      },
    },
    emit: (...args) => calls.emits.push(args),
    emailBuilder: () => ({
      subject: "Notification",
      html: "<p>Notification</p>",
      text: "Notification",
    }),
    logger: { error: (...args) => calls.errors.push(args) },
  });
  return { usecase, calls };
}

const input = {
  userId: 1,
  type: "GENERIC",
  titleEn: "Test notification",
};

test("disabled channels create and send nothing", async () => {
  const { usecase, calls } = setup([
    {
      id: 1,
      email: "user@example.com",
      inAppNotificationsEnabled: false,
      emailNotificationsEnabled: false,
    },
  ]);

  assert.equal(await usecase.createNotification(input), null);
  assert.equal(calls.create.length, 0);
  assert.equal(calls.emails.length, 0);
  assert.equal(calls.emits.length, 0);
});

test("email failure is swallowed and does not break notification creation", async () => {
  const { usecase, calls } = setup(
    [
      {
        id: 1,
        email: "user@example.com",
        locale: "en",
        inAppNotificationsEnabled: true,
        emailNotificationsEnabled: true,
      },
    ],
    { mailFails: true },
  );

  const created = await usecase.createNotification(input);
  assert.equal(created.id, 99);
  assert.equal(calls.create.length, 1);
  assert.equal(calls.emits.length, 1);
  assert.equal(calls.emails.length, 1);
  assert.equal(calls.errors.length, 1);
});

test("bulk delivery respects each recipient channel preference", async () => {
  const { usecase, calls } = setup([
    {
      id: 1,
      email: "one@example.com",
      inAppNotificationsEnabled: true,
      emailNotificationsEnabled: false,
    },
    {
      id: 2,
      email: "two@example.com",
      inAppNotificationsEnabled: false,
      emailNotificationsEnabled: true,
    },
    {
      id: 3,
      email: "three@example.com",
      inAppNotificationsEnabled: true,
      emailNotificationsEnabled: true,
    },
  ]);

  const result = await usecase.createManyForUsers([1, 2, 3, 3], input);
  assert.equal(result.count, 2);
  assert.equal(result.emailCount, 2);
  assert.deepEqual(
    calls.createMany[0].data.map((item) => item.userId),
    [1, 3],
  );
  assert.deepEqual(
    calls.emails.map((email) => email.to),
    ["two@example.com", "three@example.com"],
  );
  assert.deepEqual(
    calls.emits.map(([userId]) => userId),
    [1, 3],
  );
});
