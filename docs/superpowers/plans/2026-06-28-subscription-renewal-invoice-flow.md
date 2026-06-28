# Subscription Renewal & Invoice Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make subscriptions renew-in-place (one visible subscription per student), show price+discount, add a dedicated subscription detail page, a "send invoice to parent" flow (in-app notification + Meta WhatsApp Cloud API, env-gated), and two-way invoice↔subscription paid/active linkage.

**Architecture:** New subscription actions (`renew`, `change-plan`, `activate`) and an invoice `send` action layer on the existing layered Express+Prisma backend (route → controller → usecase → repo). A new `infra/messaging/` module (facade + Meta WhatsApp provider, mirroring `infra/backup/providers/`) handles outbound. The frontend list collapses to latest-per-student and a new `subscriptionDetail` feature + App Router page hosts all actions.

**Tech Stack:** Express 5, Prisma (MySQL), Next.js App Router (`web/`), MUI 7, react-hook-form, `@aya/shared` constants/message-codes, `@aya/db`. No SDK for WhatsApp — native `fetch` to Graph API.

## Global Constraints

- **No TypeScript in app source** — `.js`/`.jsx` only.
- **Prisma only in repos** — no `prisma.*` in routes/controllers/usecases.
- **Language-neutral error CODES only** — throw `AppError` with a code from `@aya/shared` message-codes; never raw user strings. Every new code MUST have ar+en localization in `web` messagesCodes.
- **Enum-constant sync** — any Prisma enum value added must be mirrored in `packages/shared/constants/enums.js`.
- **Authorization = permission code + object scope + status** — every new endpoint requires a permission code AND a scope check (ADMIN all; PARENT only their child; STUDENT only self).
- **Audit important actions** — follow the module's existing audit pattern for renew/activate/send/mark-paid.
- **Best-effort side-channels** — notifications and WhatsApp sends are wrapped in try/catch and never fail the main request.
- **Verification** (no unit-test runner exists): each backend task ends with `npm run db:generate` (if schema touched) + `npm run dev:server` boot clean; each frontend task ends with `npm run build:web` (or `npm run -w web lint`) clean; final task does manual E2E + scope checks.
- **WhatsApp default OFF**: `WHATSAPP_ENABLED` defaults to `false`; code runs as no-op until enabled + configured.

---

## File Structure

**Backend (`server/src/`)**
- `config/env.js` — add `whatsapp` block + `isWhatsAppConfigured()` (modify)
- `infra/messaging/providers/whatsapp.js` — Meta Cloud API provider (create)
- `infra/messaging/messagingService.js` — facade `notifyInvoiceSent` (create)
- `modules/subscriptions/subscription.{route,controller,usecase,repo,validation}.js` — add renew/change-plan/activate + latest-per-student (modify)
- `modules/invoices/invoice.{route,controller,usecase,validation}.js` — add `send` + `sentAt` (modify)

**Shared (`packages/`)**
- `db/prisma/schema.prisma` — `Invoice.sentAt`, `NotificationType.INVOICE_SENT` (modify) + migration
- `shared/constants/enums.js` — `NOTIFICATION_TYPES.INVOICE_SENT` (modify)
- `shared/constants/permissions.js` — `SUBSCRIPTION.RENEW/ACTIVATE`, `INVOICE.SEND` + role profiles (modify)
- `shared/messages-codes/{invoice,subscription}.js` — new codes (modify)

**Frontend (`web/src/`)**
- `app/[lng]/dashboard/subscriptions/[id]/page.jsx` — detail route (create)
- `features/subscriptionDetail/` — `pages/`, `components/`, `config/` (create)
- `features/subscriptions/pages/SubscriptionsPage.jsx` — latest-per-student + price/discount (modify)
- `features/subscriptions/config/*` and messagesCodes — text + codes (modify)

---

## Task 1: Schema — `Invoice.sentAt` + `NotificationType.INVOICE_SENT`

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Modify: `packages/shared/constants/enums.js`

**Interfaces:**
- Produces: `Invoice.sentAt: DateTime?`; enum value `NotificationType.INVOICE_SENT`; constant `NOTIFICATION_TYPES.INVOICE_SENT = "INVOICE_SENT"`.

- [ ] **Step 1: Add field + enum value.** In `schema.prisma`, in `model Invoice` add `sentAt DateTime?` (near `issueDate`). In `enum NotificationType` add `INVOICE_SENT`.

- [ ] **Step 2: Sync constant.** In `enums.js` `NOTIFICATION_TYPES`, add `INVOICE_SENT: "INVOICE_SENT",`.

- [ ] **Step 3: Generate + migrate.**
Run: `npm run db:generate` then `npm run db:migrate -- --name invoice_sentat_and_invoice_sent_notification`
Expected: migration created, client regenerated, no errors.

- [ ] **Step 4: Commit.**
```bash
git add packages/db/prisma packages/shared/constants/enums.js
git commit -m "feat(db): add Invoice.sentAt and INVOICE_SENT notification type"
```

