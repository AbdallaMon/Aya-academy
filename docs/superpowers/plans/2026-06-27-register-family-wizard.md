# Family Registration Wizard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the parent-only `/register` form with a two-step public wizard that registers a parent + N children, picks a plan (monthly/yearly) + optional coupon per child, creates a PENDING subscription + UNPAID invoice per child atomically, and notifies the admin.

**Architecture:** New public `POST /auth/enroll` runs everything in one Prisma transaction, reusing existing `subscriptionUsecase.computePricing` (authoritative pricing + coupon) and a new system-level invoice generator. A new public `POST /plans/quote` powers the live per-child coupon "verify". The frontend becomes a multi-step wizard built from small presentational components.

**Tech Stack:** Express + Prisma (backend, layered route→controller→usecase→repo→validation), Zod validation, Next.js App Router + MUI + `useRequest` (frontend), `@ayah/shared` for codes/enums.

## Global Constraints

- App source is **JavaScript only** (`.js`/`.jsx`) — never TypeScript.
- **Layering:** Prisma only in `*.repo.js`; controllers stay thin; business logic in `*.usecase.js`.
- **Message codes are language-neutral**: backend throws CODES + a `translationKey`; **every new code MUST have an `ar` and `en` entry** in `web/src/i18n/locales/messagesCodes.js` under the right namespace.
- **Money is server-authoritative.** The client only previews prices; the server recomputes at enroll.
- **Public endpoints** mount with **no auth middleware**.
- Default parent↔student relation = `PARENT_RELATIONS.GUARDIAN`. **At least one child required.**
- Currency comes from global settings; format on the web with `formatMoney(value, currency)`.
- **No test runner exists in this repo** (no vitest/jest, zero test files). Do **not** add a test framework. Each backend task is verified with the dev server + `curl`; each frontend task with a manual browser check. Verification commands are written into each task.

### Dev server commands (used across tasks)
- Backend: `npm run dev:server` (from repo root) → listens per `Server/src/server.js` (assume `http://localhost:4000`; confirm the printed port and substitute below if different).
- Web: `npm run dev:web` → `http://localhost:3000`.
- DB client must be generated: `npm run db:generate` (only if Prisma client is stale; this plan adds **no** schema changes).

---

## Task 1: Backend message codes (shared + web localization)

**Files:**
- Modify: `packages/shared/messages-codes/auth.js`
- Modify: `web/src/i18n/locales/messagesCodes.js`

**Interfaces:**
- Produces: new `authMessagesCodes` keys `ENROLLED_SUCCESS`, `CHILD_EMAIL_DUPLICATE`, `CHILD_EMAIL_EXISTS`, `NO_CHILDREN`, `PLAN_REQUIRED`, `COUPON_INVALID_FOR_PLAN`. Used by Task 4 (enroll) and the frontend.

- [ ] **Step 1: Add the codes to `@ayah/shared`**

In `packages/shared/messages-codes/auth.js`, inside the `authMessagesCodes` object, add to the `// success` group and a new `// enroll` group:

```js
export const authMessagesCodes = {
  // success
  REGISTERED_SUCCESS: "REGISTERED_SUCCESS",
  ENROLLED_SUCCESS: "ENROLLED_SUCCESS",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGOUT_SUCCESS: "LOGOUT_SUCCESS",
  TOKEN_REFRESHED: "TOKEN_REFRESHED",
  // ... (existing keys unchanged) ...
  // enroll (family registration wizard)
  CHILD_EMAIL_DUPLICATE: "AUTH_CHILD_EMAIL_DUPLICATE",
  CHILD_EMAIL_EXISTS: "AUTH_CHILD_EMAIL_EXISTS",
  NO_CHILDREN: "AUTH_NO_CHILDREN",
  PLAN_REQUIRED: "AUTH_PLAN_REQUIRED",
  COUPON_INVALID_FOR_PLAN: "AUTH_COUPON_INVALID_FOR_PLAN",
};
```

(Leave all existing keys exactly as they are; only insert `ENROLLED_SUCCESS` and the five enroll keys.)

- [ ] **Step 2: Add `ar` + `en` strings to the web mapping**

In `web/src/i18n/locales/messagesCodes.js`, inside `const ar = { ... [messagesNames.authMessages]: { ... } }`, add after `REGISTERED_SUCCESS`:

```js
    [authMessagesCodes.ENROLLED_SUCCESS]: "تم التسجيل بنجاح، يمكنك تسجيل الدخول الآن",
    [authMessagesCodes.CHILD_EMAIL_DUPLICATE]: "هناك بريد إلكتروني مكرر بين الأبناء في نفس الطلب",
    [authMessagesCodes.CHILD_EMAIL_EXISTS]: "البريد الإلكتروني لأحد الأبناء مستخدم بالفعل",
    [authMessagesCodes.NO_CHILDREN]: "يجب إضافة ابن واحد على الأقل",
    [authMessagesCodes.PLAN_REQUIRED]: "يجب اختيار خطة لكل ابن",
    [authMessagesCodes.COUPON_INVALID_FOR_PLAN]: "الكوبون غير صالح للخطة أو الدورة المختارة",
```

In the same file inside `const en = { ... [messagesNames.authMessages]: { ... } }`, add after `REGISTERED_SUCCESS`:

```js
    [authMessagesCodes.ENROLLED_SUCCESS]: "Registered successfully — you can sign in now",
    [authMessagesCodes.CHILD_EMAIL_DUPLICATE]: "A child email is duplicated within the same request",
    [authMessagesCodes.CHILD_EMAIL_EXISTS]: "A child email is already registered",
    [authMessagesCodes.NO_CHILDREN]: "Add at least one child",
    [authMessagesCodes.PLAN_REQUIRED]: "Select a plan for each child",
    [authMessagesCodes.COUPON_INVALID_FOR_PLAN]: "The coupon is not valid for the chosen plan or cycle",
```

- [ ] **Step 3: Verify the shared barrel still imports cleanly**

Run: `node -e "import('@ayah/shared').then(m=>console.log(m.authMessagesCodes.ENROLLED_SUCCESS, m.authMessagesCodes.COUPON_INVALID_FOR_PLAN))"`
(Run from `Server/` so the workspace resolves `@ayah/shared`; if it does not resolve there, run from repo root.)
Expected: prints `ENROLLED_SUCCESS AUTH_COUPON_INVALID_FOR_PLAN`

- [ ] **Step 4: Commit**

```bash
git add packages/shared/messages-codes/auth.js web/src/i18n/locales/messagesCodes.js
git commit -m "feat(shared): enroll message codes (ar+en)"
```

---

## Task 2: Backend — tx-aware invoice repo + system invoice generator

**Files:**
- Modify: `Server/src/modules/invoices/invoice.repo.js`
- Modify: `Server/src/modules/invoices/invoice.usecase.js`

**Interfaces:**
- Produces: `invoiceRepo.create(data, client?)` (now accepts a Prisma tx client); `invoiceUsecase.generateForSubscription(subscription, { template, settings, plan, createdById, tx })` → `Promise<invoice|null>`. Consumed by Task 4.
- Consumes: existing `computeAmounts`, `computeDiscountSnapshot`, `invoiceNumberFor`, `computeDueDate`, `INVOICE_STATUSES`, `priceForPeriod`, `roundMoney`.

- [ ] **Step 1: Make `invoiceRepo.create` accept a tx client**

In `Server/src/modules/invoices/invoice.repo.js`, replace the `create` method:

```js
  async create(data, client) {
    const row = await (client ?? prisma).invoice.create({
      data,
      select: invoiceSelect,
    });
    return toInvoice(row);
  }
```

- [ ] **Step 2: Let `computeDiscountSnapshot` accept a preloaded plan (avoids a DB read inside the enroll tx)**

In `Server/src/modules/invoices/invoice.usecase.js`, change the signature + first lines of `computeDiscountSnapshot`:

