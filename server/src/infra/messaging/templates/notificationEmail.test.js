import test from "node:test";
import assert from "node:assert/strict";
import {
  buildNotificationEmail,
  buildNotificationUrl,
} from "./notificationEmail.js";

test("notification links are localized and absolute", () => {
  assert.equal(
    buildNotificationUrl({
      link: "/dashboard/reports/7",
      locale: "ar",
      appUrl: "https://ayah.example",
    }),
    "https://ayah.example/ar/dashboard/reports/7",
  );
  assert.equal(
    buildNotificationUrl({
      link: "/en/dashboard",
      locale: "ar",
      appUrl: "https://ayah.example/",
    }),
    "https://ayah.example/en/dashboard",
  );
  assert.equal(
    buildNotificationUrl({
      link: "//untrusted.example/path",
      locale: "en",
      appUrl: "https://ayah.example",
    }),
    null,
  );
});

test("notification email uses the recipient locale and escapes HTML", () => {
  const email = buildNotificationEmail({
    recipient: { name: "<Admin>", locale: "en" },
    notification: {
      titleAr: "عنوان",
      titleEn: "A <strong>new</strong> report",
      bodyEn: "Open & review it",
      link: "/dashboard/reports/7",
    },
    appUrl: "https://ayah.example",
  });

  assert.equal(email.subject, "A <strong>new</strong> report");
  assert.match(email.html, /Hi &lt;Admin&gt;,/);
  assert.match(email.html, /A &lt;strong&gt;new&lt;\/strong&gt; report/);
  assert.match(email.html, /Open &amp; review it/);
  assert.match(email.text, /https:\/\/ayah\.example\/en\/dashboard\/reports\/7/);
});

test("family enrollment email lists student buttons and one parent button", () => {
  const email = buildNotificationEmail({
    recipient: { name: "Admin", locale: "en" },
    notification: {
      titleEn: "New enrollment: parent Mona",
      link: "/dashboard/users/10",
      dataJson: {
        enrollmentType: "FAMILY",
        parentId: 10,
        students: [
          { id: 21, name: "Ahmed", link: "/dashboard/users/21" },
          { id: 22, name: "Sara", link: "/dashboard/users/22" },
        ],
      },
    },
    appUrl: "https://ayah.example",
  });

  assert.equal(email.subject, "New enrollment");
  assert.match(email.html, />Ahmed</);
  assert.match(email.html, />Sara</);
  assert.match(email.html, /https:\/\/ayah\.example\/en\/dashboard\/users\/21/);
  assert.match(email.html, /https:\/\/ayah\.example\/en\/dashboard\/users\/22/);
  assert.match(email.html, />View parent<\/a>/);
  assert.match(email.html, /https:\/\/ayah\.example\/en\/dashboard\/users\/10/);
  assert.match(email.text, /Ahmed: https:\/\/ayah\.example\/en\/dashboard\/users\/21/);
  assert.match(email.text, /Sara: https:\/\/ayah\.example\/en\/dashboard\/users\/22/);
  assert.match(email.text, /Parent: https:\/\/ayah\.example\/en\/dashboard\/users\/10/);
});