---

## Task 2: Permissions — RENEW / ACTIVATE / INVOICE.SEND + role profiles

**Files:**
- Modify: `packages/shared/constants/permissions.js`

**Interfaces:**
- Produces: `SUBSCRIPTION_PERMISSIONS.RENEW="subscription.renew"`, `SUBSCRIPTION_PERMISSIONS.ACTIVATE="subscription.activate"`, `INVOICE_PERMISSIONS.SEND="invoice.send"`. ADMIN gets all (via `getAllPermissions()`); PARENT keeps `SUBSCRIPTION.REQUEST` (used by parent renew). PARENT/STUDENT do NOT get ACTIVATE / INVOICE.SEND.

- [ ] **Step 1: Add codes.** Add `RENEW` and `ACTIVATE` to `SUBSCRIPTION_PERMISSIONS`; add `SEND: "invoice.send"` to `INVOICE_PERMISSIONS`.

- [ ] **Step 2: Verify role profiles.** Confirm ADMIN aggregates all permissions automatically. Confirm PARENT profile still lists `SUBSCRIPTION.REQUEST` and does NOT include `ACTIVATE`/`INVOICE.SEND`. Adjust the parent/student profile arrays only if they enumerate codes explicitly.

- [ ] **Step 3: Boot check.**
Run: `npm run dev:server`
Expected: server boots; no "unknown permission" errors.

- [ ] **Step 4: Commit.**
```bash
git add packages/shared/constants/permissions.js
git commit -m "feat(perms): add subscription.renew/activate and invoice.send"
```

---

## Task 3: Message codes (ar+en) — invoice + subscription

**Files:**
- Modify: `packages/shared/messages-codes/invoice.js`
- Modify: `packages/shared/messages-codes/subscription.js`
- Modify: `web` messagesCodes (the file that maps codes → ar/en text; locate via `grep -r "INVOICE_GENERATED" web/src`)

**Interfaces:**
- Produces codes: invoice → `INVOICE_SENT`, `INVOICE_SEND_FAILED`, `CANNOT_SEND_INVOICE`, `WHATSAPP_NOT_CONFIGURED`. subscription → `SUBSCRIPTION_STILL_ACTIVE`, `SUBSCRIPTION_RENEWED`, `PLAN_CHANGED`, `SUBSCRIPTION_ACTIVATED`, `CANNOT_CHANGE_PLAN_PAID`.

- [ ] **Step 1: Add shared codes.** Add the keys above to the two `messages-codes` files (value === key, following existing entries like `INVOICE_GENERATED: "INVOICE_GENERATED"`).

- [ ] **Step 2: Add ar+en text.** In the web messagesCodes file, add ar AND en strings for every new code (mirror existing entries). Example: `SUBSCRIPTION_STILL_ACTIVE` → ar "يوجد اشتراك فعّال لم ينتهِ بعد" / en "There is still an active subscription".

- [ ] **Step 3: Verify mapping.**
Run: `grep -rE "INVOICE_SENT|SUBSCRIPTION_STILL_ACTIVE" web/src packages/shared`
Expected: each code present in shared codes AND in web ar + en.

- [ ] **Step 4: Commit.**
```bash
git add packages/shared/messages-codes web/src
git commit -m "feat(i18n): add subscription renewal + invoice send message codes (ar/en)"
```

---

## Task 4: env — WhatsApp config block

**Files:**
- Modify: `server/src/config/env.js`
- Modify: `server/.env.example` (if present; else document in README)

**Interfaces:**
- Produces: `ENV.whatsapp = { enabled, token, phoneId, templateName, apiVersion, apiUrl }`; exported `isWhatsAppConfigured()`.

- [ ] **Step 1: Add block** (mirror the `backup`/`aws` style):
```js
whatsapp: {
  enabled: process.env.WHATSAPP_ENABLED === "true",
  token: process.env.WHATSAPP_TOKEN,
  phoneId: process.env.WHATSAPP_PHONE_ID,
  templateName: process.env.WHATSAPP_TEMPLATE_INVOICE || "invoice_sent",
  apiVersion: process.env.WHATSAPP_API_VERSION || "v21.0",
  apiUrl: process.env.WHATSAPP_API_URL,
},
```

- [ ] **Step 2: Add helper** (next to `isAwsConfigured`):
```js
export function isWhatsAppConfigured() {
  return Boolean(ENV.whatsapp.token && ENV.whatsapp.phoneId);
}
```

- [ ] **Step 3: Document env vars** in `.env.example`: `WHATSAPP_ENABLED=false`, `WHATSAPP_TOKEN=`, `WHATSAPP_PHONE_ID=`, `WHATSAPP_TEMPLATE_INVOICE=invoice_sent`.

- [ ] **Step 4: Boot check.** Run `npm run dev:server`; expected clean boot with `WHATSAPP_ENABLED` unset (no throw — all optional).

