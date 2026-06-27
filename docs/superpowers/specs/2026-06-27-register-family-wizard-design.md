# Family Registration Wizard — Design Spec

Date: 2026-06-27
Status: Approved (design)

## Goal

Replace the simple parent-only `/register` form with a professional **two-step
wizard** that, in a single submission, registers a parent, one or more children
(students), picks a plan per child (monthly/yearly) with an optional per-child
coupon, creates a **PENDING subscription + UNPAID invoice** per child, and
notifies the admin (the "teacher").

No payment happens at registration. The UI communicates: "first session free"
and "no payment required until after the first session — the plan is selected
for reference only."

## Context (existing building blocks reused)

- `USER_ROLES`: `ADMIN` (= the teacher), `PARENT`, `STUDENT`. Every `User`
  requires a **unique `email` + `passwordHash`** (schema constraint). Login is by
  email. → Each child needs explicit email + password (user decision).
- `ParentStudent` M:N link with a `ParentRelation` (default `GUARDIAN`).
- `subscription.usecase.js`:
  - `request(authUser, input)` — creates a PENDING subscription, computes price
    for the cycle, validates + consumes a coupon atomically, derives dates/hours,
    notifies admins. **This is the template for per-child enrollment.**
  - `computePricing(plan, billingPeriod, couponCode, hourlyRate)` — authoritative
    pricing with best plan-linked coupon and/or coupon code.
  - `computeEndDate`, `resolveStatus`.
- `coupon.usecase.js` `validateCoupon({code, planId, billingPeriod})` →
  `{valid, reason, discount}`.
- `invoice.usecase.js` `generate(authUser, subscriptionId)` — admin-gated, reads
  the global payment template + settings, creates an UNPAID invoice. We extract a
  system-level variant (no admin gate) for the public flow.
- `plan.usecase.js` `listPublic()` → `GET /plans/public` (already public) returns
  plans with `monthly`/`yearly` `{base, effective, discount}`.
- Frontend reference UI: `web/src/features/children/components/PlanPickerDialog.jsx`
  (plan cards + billing toggle + coupon) — reused as the per-child plan picker.
- Frontend infra: `useRequest` (supports `isPublic`), `RHFTextField`,
  `RHFPhoneField`, `AuthShell`, `formatMoney`, i18n `messagesCodes.js`.

## User decisions

1. **Child credentials**: parent enters `email + password` per child explicitly.
2. **Billing period**: per-child monthly/yearly toggle (affects price + coupon).
3. **Register outcome**: PENDING subscription + UNPAID invoice per child.
4. Default relation `GUARDIAN`; at least one child required.

---

## UX flow

### Step 1 — Children & plans
Repeatable child cards. Each card:
- Child fields: name, email, password, birthDate, nickname (optional).
- Billing toggle (MONTHLY/YEARLY).
- Plan cards as **single-select (radio)** — pick exactly one plan. Same visual
  language as `PlanPickerDialog` (price, hours, description, discount chip).