```js
  async computeDiscountSnapshot(subscription, hourlyRate, plan) {
    if (!subscription?.planId || subscription.priceCharged == null) return null;
    const planRow = plan ?? (await planRepo.getById(subscription.planId));
    if (!planRow) return null;

    const base = roundMoney(
      priceForPeriod(planRow, subscription.billingPeriod, hourlyRate),
    );
```

Then replace the remaining references to `plan` in that method's body with `planRow` (the `coupon` part stays as `subscription.coupon`). The admin path (`generate`) calls it with two args, so `plan` is `undefined` and it still loads — no behaviour change.

- [ ] **Step 3: Add the system-level generator**

In `Server/src/modules/invoices/invoice.usecase.js`, add this method to the `InvoiceUsecase` class (e.g. right after `generate`):

```js
  /**
   * System-initiated invoice creation (no admin gate) — used by the public
   * family-enrollment flow. Always creates a fresh UNPAID invoice for a
   * just-created subscription. `template` + `settings` are passed in (loaded
   * once by the caller); `plan` lets us skip a DB read inside the caller's tx.
   * Pass `tx` to run inside the caller's transaction.
   */
  async generateForSubscription(
    subscription,
    { template, settings, plan, createdById = null, tx } = {},
  ) {
    if (!subscription || subscription.priceCharged == null) return null;

    const amounts = await this.computeAmounts(
      subscription,
      { previousCredit: 0, previousDebt: 0 },
      template,
      settings,
    );
    const discount = await this.computeDiscountSnapshot(
      subscription,
      Number(settings.hourlyRate),
      plan,
    );
    const configJson = { ...template.configJson, discount };
    const issueDate = new Date();

    return invoiceRepo.create(
      {
        subscriptionId: subscription.id,
        invoiceNumber: this.invoiceNumberFor(subscription.id),
        status: INVOICE_STATUSES.UNPAID,
        ...amounts,
        configJson,
        issueDate,
        dueDate: this.computeDueDate(issueDate, template),
        createdById,
      },
      tx,
    );
  }
```

- [ ] **Step 4: Verify the module loads (no syntax/import errors)**

Run: `node -e "import('./src/modules/invoices/invoice.usecase.js').then(m=>console.log(typeof m.invoiceUsecase.generateForSubscription))"` (from `Server/`)
Expected: prints `function`

- [ ] **Step 5: Commit**

```bash
git add Server/src/modules/invoices/invoice.repo.js Server/src/modules/invoices/invoice.usecase.js
git commit -m "feat(invoices): system-level generateForSubscription + tx-aware create"
```

---

## Task 3: Backend — public `POST /plans/quote` (coupon verify + authoritative price)

**Files:**
- Modify: `Server/src/modules/plans/plan.usecase.js`
- Modify: `Server/src/modules/plans/plan.controller.js`
- Modify: `Server/src/modules/plans/plan.validation.js`
- Modify: `Server/src/modules/plans/plan.route.js`

**Interfaces:**
- Produces: `POST /plans/quote` (public). Body `{ planId:number, billingPeriod:"MONTHLY"|"YEARLY", couponCode?:string }`. Response `data`: `{ currency, base, net, discount: {type,value,code}|null, couponValid: boolean|null, reason: string|null }`. Consumed by the frontend `CouponField`.

- [ ] **Step 1: Add imports + `quote()` to `plan.usecase.js`**

In `Server/src/modules/plans/plan.usecase.js`, extend the pricing-util import to include `priceForPeriod`, and add a `couponUsecase` import:

```js
import {
  applyDiscount,
  couponAppliesToPeriod,
  effectiveMonthlyPrice,
  effectiveYearlyPrice,
  isCouponActive,
  priceForPeriod,
  roundMoney,
} from "../../shared/utility/pricing.js";
import { couponUsecase } from "../coupons/coupon.usecase.js";
```

Add this method to the `PlanUsecase` class (e.g. after `pricingFor`):

```js
  /**
   * Public price quote for one plan/cycle with an optional coupon code. Mirrors
   * `subscriptionUsecase.computePricing` (best of auto plan-coupon vs typed code)
   * but NEVER throws on an invalid code — it reports `{couponValid:false,reason}`
   * so the registration wizard can show an inline error. Money stays
   * server-authoritative; the client only previews.
   */
  async quote({ planId, billingPeriod, couponCode }) {
    const plan = await planRepo.getByIdWithCoupons(planId);
    if (!plan || !plan.isActive) throw notFound(planMessagesCodes.PLAN_NOT_FOUND);

    const settings = await settingsUsecase.getEffective();
    const hourlyRate = Number(settings.hourlyRate);
    const now = new Date();
    const base = roundMoney(priceForPeriod(plan, billingPeriod, hourlyRate));

    // (1) best active plan-linked coupon for this cycle (auto-applied)
    const linked = (plan.coupons ?? [])
      .map((link) => link.coupon)
      .filter(Boolean);
    let net = base;
    let applied = null;
    for (const coupon of linked) {
      if (!isCouponActive(coupon, now)) continue;
      if (!couponAppliesToPeriod(coupon, billingPeriod)) continue;
      const candidate = roundMoney(applyDiscount(base, coupon));
      if (candidate < net) {
        net = candidate;
        applied = { type: coupon.type, value: Number(coupon.value), code: coupon.code };
      }
    }

    // (2) typed coupon code, if supplied
    let couponValid = null;
    let reason = null;
    if (couponCode) {
      const result = await couponUsecase.validateCoupon({
        code: couponCode,
        planId,
        billingPeriod,
      });
      if (!result.valid) {
        couponValid = false;
        reason = result.reason;
      } else {
        couponValid = true;
        const candidate = roundMoney(
          applyDiscount(base, {
            type: result.discount.type,
            value: result.discount.value,
          }),
        );
        if (candidate < net) {
          net = candidate;
          applied = {
            type: result.discount.type,
            value: result.discount.value,
            code: couponCode,
          };
        }
      }
    }

    return { currency: settings.currency, base, net: roundMoney(net), discount: applied, couponValid, reason };
  }
```

- [ ] **Step 2: Add the controller handler**

In `Server/src/modules/plans/plan.controller.js`, add to `PlanController` (after `listPublic`):

```js
  quote = async (req, res) => {
    const result = await planUsecase.quote(req.body);
    return ok(res, result);
  };
```

- [ ] **Step 3: Add the validation schema**

In `Server/src/modules/plans/plan.validation.js`, add the `BILLING_PERIODS` import and a `quoteSchema`:

```js
import { z } from "zod";
import { BILLING_PERIODS } from "@ayah/shared";
import { planMessagesCodes } from "./plan.messages.js";

const billingPeriods = [BILLING_PERIODS.MONTHLY, BILLING_PERIODS.YEARLY];
```

Add to the `PlanValidation` class:

```js
  static quoteSchema = z.object({
    planId: z.coerce.number().int().positive(planMessagesCodes.PLAN_NOT_FOUND),
    billingPeriod: z.enum(billingPeriods),
    couponCode: z.string().trim().min(1).optional(),
  });
```

- [ ] **Step 4: Mount the public route**

In `Server/src/modules/plans/plan.route.js`, add directly under the existing `"/public"` line (still **before** `"/:id"`):

```js
// PUBLIC — price quote for the registration wizard (coupon verify).
planRoutes.post(
  "/quote",
  validate(PlanValidation.quoteSchema),
  asyncHandler(planController.quote),
);
```

- [ ] **Step 5: Verify with the dev server**

Start the backend (`npm run dev:server`). Pick a real active `planId` (check the DB or the `/plans/public` response). Then:

Run (substitute a real plan id):
```bash
curl -s -X POST http://localhost:4000/api/plans/quote -H "Content-Type: application/json" -d '{"planId":1,"billingPeriod":"MONTHLY"}'
```
(If the API base path is not `/api`, check `Server/src/server.js` / app router mount and adjust.)
Expected: JSON `{"success":true,...,"data":{"currency":...,"base":<number>,"net":<number>,"discount":...,"couponValid":null,"reason":null}}`

Run with a bogus coupon:
```bash
curl -s -X POST http://localhost:4000/api/plans/quote -H "Content-Type: application/json" -d '{"planId":1,"billingPeriod":"MONTHLY","couponCode":"NOPE123"}'
```
Expected: `data.couponValid` is `false` and `data.reason` is a coupon code string (e.g. `COUPON_NOT_FOUND`).

- [ ] **Step 6: Commit**

```bash
git add Server/src/modules/plans/
git commit -m "feat(plans): public POST /plans/quote for coupon verify"
```

---

## Task 4: Backend — public `POST /auth/enroll` (family enrollment)

**Files:**
- Modify: `Server/src/modules/auth/auth.validation.js`
- Modify: `Server/src/modules/auth/auth.usecase.js`
- Modify: `Server/src/modules/auth/auth.controller.js`
- Modify: `Server/src/modules/auth/auth.route.js`

**Interfaces:**
- Consumes: `invoiceUsecase.generateForSubscription` (Task 2), `subscriptionUsecase.computePricing`/`computeEndDate`, `couponRepo.incrementCouponRedemption`, `userRepo.{findByEmail,createUser,linkParentStudent,findAdminIds}`, `authRepo.findByEmail`, `planRepo.getByIdWithCoupons`, `settingsUsecase.getEffective`, `paymentTemplateUsecase.get`, `notificationUsecase.createManyForUsers`, `hashPassword`.
- Produces: `POST /auth/enroll` (public). Response `data`: `{ parentId, children: [{studentId, subscriptionId, invoiceId}] }`.

- [ ] **Step 1: Add `enrollSchema`**

In `Server/src/modules/auth/auth.validation.js`, add the imports + schema:

```js
import { z } from "zod";
import { authMessagesCodes, BILLING_PERIODS } from "@ayah/shared";

const billingPeriods = [BILLING_PERIODS.MONTHLY, BILLING_PERIODS.YEARLY];

export class AuthValidation {
  // ... existing registerSchema, loginSchema unchanged ...

  static enrollChildSchema = z.object({
    name: z.string().min(1, authMessagesCodes.NAME_REQUIRED),
    email: z.string().email(authMessagesCodes.INVALID_EMAIL),
    password: z.string().min(6, authMessagesCodes.PASSWORD_TOO_SHORT),
    birthDate: z.coerce.date().optional(),
    nickname: z.string().trim().optional(),
    planId: z.coerce.number().int().positive(authMessagesCodes.PLAN_REQUIRED),
    billingPeriod: z.enum(billingPeriods),
    couponCode: z.string().trim().min(1).optional(),
  });

  static enrollSchema = z.object({
    parent: z.object({
      name: z.string().min(1, authMessagesCodes.NAME_REQUIRED),
      email: z.string().email(authMessagesCodes.INVALID_EMAIL),
      password: z.string().min(6, authMessagesCodes.PASSWORD_TOO_SHORT),
      phone: z
        .string()
        .trim()
        .min(1, authMessagesCodes.PHONE_REQUIRED)
        .regex(/^\+?[0-9\s\-()]{6,20}$/, authMessagesCodes.INVALID_PHONE),
      locale: z.enum(["ar", "en"]).optional(),
    }),
    children: z
      .array(AuthValidation.enrollChildSchema)
      .min(1, authMessagesCodes.NO_CHILDREN),
  });
}
```

(Note: `AuthValidation.enrollChildSchema` is referenced inside the class static initializer — define `enrollChildSchema` **before** `enrollSchema` in the class body, as shown.)

- [ ] **Step 2: Implement `enrollFamily` in the usecase**

In `Server/src/modules/auth/auth.usecase.js`, replace the imports block and add the method. New imports:

```js
import {
  BILLING_PERIODS,
  NOTIFICATION_TYPES,
  PARENT_RELATIONS,
  SUBSCRIPTION_STATUSES,
  USER_ROLES,
  authMessagesCodes,
  messagesNames,
  planMessagesCodes,
} from "@ayah/shared";
import { prisma } from "@ayah/db/prisma.client.js";
import { AppError, badRequest, conflict, notFound } from "../../shared/errors/AppError.js";
import { comparePassword, hashPassword } from "../../infra/security/hash.js";
import { userRepo } from "../users/user.repo.js";
import { planRepo } from "../plans/plan.repo.js";
import { couponRepo } from "../coupons/coupon.repo.js";
import { settingsUsecase } from "../settings/settings.usecase.js";
import { paymentTemplateUsecase } from "../paymentTemplates/paymentTemplate.usecase.js";
import { subscriptionRepo } from "../subscriptions/subscription.repo.js";
import { subscriptionUsecase } from "../subscriptions/subscription.usecase.js";
import { invoiceUsecase } from "../invoices/invoice.usecase.js";
import { notificationUsecase } from "../notifications/notification.usecase.js";
import { authRepo } from "./auth.repo.js";
```

Add this method to the `AuthUsecase` class (after `register`):

