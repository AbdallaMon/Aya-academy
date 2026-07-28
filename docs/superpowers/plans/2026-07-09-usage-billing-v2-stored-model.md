# Usage Billing v2 — Switch to STORED model + display fixes

> Addendum to [2026-07-09-usage-based-subscription-billing.md](2026-07-09-usage-based-subscription-billing.md).
> Reverses the "derived" decision → **stored/incremental (Option A)**, per Abdalla 2026-07-09.

## Why

v1 built **derived** hours: the open USAGE sub stores `subsHours = null` and the number is computed on read (usage-preview). This caused the reported problems: the open sub shows **no hours** in lists/pages, and the list shows only the **latest** sub per student. Switch to **stored**: every session mutation recomputes and **stores** the hours on the open sub (recompute-from-source, so no drift); the month-end cron remains the verify+freeze step.

## Confirmed decisions
1. **Stored (A):** session create/update/delete → recompute `subsHours` from the actual session sum and store it on the open (UPCOMING) USAGE sub + its price. Cron still freezes/invoices at month end (= the "verify").
2. **Add subscription = month only:** the create form asks for ONE month → sub `startDate = 1st`, `endDate = last day`, `origin = USAGE`; hours recomputed from sessions (no manual plan/hours picker).
3. **One combined card:** current (being paid) + next (accumulating) shown together per student — in the subscriptions list, the student page, and the parent view.
4. **Keep** the arrears bucketing already agreed: a session dated in month M feeds the M+1 (payment-month) sub.

---

## Task V2-1: Repo — per-student single-month sum

**File:** `server/src/modules/finance/subscriptions/subscription.repo.js`

- [ ] Add `sumUsageHoursForStudentMonth({ studentId, gte, lt }) → Promise<number>`: same filter as `sumUsageHoursByStudent` (`PRESENT`, `billedSubscriptionId: null`) but scoped to one `studentId`, returning a plain number (0 when none). Reuse `SESSION_ATTENDANCE.PRESENT`.

```js
async sumUsageHoursForStudentMonth({ studentId, gte, lt, client } = {}) {
  const agg = await (client ?? prisma).sessionLog.aggregate({
    where: {
      studentId,
      sessionDate: { gte, lt },
      attendance: SESSION_ATTENDANCE.PRESENT,
      billedSubscriptionId: null,
    },
    _sum: { durationHours: true },
  });
  return Number(agg._sum.durationHours ?? 0);
}
```

- [ ] Verify import-smoke. Commit: `feat(subscriptions): repo per-student month usage sum`.

---

## Task V2-2: Usecase — recompute-and-store on the open sub

**File:** `server/src/modules/finance/subscriptions/subscription.usecase.js`

- [ ] Replace `ensureOpenUsageSubscription` with `recomputeOpenUsageSubscription({ studentId, sessionDate })` that (a) finds/creates the open UPCOMING USAGE sub for `firstOfNextMonth(sessionDate)`, (b) recomputes `subsHours` from `sumUsageHoursForStudentMonth` for the consumption month `monthRange(sessionDate)`, (c) applies the sub's already-attached coupon to the price (same stored-coupon logic as the freeze), (d) writes `subsHours`/`remainingHours`/`priceCharged` — **only while the sub is UPCOMING** (never touch a frozen/paid sub).

```js
async recomputeOpenUsageSubscription({ studentId, sessionDate }) {
  const when = new Date(sessionDate);
  const paymentStart = firstOfNextMonth(when);
  const consumption = monthRange(when);
  const settings = await settingsUsecase.getEffective();
  const hourlyRate = Number(settings.hourlyRate);

  let open = await subscriptionRepo.findOpenUsageSubscription({ studentId, paymentStart });
  if (open && open.status !== SUBSCRIPTION_STATUSES.UPCOMING) return open; // frozen — leave it

  const subsHours = await subscriptionRepo.sumUsageHoursForStudentMonth({
    studentId, gte: consumption.gte, lt: consumption.lt,
  });

  // price = hours × rate, minus any coupon already attached to the open sub.
  const base = priceFromHours(subsHours, hourlyRate);
  const c = open?.coupon ?? null;
  const priceCharged = c
    ? roundMoney(applyDiscount(base, { type: c.type, value: Number(c.value) }))
    : base;

  if (!open) {
    return subscriptionRepo.createSubscription({
      origin: SUBSCRIPTION_ORIGINS.USAGE,
      status: SUBSCRIPTION_STATUSES.UPCOMING,
      billingPeriod: BILLING_PERIODS.MONTHLY,
      startDate: paymentStart,
      endDate: endOfMonth(paymentStart),
      subsHours,
      remainingHours: subsHours,
      priceCharged,
      currency: settings.currency,
      student: { connect: { id: studentId } },
    });
  }
  return subscriptionRepo.updateSubscription(open.id, {
    subsHours, remainingHours: subsHours, priceCharged,
  });
}
```