- [ ] **Step 5: Commit.**
```bash
git add server/src/config/env.js server/.env.example
git commit -m "feat(config): add WhatsApp (Meta Cloud API) env config, default disabled"
```

---

## Task 5: WhatsApp provider (Meta Cloud API)

**Files:**
- Create: `server/src/infra/messaging/providers/whatsapp.js`

**Interfaces:**
- Consumes: `ENV.whatsapp`, `isWhatsAppConfigured`, `AppError`, `invoiceMessagesCodes.WHATSAPP_NOT_CONFIGURED`.
- Produces: singleton `whatsappProvider` with `async sendTemplate(toPhone, { templateName, languageCode, components })` and `async sendText(toPhone, text)`. `normalizePhone(raw)` → E.164 digits (strip `+`, spaces, leading `00`).

- [ ] **Step 1: Implement provider.**
```js
import { ENV, isWhatsAppConfigured } from "../../../config/env.js";
import { AppError } from "../../../shared/errors/AppError.js"; // confirm exact path
import { invoiceMessagesCodes } from "@aya/shared";

function baseUrl() {
  const { apiUrl, apiVersion, phoneId } = ENV.whatsapp;
  return apiUrl || `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;
}

class WhatsAppProvider {
  normalizePhone(raw) {
    if (!raw) return null;
    let p = String(raw).trim().replace(/[\s-()]/g, "");
    if (p.startsWith("+")) p = p.slice(1);
    if (p.startsWith("00")) p = p.slice(2);
    return /^\d{8,15}$/.test(p) ? p : null;
  }

  async _post(body) {
    if (!isWhatsAppConfigured()) {
      throw new AppError(401, invoiceMessagesCodes.WHATSAPP_NOT_CONFIGURED);
    }
    const res = await fetch(baseUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.whatsapp.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new AppError(502, invoiceMessagesCodes.INVOICE_SEND_FAILED, { detail });
    }
    return res.json();
  }

  async sendTemplate(toPhone, { templateName, languageCode = "ar", components = [] }) {
    const to = this.normalizePhone(toPhone);
    if (!to) return null;
    return this._post({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name: templateName, language: { code: languageCode }, components },
    });
  }

  async sendText(toPhone, text) {
    const to = this.normalizePhone(toPhone);
    if (!to) return null;
    return this._post({ messaging_product: "whatsapp", to, type: "text", text: { body: text } });
  }
}

export const whatsappProvider = new WhatsAppProvider();
```
> Confirm the exact `AppError` import path and constructor signature by checking an existing provider (e.g. `infra/backup/providers/s3.js`) before finalizing.

- [ ] **Step 2: Boot check.** Run `npm run dev:server`; expected clean (module imported lazily later, but syntax must be valid). Optionally `node --check server/src/infra/messaging/providers/whatsapp.js`.

- [ ] **Step 3: Commit.**
```bash
git add server/src/infra/messaging/providers/whatsapp.js
git commit -m "feat(messaging): Meta WhatsApp Cloud API provider"
```

---

## Task 6: messagingService facade — `notifyInvoiceSent`

**Files:**
- Create: `server/src/infra/messaging/messagingService.js`

**Interfaces:**
- Consumes: `notificationUsecase.createNotification` (signature: `({ userId, type, titleAr, titleEn, bodyAr, bodyEn, dataJson, link }, tx?)`), `whatsappProvider`, `ENV.whatsapp.enabled`, `isWhatsAppConfigured`, `NOTIFICATION_TYPES.INVOICE_SENT`.
- Produces: `async notifyInvoiceSent({ parents, student, invoice, subscriptionId, link })` → always creates one in-app notification per parent; if `ENV.whatsapp.enabled && isWhatsAppConfigured()` also sends WhatsApp template per parent phone (best-effort). `parents`: array of `{ id, name, phone }`.

- [ ] **Step 1: Implement facade.**
```js
import { ENV, isWhatsAppConfigured } from "../../config/env.js";
import { NOTIFICATION_TYPES } from "@aya/shared";
import { notificationUsecase } from "../../modules/notifications/notification.usecase.js";
import { whatsappProvider } from "./providers/whatsapp.js";