```js
  /**
   * Public family enrollment. Creates a PARENT + N STUDENT children, links them,
   * and for each child a PENDING subscription + UNPAID invoice — all atomically.
   * Pricing (incl. coupon) is recomputed server-side. Admins are notified.
   */
  async enrollFamily({ parent, children }) {
    // 1. Reject duplicate emails within the payload (children + parent).
    const seen = new Set();
    for (const child of children) {
      const key = child.email.trim().toLowerCase();
      if (seen.has(key) || key === parent.email.trim().toLowerCase()) {
        throw badRequest(
          authMessagesCodes.CHILD_EMAIL_DUPLICATE,
          messagesNames.authMessages,
        );
      }
      seen.add(key);
    }

    // 2. Reject already-registered emails (parent first, then each child).
    if (await authRepo.findByEmail(parent.email)) {
      throw new AppError({
        statusCode: 409,
        code: authMessagesCodes.EMAIL_ALREADY_EXISTS,
        message: authMessagesCodes.EMAIL_ALREADY_EXISTS,
        translationKey: messagesNames.authMessages,
      });
    }
    for (const child of children) {
      if (await userRepo.findByEmail(child.email)) {
        throw new AppError({
          statusCode: 409,
          code: authMessagesCodes.CHILD_EMAIL_EXISTS,
          message: authMessagesCodes.CHILD_EMAIL_EXISTS,
          translationKey: messagesNames.authMessages,
        });
      }
    }

    // 3. Load global settings + payment template once.
    const settings = await settingsUsecase.getEffective();
    const template = await paymentTemplateUsecase.get(null);
    const hourlyRate = Number(settings.hourlyRate);
    const now = new Date();

    // 4. Price each child authoritatively (also validates the coupon).
    const priced = [];
    for (const child of children) {
      const plan = await planRepo.getByIdWithCoupons(child.planId);
      if (!plan || !plan.isActive) {
        throw notFound(planMessagesCodes.PLAN_NOT_FOUND);
      }
      const billingPeriod = child.billingPeriod ?? BILLING_PERIODS.MONTHLY;
      let pricing;
      try {
        pricing = await subscriptionUsecase.computePricing(
          plan,
          billingPeriod,
          child.couponCode,
          hourlyRate,
        );
      } catch {
        throw badRequest(
          authMessagesCodes.COUPON_INVALID_FOR_PLAN,
          messagesNames.authMessages,
        );
      }
      const hours =
        billingPeriod === BILLING_PERIODS.YEARLY ? plan.hours * 12 : plan.hours;
      const startDate = now;
      const endDate = subscriptionUsecase.computeEndDate(startDate, billingPeriod);
      priced.push({ child, plan, billingPeriod, hours, startDate, endDate, ...pricing });
    }

    // 5. Pre-hash passwords outside the tx (keeps the tx short).
    const parentHash = await hashPassword(parent.password);
    const childHashes = await Promise.all(
      children.map((c) => hashPassword(c.password)),
    );

    // 6. Atomic write: parent + children + links + subscriptions + invoices.
    const result = await prisma.$transaction(async (tx) => {
      const parentUser = await userRepo.createUser(
        {
          name: parent.name,
          email: parent.email,
          passwordHash: parentHash,
          role: USER_ROLES.PARENT,
          phone: parent.phone,
          locale: parent.locale ?? "ar",
        },
        tx,
      );

      const createdChildren = [];
      for (let i = 0; i < priced.length; i += 1) {
        const p = priced[i];
        const studentUser = await userRepo.createUser(
          {
            name: p.child.name,
            email: p.child.email,
            passwordHash: childHashes[i],
            role: USER_ROLES.STUDENT,
            nickname: p.child.nickname,
            birthDate: p.child.birthDate,
            locale: parent.locale ?? "ar",
            createdById: parentUser.id,
          },
          tx,
        );
        await userRepo.linkParentStudent(
          parentUser.id,
          studentUser.id,
          PARENT_RELATIONS.GUARDIAN,
          tx,
        );

        const subData = {
          status: SUBSCRIPTION_STATUSES.PENDING,
          billingPeriod: p.billingPeriod,
          startDate: p.startDate,
          endDate: p.endDate,
          totalHours: p.hours,
          remainingHours: p.hours,
          priceCharged: p.priceCharged,
          currency: settings.currency,
          student: { connect: { id: studentUser.id } },
          plan: { connect: { id: p.plan.id } },
          createdBy: { connect: { id: parentUser.id } },
        };
        if (p.couponId) subData.coupon = { connect: { id: p.couponId } };

        const subscription = await subscriptionRepo.createSubscription(subData, tx);
        if (p.couponId) {
          await couponRepo.incrementCouponRedemption(p.couponId, tx);
        }

        const invoice = await invoiceUsecase.generateForSubscription(subscription, {
          template,
          settings,
          plan: p.plan,
          createdById: parentUser.id,
          tx,
        });

        createdChildren.push({
          studentId: studentUser.id,
          subscriptionId: subscription.id,
          invoiceId: invoice?.id ?? null,
        });
      }

      return { parentId: parentUser.id, children: createdChildren };
    });

    // 7. Notify admins (the teacher) — best-effort, must not fail the request.
    try {
      const adminIds = await userRepo.findAdminIds();
      if (adminIds.length) {
        await notificationUsecase.createManyForUsers(adminIds, {
          type: NOTIFICATION_TYPES.SUBSCRIPTION_CREATED,
          titleAr: `طلب تسجيل جديد: ${children.length} طالب بانتظار المراجعة`,
          titleEn: `New enrollment: ${children.length} student(s) pending review`,
          link: "/dashboard/subscriptions",
        });
      }
    } catch {
      // swallow — notification is best-effort
    }

    return result;
  }
```

(Keep the existing `register`, `login`, `getById` methods. Only the imports block is rewritten and `enrollFamily` added. The new imports are a superset of the old ones — `AppError`, `comparePassword`, `hashPassword`, `authRepo`, `USER_ROLES`, `authMessagesCodes`, `messagesNames` were already used by `register`/`login`.)

- [ ] **Step 3: Add the controller handler**

In `Server/src/modules/auth/auth.controller.js`, add to `AuthController` (after `register`):

```js
  enroll = async (req, res) => {
    const result = await authUsecase.enrollFamily(req.body);
    return created(
      res,
      result,
      authMessagesCodes.ENROLLED_SUCCESS,
      messagesNames.authMessages,
    );
  };
```

(`created`, `authMessagesCodes`, `messagesNames`, `authUsecase` are already imported in this file.)

- [ ] **Step 4: Mount the public route**

In `Server/src/modules/auth/auth.route.js`, add after the `/register` route:

```js
authRoutes.post(
  "/enroll",
  validate(AuthValidation.enrollSchema),
  asyncHandler(authController.enroll),
);
```

- [ ] **Step 5: Verify with the dev server**

Restart the backend. Use a unique parent email and one child with a real active `planId`:

```bash
curl -s -X POST http://localhost:4000/api/auth/enroll -H "Content-Type: application/json" -d '{
  "parent":{"name":"اب تجريبي","email":"parent.test+1@example.com","password":"secret123","phone":"+201000000000","locale":"ar"},
  "children":[{"name":"ابن تجريبي","email":"child.test+1@example.com","password":"secret123","birthDate":"2016-05-01","planId":1,"billingPeriod":"MONTHLY"}]
}'
```
Expected: HTTP 201, `{"success":true,"message":"ENROLLED_SUCCESS",...,"data":{"parentId":<id>,"children":[{"studentId":<id>,"subscriptionId":<id>,"invoiceId":<id>}]}}`

Re-run the same command. Expected: HTTP 409 with `message:"AUTH_EMAIL_ALREADY_EXISTS"` (parent email taken — nothing else created).

Verify the side effects (Prisma Studio `npm run db:studio`, or a quick query): the parent + child exist, a `ParentStudent` link exists, a PENDING `Subscription`, and an UNPAID `Invoice`.

- [ ] **Step 6: Commit**

```bash
git add Server/src/modules/auth/
git commit -m "feat(auth): public POST /auth/enroll family registration"
```

---

## Task 5: Frontend — auth copy + registration URL constants

**Files:**
- Modify: `web/src/features/auth/config/authText.js`
- Create: `web/src/features/auth/config/constant.js`

**Interfaces:**
- Produces: new `authText` keys (listed below) for `ar` + `en`; exported URL constants `ENROLL_URL`, `PLAN_QUOTE_URL`, `PLANS_PUBLIC_URL`. Consumed by Tasks 6–10.

- [ ] **Step 1: Create the URL constants**

Create `web/src/features/auth/config/constant.js`:

```js
export const PLANS_PUBLIC_URL = "plans/public";
export const PLAN_QUOTE_URL = "plans/quote";
export const ENROLL_URL = "auth/enroll";
```

- [ ] **Step 2: Add wizard copy to `authText.js`**

In `web/src/features/auth/config/authText.js`, add these keys to **both** the `ar` and `en` objects (alongside the existing keys).

`ar` additions:
```js
    // wizard
    wizardTitle: "التسجيل في أكاديمية آية",
    wizardSubtitle: "أضف أبناءك واختر الخطة المناسبة",
    stepChildren: "الأبناء والخطط",
    stepReview: "المراجعة وبيانات ولي الأمر",
    childTitle: "بيانات الابن",
    childNumber: "الابن",
    nickname: "اسم الدلع (اختياري)",
    birthDate: "تاريخ الميلاد",
    monthly: "شهري",
    yearly: "سنوي",
    perMonth: "/ شهر",
    perYear: "/ سنة",
    hours: "ساعة",
    was: "كان",
    choosePlan: "اختر الخطة",
    noPlans: "لا توجد خطط متاحة حالياً",
    couponLabel: "كود الخصم",
    couponPlaceholder: "أدخل كود الخصم إن وجد",
    verifyCoupon: "تحقق",
    verifying: "جارٍ التحقق…",
    removeCoupon: "إزالة الكوبون",
    couponApplied: "تم تطبيق الخصم 🎉",
    couponInvalid: "كود الخصم غير صالح",
    couponExpired: "انتهت صلاحية كود الخصم",
    couponNotApplicable: "الكوبون لا ينطبق على هذه الخطة أو الدورة",
    couponNotFound: "كود الخصم غير موجود",
    selectPlanFirst: "اختر خطة أولاً قبل التحقق من الكوبون",
    giftBanner: "🎁 أول حصة مجانية لكل ابن",
    paymentNotice: "الاشتراك لا يتطلب دفعاً الآن — الدفع يكون بعد أول حصة. الاختيار للتسجيل فقط.",
    addChild: "➕ إضافة ابن آخر",
    removeChild: "حذف هذا الابن",
    next: "التالي",
    back: "السابق",
    summaryTitle: "ملخص الطلب",
    colChild: "الابن",
    colPlan: "الخطة",
    colCycle: "الدورة",
    colBase: "السعر",
    colDiscount: "الخصم",
    colNet: "الصافي",
    colGift: "هدية",
    firstSessionFree: "أول حصة مجانية",
    parentTitle: "بيانات ولي الأمر",
    submit: "تسجيل",
    submitting: "جارٍ التسجيل…",
    fixErrors: "بعض البيانات غير مكتملة، يرجى المراجعة",
    planRequired: "اختر خطة لهذا الابن",
```

