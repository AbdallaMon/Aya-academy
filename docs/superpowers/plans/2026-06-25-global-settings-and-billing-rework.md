# Global Settings & Billing Rework — Implementation Plan

> **For agentic workers:** phase-level plan. Each phase ends with a verifiable deliverable (lint/build/prisma validate + manual check). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Introduce a global app-settings singleton (hourly rate + single currency), reprice plans off the global hourly rate, unify currency everywhere, simplify the invoice (no free hours; logo auto; header bg+text colors; show coupon discount), and link a coupon to a subscription with a "generate invoice" action.

**Architecture:** Mirror the existing singleton `PaymentTemplate` module for a new `AppSetting` singleton. Pricing becomes a pure function of `plan.hours × settings.hourlyRate`. Currency is read once from settings and threaded through formatters. Invoice/plan/subscription UIs read settings via a small client hook/provider.

**Tech Stack:** Express + Prisma (MySQL) backend (layered route→controller→usecase→repo→validation→dto); Next.js App Router + MUI + react-hook-form frontend; `@aya/shared` for permission/message codes.

## Global Constraints
- Hourly rate default = **8**, currency default = **USD**.
- One currency for the whole system (no per-plan / per-subscription currency selection).
- Plan stores **hours only** (+ title/desc/active/featured/sortOrder). Price = `hours × settings.hourlyRate` (monthly); yearly = monthly × 12.
- No "free hours" anywhere.
- Backend message codes are language-neutral CODES with ar+en localization on the web.
- No TypeScript in app source. Prisma only in repos.

---

## Decisions (confirmed with user)
- Plan pricing: **hours only**, computed from global hourly rate.
- Currency: **single global currency**.
- Invoice: remove free hours; rely on **discount** (coupon) display; previous balance stays admin-entered.
- Coupon can be **linked to a subscription** at creation; invoice shows the discount.
- Subscription has a **Generate Invoice** button; generating before activation is allowed/preferred (already supported by the endpoint).

---

## Phase 1 — Global Settings foundation (KEYSTONE)

**Files:**
- Create: `packages/db/prisma/schema.prisma` → `model AppSetting` (singleton)
- Create: migration via `prisma migrate dev`
- Modify: `packages/shared/constants/permissions.js` (add `SETTINGS_PERMISSIONS`, register in `PERMISSIONS`)
- Create: `packages/shared/messages-codes/settings.js`; Modify: `messages-codes/index.js`, `messages-names.js`
- Create: `packages/shared/constants/settings.js` (DEFAULT_APP_SETTINGS, CURRENCY list reuse)
- Create: `Server/src/modules/settings/{settings.route,settings.controller,settings.usecase,settings.repo,settings.dto,settings.validation,settings.messages}.js`
- Modify: `Server/src/routes.js` (mount `/settings`)
- Create: `web/src/app/[lng]/dashboard/settings/page.jsx`
- Create: `web/src/features/settings/{pages/SettingsPage.jsx,config/settingsText.js,config/constant.js,hooks/useAppSettings.js}`
- Modify: `web/src/features/dashboard/config/navModel.js` (add Settings tab) + nav labels

**Model:**
```prisma
model AppSetting {
  id          Int      @id @default(autoincrement())
  hourlyRate  Decimal  @default(8) @db.Decimal(10, 2)
  currency    String   @default("USD")
  updatedById Int?
  updatedBy   User?    @relation("AppSettingUpdatedBy", fields: [updatedById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```
(+ back-relation on User: `appSettingUpdates AppSetting[] @relation("AppSettingUpdatedBy")`)

- [ ] Add model + User back-relation; `npx prisma migrate dev -n app_settings`
- [ ] shared: `SETTINGS_PERMISSIONS = { VIEW: "settings.view", MANAGE: "settings.manage" }`, register
- [ ] shared: settings message codes (`SETTINGS_UPDATED`) + names + DEFAULT_APP_SETTINGS
- [ ] backend module mirroring paymentTemplates singleton (get auto-creates default; put updates). Routes: `GET /` (VIEW), `PUT /` (MANAGE)
- [ ] mount in routes.js
- [ ] frontend: `useAppSettings` hook (GET /settings, cached), SettingsPage form (hourlyRate number + currency select), nav tab "الإعدادات/Settings"
- [ ] Verify: `prisma validate`, server boots, `GET/PUT /settings` work, tab renders