export const messagingService = {
  async notifyInvoiceSent({ parents = [], student, invoice, subscriptionId, link }) {
    const title = { ar: "تم إرسال فاتورة اشتراك", en: "A subscription invoice was sent" };
    const body = {
      ar: `فاتورة اشتراك ${student?.name ?? ""} بإجمالي ${invoice.total} ${invoice.currency}`,
      en: `Invoice for ${student?.name ?? ""}, total ${invoice.total} ${invoice.currency}`,
    };
    for (const parent of parents) {
      try {
        await notificationUsecase.createNotification({
          userId: parent.id,
          type: NOTIFICATION_TYPES.INVOICE_SENT,
          titleAr: title.ar, titleEn: title.en,
          bodyAr: body.ar, bodyEn: body.en,
          dataJson: { invoiceId: invoice.id, subscriptionId },
          link,
        });
      } catch { /* best-effort */ }
    }
    if (ENV.whatsapp.enabled && isWhatsAppConfigured()) {
      for (const parent of parents) {
        try {
          await whatsappProvider.sendTemplate(parent.phone, {
            templateName: ENV.whatsapp.templateName,
            languageCode: "ar",
            components: [{
              type: "body",
              parameters: [
                { type: "text", text: student?.name ?? "" },
                { type: "text", text: `${invoice.total} ${invoice.currency}` },
              ],
            }],
          });
        } catch { /* best-effort: logged, never fails request */ }
      }
    }
  },
};
```
> Confirm `notificationUsecase` is exported as a singleton object with `createNotification` (per exploration it is). Confirm `@aya/shared` re-exports `NOTIFICATION_TYPES`.

- [ ] **Step 2: Boot check.** `npm run dev:server` clean.

- [ ] **Step 3: Commit.**
```bash
git add server/src/infra/messaging/messagingService.js
git commit -m "feat(messaging): notifyInvoiceSent facade (in-app always, WhatsApp when enabled)"
```

---

## Task 7: Repo — latest-subscription-per-student + usecase list

**Files:**
- Modify: `server/src/modules/subscriptions/subscription.repo.js`
- Modify: `server/src/modules/subscriptions/subscription.usecase.js`

**Interfaces:**
- Produces: `subscriptionRepo.listLatestPerStudent({ where, skip, take })` → `{ rows, total }`, where each row is the max-`id` subscription per student matching `where` (status filter applied to that latest row), using existing `subscriptionSelect`. `subscriptionUsecase.list` calls it instead of `listSubscriptions`.

- [ ] **Step 1: Implement repo query.**
```js
async listLatestPerStudent({ where = {}, skip = 0, take = 20 }) {
  // newest subscription id per student (autoincrement => latest renewal)
  const groups = await prisma.subscription.groupBy({
    by: ["studentId"],
    where, // scope filter (e.g. studentId in parent's children)
    _max: { id: true },
  });
  let ids = groups.map((g) => g._max.id).filter(Boolean);
  // apply status filter on the latest row only
  let latestWhere = { id: { in: ids } };
  if (where.status) latestWhere.status = where.status;
  const total = await prisma.subscription.count({ where: latestWhere });
  const rows = await prisma.subscription.findMany({
    where: latestWhere,
    select: subscriptionSelect,
    orderBy: { createdAt: "desc" },
    skip, take,
  });
  return { rows, total };
}
```
> Note: pass scope filters (studentId-in-children, single studentId) inside `where`; pass `status` inside `where.status`. The query splits them: scope narrows the groupBy, status narrows the latest set.

- [ ] **Step 2: Wire usecase.** In `subscriptionUsecase.list`, build the scope `where` exactly as today (ADMIN none, PARENT children ids, STUDENT self), then call `listLatestPerStudent` and return the existing paginated shape via `toSubscription`.

- [ ] **Step 3: Manual check.**
Run server; `GET /subscriptions` as admin after creating 2 subscriptions for the same student.
Expected: only the newest appears (one row for that student).

- [ ] **Step 4: Commit.**
```bash
git add server/src/modules/subscriptions/subscription.repo.js server/src/modules/subscriptions/subscription.usecase.js
git commit -m "feat(subscriptions): list shows latest subscription per student only"
```

---

## Task 8: Backend — Renew action

**Files:**
- Modify: `subscription.validation.js`, `subscription.usecase.js`, `subscription.controller.js`, `subscription.route.js`

**Interfaces:**
- Consumes: `computePricing`, `computeEndDate`, `resolveStatus`, `ensureInvoice`, coupon increment, scope helpers, `subscriptionMessagesCodes.SUBSCRIPTION_STILL_ACTIVE`, `NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED`.
- Produces: `POST /subscriptions/:id/renew` body `{ planId?, billingPeriod?, couponCode?, startDate?, allowWhileActive? }`; `subscriptionUsecase.renew(authUser, id, input)` returns the NEW subscription (via `toSubscription`). Status of new row = `PENDING`.

- [ ] **Step 1: Validation schema** `renewSubscriptionSchema`: all optional — `planId` int, `billingPeriod` enum, `couponCode` string, `startDate` coerce date, `allowWhileActive` boolean.

- [ ] **Step 2: Usecase `renew`.**
  1. Load source subscription by `id`; scope-check (ADMIN, or PARENT owns the student, else `forbidden`).
  2. Resolve `studentId`, default `planId`/`billingPeriod` from source, override from input.
  3. Check active: query student's current subscription; if an `ACTIVE` row is within `[startDate,endDate]` now and `!input.allowWhileActive` → `throw new AppError(409, SUBSCRIPTION_STILL_ACTIVE)`.
  4. Inside a transaction: `computePricing` (validate coupon, get `priceCharged`/`couponId`), `computeEndDate`, compute hours; create subscription with `status: "PENDING"`, `createdById: authUser.id`; if coupon used, increment redemption atomically.
  5. After tx: `ensureInvoice(newSubscription, { plan })` (best-effort).
  6. Notify: if `authUser.role === PARENT` → notify admins (`createManyForUsers`); else notify student. Type `SUBSCRIPTION_RENEWED`.
  7. Return `toSubscription(newSubscription)`.

- [ ] **Step 3: Controller + route.** Add `renew` controller calling `subscriptionUsecase.renew(req.authUser, Number(req.params.id), req.body)`; respond with code `SUBSCRIPTION_RENEWED` and the new subscription. Route: `router.post("/:id/renew", requirePermissions([... see below]), controller.renew)`. Permission: allow if user has `SUBSCRIPTION.RENEW` OR `SUBSCRIPTION.REQUEST` (parent) — follow existing multi-permission guard style (e.g. `requireAnyPermission`), or gate inside usecase by role.

- [ ] **Step 4: Manual check.** As admin, `POST /subscriptions/:id/renew {}` on an EXPIRED sub → 200, new PENDING sub + UNPAID invoice. On an ACTIVE sub without `allowWhileActive` → 409 `SUBSCRIPTION_STILL_ACTIVE`; with `allowWhileActive:true` → 200.

- [ ] **Step 5: Commit.**
```bash
git add server/src/modules/subscriptions
git commit -m "feat(subscriptions): renew action (new PENDING sub + invoice, active-guard)"
```

---

## Task 9: Backend — Change plan action

**Files:**
- Modify: `subscription.validation.js`, `subscription.usecase.js`, `subscription.controller.js`, `subscription.route.js`

**Interfaces:**
- Consumes: invoice repo (`getBySubscriptionId`), `invoiceUsecase.generate` (regenerate), `computePricing`, `computeEndDate`, `subscriptionMessagesCodes.{PLAN_CHANGED,CANNOT_CHANGE_PLAN_PAID}`.
- Produces: `POST /subscriptions/:id/change-plan` body `{ planId, billingPeriod?, couponCode? }`; `subscriptionUsecase.changePlan(authUser, id, input)` returns updated subscription. Allowed only while linked invoice is `UNPAID` (or no invoice yet).

- [ ] **Step 1: Validation** `changePlanSchema`: `planId` int required; `billingPeriod` enum optional; `couponCode` string optional.

- [ ] **Step 2: Usecase `changePlan`.** Load sub + scope-check. Load invoice; if invoice exists and `status !== "UNPAID"` → `throw AppError(409, CANNOT_CHANGE_PLAN_PAID)`. Recompute `priceCharged/totalHours/remainingHours/endDate/couponId` via `computePricing`/`computeEndDate`. `updateSubscription(id, {...})`. Then regenerate invoice (`invoiceUsecase.generate(authUser, id)` — admin path) so amounts match. Return updated sub. Notify student (`PLAN_CHANGED`) best-effort.

- [ ] **Step 3: Controller + route.** `router.post("/:id/change-plan", requirePermissions([SUBSCRIPTION.EDIT]), controller.changePlan)`. Respond with `PLAN_CHANGED`.

- [ ] **Step 4: Manual check.** On a PENDING sub with UNPAID invoice: change plan → 200, sub price/hours updated, invoice regenerated. On a sub whose invoice is PAID → 409 `CANNOT_CHANGE_PLAN_PAID`.

- [ ] **Step 5: Commit.**
```bash
git add server/src/modules/subscriptions
git commit -m "feat(subscriptions): change-plan action (UNPAID-only, regenerates invoice)"
```

---

## Task 10: Backend — Activate action (two-way → mark invoice paid)

**Files:**
- Modify: `subscription.validation.js`, `subscription.usecase.js`, `subscription.controller.js`, `subscription.route.js`

**Interfaces:**
- Consumes: `resolveStatus`, invoice repo/usecase to set `PAID`, `NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED`, `subscriptionMessagesCodes.SUBSCRIPTION_ACTIVATED`.
- Produces: `POST /subscriptions/:id/activate` body `{ markInvoicePaid? }`; `subscriptionUsecase.activate(authUser, id, input)` → PENDING/UPCOMING → ACTIVE (resolved by dates); if `markInvoicePaid` → set linked invoice `PAID`. Returns updated subscription. Mirrors existing `invoiceUsecase.update(..., { activateSubscription })` for the reverse direction (no change needed there).

- [ ] **Step 1: Validation** `activateSubscriptionSchema`: `markInvoicePaid` boolean optional.

- [ ] **Step 2: Usecase `activate`.** Load sub + scope-check (ADMIN only via permission). If status not in `PENDING/UPCOMING` → error (reuse a suitable existing code or `SUBSCRIPTION_ACTIVATED` guard). Set status via `resolveStatus(startDate,endDate,now)` (→ ACTIVE/UPCOMING). If `markInvoicePaid`: load invoice, if `UNPAID` set `PAID` (use the same status-transition guard as `invoiceUsecase.update`). Notify student. Return updated sub.

- [ ] **Step 3: Controller + route.** `router.post("/:id/activate", requirePermissions([SUBSCRIPTION.ACTIVATE]), controller.activate)`. Respond `SUBSCRIPTION_ACTIVATED`.

- [ ] **Step 4: Manual check.** PENDING sub → activate `{markInvoicePaid:true}` → sub ACTIVE + invoice PAID. Reverse: `PATCH /invoices/:id {status:"PAID", activateSubscription:true}` still activates (existing).

- [ ] **Step 5: Commit.**
```bash
git add server/src/modules/subscriptions
git commit -m "feat(subscriptions): activate action with optional mark-invoice-paid"
```

---

## Task 11: Backend — Invoice `send` to parent

**Files:**
- Modify: `invoice.usecase.js`, `invoice.controller.js`, `invoice.route.js`, `invoice.repo.js` (if `update` doesn't already allow `sentAt`)

**Interfaces:**
- Consumes: `messagingService.notifyInvoiceSent`, invoice DTO (`subscription.student` + flattened `parents` with phone), `invoiceMessagesCodes.{INVOICE_SENT,CANNOT_SEND_INVOICE}`.
- Produces: `POST /invoices/:id/send`; `invoiceUsecase.send(authUser, id)` → ADMIN-only; builds `parents` from invoice's student links; calls `messagingService.notifyInvoiceSent`; sets `invoice.sentAt = now`; returns invoice. Link = `/dashboard/subscriptions/${subscriptionId}`.

- [ ] **Step 1: Usecase `send`.**
  1. ADMIN check else `throw AppError(403, CANNOT_SEND_INVOICE)`.
  2. `getById` (with subscription→student→parents projection); throw `INVOICE_NOT_FOUND` if missing.
  3. Build `parents = student.parents.map(p => ({ id: p.id, name: p.name, phone: p.phone }))`.
  4. `await messagingService.notifyInvoiceSent({ parents, student, invoice, subscriptionId: invoice.subscriptionId, link })`.
  5. `invoiceRepo.update(id, { sentAt: new Date() })`; return `toInvoice`.

- [ ] **Step 2: Ensure DTO exposes parent `phone`.** Confirm `invoiceSelect` student projection includes `phone` on parents (exploration shows parents include phone) — if not, add it.

- [ ] **Step 3: Controller + route.** `router.post("/:id/send", requirePermissions([INVOICE.SEND]), controller.send)`. Respond `INVOICE_SENT`.

- [ ] **Step 4: Manual check.** `POST /invoices/:id/send` as admin → 200; the student's parent gets an in-app notification (`GET /notifications`); `invoice.sentAt` set. With `WHATSAPP_ENABLED=false` no WhatsApp attempted.

- [ ] **Step 5: Commit.**
```bash
git add server/src/modules/invoices
git commit -m "feat(invoices): send-to-parent action (in-app + WhatsApp when enabled, sets sentAt)"
```

---

## Task 12: Frontend — Subscriptions list = latest-per-student + price/discount

**Files:**
- Modify: `web/src/features/subscriptions/pages/SubscriptionsPage.jsx`
- Modify: `web/src/features/subscriptions/config/subscriptionsText.js`

**Interfaces:**
- Consumes: existing `useRequest` list (now returns latest-per-student from backend), `INVOICE_STATUS_COLOR`, subscription row with `priceCharged`, `coupon`, `plan`.
- Produces: a price/discount cell (base struck-through + net when a coupon exists), a row click / "عرض" action navigating to `/dashboard/subscriptions/${row.id}`, and a quick "تجديد" action.

- [ ] **Step 1: Price/discount cell.** Render: if `row.coupon` → show base (from plan pricing or `priceCharged`+discount) struck-through + net `priceCharged`; else just `priceCharged`. Add text keys `priceLabel`, `discountLabel`.

- [ ] **Step 2: Navigation + renew.** Add a column/action button "عرض" → `router.push(\`/dashboard/subscriptions/${row.id}\`)` (use the `[lng]` locale prefix consistent with existing nav). Add quick "تجديد" calling `POST /subscriptions/:id/renew` then navigating to the returned new sub's detail page.

- [ ] **Step 3: Build check.** `npm run build:web` (or `npm run -w web lint`) clean.

- [ ] **Step 4: Commit.**
```bash
git add web/src/features/subscriptions
git commit -m "feat(web): subscriptions list shows price+discount, links to detail, quick renew"
```

---

## Task 13: Frontend — Subscription detail route + feature scaffold

**Files:**
- Create: `web/src/app/[lng]/dashboard/subscriptions/[id]/page.jsx`
- Create: `web/src/features/subscriptionDetail/pages/SubscriptionDetailPage.jsx`
- Create: `web/src/features/subscriptionDetail/config/constant.js`
- Create: `web/src/features/subscriptionDetail/config/subscriptionDetailText.js`

**Interfaces:**
- Consumes: `useRequest` (`GET /subscriptions/:id`), `usePermission`, `PERMISSIONS`, `useTranslation`.
- Produces: page component `SubscriptionDetailPage({ subscriptionId })` that fetches the subscription and renders header + status + (placeholder for) cards/actions. Route file mirrors `users/[id]/page.jsx` (async `params`).

- [ ] **Step 1: Route file** (mirror `users/[id]/page.jsx`):
```jsx
import { Suspense } from "react";
import SubscriptionDetailPage from "@/features/subscriptionDetail/pages/SubscriptionDetailPage.jsx";
export default async function Page({ params }) {
  const { id } = await params;
  return (<Suspense><SubscriptionDetailPage subscriptionId={id} /></Suspense>);
}
```

- [ ] **Step 2: Page shell.** `"use client"`; `if (!hasPermission(PERMISSIONS.SUBSCRIPTION.VIEW)) return null;`. Fetch subscription via `useRequest`. Render header (student name + status chip). Add `config/constant.js` (URLs, status colors mirroring subscriptions constant) and text file (ar/en).

- [ ] **Step 3: Build check.** Navigate to `/dashboard/subscriptions/<id>` → header + status render. `npm run build:web` clean.

- [ ] **Step 4: Commit.**
```bash
git add web/src/app web/src/features/subscriptionDetail
git commit -m "feat(web): subscription detail page route + scaffold"
```

---

## Task 14: Frontend — Detail cards (subscription + invoice + price/discount)

**Files:**
- Modify: `SubscriptionDetailPage.jsx`
- Create: `web/src/features/subscriptionDetail/components/SubscriptionCard.jsx`
- Create: `web/src/features/subscriptionDetail/components/InvoiceCard.jsx`

**Interfaces:**
- Consumes: subscription (plan, billingPeriod, dates, hours, priceCharged, coupon, invoice), reuse `InvoiceDialog`/`InvoiceDocument` from `features/invoices`.
- Produces: `SubscriptionCard` (plan, period, dates, hours, price+discount breakdown) and `InvoiceCard` (invoice status chip, total, "تم الإرسال" when `sentAt`, open/download invoice via reused `InvoiceDialog`).

- [ ] **Step 1: SubscriptionCard** with full price/discount breakdown (base, discount amount, net) using the existing coupon/discount snapshot.
- [ ] **Step 2: InvoiceCard** reusing `InvoiceDialog` (pass `subscriptionId`, `canGenerate`, `canEdit`). Show `sentAt` state.
- [ ] **Step 3: Build check** clean.
- [ ] **Step 4: Commit.**
```bash
git add web/src/features/subscriptionDetail
git commit -m "feat(web): subscription detail cards (subscription + invoice + discount)"
```

---

## Task 15: Frontend — Renew / Change-plan / Coupon dialogs on detail page

**Files:**
- Create: `web/src/features/subscriptionDetail/components/RenewDialog.jsx`
- Create: `web/src/features/subscriptionDetail/components/ChangePlanDialog.jsx`
- Modify: `SubscriptionDetailPage.jsx`

**Interfaces:**
- Consumes: `CouponControl`, `couponPricing` (`initialCoupon`/`resolveCoupon`), public plans (`/plans/public`), `POST /subscriptions/:id/renew`, `POST /subscriptions/:id/change-plan`.
- Produces: RenewDialog (defaults to source plan, editable plan + billingPeriod + coupon; on `SUBSCRIPTION_STILL_ACTIVE` shows confirm → retries with `allowWhileActive:true`; on success navigates to new sub detail). ChangePlanDialog (plan + coupon; hidden/disabled when invoice is PAID). Coupon entry available to BOTH admin and parent (gate destructive actions by permission, not coupon).

- [ ] **Step 1: RenewDialog** — reuse `SubscriptionCreateDialog` field patterns; prefill from current sub; handle 409 active-warning confirm.
- [ ] **Step 2: ChangePlanDialog** — plan + coupon; submit to change-plan; disabled when `invoice.status==="PAID"`.
- [ ] **Step 3: Wire buttons** on detail page, permission-gated (`SUBSCRIPTION.RENEW`/`REQUEST` for renew; `SUBSCRIPTION.EDIT` for change-plan).
- [ ] **Step 4: Build check** clean.
- [ ] **Step 5: Commit.**
```bash
git add web/src/features/subscriptionDetail
git commit -m "feat(web): renew + change-plan + coupon dialogs on subscription detail"
```

---

## Task 16: Frontend — Send-to-parent + two-way activate/mark-paid

**Files:**
- Modify: `SubscriptionDetailPage.jsx`, `InvoiceCard.jsx`
- Reuse/extend: `features/invoices/components/InvoiceDialog.jsx` (mark-paid already supports `activateSubscription`)

**Interfaces:**
- Consumes: `POST /invoices/:id/send`, `POST /subscriptions/:id/activate` (`{markInvoicePaid}`), `PATCH /invoices/:id` (`{status:"PAID", activateSubscription}`).
- Produces: "إرسال لولي الأمر" button (→ becomes "تم الإرسال ✓" after, allows re-send); "تفعيل الاشتراك" button (if not active) with checkbox "اعتمد الفاتورة كمدفوعة كمان؟" → `activate {markInvoicePaid}`; "اعتماد الفاتورة كمدفوعة" button (if UNPAID) with checkbox "فعّل الاشتراك كمان؟" → invoice PATCH `{status:PAID, activateSubscription}`.

- [ ] **Step 1: Send button** → `POST /invoices/:id/send`; toast `INVOICE_SENT`; refetch shows `sentAt`.
- [ ] **Step 2: Activate button** (sub not active) with complementary checkbox.
- [ ] **Step 3: Mark-paid button** (invoice UNPAID) with complementary checkbox.
- [ ] **Step 4: Permission-gate** all three to ADMIN (`INVOICE.SEND`, `SUBSCRIPTION.ACTIVATE`, `INVOICE.EDIT`); hide for parent.
- [ ] **Step 5: Build check** clean.
- [ ] **Step 6: Commit.**
```bash
git add web/src/features
git commit -m "feat(web): send-to-parent + two-way activate/mark-paid on subscription detail"
```

---

## Task 17: Frontend — Parent scoping (latest per child, renew + coupon only)

**Files:**
- Modify: `SubscriptionsPage.jsx`, `SubscriptionDetailPage.jsx`

**Interfaces:**
- Consumes: `usePermission`, role.
- Produces: parent sees latest subscription per child (backend already scopes); on detail page parent sees Renew + Coupon only — Activate / Mark-paid / Send hidden (no permission).

- [ ] **Step 1: Verify gating.** Confirm all admin-only buttons are wrapped in `hasPermission(...)` so they vanish for parent; confirm Renew is available to parent (maps to `SUBSCRIPTION.REQUEST`).
- [ ] **Step 2: Manual check** as a parent account: one row per child, detail shows only renew + coupon, renew creates PENDING and notifies admins.
- [ ] **Step 3: Commit.**
```bash
git add web/src/features
git commit -m "feat(web): parent-scoped subscription detail (renew + coupon only)"
```

---

## Task 18: End-to-end verification + scope/IDOR pass

**Files:** none (verification only)

- [ ] **Step 1: Migrate + build.** `npm run db:migrate:deploy` (or dev), `npm run build:web`, `npm run dev:server` — all clean.
- [ ] **Step 2: Full E2E (admin).** Renew expired sub → new PENDING + UNPAID invoice → detail page → edit invoice → send to parent (in-app notification appears) → mark invoice paid + activate (or activate + mark paid) → student notified. Change-plan on UNPAID works; blocked when PAID.
- [ ] **Step 3: E2E (parent).** Login as parent of a student: one row per child, renew creates PENDING + notifies admins, coupon applies, admin-only buttons absent.
- [ ] **Step 4: IDOR checks.** Parent A cannot renew/activate/send for Parent B's child (expect 403). Student cannot hit activate/send (403). Verify `GET /subscriptions/:id` scope.
- [ ] **Step 5: WhatsApp gate.** With `WHATSAPP_ENABLED=false`, send-to-parent does in-app only. Set `WHATSAPP_ENABLED=true` with dummy creds → send attempts Graph API and fails gracefully (request still 200, error logged).
- [ ] **Step 6: Commit any fixes.**
```bash
git add -A && git commit -m "test: e2e + scope verification for subscription renewal & invoice flow"
```

---

## Self-Review Notes

- **Spec coverage:** §3 schema → T1; permissions → T2; codes → T3; env+whatsapp → T4–T6; latest-per-student → T7; renew → T8; change-plan → T9; two-way → T10; send → T11; list price/discount → T12; detail page → T13–T16; parent scope → T17; verify → T18. All spec sections mapped.
- **WhatsApp now-not-later:** fully implemented in T5/T6, env-gated (T4); confirmed against user's correction.
- **Type consistency:** `notifyInvoiceSent({ parents, student, invoice, subscriptionId, link })`, `whatsappProvider.sendTemplate(phone, {templateName, languageCode, components})`, `listLatestPerStudent({where,skip,take})→{rows,total}`, `renew(authUser,id,input)→sub`, `activate(authUser,id,{markInvoicePaid})`, `send(authUser,id)` used consistently across tasks.
- **No unit-test runner:** intentional — repo has none; verification is build/boot/manual+IDOR (Global Constraints). Not a placeholder.
- **Confirm-before-final:** exact `AppError` import path/signature and `notificationUsecase` export shape must be confirmed from real files in T5/T6 (noted inline).