`en` additions:
```js
    wizardTitle: "Join Ayah Academy",
    wizardSubtitle: "Add your children and choose a plan",
    stepChildren: "Children & plans",
    stepReview: "Review & parent details",
    childTitle: "Child details",
    childNumber: "Child",
    nickname: "Nickname (optional)",
    birthDate: "Date of birth",
    monthly: "Monthly",
    yearly: "Yearly",
    perMonth: "/ mo",
    perYear: "/ yr",
    hours: "hours",
    was: "was",
    choosePlan: "Choose a plan",
    noPlans: "No plans available right now",
    couponLabel: "Coupon code",
    couponPlaceholder: "Enter a coupon code if you have one",
    verifyCoupon: "Verify",
    verifying: "Verifying…",
    removeCoupon: "Remove coupon",
    couponApplied: "Discount applied 🎉",
    couponInvalid: "Invalid coupon code",
    couponExpired: "Coupon code expired",
    couponNotApplicable: "Coupon does not apply to this plan or cycle",
    couponNotFound: "Coupon code not found",
    selectPlanFirst: "Select a plan first before verifying a coupon",
    giftBanner: "🎁 First session free for every child",
    paymentNotice: "No payment is required now — you pay after the first session. The selection is for registration only.",
    addChild: "➕ Add another child",
    removeChild: "Remove this child",
    next: "Next",
    back: "Back",
    summaryTitle: "Order summary",
    colChild: "Child",
    colPlan: "Plan",
    colCycle: "Cycle",
    colBase: "Price",
    colDiscount: "Discount",
    colNet: "Net",
    colGift: "Gift",
    firstSessionFree: "First session free",
    parentTitle: "Parent details",
    submit: "Register",
    submitting: "Registering…",
    fixErrors: "Some details are incomplete, please review",
    planRequired: "Choose a plan for this child",
```

- [ ] **Step 3: Verify the web app still compiles**

Run: `npm run dev:web` and confirm it boots without a module/parse error (Ctrl-C after it compiles). (No UI yet uses these keys — this is just a parse/import check.)

- [ ] **Step 4: Commit**

```bash
git add web/src/features/auth/config/
git commit -m "feat(web/auth): wizard copy + enroll URL constants"
```

---

## Task 6: Frontend — `PlanRadioCards` (single-select plan cards)

**Files:**
- Create: `web/src/features/auth/components/PlanRadioCards.jsx`

**Interfaces:**
- Produces: `<PlanRadioCards plans billingPeriod selectedPlanId onSelect lng txt />`.
  - `plans`: array from `GET /plans/public` (each: `{id,titleAr,titleEn,descriptionAr,descriptionEn,hours,currency,isFeatured,monthly:{base,effective,discount},yearly:{...}}`).
  - `billingPeriod`: `"MONTHLY"|"YEARLY"`. `selectedPlanId`: number|null. `onSelect(planId)`. `txt`: `useAuthText()` object. `lng`: `"ar"|"en"`.
- Consumed by Task 8 (`ChildEnrollCard`).

- [ ] **Step 1: Write the component**

Create `web/src/features/auth/components/PlanRadioCards.jsx`:

```jsx
"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { formatMoney } from "../../../shared/lib/money.js";

/** Plans as single-select (radio) cards for one billing cycle. */
export default function PlanRadioCards({
  plans,
  billingPeriod,
  selectedPlanId,
  onSelect,
  lng,
  txt,
}) {
  if (!plans || plans.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
        {txt.noPlans}
      </Typography>
    );
  }

  const isYearly = billingPeriod === "YEARLY";

  return (
    <Grid container spacing={2}>
      {plans.map((p) => {
        const cycle = isYearly ? p.yearly : p.monthly;
        const base = cycle?.base;
        const effective = cycle?.effective;
        const discount = cycle?.discount || null;
        const hasDiscount =
          discount != null && effective != null && effective < base;
        const discountLabel =
          discount &&
          (discount.type === "PERCENT"
            ? `-${discount.value}%`
            : `-${formatMoney(discount.value, p.currency)}`);
        const selected = selectedPlanId === p.id;

        return (
          <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              variant="outlined"
              onClick={() => onSelect(p.id)}
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(p.id);
                }
              }}
              sx={{
                height: "100%",
                cursor: "pointer",
                borderColor: selected ? "primary.main" : "divider",
                borderWidth: selected ? 2 : 1,
                boxShadow: selected ? 4 : 0,
                transition: "all .15s ease",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent sx={{ flex: 1 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="h6" fontWeight={800}>
                    {lng === "en" ? p.titleEn : p.titleAr}
                  </Typography>
                  {selected && <Chip size="small" color="primary" label="✓" />}
                </Stack>

                <Stack direction="row" alignItems="baseline" spacing={1}>
                  <Typography variant="h4" fontWeight={900} color="primary">
                    {formatMoney(hasDiscount ? effective : base, p.currency)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isYearly ? txt.perYear : txt.perMonth}
                  </Typography>
                </Stack>

                {hasDiscount && (
                  <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textDecoration: "line-through" }}
                    >
                      {txt.was} {formatMoney(base, p.currency)}
                    </Typography>
                    {discountLabel && (
                      <Chip size="small" color="error" label={discountLabel} />
                    )}
                  </Stack>
                )}

                <Typography variant="body2" color="text.secondary" mt={1}>
                  {p.hours} {txt.hours}
                </Typography>
                {(lng === "en" ? p.descriptionEn : p.descriptionAr) && (
                  <Typography variant="body2" mt={1}>
                    {lng === "en" ? p.descriptionEn : p.descriptionAr}
                  </Typography>
                )}
              </CardContent>
              <Box sx={{ px: 2, pb: 2 }}>
                <Chip
                  size="small"
                  variant={selected ? "filled" : "outlined"}
                  color={selected ? "primary" : "default"}
                  label={selected ? txt.choosePlan + " ✓" : txt.choosePlan}
                  sx={{ width: "100%" }}
                />
              </Box>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/features/auth/components/PlanRadioCards.jsx
git commit -m "feat(web/auth): PlanRadioCards single-select plan cards"
```

---

## Task 7: Frontend — `CouponField` (verify / apply / remove)

**Files:**
- Create: `web/src/features/auth/components/CouponField.jsx`

**Interfaces:**
- Produces: `<CouponField code status reason net currency disabled verifying onCodeChange onVerify onRemove txt />`.
  - `status`: `"idle"|"valid"|"invalid"`. `reason`: coupon reason code string|null (e.g. `COUPON_NOT_FOUND`). `net`: number|null (discounted price when valid). `currency`: string. `disabled`: boolean (true when no plan selected). `verifying`: boolean.
  - Callbacks: `onCodeChange(string)`, `onVerify()`, `onRemove()`.
- Consumed by Task 8.

- [ ] **Step 1: Write the component**

Create `web/src/features/auth/components/CouponField.jsx`:

```jsx
"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
} from "@mui/material";
import { formatMoney } from "../../../shared/lib/money.js";

/** Maps a backend coupon reason code to a localized message. */
function reasonText(reason, txt) {
  switch (reason) {
    case "COUPON_EXPIRED":
      return txt.couponExpired;
    case "COUPON_NOT_APPLICABLE":
      return txt.couponNotApplicable;
    case "COUPON_NOT_FOUND":
      return txt.couponNotFound;
    default:
      return txt.couponInvalid;
  }
}

export default function CouponField({
  code,
  status,
  reason,
  net,
  currency,
  disabled,
  verifying,
  onCodeChange,
  onVerify,
  onRemove,
  txt,
}) {
  const isValid = status === "valid";
  const isInvalid = status === "invalid";

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <TextField
          label={txt.couponLabel}
          placeholder={txt.couponPlaceholder}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          size="small"
          fullWidth
          disabled={isValid || verifying}
        />
        {isValid ? (
          <Button color="error" variant="outlined" onClick={onRemove} sx={{ whiteSpace: "nowrap" }}>
            {txt.removeCoupon}
          </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={onVerify}
            disabled={disabled || verifying || !code.trim()}
            startIcon={verifying ? <CircularProgress size={16} /> : undefined}
            sx={{ whiteSpace: "nowrap" }}
          >
            {verifying ? txt.verifying : txt.verifyCoupon}
          </Button>
        )}
      </Stack>

      {disabled && (
        <Box component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
          {txt.selectPlanFirst}
        </Box>
      )}

      {isValid && (
        <Alert severity="success" sx={{ py: 0 }}>
          {txt.couponApplied}
          {net != null ? ` — ${formatMoney(net, currency)}` : ""}
        </Alert>
      )}

      {isInvalid && (
        <Alert severity="error" sx={{ py: 0 }} action={
          <Button color="inherit" size="small" onClick={onRemove}>
            {txt.removeCoupon}
          </Button>
        }>
          {reasonText(reason, txt)}
        </Alert>
      )}
    </Stack>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/features/auth/components/CouponField.jsx
git commit -m "feat(web/auth): CouponField verify/apply/remove"
```

---

## Task 8: Frontend — `ChildEnrollCard` (one child: fields + plan + coupon + banners)

**Files:**
- Create: `web/src/features/auth/components/ChildEnrollCard.jsx`

**Interfaces:**
- Consumes: `PlanRadioCards` (Task 6), `CouponField` (Task 7), `PLAN_QUOTE_URL` (Task 5), `useRequest`, `formatMoney`.
- Produces: `<ChildEnrollCard index child plans onChange onRemove canRemove errors txt lng />`.
  - `child`: `{name,email,password,nickname,birthDate,billingPeriod,planId,coupon:{code,status,reason,quote}}`.
  - `onChange(patch)`: merge a partial child into the wizard state at `index`.
  - `errors`: `{name?,email?,password?,planId?}` strings to show under fields.
- Used by Task 10.

- [ ] **Step 1: Write the component**

Create `web/src/features/auth/components/ChildEnrollCard.jsx`:

```jsx
"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import PlanRadioCards from "./PlanRadioCards.jsx";
import CouponField from "./CouponField.jsx";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { PLAN_QUOTE_URL } from "../config/constant.js";

export default function ChildEnrollCard({
  index,
  child,
  plans,
  onChange,
  onRemove,
  canRemove,
  errors = {},
  txt,
  lng,
}) {
  const quoteReq = useRequest({
    url: PLAN_QUOTE_URL,
    method: "post",
    isPublic: true,
    syncToUrl: false,
  });

  const coupon = child.coupon || { code: "", status: "idle", reason: null, quote: null };

  const setField = (key) => (e) => onChange({ [key]: e.target.value });

  const handleBilling = (_e, value) => {
    if (!value) return;
    // Changing the cycle invalidates any applied coupon.
    onChange({
      billingPeriod: value,
      coupon: { ...coupon, status: "idle", reason: null, quote: null },
    });
  };

  const handleSelectPlan = (planId) => {
    // Changing the plan invalidates any applied coupon.
    onChange({
      planId,
      coupon: { ...coupon, status: "idle", reason: null, quote: null },
    });
  };

  const verifyCoupon = async () => {
    if (!child.planId) return;
    try {
      const res = await quoteReq.fetchData(null, {
        planId: child.planId,
        billingPeriod: child.billingPeriod,
        couponCode: coupon.code.trim(),
      });
      const data = res?.data;
      if (data?.couponValid) {
        onChange({ coupon: { ...coupon, status: "valid", reason: null, quote: data } });
      } else {
        onChange({
          coupon: { ...coupon, status: "invalid", reason: data?.reason || null, quote: null },
        });
      }
    } catch {
      onChange({ coupon: { ...coupon, status: "invalid", reason: null, quote: null } });
    }
  };

  const removeCoupon = () =>
    onChange({ coupon: { code: "", status: "idle", reason: null, quote: null } });

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" fontWeight={800}>
            {txt.childTitle} — {txt.childNumber} {index + 1}
          </Typography>
          {canRemove && (
            <Button color="error" size="small" onClick={onRemove}>
              {txt.removeChild}
            </Button>
          )}
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.name}
              value={child.name}
              onChange={setField("name")}
              error={Boolean(errors.name)}
              helperText={errors.name}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.nickname}
              value={child.nickname}
              onChange={setField("nickname")}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.email}
              type="email"
              value={child.email}
              onChange={setField("email")}
              error={Boolean(errors.email)}
              helperText={errors.email}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.password}
              type="password"
              value={child.password}
              onChange={setField("password")}
              error={Boolean(errors.password)}
              helperText={errors.password}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.birthDate}
              type="date"
              value={child.birthDate}
              onChange={setField("birthDate")}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Alert severity="success" icon={false} sx={{ mb: 1 }}>
          {txt.giftBanner}
        </Alert>
        <Alert severity="info" icon={false} sx={{ mb: 2 }}>
          {txt.paymentNotice}
        </Alert>

        <Stack direction="row" justifyContent="center" mb={2}>
          <ToggleButtonGroup
            value={child.billingPeriod}
            exclusive
            color="primary"
            size="small"
            onChange={handleBilling}
          >
            <ToggleButton value="MONTHLY">{txt.monthly}</ToggleButton>
            <ToggleButton value="YEARLY">{txt.yearly}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <PlanRadioCards
          plans={plans}
          billingPeriod={child.billingPeriod}
          selectedPlanId={child.planId}
          onSelect={handleSelectPlan}
          lng={lng}
          txt={txt}
        />
        {errors.planId && (
          <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
            {errors.planId}
          </Typography>
        )}

        <Box sx={{ mt: 2 }}>
          <CouponField
            code={coupon.code}
            status={coupon.status}
            reason={coupon.reason}
            net={coupon.quote?.net ?? null}
            currency={coupon.quote?.currency}
            disabled={!child.planId}
            verifying={quoteReq.isLoading}
            onCodeChange={(value) =>
              onChange({ coupon: { ...coupon, code: value } })
            }
            onVerify={verifyCoupon}
            onRemove={removeCoupon}
            txt={txt}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/features/auth/components/ChildEnrollCard.jsx
git commit -m "feat(web/auth): ChildEnrollCard (fields + plan + coupon + banners)"
```

---

## Task 9: Frontend — `EnrollSummaryTable` + `ParentDetailsForm`

**Files:**
- Create: `web/src/features/auth/components/EnrollSummaryTable.jsx`
- Create: `web/src/features/auth/components/ParentDetailsForm.jsx`

**Interfaces:**
- `EnrollSummaryTable`: `<EnrollSummaryTable children plans lng txt />`. Computes per-child base/discount/net from `plans` (`/plans/public` shape) + each child's selected plan/cycle/coupon quote.
- `ParentDetailsForm`: `<ParentDetailsForm parent onChange errors txt />`. Controlled fields name/email/password/phone (plain `TextField`s — phone as a normal text input to keep the wizard dependency-free).
- Both consumed by Task 10.

