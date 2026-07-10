# Usage Billing v3 — Plan inheritance + plan-based create/change

> Addendum to the v1/v2 plans. Per Abdalla 2026-07-09.

## Locked model
1. **Every subscription has a linked plan** (`planId`). Inherited month-to-month; **no subscription without a plan**.
2. **Create (first / manual):** form asks **plan + month** (+ optional coupon). `startDate` = 1st of month, `endDate` = last day. Hours + price **from the plan** at creation.
3. **Change plan:** **re-links the plan only** — never recomputes/touches `subsHours` / `priceCharged` / dates / invoice.
4. **Billable hours:** `subsHours = actualSessions > 0 ? actualSessions : linkedPlanHours`. Zero sessions → the sub's **own inherited plan hours** (NOT the lowest active plan). Actual sessions bill as-is even if below plan.
5. **Inheritance:** each new monthly sub (accumulating/open, or cron/seed-created) inherits the **previous/current** sub's `planId`.

## Backend tasks

### V3-1: `resolveUsageHours` → plan-of-the-sub fallback (update pure fn + test)
`server/src/modules/finance/subscriptions/usageBilling.js` + `.test.js`.
- Change signature to `resolveUsageHours({ usageHours, planHours })` → `usageHours > 0 ? usageHours : (planHours ?? null)`. Drop `lowestPlanHours`.
- Update the test: actual-wins-below-plan, zero→plan, zero+no-plan→null.

### V3-2: recompute + freeze use the sub's inherited plan; inherit planId on create
`subscription.usecase.js`.
- `recomputeOpenUsageSubscription`: when the open sub is **missing**, create it inheriting the student's current sub's `planId` (look it up); set `subsHours = usage>0 ? usage : plan.hours` (the inherited plan). When it exists (UPCOMING), recompute `subsHours` the same way using its own `planId`'s hours as the zero fallback. Price = hours × rate (minus attached coupon, as today).
- `generateMonthlyUsageInvoices` (freeze): replace the `resolveUsageHours({usageHours, planHours, lowestPlanHours})` call with `resolveUsageHours({ usageHours, planHours })` where `planHours` = the open sub's **linked plan** hours (fetch via the sub's `planId`). Ensure the frozen sub keeps its `planId`. Drop `lowestActivePlanHours` usage here.
- Add a repo helper if needed: `subscriptionRepo.currentPlanIdForStudent(studentId)` → the student's active/most-recent sub's `planId` (for inheritance), and expose `plan { id, hours }` on the sub select if not already.

### V3-3: create-by-plan(+month)
`subscription.validation.js` + `subscription.usecase.js` `create`.
- Accept `{ studentId, planId, month, couponCode? }`. Derive dates from `month`. Load the plan; `subsHours = plan.hours`; price via `computePricing(plan, MONTHLY, couponCode, rate)`; `plan: { connect }`. Keep legacy fields working. (The month-only USAGE path may remain for internal callers, but the admin form now sends planId+month.)

### V3-4: `changePlan` = re-link only
`subscription.usecase.js` `changePlan`.
- Keep the guards (not ACTIVE / invoice UNPAID / admin). Change the body to ONLY `updateSubscription(id, { plan: { connect: { id: planId } } })` — do NOT recompute `priceCharged`/`subsHours`/`endDate`, and do NOT regenerate the invoice. (Coupon stays a separate action.)

## Frontend tasks

### V3-5: create dialog = plan + month (+ coupon)
`web/src/features/subscriptions/components/SubscriptionCreateDialog.jsx`.
- Add a **plan picker** (fetch `/plans/public`) and keep the **month** field; optional **coupon** (reuse `CouponControl`). Submit `{ studentId, planId, month, couponCode? }`. Bilingual labels.

### V3-6: change-plan dialog reflects re-link-only
`web/src/features/subscriptionDetail/components/ChangePlanDialog.jsx`.
- It should send only the new `planId` (drop any hours/price preview implying recompute); copy tweak that it only changes the linked plan. Coupon remains its own dialog.

## Verify
- `node --test .../usageBilling.test.js .../dates.test.js` green.
- Build web. After migrate: create sub with plan+month → hours from plan; log sessions → next sub accumulates (its plan inherited); zero-session month → bills the inherited plan hours; change-plan → only the plan chip changes, hours/price unchanged; coupon addable.
