import test, { after, before, mock } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { Router } from "express";
import { authMessagesCodes } from "@ayah/shared";
import { registrationRateLimiter } from "./rate-limit.middleware.js";

// Exercise the real app/proxy/error middleware without creating accounts or
// connecting to a database. Only the business routes are replaced.
const routes = Router();
for (const path of ["/auth/register", "/auth/enroll"]) {
  routes.post(path, registrationRateLimiter, (req, res) => {
    res.status(req.body.invalid ? 400 : 201).json({ ip: req.ip });
  });
}
mock.module("../../routes.js", { defaultExport: routes });
const { default: app } = await import("../../app.js");

let server;
let baseUrl;
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
});
after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
    server.closeAllConnections();
  });
});

async function submit(ip, path = "/auth/enroll", body = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

test("20 attempts share both registration routes; blocking one IP leaves another free", async () => {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const path = attempt % 2 ? "/auth/register" : "/auth/enroll";
    const result = await submit("198.51.100.10", path, {
      email: `parent-${attempt}@example.com`,
      invalid: attempt % 2 === 0,
    });
    assert.equal(result.response.status, attempt % 2 === 0 ? 400 : 201);
    assert.equal(result.body.ip, "198.51.100.10");
  }
  const blocked = await submit("198.51.100.10", "/auth/register", {
    email: "different-account@example.com",
  });
  assert.equal(blocked.response.status, 429);
  assert.equal(blocked.body.code, authMessagesCodes.REGISTRATION_RATE_LIMITED);
  assert.equal(blocked.body.details.limit, 20);
  assert.equal(blocked.body.details.windowMinutes, 60);
  assert.ok(blocked.body.details.retryAfterSeconds > 0);
  assert.ok(blocked.body.details.retryAfterSeconds <= 3600);
  assert.ok(Number(blocked.response.headers.get("retry-after")) > 0);

  const otherVisitor = await submit("198.51.100.11");
  assert.equal(otherVisitor.response.status, 201);
  assert.equal(otherVisitor.body.ip, "198.51.100.11");
});

test("a client-supplied leading forwarded IP cannot change the visitor identified by the proxy", async () => {
  const result = await submit("203.0.113.99, 198.51.100.12");
  assert.equal(result.response.status, 201);
  assert.equal(result.body.ip, "198.51.100.12");
});

test("IPv6 visitors in different subnets have independent registration allowances", async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await submit("2001:db8:100::1");
    assert.equal(result.response.status, 201);
  }
  assert.equal((await submit("2001:db8:100::2")).response.status, 429);
  assert.equal((await submit("2001:db8:200::1")).response.status, 201);
});