- [ ] **Step 1: Write `EnrollSummaryTable.jsx`**

Create `web/src/features/auth/components/EnrollSummaryTable.jsx`:

```jsx
"use client";

import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { formatMoney } from "../../../shared/lib/money.js";

/** Resolve the {base, net, discountAmount, currency} a child will be charged. */
function priceFor(child, plans) {
  const plan = plans.find((p) => p.id === child.planId);
  if (!plan) return null;
  const cycle = child.billingPeriod === "YEARLY" ? plan.yearly : plan.monthly;
  const base = cycle?.base ?? 0;
  // valid typed coupon → its quoted net; otherwise the plan's auto-effective.
  const net =
    child.coupon?.status === "valid" && child.coupon.quote?.net != null
      ? child.coupon.quote.net
      : cycle?.effective ?? base;
  return {
    plan,
    base,
    net,
    discountAmount: Math.max(0, base - net),
    currency: plan.currency,
  };
}

export default function EnrollSummaryTable({ children, plans, lng, txt }) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{txt.colChild}</TableCell>
            <TableCell>{txt.colPlan}</TableCell>
            <TableCell>{txt.colCycle}</TableCell>
            <TableCell align="right">{txt.colBase}</TableCell>
            <TableCell align="right">{txt.colDiscount}</TableCell>
            <TableCell align="right">{txt.colNet}</TableCell>
            <TableCell>{txt.colGift}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {children.map((child, i) => {
            const p = priceFor(child, plans);
            return (
              <TableRow key={i}>
                <TableCell>{child.name || `${txt.childNumber} ${i + 1}`}</TableCell>
                <TableCell>
                  {p ? (lng === "en" ? p.plan.titleEn : p.plan.titleAr) : "—"}
                </TableCell>
                <TableCell>
                  {child.billingPeriod === "YEARLY" ? txt.yearly : txt.monthly}
                </TableCell>
                <TableCell align="right">
                  {p ? formatMoney(p.base, p.currency) : "—"}
                </TableCell>
                <TableCell align="right">
                  {p && p.discountAmount > 0
                    ? `-${formatMoney(p.discountAmount, p.currency)}`
                    : "—"}
                </TableCell>
                <TableCell align="right">
                  {p ? formatMoney(p.net, p.currency) : "—"}
                </TableCell>
                <TableCell>
                  <Chip size="small" color="success" label={txt.firstSessionFree} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

- [ ] **Step 2: Write `ParentDetailsForm.jsx`**

Create `web/src/features/auth/components/ParentDetailsForm.jsx`:

```jsx
"use client";

import { Grid, TextField } from "@mui/material";

export default function ParentDetailsForm({ parent, onChange, errors = {}, txt }) {
  const setField = (key) => (e) => onChange({ [key]: e.target.value });

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label={txt.name}
          value={parent.name}
          onChange={setField("name")}
          error={Boolean(errors.name)}
          helperText={errors.name}
          fullWidth
          size="small"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label={txt.phone}
          value={parent.phone}
          onChange={setField("phone")}
          error={Boolean(errors.phone)}
          helperText={errors.phone}
          fullWidth
          size="small"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label={txt.email}
          type="email"
          value={parent.email}
          onChange={setField("email")}
          error={Boolean(errors.email)}
          helperText={errors.email}
          fullWidth
          size="small"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          label={txt.password}
          type="password"
          value={parent.password}
          onChange={setField("password")}
          error={Boolean(errors.password)}
          helperText={errors.password}
          fullWidth
          size="small"
        />
      </Grid>
    </Grid>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/features/auth/components/EnrollSummaryTable.jsx web/src/features/auth/components/ParentDetailsForm.jsx
git commit -m "feat(web/auth): EnrollSummaryTable + ParentDetailsForm"
```

---

## Task 10: Frontend — `RegisterWizard` + wire the page

**Files:**
- Create: `web/src/features/auth/components/RegisterWizard.jsx`
- Modify: `web/src/app/[lng]/register/page.jsx`

**Interfaces:**
- Consumes: `ChildEnrollCard`, `EnrollSummaryTable`, `ParentDetailsForm`, `useAuthText`, `useRequest`, `PLANS_PUBLIC_URL`, `ENROLL_URL`, i18n routing helpers.
- Produces: the full registration screen.

- [ ] **Step 1: Write `RegisterWizard.jsx`**

Create `web/src/features/auth/components/RegisterWizard.jsx`:

```jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import ChildEnrollCard from "./ChildEnrollCard.jsx";
import EnrollSummaryTable from "./EnrollSummaryTable.jsx";
import ParentDetailsForm from "./ParentDetailsForm.jsx";
import { useAuthText } from "../config/authText.js";
import { ENROLL_URL, PLANS_PUBLIC_URL } from "../config/constant.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emptyChild() {
  return {
    name: "",
    email: "",
    password: "",
    nickname: "",
    birthDate: "",
    billingPeriod: "MONTHLY",
    planId: null,
    coupon: { code: "", status: "idle", reason: null, quote: null },
  };
}