- Coupon field + **"تحقق" (verify)** button:
  - Valid → green "تم تطبيق الخصم" + discounted price shown.
  - Invalid → red error + **"إزالة الكوبون"** button to clear and retry.
  - Coupon is **per child** (applies to that child's plan + cycle).
- Gift banner 🎁 "أول حصة مجانية" + notice "الاشتراك لا يتطلب دفع الآن — الدفع
  بعد أول حصة. الاختيار للتسجيل فقط."
- "➕ إضافة ابن آخر" adds another card. "التالي" validates each child is complete
  and has a selected plan.

### Step 2 — Summary & parent
- Summary **table**: per child → name | plan | cycle | base price | discount |
  net | "أول حصة مجانية".
- Parent form: name, email, password, phone (same fields as current register).
- "تسجيل" submits everything.

On success: toast `ENROLLED_SUCCESS`, redirect to `/login` (registration does not
set session cookies, matching current behaviour).

---

## Backend

### New public endpoint: `POST /auth/enroll`
No auth. Zod-validated. Payload:
```js
{
  parent:   { name, email, password, phone, locale },
  children: [
    { name, email, password, birthDate, nickname?,
      planId, billingPeriod, couponCode? }
  ] // min 1
}
```

`AuthValidation.enrollSchema` — reuse field rules from `registerSchema`;
`children` is `z.array(childSchema).min(1, ...)`; `billingPeriod` enum from
`BILLING_PERIODS`.

### `authUsecase.enrollFamily(input)`
1. **Pre-checks (before tx, fail fast):**
   - Collect all emails (parent + children). Reject if any child email is
     duplicated within the payload (`CHILD_EMAIL_DUPLICATE`).
   - `authRepo.findByEmail` for parent → `EMAIL_ALREADY_EXISTS`.
   - For each child email → `CHILD_EMAIL_EXISTS` if taken.
   - Load each referenced plan (`planRepo.getByIdWithCoupons`); reject if
     missing/inactive (`PLAN_NOT_FOUND`).
   - Load global `settings` (hourlyRate, currency) and payment `template` once.
2. **Per-child pricing (authoritative, server-side):** for each child, reuse
   `subscriptionUsecase.computePricing(plan, billingPeriod, couponCode, hourlyRate)`
   to get `{priceCharged, couponId}`, derive `hours` (×12 for yearly),
   `startDate=now`, `endDate=computeEndDate(...)`.
   - Invalid coupon → `COUPON_INVALID_FOR_PLAN` (the verify step already guards
     this on the client, but the server is authoritative).
3. **Transaction (`prisma.$transaction`) — all-or-nothing:**
   - Create parent (`role: PARENT`, hashed password).
   - For each child:
     - Create student (`role: STUDENT`, hashed password, birthDate, nickname,
       `createdById: parent.id`).
     - `linkParentStudent(parent.id, child.id, GUARDIAN, tx)`.
     - Create PENDING subscription (status PENDING, billingPeriod, dates, hours,
       priceCharged, currency, plan connect, createdBy=parent, coupon connect if
       any), then `incrementCouponRedemption(couponId, tx)` if used.
     - Create UNPAID invoice via the new system-level invoice method (below),
       passing `tx`.
   - Return `{ parent, children:[{studentId, subscriptionId, invoiceId}] }`.
4. **After tx (best-effort, must not fail the request):** notify all admins
   (`userRepo.findAdminIds` + `createManyForUsers`) — one notification:
   "طلب تسجيل جديد: ولي أمر + N طلاب بانتظار المراجعة", link
   `/dashboard/subscriptions`.

### System-level invoice creation
Extract the core of `invoice.generate` into
`invoiceUsecase.generateForSubscription(subscriptionId, { tx } = {})`:
- No admin gate (system-initiated).
- Reads payment template + settings, computes amounts + discount snapshot,
  creates the UNPAID invoice (using `tx` when provided).
- If **no payment template** exists, skip invoice creation gracefully (return
  null) — enrollment still succeeds.
- `invoice.generate(authUser, ...)` keeps its admin gate and delegates to this
  core after the role check (no behaviour change for the admin path).

### New public pricing endpoint: `POST /plans/quote`
No auth. Input `{ planId, billingPeriod, couponCode? }`. Returns
`{ base, net, discount: {type,value,code}|null, valid, reason }`.
- Implemented in `plan.usecase.quote()` (or `subscriptionUsecase` pricing reuse):
  load plan with coupons, compute base for cycle, validate the coupon code,
  return computed `net`. **Money math stays server-authoritative**; the client
  only previews. Drives the per-child "verify coupon" button.

---

## Message codes (bilingual ar + en)

Add to `packages/shared/messages-codes/auth.js` and the web mapping
`web/src/i18n/locales/messagesCodes.js` (ar + en for each):
- `ENROLLED_SUCCESS` — "تم التسجيل بنجاح" / "Registered successfully"
- `CHILD_EMAIL_DUPLICATE` — duplicate child email within the same request
- `CHILD_EMAIL_EXISTS` — a child email is already registered
- `NO_CHILDREN` — at least one child is required
- `PLAN_REQUIRED` — a plan must be selected for each child
- `COUPON_INVALID_FOR_PLAN` — coupon not valid for the chosen plan/cycle

(Reuse existing: `EMAIL_ALREADY_EXISTS`, `INVALID_EMAIL`, `PASSWORD_TOO_SHORT`,
`PHONE_REQUIRED`, `NAME_REQUIRED`, plan/coupon codes.)

---

## Frontend files (follow project conventions)

- `web/src/features/auth/components/RegisterWizard.jsx` — replaces `RegisterForm`
  as the page body; owns wizard state (array of children + parent), step control.
- `web/src/features/auth/components/ChildEnrollCard.jsx` — one child: fields +
  billing toggle + plan radio cards + coupon + gift/notice banners.
- `web/src/features/auth/components/PlanRadioCards.jsx` — plan cards as
  single-select (extracted/adapted from `PlanPickerDialog`).
- `web/src/features/auth/components/CouponField.jsx` — coupon input + verify +
  remove, calls `POST /plans/quote`.
- `web/src/features/auth/components/EnrollSummaryTable.jsx` — Step 2 summary.
- `web/src/features/auth/components/ParentDetailsForm.jsx` — parent fields.
- `web/src/app/[lng]/register/page.jsx` — render `RegisterWizard`.
- Auth copy added to `web/src/features/auth/config/authText.js`.

State shape (client):
```js
children: [{ name,email,password,birthDate,nickname,
             billingPeriod, planId,
             coupon: { code, status: 'idle'|'valid'|'invalid', quote } }]
parent:   { name,email,password,phone }
```

---

## Edge cases (resolved)
- At least one child required (`NO_CHILDREN`).
- Duplicate emails (within payload or already existing) rejected before any
  write; the transaction guarantees all-or-nothing.
- Default relation `GUARDIAN` (no father/mother prompt).
- Final pricing recomputed server-side at enroll (client price is preview only).
- No payment template → invoice skipped, enrollment still succeeds.
- Coupon redemption incremented only inside the successful transaction.

## Out of scope
- Real payment processing (none exists yet).
- Father/mother relation selection.
- Editing children after submission (existing dashboards handle that).