**Deliverable:** Admin can view/edit global hourly rate + currency.

---

## Phase 2 — Currency unification

**Files:** `web/src/features/invoices/config/constant.js` (`formatMoney`), `web/src/features/plans/config/constant.js` (`formatGBP`→`formatMoney`), any `Intl...GBP` hardcodes; backend invoice/subscription/plan usecases that snapshot currency.

- [ ] Replace hardcoded `GBP` formatters with a currency-param formatter; feed currency from `useAppSettings`
- [ ] Remove per-plan currency column/display
- [ ] Backend: invoice/subscription read currency from settings at generate time
- [ ] Verify: amounts render with the configured currency symbol (USD → `$`)

**Deliverable:** Changing the settings currency changes it everywhere; USD shows correctly.

---

## Phase 3 — Plan repricing

**Files:** `schema.prisma` (Plan), migration, `Server/src/shared/utility/pricing.js`, `Server/src/modules/plans/*`, `web/src/features/plans/*` (form, list, PlanPriceFields).

- [ ] Prisma: drop `hourlyRate`, `monthlyPrice`, `yearlyPrice`, `currency` from `Plan` (keep `hours`). Migrate.
- [ ] `pricing.js`: `effectiveMonthlyPrice(plan, settings) = hours × settings.hourlyRate`; yearly ×12. Thread settings into callers (coupon/subscription/invoice).
- [ ] plan validation/usecase/repo/dto: hours-only
- [ ] plan form: hours + meta only; live price preview from settings hourly rate
- [ ] Verify: plan list/cards show computed price; coupon discount applies to computed price

**Deliverable:** Plans store only hours; price derives from settings.

---

## Phase 4 — Invoice simplification

**Files:** `schema.prisma` (Invoice: drop `freeHours`), migration, `packages/shared/constants/paymentTemplate.js` (theme `headerTextColor`, drop `showFreeHours`), invoice usecase/validation/dto, `web/src/features/invoices/components/{InvoiceDocument,InvoiceEditForm}.jsx`, `web/src/features/paymentTemplate/pages/PaymentTemplateSettingsPage.jsx`, `invoicesText.js`, `paymentTemplateText.js`.

- [ ] Remove `freeHours` from model + computeAmounts + form + preview + `showFreeHours`
- [ ] Logo: remove upload control; render app logo (`/logos/logo.png` via public) automatically
- [ ] Theme: add `headerTextColor` (header band text); keep `headerColor` (bg), `accentColor`, `textColor`
- [ ] Invoice preview shows the **discount** (coupon) line from `configJson.discount`
- [ ] Verify: preview renders logo, header bg+text colors, discount; no free-hours anywhere

**Deliverable:** Simplified invoice with auto logo, header bg/text colors, discount line, no free hours.

---

## Phase 5 — Subscription ↔ coupon + Generate Invoice button

**Files:** `Server/src/modules/subscriptions/*` (already has `couponId`), subscription create validation/usecase, `web/src/features/subscriptions/*` (create form: coupon code field; row action: Generate Invoice), invoice generate wiring.

- [ ] Subscription create/edit: optional coupon code → validate → link `couponId`; snapshot discount onto invoice config at generate time
- [ ] Subscriptions list/detail: prominent **Generate Invoice** action (works before activation)
- [ ] Verify: create subscription with coupon → generate invoice → discount shows

**Deliverable:** Coupon linked at subscription creation, invoice generated (pre-activation) showing the discount.

---

## Verification per phase
- Backend: `npx prisma validate`, server boots, hit endpoints.
- Frontend: `npx eslint <changed files>`; manual render of the page.
- Never claim done without running the check.
