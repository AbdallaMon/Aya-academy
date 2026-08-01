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