- [ ] Keep `generateMonthlyUsageInvoices` as-is (it already recomputes from the sum + freezes — this is the month-end "verify"). Its freeze recompute is unchanged.
- [ ] Verify import-smoke + `node --test` (existing pure tests stay green). Commit: `feat(subscriptions): store recomputed usage hours on the open sub`.

---

## Task V2-3: SessionLog hooks — create/update/delete recompute

**File:** `server/src/modules/sessions/sessionLogs/sessionLog.usecase.js`

- [ ] **create:** replace the existing `ensureOpenUsageSubscription` hook with `recomputeOpenUsageSubscription({ studentId, sessionDate })` (best-effort try/catch, unchanged pattern).
- [ ] **update:** after a successful update, recompute the affected month(s). If `sessionDate` (or attendance) changed, recompute BOTH the old month and the new month; else recompute the one month. Best-effort.
- [ ] **delete:** load the session first (need its `studentId` + `sessionDate`), delete, then recompute that month. Best-effort.

```js
// helper (module-local, best-effort)
async function syncUsageBill(studentId, sessionDate) {
  try {
    await subscriptionUsecase.recomputeOpenUsageSubscription({ studentId, sessionDate });
  } catch { /* swallow — billing sync must never fail session logging */ }
}
```

- [ ] For update: recompute old + new dates. For delete: recompute the removed session's date. Verify import-smoke. Commit: `feat(sessions): recompute usage bill on session create/update/delete`.

---

## Task V2-4: Create-by-month flow

**Files:** `subscription.validation.js`, `subscription.usecase.js` (`create`), `subscription.dto.js`/route as needed; frontend `SubscriptionCreateDialog.jsx`.

- [ ] **Backend `create`:** accept a `month` input (an ISO date or `YYYY-MM`) as the primary path. Derive `startDate = firstOfMonth(month)`, `endDate = endOfMonth(startDate)`, `origin = USAGE`, and `subsHours = sumUsageHoursForStudentMonth` for the sub's consumption month (`previousMonth(startDate)` per arrears), `priceCharged` from that. Keep the old plan-based create path available but the default admin form uses month-only. Validate the month; reject creating a duplicate USAGE sub for the same `(studentId, startDate)`.
- [ ] **Frontend `SubscriptionCreateDialog.jsx`:** replace plan/hours fields with a single **month picker** (MUI month/date input). On submit, POST `{ studentId, month }`. Keep bilingual labels (ar+en).
- [ ] Verify `npm run build:web`. Commit: `feat(subscriptions): create subscription by month (hours from sessions)`.

---

## Task V2-5: List shows current + next (not latest-only)

**Files:** `subscription.repo.js` / `subscription.usecase.js` (`list`), and the frontend list.

- [ ] **Backend:** the scoped list must no longer collapse to latest-per-student. When `studentId` is provided (student page), return ALL that student's subs (newest first). For the global admin list, return one **summary per student** = `{ current, next, historyCount }` (reuse the shape of `dashboardRepo.cardSubscriptionsForStudent`), OR return all rows — pick the option that the card grid (V2-6) consumes. Prefer: add `subscriptionRepo.summariesByStudent(...)` returning `{ studentId, current, next }` per student for the list, and keep a raw `listSubscriptions` for the per-student (studentId-filtered) view.
- [ ] Verify. Commit: `feat(subscriptions): list surfaces current + next per student`.

---

## Task V2-6: Combined card (current + next) — shared component

**Files:** create `web/src/features/subscriptions/components/SubscriptionSummaryCard.jsx`; use it in the subscriptions list page, the userDetail subscriptions tab, and the parent ChildCard.

- [ ] The card shows, for one student: the **current** sub (status chip + hours + invoice/paid state) and the **next/accumulating** sub (hours that now come straight from `sub.subsHours` — stored — no separate usage-preview needed) side by side. Use `SubscriptionStatusChip`, `formatHours`, `formatMoney`; bilingual labels.
- [ ] Replace the `UsageMeterCard` usage (which called usage-preview) with a plain read of the stored `subsHours`/`priceCharged` on the next sub — since hours are stored now, the live meter can simply render `sub.subsHours`. (Keep `usage-preview` endpoint; it's now optional.)
- [ ] Update the subscriptions list page to render a grid of `SubscriptionSummaryCard` (one per student) instead of the latest-only table — or keep the table but add the second sub. Update ChildCard/ParentChildrenTab to read stored hours.
- [ ] Verify `npm run build:web`. Commit: `feat(web): combined current+next subscription summary card`.

---

## Verification
- `node --test` pure suites green.
- After migrate: log a session → open sub's `subsHours` is written (visible in the list + card). Delete it → recomputed down. Add a second in the same month → sum updates.
- Add-subscription form asks only for a month → creates the 1st-of-month sub with hours from sessions.
- The list + student page + parent view all show current AND next in one card.
