# Usage-Based Subscription Billing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bill each student in arrears for the tutoring hours they consumed during a month, by auto-generating a `USAGE` subscription + invoice for the following month, while keeping the existing manual/prepaid `MANUAL` path intact.

**Architecture:** `SessionLog` rows are the single source of truth. During month **M** an open `USAGE` subscription dated to month **M+1** shows a live-derived hours counter (`SUM(durationHours)`). The already-wired end-of-month cron freezes that sum (fallback: student's plan hours → lowest active plan hours), stamps the billed sessions, generates + sends the invoice, and rolls status. The number is never mutated per session — only frozen once at close.

**Tech Stack:** Node.js (ESM), Express (layered route→controller→usecase→repo), Prisma + MySQL (`@aya/db`), shared constants (`@aya/shared`), `node-cron`; frontend Next.js App Router + MUI + `useRequest`. Tests via Node's built-in `node --test` (no third-party runner in this repo).

## Global Constraints

- **NEVER run `prisma migrate` / `db:migrate`.** Edit `schema.prisma`, then hand Abdalla the exact migrate command to run himself. (Memory: `feedback-no-auto-migrations`.)
- **Layering is strict:** Prisma only in `*.repo.js`; no business logic in routes/controllers; language-neutral error CODES only (never raw user strings).
- **Every message code + UI label is bilingual (ar + en).** (Memory: `message-codes-bilingual`.)
- **Enum values must stay in sync** between `packages/shared/constants/enums.js` and `packages/db/prisma/schema.prisma`.
- Money via `priceFromHours(hours, hourlyRate)` (usecase) / `formatMoney` (web); hours via `formatHours` (web). Never re-implement.
- Paths after the recent refactor: subscriptions `server/src/modules/finance/subscriptions/`, sessions `server/src/modules/sessions/sessionLogs/`, schema `packages/db/prisma/schema.prisma`.
- Resolved billing rules (spec §12): actual unbilled `PRESENT` hours bill as-is even below plan; zero sessions → student's plan hours → else lowest active plan hours (**no student is ever skipped**); `SessionLog.billedSubscriptionId` is enabled now and the monthly sum counts only `billedSubscriptionId IS NULL`.

**Spec:** `docs/superpowers/specs/2026-07-08-usage-based-subscription-billing-design.md`

---

## File Structure

**Backend — create:**
- `server/src/shared/utility/dates.js` — UTC month-boundary helpers (pure).
- `server/src/shared/utility/dates.test.js` — `node --test`.
- `server/src/modules/finance/subscriptions/usageBilling.js` — pure `resolveUsageHours` fallback resolver.
- `server/src/modules/finance/subscriptions/usageBilling.test.js` — `node --test`.

**Backend — modify:**
- `packages/shared/constants/enums.js` — add `SUBSCRIPTION_ORIGINS`.
- `packages/db/prisma/schema.prisma` — `SubscriptionOrigin` enum, `Subscription.origin`, `SessionLog.billedSubscriptionId` + relation + index.
- `server/src/modules/finance/subscriptions/subscription.repo.js` — new query methods + `origin` in selects.
- `server/src/modules/finance/subscriptions/subscription.dto.js` — expose `origin` in `subscriptionSelect`.
- `server/src/modules/finance/subscriptions/subscription.usecase.js` — `ensureOpenUsageSubscription`, `generateMonthlyUsageInvoices` (replaces `autoRenewSubscriptions` stub), `usagePreview`, `prepareForNewSubscription` guard.
- `server/src/modules/finance/subscriptions/subscription.route.js` + `subscription.controller.js` — `GET /:id/usage-preview`.
- `server/src/infra/scheduler/subscriptionScheduler.js` — call the renamed usecase method.
- `server/src/modules/sessions/sessionLogs/sessionLog.usecase.js` — best-effort `ensureOpenUsageSubscription` hook on create.
- `server/src/modules/dashboard/dashboard.repo.js` + `dashboard.usecase.js` — return `subscriptions[]` per child.

**Frontend — create:**
- `web/src/features/subscriptions/config/subscriptionView.js` — `resolveSubscriptionView`.
- `web/src/shared/components/SubscriptionStatusChip.jsx`.
- `web/src/features/subscriptionDetail/components/UsageMeterCard.jsx`.

**Frontend — modify:** `subscriptionsColumns.js`, `subscriptionsFilters.js`, `subscriptionsText.js`, `subscriptionDetailText.js`, `dashboardText.js`, `parentOverview/ChildCard.jsx`, `ParentOverview.jsx`, `children/ChildrenPage.jsx`, `userDetail/ParentChildrenTab.jsx`, `userDetail/UserDetailPage.jsx`, `subscriptionDetail/components/SubscriptionActions.jsx`, `subscriptionDetail/pages/SubscriptionDetailPage.jsx`.

---

## Task 1: Add `SUBSCRIPTION_ORIGINS` to shared constants

**Files:**
- Modify: `packages/shared/constants/enums.js` (after `SUBSCRIPTION_STATUSES`, ~line 107)

**Interfaces:**
- Produces: `SUBSCRIPTION_ORIGINS = { MANUAL: "MANUAL", USAGE: "USAGE" }` importable from `@aya/shared`.

- [ ] **Step 1: Add the constant**

In `packages/shared/constants/enums.js`, immediately after the `SUBSCRIPTION_STATUSES` block:

```js
// How a subscription came to exist. MANUAL = admin/parent prepaid plan pick or
// renew. USAGE = auto-generated from logged session hours (arrears billing).
// Keep in sync with packages/db/prisma/schema.prisma (enum SubscriptionOrigin).
export const SUBSCRIPTION_ORIGINS = {
  MANUAL: "MANUAL",
  USAGE: "USAGE",
};
```

- [ ] **Step 2: Verify it is re-exported**

Run: `node -e "import('@aya/shared').then(m => console.log(m.SUBSCRIPTION_ORIGINS))"`
Expected: `{ MANUAL: 'MANUAL', USAGE: 'USAGE' }`

If it prints `undefined`, add `export * from "./constants/enums.js";` (or the matching barrel line already used for `SUBSCRIPTION_STATUSES`) to the `@aya/shared` entry point.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/constants/enums.js
git commit -m "feat(shared): add SUBSCRIPTION_ORIGINS enum"
```

---

## Task 2: Schema — `origin` + `billedSubscriptionId`

**Files:**
- Modify: `packages/db/prisma/schema.prisma` (Subscription ~464-494, SessionLog ~735-763, enums section)

**Interfaces:**
- Produces: `Subscription.origin` (`SubscriptionOrigin`, default `MANUAL`); `SessionLog.billedSubscriptionId Int?` + relation `billedSubscription`; back-relation `Subscription.billedSessions`.

- [ ] **Step 1: Add the enum**

In the enums region of `schema.prisma` (near `SubscriptionStatus`):

```prisma
enum SubscriptionOrigin {
  MANUAL
  USAGE
}
```

- [ ] **Step 2: Add `origin` + back-relation + index to `Subscription`**

Inside `model Subscription { ... }`:

```prisma
  origin        SubscriptionOrigin @default(MANUAL)
  billedSessions SessionLog[]      @relation("UsageBilledSessions")
```

And add to its index block:

```prisma
  @@index([studentId, status, origin])
```

- [ ] **Step 3: Add `billedSubscriptionId` to `SessionLog`**

Inside `model SessionLog { ... }`:

```prisma
  billedSubscriptionId Int?
  billedSubscription   Subscription? @relation("UsageBilledSessions", fields: [billedSubscriptionId], references: [id], onDelete: SetNull)

  @@index([studentId, sessionDate, billedSubscriptionId])
```

- [ ] **Step 4: Validate schema WITHOUT migrating**

Run: `npm run db:generate`
Expected: Prisma client regenerates with no schema errors. (This does NOT touch the database.)

- [ ] **Step 5: Hand the migration command to Abdalla — DO NOT RUN IT**

Print this message and stop for Abdalla to run it himself:

> Schema edited. Run this yourself to create + apply the migration:
> `npm run db:migrate -- --name add_subscription_origin_and_billed_session`
> (all-default additive columns → no backfill; every existing subscription becomes `origin = MANUAL`.)

- [ ] **Step 6: Commit (schema only)**

```bash
git add packages/db/prisma/schema.prisma
git commit -m "feat(db): add Subscription.origin + SessionLog.billedSubscriptionId"
```

---

## Task 3: UTC date helpers (pure, TDD)

**Files:**
- Create: `server/src/shared/utility/dates.js`
- Test: `server/src/shared/utility/dates.test.js`

**Interfaces:**
- Produces: `monthRange(date) → { gte, lt }`; `firstOfNextMonth(date) → Date`; `endOfMonth(firstOfMonth) → Date`; `previousMonth(date) → Date`. All UTC-based.

- [ ] **Step 1: Write the failing test**

`server/src/shared/utility/dates.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { monthRange, firstOfNextMonth, endOfMonth, previousMonth } from "./dates.js";

test("monthRange spans the whole UTC month", () => {
  const { gte, lt } = monthRange(new Date("2026-07-15T10:00:00Z"));
  assert.equal(gte.toISOString(), "2026-07-01T00:00:00.000Z");
  assert.equal(lt.toISOString(), "2026-08-01T00:00:00.000Z");
});

test("firstOfNextMonth rolls over year boundary", () => {
  assert.equal(firstOfNextMonth(new Date("2026-12-31T23:00:00Z")).toISOString(),
    "2027-01-01T00:00:00.000Z");
});

test("endOfMonth is the last instant of the month", () => {
  assert.equal(endOfMonth(new Date("2026-08-01T00:00:00Z")).toISOString(),
    "2026-08-31T23:59:59.000Z");
});

test("previousMonth returns the 1st of the prior month", () => {
  assert.equal(previousMonth(new Date("2026-08-01T00:00:00Z")).toISOString(),
    "2026-07-01T00:00:00.000Z");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/src/shared/utility/dates.test.js`
Expected: FAIL — `Cannot find module './dates.js'`.

- [ ] **Step 3: Write the implementation**

`server/src/shared/utility/dates.js`:

```js
// UTC-safe month-boundary helpers. Mirrors parseMonthRange in sessionLog.repo.
export function monthRange(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  return { gte: new Date(Date.UTC(y, m, 1)), lt: new Date(Date.UTC(y, m + 1, 1)) };
}

export function firstOfNextMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

// day 0 of next month = last day; 23:59:59 for an inclusive end-of-window.
export function endOfMonth(firstOfMonth) {
  return new Date(Date.UTC(firstOfMonth.getUTCFullYear(), firstOfMonth.getUTCMonth() + 1, 0, 23, 59, 59));
}

export function previousMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/src/shared/utility/dates.test.js`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add server/src/shared/utility/dates.js server/src/shared/utility/dates.test.js
git commit -m "feat(server): add UTC month-boundary date helpers"
```

---

## Task 4: `resolveUsageHours` fallback resolver (pure, TDD)

**Files:**
- Create: `server/src/modules/finance/subscriptions/usageBilling.js`
- Test: `server/src/modules/finance/subscriptions/usageBilling.test.js`

**Interfaces:**
- Produces: `resolveUsageHours({ usageHours, planHours, lowestPlanHours }) → number | null`. Returns actual usage if > 0; else planHours if set; else lowestPlanHours; else null (caller skips — only when the system has no plans at all).

- [ ] **Step 1: Write the failing test**

`server/src/modules/finance/subscriptions/usageBilling.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveUsageHours } from "./usageBilling.js";

test("actual usage wins even when below plan", () => {
  assert.equal(resolveUsageHours({ usageHours: 5, planHours: 8, lowestPlanHours: 4 }), 5);
});

test("zero usage falls back to the student's plan hours", () => {
  assert.equal(resolveUsageHours({ usageHours: 0, planHours: 8, lowestPlanHours: 4 }), 8);
});

test("zero usage + no plan falls back to lowest active plan", () => {
  assert.equal(resolveUsageHours({ usageHours: 0, planHours: null, lowestPlanHours: 4 }), 4);
});

test("no usage, no plan, no plans in system → null (caller skips)", () => {
  assert.equal(resolveUsageHours({ usageHours: 0, planHours: null, lowestPlanHours: null }), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/src/modules/finance/subscriptions/usageBilling.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`server/src/modules/finance/subscriptions/usageBilling.js`:

```js
// Pure billing-hours resolver (spec §4). No student is skipped unless the
// system has no plans at all. Kept side-effect-free so it is unit-testable.
export function resolveUsageHours({ usageHours, planHours, lowestPlanHours }) {
  if (usageHours > 0) return usageHours;      // actual bills as-is, even below plan
  if (planHours != null) return planHours;    // zero sessions → student's plan
  if (lowestPlanHours != null) return lowestPlanHours; // → lowest active plan
  return null;                                // no plans exist → caller skips
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/src/modules/finance/subscriptions/usageBilling.test.js`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/finance/subscriptions/usageBilling.js server/src/modules/finance/subscriptions/usageBilling.test.js
git commit -m "feat(subscriptions): add usage-hours fallback resolver"
```

---

## Task 5: Subscription repo — usage queries + `origin` in selects

**Files:**
- Modify: `server/src/modules/finance/subscriptions/subscription.repo.js`
- Modify: `server/src/modules/finance/subscriptions/subscription.dto.js`

**Interfaces:**
- Consumes: `SUBSCRIPTION_ORIGINS`, `activeSubscriptionWhere` (@aya/shared); `prisma`.
- Produces on `subscriptionRepo`:
  - `sumUsageHoursByStudent({ gte, lt }) → Promise<Map<number, number>>`
  - `findOpenUsageSubscription({ studentId, paymentStart, client }) → Promise<Subscription|null>`
  - `listActiveStudentsWithPlan(now) → Promise<Array<{ studentId, planHours: number|null }>>`
  - `lowestActivePlanHours() → Promise<number|null>`
  - `markSessionsBilled({ studentId, gte, lt, subscriptionId, client }) → Promise<number>`
  - `findPendingSubscriptionsByStudent` now also selects `origin`.
- Produces on DTO: `subscriptionSelect` includes `origin`; `toSubscription` passes it through.

- [ ] **Step 1: Add `origin` to the DTO select**

In `subscription.dto.js`, add `origin: true` to `subscriptionSelect`, and include `origin: row.origin` in the object `toSubscription` returns.

- [ ] **Step 2: Import the origin constant in the repo**

Top of `subscription.repo.js`, extend the `@aya/shared` import to include `SUBSCRIPTION_ORIGINS`.

- [ ] **Step 3: Add the query methods**

Append inside `class SubscriptionRepo`:

```js
  /** Map<studentId, hours> of UNBILLED PRESENT session hours in a month window. */
  async sumUsageHoursByStudent({ gte, lt }) {
    const rows = await prisma.sessionLog.groupBy({
      by: ["studentId"],
      where: {
        sessionDate: { gte, lt },
        attendance: "PRESENT",
        billedSubscriptionId: null,
      },
      _sum: { durationHours: true },
    });
    return new Map(rows.map((r) => [r.studentId, Number(r._sum.durationHours ?? 0)]));
  }

  /** The open (UPCOMING) USAGE subscription for a student's payment month, or null. */
  async findOpenUsageSubscription({ studentId, paymentStart, client } = {}) {
    const row = await (client ?? prisma).subscription.findFirst({
      where: {
        studentId,
        origin: SUBSCRIPTION_ORIGINS.USAGE,
        startDate: paymentStart,
      },
      select: subscriptionSelect,
    });
    return toSubscription(row);
  }

  /** Every currently-active student + their current plan's hours (for fallback). */
  async listActiveStudentsWithPlan(now = new Date()) {
    const subs = await prisma.subscription.findMany({
      where: activeSubscriptionWhere(now),
      select: { studentId: true, plan: { select: { hours: true } } },
      distinct: ["studentId"],
    });
    return subs.map((s) => ({ studentId: s.studentId, planHours: s.plan?.hours ?? null }));
  }

  /** Hours of the cheapest active plan (min hours), or null if none exist. */
  async lowestActivePlanHours() {
    const plan = await prisma.plan.findFirst({
      where: { isActive: true },
      orderBy: { hours: "asc" },
      select: { hours: true },
    });
    return plan?.hours ?? null;
  }

  /** Stamp a student's unbilled PRESENT sessions in a window as billed. Returns count. */
  async markSessionsBilled({ studentId, gte, lt, subscriptionId, client } = {}) {
    const res = await (client ?? prisma).sessionLog.updateMany({
      where: {
        studentId,
        sessionDate: { gte, lt },
        attendance: "PRESENT",
        billedSubscriptionId: null,
      },
      data: { billedSubscriptionId: subscriptionId },
    });
    return res.count;
  }
```

- [ ] **Step 4: Add `origin` to `findPendingSubscriptionsByStudent` select**

Change its `select` to `{ id: true, couponId: true, origin: true }` (Task 7's guard reads `origin`).

- [ ] **Step 5: Verify it loads (no test runner for repo — smoke import)**

Run: `node --input-type=module -e "import('./server/src/modules/finance/subscriptions/subscription.repo.js').then(m => console.log(typeof m.subscriptionRepo.sumUsageHoursByStudent))"`
Expected: prints `function` (a DB connection is not required just to import).

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/finance/subscriptions/subscription.repo.js server/src/modules/finance/subscriptions/subscription.dto.js
git commit -m "feat(subscriptions): repo queries for usage billing + expose origin"
```

---

## Task 6: Open the USAGE sub when a session is logged

**Files:**
- Modify: `server/src/modules/finance/subscriptions/subscription.usecase.js`
- Modify: `server/src/modules/sessions/sessionLogs/sessionLog.usecase.js`

**Interfaces:**
- Consumes: `subscriptionRepo.findOpenUsageSubscription/createSubscription`; `firstOfNextMonth`, `endOfMonth` (dates.js); `SUBSCRIPTION_ORIGINS`, `SUBSCRIPTION_STATUSES`, `BILLING_PERIODS`.
- Produces: `subscriptionUsecase.ensureOpenUsageSubscription({ studentId, sessionDate }) → Promise<Subscription>` (idempotent).

- [ ] **Step 1: Add imports to the usecase**

In `subscription.usecase.js`, import the date helpers and (if not already) `SUBSCRIPTION_ORIGINS`:

```js
import { firstOfNextMonth, endOfMonth, monthRange, previousMonth } from "../../../shared/utility/dates.js";
import { SUBSCRIPTION_ORIGINS } from "@aya/shared";
```

- [ ] **Step 2: Add `ensureOpenUsageSubscription`**

Inside `class SubscriptionUsecase` (near `create`):

```js
  /**
   * Ensure an open (UPCOMING) USAGE subscription exists for the payment month
   * (M+1) of a session dated in month M. Called best-effort when a session is
   * logged. Hours are NOT written here — they are derived until month-close
   * freeze. Idempotent: returns the existing open sub if present.
   */
  async ensureOpenUsageSubscription({ studentId, sessionDate }) {
    const paymentStart = firstOfNextMonth(new Date(sessionDate));
    const existing = await subscriptionRepo.findOpenUsageSubscription({ studentId, paymentStart });
    if (existing) return existing;

    const settings = await settingsUsecase.getEffective();
    return subscriptionRepo.createSubscription({
      origin: SUBSCRIPTION_ORIGINS.USAGE,
      status: SUBSCRIPTION_STATUSES.UPCOMING,
      billingPeriod: BILLING_PERIODS.MONTHLY,
      startDate: paymentStart,
      endDate: endOfMonth(paymentStart),
      subsHours: null,
      remainingHours: null,
      priceCharged: null,
      currency: settings.currency,
      student: { connect: { id: studentId } },
    });
  }
```

- [ ] **Step 3: Call it from `sessionLog.usecase.create`**

In `sessionLog.usecase.js`, import the subscription usecase at the top:

```js
import { subscriptionUsecase } from "../../finance/subscriptions/subscription.usecase.js";
```

After the session is successfully created (and before/after `notifyParents`), add a best-effort hook:

```js
    // Open the accumulating next-month USAGE subscription (best-effort).
    try {
      await subscriptionUsecase.ensureOpenUsageSubscription({
        studentId: created.studentId,
        sessionDate: created.sessionDate,
      });
    } catch {
      // swallow — opening the accumulator must never fail session logging
    }
```

> If importing `subscriptionUsecase` at module top causes a circular import (subscription usecase importing session usecase), use a dynamic `await import(...)` inside the `try` instead — mirror how `invoice.usecase` is dynamically imported by `ensureInvoice`.

- [ ] **Step 4: Verify manually (app run)**

Start the server (`npm run dev:server`), log a session for a test student via the existing UI/endpoint, then check the DB:

Run: `npm run db:studio` → open `Subscription` → confirm a row exists with `origin = USAGE`, `status = UPCOMING`, `startDate = 1st of next month`, `subsHours = NULL`. Log a **second** session same student → confirm NO duplicate open sub (still one).

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/finance/subscriptions/subscription.usecase.js server/src/modules/sessions/sessionLogs/sessionLog.usecase.js
git commit -m "feat(subscriptions): open accumulating USAGE sub on session log"
```

---

## Task 7: Month-close — `generateMonthlyUsageInvoices` + coexistence guard

**Files:**
- Modify: `server/src/modules/finance/subscriptions/subscription.usecase.js`

**Interfaces:**
- Consumes: `resolveUsageHours` (usageBilling.js); `monthRange`, `firstOfNextMonth`, `endOfMonth` (dates.js); repo methods from Task 5; existing `this.ensureInvoice(sub)`, `priceFromHours`, `settingsUsecase.getEffective`, `invoiceUsecase`.
- Produces: `subscriptionUsecase.generateMonthlyUsageInvoices(now) → Promise<{ invoiced, skipped }>` (replaces the `autoRenewSubscriptions` stub). `prepareForNewSubscription` now skips `USAGE` pendings.

- [ ] **Step 1: Import the resolver**

Add to `subscription.usecase.js` imports:

```js
import { resolveUsageHours } from "./usageBilling.js";
```

- [ ] **Step 2: Guard `prepareForNewSubscription` against USAGE subs**

In `prepareForNewSubscription`, inside the `for (const p of pendings)` loop, add as the first line of the loop body:

```js
      if (p.origin === SUBSCRIPTION_ORIGINS.USAGE) continue; // never delete usage bills
```

- [ ] **Step 3: Replace the `autoRenewSubscriptions` stub**

Replace the whole `autoRenewSubscriptions(now)` method with:

```js
  /**
   * End-of-month usage billing — invoked by subscriptionScheduler on the last
   * day of the month. For every active student: freeze the consumed hours (or
   * plan / lowest-plan fallback), stamp the billed sessions, generate + send the
   * invoice, and expire the closing month's sub. Idempotent per (student, month)
   * via the one-open-USAGE-sub invariant. Never throws over the edge.
   *
   * @param {Date} [now] last day of month M (the month being closed).
   * @returns {Promise<{ invoiced:number, skipped:number }>}
   */
  async generateMonthlyUsageInvoices(now = new Date()) {
    const consumption = monthRange(now);            // [1/M, 1/(M+1)) — closing month
    const paymentStart = consumption.lt;            // 1/(M+1)
    const paymentEnd = endOfMonth(paymentStart);
    const settings = await settingsUsecase.getEffective();
    const hourlyRate = Number(settings.hourlyRate);

    const [usageByStudent, activeStudents, lowestPlanHours] = await Promise.all([
      subscriptionRepo.sumUsageHoursByStudent(consumption),
      subscriptionRepo.listActiveStudentsWithPlan(now),
      subscriptionRepo.lowestActivePlanHours(),
    ]);

    let invoiced = 0;
    let skipped = 0;

    for (const { studentId, planHours } of activeStudents) {
      const usageHours = usageByStudent.get(studentId) ?? 0;
      const subsHours = resolveUsageHours({ usageHours, planHours, lowestPlanHours });

      if (!subsHours || subsHours <= 0) {
        skipped += 1; // only when the system has no plans at all
        continue;
      }

      const priceCharged = priceFromHours(subsHours, hourlyRate);

      const sub = await prisma.$transaction(async (tx) => {
        let open = await subscriptionRepo.findOpenUsageSubscription({ studentId, paymentStart, client: tx });
        if (!open) {
          open = await subscriptionRepo.createSubscription(
            {
              origin: SUBSCRIPTION_ORIGINS.USAGE,
              status: SUBSCRIPTION_STATUSES.PENDING,
              billingPeriod: BILLING_PERIODS.MONTHLY,
              startDate: paymentStart,
              endDate: paymentEnd,
              currency: settings.currency,
              student: { connect: { id: studentId } },
            },
            tx,
          );
        }
        // freeze the final number + price, mark it awaiting payment.
        const frozen = await subscriptionRepo.updateSubscription(
          open.id,
          {
            subsHours,
            remainingHours: subsHours,
            priceCharged,
            status: SUBSCRIPTION_STATUSES.PENDING,
          },
          tx,
        );
        // stamp the sessions that were just billed (only when real usage).
        if (usageHours > 0) {
          await subscriptionRepo.markSessionsBilled({
            studentId,
            gte: consumption.gte,
            lt: consumption.lt,
            subscriptionId: frozen.id,
            client: tx,
          });
        }
        return frozen;
      });

      await this.ensureInvoice(sub);       // existing idempotent invoice generator
      invoiced += 1;
    }

    return { invoiced, skipped };
  }
```

- [ ] **Step 4: Verify with a manual driver script**

Create a throwaway script `scratch-run-usage.mjs` at repo root (do NOT commit):

```js
import { subscriptionUsecase } from "./server/src/modules/finance/subscriptions/subscription.usecase.js";
// pass a date whose month has logged sessions:
const res = await subscriptionUsecase.generateMonthlyUsageInvoices(new Date("2026-07-31T23:00:00Z"));
console.log(res);
process.exit(0);
```

Run: `node scratch-run-usage.mjs`
Expected: prints `{ invoiced: <n>, skipped: <m> }`. In `db:studio`: the USAGE subs for the payment month now have `subsHours`/`priceCharged` set and `status = PENDING`; their billed sessions have `billedSubscriptionId` set; an `Invoice` row exists per frozen sub. Re-run the script → the same sessions are NOT re-billed (already stamped) and hours don't double. Delete the script after.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/finance/subscriptions/subscription.usecase.js
git commit -m "feat(subscriptions): month-close usage billing replaces auto-renew stub"
```

---

## Task 8: Wire the cron to the new method name

**Files:**
- Modify: `server/src/infra/scheduler/subscriptionScheduler.js:37`

**Interfaces:**
- Consumes: `subscriptionUsecase.generateMonthlyUsageInvoices`.

- [ ] **Step 1: Update the call + import comment**

Change line 37 from `subscriptionUsecase.autoRenewSubscriptions(now)` to:

```js
    subscriptionUsecase.generateMonthlyUsageInvoices(now).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[subscription-cron] usage-billing error:", err?.code || err?.message || err);
    });
```

Update the header docstring wording from "auto-renew" to "end-of-month usage billing".

- [ ] **Step 2: Verify boot is clean**

Run: `npm run dev:server`
Expected: boots without error; logs `[subscription-cron] end-of-month ... scheduled`. Ctrl-C.

- [ ] **Step 3: Commit**

```bash
git add server/src/infra/scheduler/subscriptionScheduler.js
git commit -m "chore(scheduler): call generateMonthlyUsageInvoices"
```

---

## Task 9: `GET /subscriptions/:id/usage-preview`

**Files:**
- Modify: `server/src/modules/finance/subscriptions/subscription.usecase.js`
- Modify: `server/src/modules/finance/subscriptions/subscription.controller.js`
- Modify: `server/src/modules/finance/subscriptions/subscription.route.js`

**Interfaces:**
- Consumes: `subscriptionRepo.getById/sumUsageHoursByStudent`; `monthRange`, `previousMonth`; `priceFromHours`; the existing object-scope helper used by other read paths (e.g. `assertCanViewSubscription` / `getById` scope check — reuse whatever `getById` route already uses).
- Produces: `subscriptionUsecase.usagePreview({ authUser, id }) → { usageHours, projectedPrice, currency, frozen }`.

- [ ] **Step 1: Add the usecase method**

```js
  async usagePreview({ authUser, id }) {
    const sub = await subscriptionRepo.getById(id);
    if (!sub || sub.origin !== SUBSCRIPTION_ORIGINS.USAGE) {
      throw notFound(subscriptionMessagesCodes.SUBSCRIPTION_NOT_FOUND);
    }
    await this.assertCanViewSubscription(authUser, sub); // reuse the same scope check getById uses

    const consumption = monthRange(previousMonth(sub.startDate)); // consumption month = start − 1
    const hoursMap = await subscriptionRepo.sumUsageHoursByStudent(consumption);
    const usageHours = hoursMap.get(sub.studentId) ?? 0;
    const settings = await settingsUsecase.getEffective();

    return {
      usageHours,
      projectedPrice: priceFromHours(usageHours, Number(settings.hourlyRate)),
      currency: sub.currency,
      frozen: sub.status !== SUBSCRIPTION_STATUSES.UPCOMING,
    };
  }
```

> If there is no existing `assertCanViewSubscription`, reuse the exact scope guard that the `GET /:id` (getById) usecase path already applies to a loaded subscription. Do not invent a new authorization rule.

- [ ] **Step 2: Add the controller**

In `subscription.controller.js`, mirror the existing `getById` controller shape:

```js
  async usagePreview(req, res) {
    const data = await subscriptionUsecase.usagePreview({
      authUser: req.user,
      id: Number(req.params.id),
    });
    return res.json({ success: true, data });
  }
```

- [ ] **Step 3: Add the route**

In `subscription.route.js`, next to the `GET /:id` route, add (match the permission set that guards `GET /:id`):

```js
router.get(
  "/:id/usage-preview",
  authMiddleware.requireAuth,
  requireAnyPermission([PERMISSIONS.SUBSCRIPTION.READ, PERMISSIONS.SUBSCRIPTION.REQUEST]),
  subscriptionController.usagePreview,
);
```

> Use the SAME guard imports/permission codes already used by the read routes in this file. If the file uses a different guard name, match it.

- [ ] **Step 4: Verify via curl**

Boot the server, get an admin cookie/token as other manual tests do, then:

Run: `curl -s -H "Cookie: <auth>" http://localhost:<port>/api/subscriptions/<usageSubId>/usage-preview`
Expected: `{"success":true,"data":{"usageHours":<n>,"projectedPrice":<n>,"currency":"...","frozen":false}}`. Log another session for that student, re-curl → `usageHours` increased.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/finance/subscriptions/subscription.usecase.js server/src/modules/finance/subscriptions/subscription.controller.js server/src/modules/finance/subscriptions/subscription.route.js
git commit -m "feat(subscriptions): usage-preview endpoint for live accumulating bill"
```

---

## Task 10: Parent dashboard returns `subscriptions[]` per child

**Files:**
- Modify: `server/src/modules/dashboard/dashboard.repo.js`
- Modify: `server/src/modules/dashboard/dashboard.usecase.js:102-152`

**Interfaces:**
- Consumes: `SUBSCRIPTION_ORIGINS`, `SUBSCRIPTION_STATUSES`.
- Produces: each child object now carries `subscriptions: Array<{ id, origin, status, planId, endDate, remainingHours }>` (current ACTIVE + open USAGE + newest ended), plus keeps `subscriptionState` + `latestSubscriptionId` for backward compat during the frontend migration.

- [ ] **Step 1: Add a repo method returning the relevant subs per student**

In `dashboard.repo.js`:

```js
  // The subscriptions a parent card needs: the active one, the open USAGE
  // accumulator, and the newest overall (for history/CTA). De-duplicated by id.
  async cardSubscriptionsForStudent({ studentId, client } = {}) {
    const db = client ?? prisma;
    const now = new Date();
    const [active, open, latest] = await Promise.all([
      db.subscription.findFirst({
        where: { studentId, ...activeSubscriptionWhere(now) },
        orderBy: { endDate: "desc" },
        select: SUB_CARD_SELECT,
      }),
      db.subscription.findFirst({
        where: { studentId, origin: SUBSCRIPTION_ORIGINS.USAGE, status: SUBSCRIPTION_STATUSES.UPCOMING },
        orderBy: { startDate: "desc" },
        select: SUB_CARD_SELECT,
      }),
      db.subscription.findFirst({
        where: { studentId },
        orderBy: { id: "desc" },
        select: SUB_CARD_SELECT,
      }),
    ]);
    const byId = new Map();
    for (const s of [active, open, latest]) if (s) byId.set(s.id, s);
    return [...byId.values()];
  }
```

Add near the top of the file:

```js
import { USER_ROLES, activeSubscriptionWhere, SUBSCRIPTION_ORIGINS, SUBSCRIPTION_STATUSES } from "@aya/shared";

const SUB_CARD_SELECT = {
  id: true, origin: true, status: true, planId: true, endDate: true, remainingHours: true,
};
```

(Merge the import with the existing `@aya/shared` import line rather than duplicating it.)

- [ ] **Step 2: Use it in `getParentDashboard`**

In `dashboard.usecase.js`, within the `children.map(async (child) => {...})`, add `cardSubscriptionsForStudent` to the `Promise.all`, and include `subscriptions` in the returned child object:

```js
        const [sub, rank, latest, subscriptions] = await Promise.all([
          dashboardRepo.activeSubscriptionForStudent({ studentId: child.id }),
          isActive ? dashboardRepo.studentRank({ points: child.points ?? 0 }) : Promise.resolve(null),
          dashboardRepo.latestSubscriptionForStudent({ studentId: child.id }),
          dashboardRepo.cardSubscriptionsForStudent({ studentId: child.id }),
        ]);
```

Then in the returned object add: `subscriptions,` (keep `activeSubscription`, `subscriptionState`, `latestSubscriptionId` for now — the frontend tasks remove their last usages).

- [ ] **Step 3: Verify via curl**

Run: `curl -s -H "Cookie: <parent-auth>" http://localhost:<port>/api/dashboard/parent`
Expected: each `children[i]` has a `subscriptions` array containing the active + open USAGE entries with `origin`/`status`.

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/dashboard/dashboard.repo.js server/src/modules/dashboard/dashboard.usecase.js
git commit -m "feat(dashboard): expose subscriptions[] per child for multi-sub UI"
```

---

## Task 11: Frontend — `resolveSubscriptionView` + shared chip + i18n keys

**Files:**
- Create: `web/src/features/subscriptions/config/subscriptionView.js`
- Create: `web/src/shared/components/SubscriptionStatusChip.jsx`
- Modify: `web/src/features/subscriptions/config/subscriptionsText.js`
- Modify: `web/src/features/subscriptionDetail/config/subscriptionDetailText.js`
- Modify: `web/src/features/dashboard/config/dashboardText.js`

**Interfaces:**
- Produces: `resolveSubscriptionView(sub) → { kind, phase, color, isOpen }`; `<SubscriptionStatusChip sub txt size />`; new `txt.phase.*`, `txt.origin*`, `txt.accumulatingTitle`, `txt.liveHint`, `txt.frozenHint`, `txt.usageManagedHint`, `txt.noCurrent`, `txt.viewAll` in ar + en.

- [ ] **Step 1: Create the view resolver**

`web/src/features/subscriptions/config/subscriptionView.js`:

```js
import { SUBSCRIPTION_ORIGINS } from "@aya/shared";

// (origin, status) → a unified visual phase used by every surface.
// phase: accumulating | awaitingPayment | active | ended
export function resolveSubscriptionView(sub) {
  const isUsage = sub?.origin === SUBSCRIPTION_ORIGINS.USAGE;
  if (isUsage && sub.status === "UPCOMING") {
    return { kind: "usage", phase: "accumulating", color: "info", isOpen: true };
  }
  if (sub?.status === "PENDING") {
    return { kind: isUsage ? "usage" : "manual", phase: "awaitingPayment", color: "warning", isOpen: false };
  }
  if (sub?.status === "ACTIVE") {
    return { kind: isUsage ? "usage" : "manual", phase: "active", color: "success", isOpen: false };
  }
  return { kind: isUsage ? "usage" : "manual", phase: "ended", color: "default", isOpen: false };
}
```

- [ ] **Step 2: Create the shared chip**

`web/src/shared/components/SubscriptionStatusChip.jsx`:

```jsx
import { Chip } from "@mui/material";
import { resolveSubscriptionView } from "@/features/subscriptions/config/subscriptionView";

// txt = object with a `phase` map ({ accumulating, awaitingPayment, active, ended }).
export default function SubscriptionStatusChip({ sub, txt, size = "small" }) {
  const view = resolveSubscriptionView(sub);
  return <Chip size={size} color={view.color} variant="outlined" label={txt.phase[view.phase]} />;
}
```

> Match the project's alias for `web/src` (the codebase uses `@/...`). If it uses a different alias, follow that.

- [ ] **Step 3: Add the ar + en keys**

In each of the three text files, add to the ar block AND the en block. AR:

```js
phase: { accumulating: "بتتجمّع", awaitingPayment: "بانتظار الدفع", active: "نشط", ended: "منتهي" },
origin: "النوع", originUsage: "حسب الحصص", originManual: "يدوي",
accumulatingTitle: "فاتورة الشهر القادم (بتتجمّع)",
liveHint: "بيتحدّث مع كل حصة",
frozenHint: "اتجمّد — جاهز للفاتورة",
usageManagedHint: "بيتحسب تلقائياً من الحصص، ويتقفل آخر الشهر",
noCurrent: "لا يوجد اشتراك حالي", viewAll: "كل الاشتراكات",
```

EN:

```js
phase: { accumulating: "Accumulating", awaitingPayment: "Awaiting payment", active: "Active", ended: "Ended" },
origin: "Type", originUsage: "Usage-based", originManual: "Manual",
accumulatingTitle: "Next month's bill (building up)",
liveHint: "Updates with every session",
frozenHint: "Frozen — ready to invoice",
usageManagedHint: "Auto-computed from sessions; closes at month end",
noCurrent: "No current subscription", viewAll: "All subscriptions",
```

> `dashboardText.js` only needs `phase`, `noCurrent`, `viewAll`, `accumulatingTitle`, `liveHint`, `frozenHint`, `remainingHours`. Add the subset it uses.

- [ ] **Step 4: Verify build**

Run: `npm run build:web`
Expected: compiles with no import/JSX errors.

- [ ] **Step 5: Commit**

```bash
git add web/src/features/subscriptions/config/subscriptionView.js web/src/shared/components/SubscriptionStatusChip.jsx web/src/features/subscriptions/config/subscriptionsText.js web/src/features/subscriptionDetail/config/subscriptionDetailText.js web/src/features/dashboard/config/dashboardText.js
git commit -m "feat(web): subscription view resolver, shared status chip, i18n keys"
```

---

## Task 12: Frontend — `UsageMeterCard`

**Files:**
- Create: `web/src/features/subscriptionDetail/components/UsageMeterCard.jsx`

**Interfaces:**
- Consumes: `useRequest`, `formatMoney`, `formatHours`, `SUBSCRIPTIONS_URL`.
- Produces: `<UsageMeterCard subscriptionId txt />` — fetches `/subscriptions/:id/usage-preview`, renders live hours + projected price.

- [ ] **Step 1: Create the component**

```jsx
import { Card, CardContent, Typography, Stack, Skeleton } from "@mui/material";
import { useRequest } from "@/hooks/request/useRequest";
import { formatMoney, formatHours } from "@/shared/lib/money";
import { SUBSCRIPTIONS_URL } from "@/features/subscriptions/config/constant";

export default function UsageMeterCard({ subscriptionId, txt }) {
  const { data, isLoading } = useRequest({
    url: `${SUBSCRIPTIONS_URL}/${subscriptionId}/usage-preview`,
    method: "get",
    autoFetch: true,
  });

  if (isLoading) return <Skeleton variant="rounded" height={140} />;

  return (
    <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
      <CardContent>
        <Typography variant="overline" color="info.main">{txt.accumulatingTitle}</Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="h4">{formatHours(data?.usageHours ?? 0)}</Typography>
          <Typography variant="h6" color="text.secondary">
            ≈ {formatMoney(data?.projectedPrice ?? 0, data?.currency)}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {data?.frozen ? txt.frozenHint : txt.liveHint}
        </Typography>
      </CardContent>
    </Card>
  );
}
```

> Confirm `SUBSCRIPTIONS_URL` is exported from `features/subscriptions/config/constant.js` and `formatMoney`/`formatHours` from `shared/lib/money.js` (verified in spec §15). Adjust import paths if the alias differs.

- [ ] **Step 2: Verify build**

Run: `npm run build:web`
Expected: compiles clean.

- [ ] **Step 3: Commit**

```bash
git add web/src/features/subscriptionDetail/components/UsageMeterCard.jsx
git commit -m "feat(web): UsageMeterCard live accumulating-bill widget"
```

---

## Task 13: Frontend — subscriptions list origin column/filter + actions

**Files:**
- Modify: `web/src/features/subscriptions/config/subscriptionsColumns.js`
- Modify: `web/src/features/subscriptions/config/subscriptionsFilters.js`

**Interfaces:**
- Consumes: `SubscriptionStatusChip`, `txt.origin*`, `resolveSubscriptionView`.

- [ ] **Step 1: Replace the inline status chip with the shared chip**

In `subscriptionsColumns.js`, change the status column's `renderCell` to:

```jsx
renderCell: ({ row }) => <SubscriptionStatusChip sub={row} txt={txt} />,
```

Import it at the top: `import SubscriptionStatusChip from "@/shared/components/SubscriptionStatusChip";`

- [ ] **Step 2: Add an origin column**

```jsx
{
  field: "origin",
  headerName: txt.origin,
  minWidth: 110,
  renderCell: ({ row }) => (
    <Chip size="small" variant="outlined"
      label={row.origin === "USAGE" ? txt.originUsage : txt.originManual} />
  ),
},
```

- [ ] **Step 3: Hide manual actions on USAGE rows**

In the actions builder, change the `showRenew` line and add a USAGE guard:

```jsx
const isUsage = row.origin === "USAGE";
const showRenew = can.renew && !isUsage && (row.status === "EXPIRED" || row.status === "CANCELLED");
const showEditHours = can.editHours && !(isUsage && row.status === "UPCOMING");
```

Use `showEditHours` to gate the edit-hours action (an accumulating USAGE sub has derived hours — editing opens only after freeze).

- [ ] **Step 4: Add the origin filter**

In `subscriptionsFilters.js`, add to the returned filters array:

```js
{ name: "origin", label: txt.origin, type: "select", options: [
  { value: "MANUAL", label: txt.originManual },
  { value: "USAGE", label: txt.originUsage },
]},
```

- [ ] **Step 5: Verify build + visual**

Run: `npm run build:web` then `npm run dev:web`, open `/dashboard/subscriptions`.
Expected: origin column + filter show; USAGE/UPCOMING rows show an "Accumulating" chip and no Renew action.

- [ ] **Step 6: Commit**

```bash
git add web/src/features/subscriptions/config/subscriptionsColumns.js web/src/features/subscriptions/config/subscriptionsFilters.js
git commit -m "feat(web): subscriptions list origin column/filter + usage-aware actions"
```

---

## Task 14: Frontend — subscription detail (actions + usage meter)

**Files:**
- Modify: `web/src/features/subscriptionDetail/components/SubscriptionActions.jsx`
- Modify: `web/src/features/subscriptionDetail/pages/SubscriptionDetailPage.jsx`

**Interfaces:**
- Consumes: `resolveSubscriptionView`, `UsageMeterCard`, `txt.usageManagedHint`.

- [ ] **Step 1: Gate manual actions in `SubscriptionActions`**

Near the existing enablement flags (`SubscriptionActions.jsx:117-129`):

```jsx
const isUsage = subscription.origin === "USAGE";
const isAccumulating = isUsage && status === "UPCOMING";
const showRenew = !isUsage && subEnded;
const showChangePlan = !isUsage && status !== "ACTIVE" && invoiceUnpaidOrNone;
```

Use `showRenew`/`showChangePlan` to gate those buttons. Add an info banner while accumulating:

```jsx
{isAccumulating && <Alert severity="info" sx={{ mb: 2 }}>{txt.usageManagedHint}</Alert>}
```

(Import `Alert` from `@mui/material`.)

- [ ] **Step 2: Swap the card for the meter when the sub is open**

In `SubscriptionDetailPage.jsx`, where `SubscriptionCard` is rendered:

```jsx
import { resolveSubscriptionView } from "@/features/subscriptions/config/subscriptionView";
import UsageMeterCard from "../components/UsageMeterCard";
// ...
{resolveSubscriptionView(subscription).isOpen
  ? <UsageMeterCard subscriptionId={subscription.id} txt={txt} />
  : <SubscriptionCard subscription={subscription} invoice={invoice} />}
```

- [ ] **Step 3: Verify visual**

`npm run dev:web`, open a USAGE/UPCOMING subscription's detail page.
Expected: shows the dashed live meter + the "auto-computed" banner; no Renew/Change-plan buttons. A MANUAL sub is unchanged.

- [ ] **Step 4: Commit**

```bash
git add web/src/features/subscriptionDetail/components/SubscriptionActions.jsx web/src/features/subscriptionDetail/pages/SubscriptionDetailPage.jsx
git commit -m "feat(web): usage-aware subscription detail (meter + managed banner)"
```

---

## Task 15: Frontend — parent multi-sub cards

**Files:**
- Modify: `web/src/features/dashboard/components/parentOverview/ChildCard.jsx`
- Modify: `web/src/features/dashboard/components/ParentOverview.jsx:49`
- Modify: `web/src/features/children/pages/ChildrenPage.jsx:57-68,115-192`
- Modify: `web/src/features/userDetail/components/ParentChildrenTab.jsx:54-61`
- Modify: `web/src/features/userDetail/pages/UserDetailPage.jsx:154-174`

**Interfaces:**
- Consumes: child `subscriptions[]` (Task 10), `SubscriptionStatusChip`, `UsageMeterCard`, `formatHours`, `txt.noCurrent/viewAll/remainingHours`.

- [ ] **Step 1: Rewrite `ChildCard` to show current + accumulating**

Replace the single-`subscriptionState` block with (keeps the existing card shell/props):

```jsx
const current = child.subscriptions?.find((s) => s.status === "ACTIVE");
const open = child.subscriptions?.find((s) => s.origin === "USAGE" && s.status === "UPCOMING");

// current month
{current
  ? <Stack direction="row" spacing={1} alignItems="center">
      <SubscriptionStatusChip sub={current} txt={txt} />
      <Typography variant="body2">{txt.remainingHours}: {formatHours(current.remainingHours)}</Typography>
    </Stack>
  : <Chip size="small" label={txt.noCurrent} />}

// next month (live)
{open && <UsageMeterCard subscriptionId={open.id} txt={txt} />}

<Button component={Link} href={`/dashboard/subscriptions?studentId=${child.id}`}>{txt.viewAll}</Button>
```

Import `SubscriptionStatusChip`, `UsageMeterCard`, `formatHours`, `Chip`, `Stack`, `Typography`, `Button`, `Link` as the file already does for the others.

- [ ] **Step 2: Fix the `ParentOverview` active-count**

Change line 49 to:

```jsx
const activeSubs = children.filter((c) => c.subscriptions?.some((s) => s.status === "ACTIVE")).length;
```

- [ ] **Step 3: De-collapse `ChildrenPage`**

Remove the `rank`/`subByChild` "best sub per child" block (`:57-68`). For each child render the same current + open pattern from Step 1 (a child with any `subscriptions.length` links to `/dashboard/subscriptions?studentId=<id>`; a child with none uses the existing plan-picker CTA).

- [ ] **Step 4: Fix `ParentChildrenTab` subscription column**

Replace the binary chip (`:54-61`) with:

```jsx
renderCell: ({ row }) => {
  const current = row.subscriptions?.find((s) => s.status === "ACTIVE");
  return current ? <SubscriptionStatusChip sub={current} txt={txt} /> : <Chip size="small" label={txt.noCurrent} />;
},
```

> This requires the parent-children endpoint feeding this tab to include `subscriptions[]` per child. If it currently returns only `activeSubscription`, extend that repo/usecase the same way as Task 10 (reuse `cardSubscriptionsForStudent`).

- [ ] **Step 5: Fix the inactive-child lock in `UserDetailPage`**

Change the lock condition (`:154-174`) to derive from the collection instead of the scalar `subscriptionState`/`latestSubscriptionId`:

```jsx
const hasActive = overview?.subscriptions?.some((s) => s.status === "ACTIVE");
const openOrPending = overview?.subscriptions?.find((s) => ["UPCOMING", "PENDING"].includes(s.status));
// show SubscriptionLockedState only when !hasActive; CTA targets openOrPending?.id ?? the subscriptions list
```

- [ ] **Step 6: Verify visual (parent + admin)**

`npm run dev:web`. As a parent: dashboard child cards show current chip + live next-month meter + "All subscriptions". As admin: userDetail subscriptions tab still lists every sub; ParentChildrenTab shows the current chip.
Expected: no child collapses multiple subs into one; no console errors about missing `subscriptions`.

- [ ] **Step 7: Commit**

```bash
git add web/src/features/dashboard/components/parentOverview/ChildCard.jsx web/src/features/dashboard/components/ParentOverview.jsx web/src/features/children/pages/ChildrenPage.jsx web/src/features/userDetail/components/ParentChildrenTab.jsx web/src/features/userDetail/pages/UserDetailPage.jsx
git commit -m "feat(web): parent/admin surfaces show multiple subscriptions per child"
```

---

## Final verification

- [ ] **Backend unit tests:** `node --test server/src/shared/utility/dates.test.js server/src/modules/finance/subscriptions/usageBilling.test.js` → all PASS.
- [ ] **End-to-end usage flow (manual):** log 2 sessions for a student in the current month → one open USAGE sub appears (UPCOMING, derived hours grow). Run the month-close driver for that month → sub freezes to PENDING with an invoice, sessions get `billedSubscriptionId`, re-run does not double-bill.
- [ ] **Fallback:** an active student with a plan but zero sessions → USAGE sub freezes to `plan.hours`; a student with no plan + zero sessions → freezes to the lowest active plan's hours.
- [ ] **Coexistence:** create a MANUAL subscription via the existing admin flow while the student has an open USAGE sub → the USAGE sub is NOT deleted by `prepareForNewSubscription`, and the manual create still succeeds.
- [ ] **Web build:** `npm run build:web` → clean.

---

## Self-review notes (coverage vs spec)

- Spec §2 derived hours → Tasks 6/9 (never mutate per session; only freeze at close). ✅
- Spec §3 bucketing (session in M → sub M+1) → `firstOfNextMonth` in Task 6, `monthRange`/`previousMonth` in Tasks 7/9. ✅
- Spec §4 fallback chain → Task 4 (`resolveUsageHours`) + Task 7 wiring. ✅
- Spec §5 schema (`origin`, `billedSubscriptionId`) → Tasks 1/2. ✅
- Spec §6 open sub + live view → Tasks 6 (open) / 9 (preview) / 12 (meter). ✅
- Spec §7 lifecycle (UPCOMING→PENDING→ACTIVE→EXPIRED, no new enum) → Tasks 6/7 (statuses reused). ✅
- Spec §8 cron (fill stub) → Tasks 7/8. ✅
- Spec §9 manual override (edit after freeze via existing `update`) → Task 13 `showEditHours` gate (existing edit flow untouched). ✅
- Spec §10 coexistence guard → Task 7 Step 2. ✅
- Spec §15 frontend (view resolver, chip, meter, ChildCard, list, detail, i18n) → Tasks 11-15. ✅
- Non-goals honored: no per-session hours mutation; sessionLog module only gains a best-effort hook; existing manual/prepaid paths untouched.