export default function RegisterWizard() {
  const txt = useAuthText();
  const router = useRouter();
  const { lng } = useTranslation();

  const [step, setStep] = useState(0);
  const [children, setChildren] = useState([emptyChild()]);
  const [parent, setParent] = useState({ name: "", email: "", password: "", phone: "" });
  const [childErrors, setChildErrors] = useState([]);
  const [parentErrors, setParentErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const plansReq = useRequest({
    url: PLANS_PUBLIC_URL,
    method: "get",
    isPublic: true,
    autoFetch: false,
    syncToUrl: false,
  });

  useEffect(() => {
    plansReq.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plans = plansReq.data || [];

  const enrollReq = useRequest({
    url: ENROLL_URL,
    method: "post",
    isPublic: true,
    shouldAutoToast: true,
    onSuccess: () => router.replace(localePath(lng, "/login")),
  });

  const patchChild = (index, patch) =>
    setChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );

  const addChild = () => setChildren((prev) => [...prev, emptyChild()]);
  const removeChild = (index) =>
    setChildren((prev) => prev.filter((_, i) => i !== index));

  const patchParent = (patch) => setParent((prev) => ({ ...prev, ...patch }));

  const validateChildren = () => {
    const errs = children.map((c) => {
      const e = {};
      if (!c.name.trim()) e.name = txt.required;
      if (!EMAIL_RE.test(c.email.trim())) e.email = txt.invalidEmail;
      if ((c.password || "").length < 6) e.password = txt.passwordShort;
      if (!c.planId) e.planId = txt.planRequired;
      return e;
    });
    setChildErrors(errs);
    return errs.every((e) => Object.keys(e).length === 0);
  };

  const validateParent = () => {
    const e = {};
    if (!parent.name.trim()) e.name = txt.required;
    if (!EMAIL_RE.test(parent.email.trim())) e.email = txt.invalidEmail;
    if ((parent.password || "").length < 6) e.password = txt.passwordShort;
    if (!parent.phone.trim()) e.phone = txt.required;
    setParentErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    setFormError(null);
    if (validateChildren()) setStep(1);
    else setFormError(txt.fixErrors);
  };

  const goBack = () => {
    setFormError(null);
    setStep(0);
  };

  const submit = async () => {
    setFormError(null);
    if (!validateParent()) {
      setFormError(txt.fixErrors);
      return;
    }
    const payload = {
      parent: {
        name: parent.name.trim(),
        email: parent.email.trim(),
        password: parent.password,
        phone: parent.phone.trim(),
        locale: lng === "en" ? "en" : "ar",
      },
      children: children.map((c) => ({
        name: c.name.trim(),
        email: c.email.trim(),
        password: c.password,
        nickname: c.nickname.trim() || undefined,
        birthDate: c.birthDate || undefined,
        planId: c.planId,
        billingPeriod: c.billingPeriod,
        couponCode:
          c.coupon?.status === "valid" && c.coupon.code.trim()
            ? c.coupon.code.trim()
            : undefined,
      })),
    };
    try {
      await enrollReq.fetchData(null, payload);
    } catch {
      // toast already shown by useRequest (shouldAutoToast)
    }
  };

  return (
    <Box sx={{ py: { xs: 4, md: 6 } }}>
      <Container maxWidth="md">
        <Stack spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <Box component={Link} href={localePath(lng, "/")} aria-label="Ayah Academy">
            <Box component="img" src="/logos/logo.png" alt="Ayah Academy" sx={{ height: 56 }} />
          </Box>
          <Typography variant="h4" fontWeight={800} textAlign="center">
            {txt.wizardTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {txt.wizardSubtitle}
          </Typography>
        </Stack>

        <Stepper activeStep={step} sx={{ mb: 4 }}>
          <Step><StepLabel>{txt.stepChildren}</StepLabel></Step>
          <Step><StepLabel>{txt.stepReview}</StepLabel></Step>
        </Stepper>

        {step === 0 && (
          <Stack spacing={3}>
            {children.map((child, i) => (
              <ChildEnrollCard
                key={i}
                index={i}
                child={child}
                plans={plans}
                onChange={(patch) => patchChild(i, patch)}
                onRemove={() => removeChild(i)}
                canRemove={children.length > 1}
                errors={childErrors[i] || {}}
                txt={txt}
                lng={lng}
              />
            ))}
            <Button variant="outlined" onClick={addChild}>
              {txt.addChild}
            </Button>
            {formError && (
              <Typography color="error" variant="body2">{formError}</Typography>
            )}
            <Box>
              <Button variant="contained" size="large" onClick={goNext}>
                {txt.next}
              </Button>
            </Box>
          </Stack>
        )}

        {step === 1 && (
          <Stack spacing={3}>
            <Typography variant="h6" fontWeight={800}>{txt.summaryTitle}</Typography>
            <EnrollSummaryTable children={children} plans={plans} lng={lng} txt={txt} />

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                {txt.parentTitle}
              </Typography>
              <ParentDetailsForm
                parent={parent}
                onChange={patchParent}
                errors={parentErrors}
                txt={txt}
              />
            </Paper>

            {formError && (
              <Typography color="error" variant="body2">{formError}</Typography>
            )}

            <Stack direction="row" spacing={2}>
              <Button variant="text" onClick={goBack} disabled={enrollReq.isLoading}>
                {txt.back}
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={submit}
                disabled={enrollReq.isLoading}
              >
                {enrollReq.isLoading ? txt.submitting : txt.submit}
              </Button>
            </Stack>
          </Stack>
        )}

        <Stack spacing={1} alignItems="center" sx={{ mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {txt.haveAccount}{" "}
            <Box component={Link} href={localePath(lng, "/login")} sx={{ color: "primary.main", fontWeight: 600 }}>
              {txt.goLogin}
            </Box>
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
```

- [ ] **Step 2: Point the page at the wizard**

Replace `web/src/app/[lng]/register/page.jsx` body to render `RegisterWizard`:

```jsx
import { Suspense } from 'react';
import RegisterWizard from '@/features/auth/components/RegisterWizard.jsx';
import { buildMetadata } from '@/shared/lib/seo';

export async function generateMetadata({ params }) {
  const { lng } = await params;
  return buildMetadata({ lng, page: 'register', path: '/register' });
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterWizard />
    </Suspense>
  );
}
```

(Leave the old `RegisterForm.jsx` file in place — unused now, removable in a later cleanup. The `@/` alias resolves to `web/src` per the existing import in the current page.)

- [ ] **Step 3: Manual end-to-end verification**

Start both servers (`npm run dev:server`, `npm run dev:web`). In the browser at `http://localhost:3000/ar/register`:
1. Step 1 shows one child card with fields, billing toggle, plan cards, coupon field, gift + payment banners.
2. Select a plan → card highlights. Type a known-good coupon → "تحقق" → success + discounted price; "إزالة الكوبون" clears it. Type a bad coupon → red error + remove button.
3. "➕ إضافة ابن آخر" adds a second card; fill it; remove works (only when >1).
4. "التالي" with an incomplete child shows inline errors; with all complete → Step 2.
5. Step 2 shows the summary table (one row per child, price/discount/net/first-session-free) + parent form.
6. Submit with valid parent data → success toast → redirect to `/login`.
7. Confirm in Prisma Studio: parent + children created, `ParentStudent` links, PENDING subscriptions, UNPAID invoices.
8. Switch to `http://localhost:3000/en/register` and confirm English copy + LTR.

- [ ] **Step 4: Commit**

```bash
git add web/src/features/auth/components/RegisterWizard.jsx "web/src/app/[lng]/register/page.jsx"
git commit -m "feat(web/auth): family registration wizard wired to /register"
```

---

## Self-Review

**Spec coverage:**
- Two-step wizard → Task 10. ✓
- Child-first cards with fields + plan radio + per-child coupon → Tasks 6, 7, 8. ✓
- Coupon verify/apply/remove + invalid error with remove button → Task 7 + 8 (`verifyCoupon`/`removeCoupon`) + Task 3 (`/plans/quote`). ✓
- Per-child coupon (applies to that child's plan/cycle) → quote + `computePricing` are per child. ✓
- Free-session gift + "no payment until first session" messaging → Task 8 banners (`giftBanner`, `paymentNotice`). ✓
- Add another child → Task 10 `addChild`. ✓
- Summary table → Task 9 `EnrollSummaryTable`. ✓
- Parent form → Task 9 `ParentDetailsForm`. ✓
- One submit creates parent + children + links + subscriptions + invoices + notify admin → Task 4 `enrollFamily`. ✓
- PENDING subscription + UNPAID invoice per child → Task 4 + Task 2. ✓
- Bilingual codes → Task 1; copy → Task 5. ✓
- At least one child / duplicate-email / plan-required edge cases → Task 4 (server) + Task 10 (client). ✓

**Placeholder scan:** No TBD/TODO; all steps contain real code or concrete commands. ✓

**Type/name consistency:**
- `generateForSubscription(subscription, {template, settings, plan, createdById, tx})` defined in Task 2, called identically in Task 4. ✓
- `quote()` returns `{currency, base, net, discount, couponValid, reason}` (Task 3), consumed as `data.couponValid`/`data.net`/`data.reason` in Task 8 + `quote.net`/`quote.currency` in Tasks 8/9. ✓
- Child state shape (`coupon:{code,status,reason,quote}`, `planId`, `billingPeriod`) consistent across Tasks 8, 9, 10. ✓
- `enrollFamily({parent, children})` payload matches `enrollSchema` (Task 4 step 1) and the client payload (Task 10 `submit`). ✓
- URL constants `ENROLL_URL`/`PLAN_QUOTE_URL`/`PLANS_PUBLIC_URL` defined in Task 5, used in Tasks 8 + 10. ✓

## Notes / assumptions
- API base path assumed `/api`; if `Server/src/server.js` mounts routes elsewhere, adjust the curl URLs in Tasks 3–4 (frontend uses `useRequest`, which already knows the base).
- Backend dev port assumed `4000`; substitute the printed port.
- `paymentTemplateUsecase.get(null)` auto-creates the default template, so an invoice is always produced (no "skip invoice" branch needed).
- Wizard uses plain controlled MUI inputs (not RHF) because of the dynamic per-child array + async coupon state; validation is a small inline helper. This is intentional and self-contained.
- Old `RegisterForm.jsx` is left unused (not deleted) to keep this change reversible; delete in a follow-up if desired.
