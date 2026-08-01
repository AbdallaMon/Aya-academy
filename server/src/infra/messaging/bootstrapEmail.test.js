import test from "node:test";
import assert from "node:assert/strict";
import { sendBootstrapEmail } from "./bootstrapEmail.js";

function setup(options = {}) {
  const devEmail = Object.hasOwn(options, "devEmail")
    ? options.devEmail
    : "dev@example.com";
  const { ready = true, sendFails = false, sendHangs = false } = options;
  const calls = {
    sent: [],
    resets: 0,
    info: [],
    warn: [],
    error: [],
  };
  return {
    calls,
    options: {
      env: {
        devEmail,
        NODE_ENV: "test",
        PORT: 4000,
        smtp: { bootstrapTimeoutMs: 5 },
      },
      emailProvider: {
        isReady: () => ready,
        async sendMail(message) {
          calls.sent.push(message);
          if (sendHangs) return new Promise(() => {});
          if (sendFails) throw new Error("SMTP unavailable");
        },
        reset: () => {
          calls.resets += 1;
        },
      },
      logger: {
        info: (...args) => calls.info.push(args),
        warn: (...args) => calls.warn.push(args),
        error: (...args) => calls.error.push(args),
      },
      startedAt: new Date("2026-08-01T06:30:00.000Z"),
    },
  };
}

test("bootstrap email is skipped when DEV_EMAIL is absent", async () => {
  const { calls, options } = setup({ devEmail: undefined });
  const result = await sendBootstrapEmail(options);

  assert.deepEqual(result, {
    sent: false,
    reason: "DEV_EMAIL_NOT_CONFIGURED",
  });
  assert.equal(calls.sent.length, 0);
});

test("bootstrap email is skipped when SMTP is not configured", async () => {
  const { calls, options } = setup({ ready: false });
  const result = await sendBootstrapEmail(options);

  assert.deepEqual(result, { sent: false, reason: "SMTP_NOT_CONFIGURED" });
  assert.equal(calls.sent.length, 0);
  assert.equal(calls.warn.length, 1);
});

test("bootstrap email is sent to DEV_EMAIL with startup details", async () => {
  const { calls, options } = setup();
  const result = await sendBootstrapEmail(options);

  assert.deepEqual(result, { sent: true });
  assert.equal(calls.sent[0].to, "dev@example.com");
  assert.match(calls.sent[0].subject, /Ayah Academy API started \(test\)/);
  assert.match(calls.sent[0].text, /Port: 4000/);
  assert.match(calls.sent[0].text, /2026-08-01T06:30:00\.000Z/);
});

test("SMTP failure is swallowed so server startup can continue", async () => {
  const { calls, options } = setup({ sendFails: true });
  const result = await sendBootstrapEmail(options);

  assert.deepEqual(result, { sent: false, reason: "DELIVERY_FAILED" });
  assert.equal(calls.error.length, 1);
});

test("a hanging SMTP attempt times out and resets the transport", async () => {
  const { calls, options } = setup({ sendHangs: true });
  const result = await sendBootstrapEmail(options);

  assert.deepEqual(result, { sent: false, reason: "DELIVERY_FAILED" });
  assert.equal(calls.resets, 1);
  assert.equal(calls.error.length, 1);
});
