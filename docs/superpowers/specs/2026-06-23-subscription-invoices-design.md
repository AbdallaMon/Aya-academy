# Subscription Invoices + Payment Template Settings — Design

Date: 2026-06-23

## Goal

Every subscription gets one invoice. A global **Payment Template** (editable from a new
"Payment Template Settings" admin page) defines the fixed look + boilerplate of every invoice.
Each invoice inherits a copy of that template at generation time and stores its own per‑invoice
template that an admin can tweak. A **Regenerate** button per subscription re‑pulls the latest
global template and recomputes amounts. Hours/amount always come from the subscription (not
editable on the invoice). Payment is **not real** yet — `status` is set manually; a gateway can
be wired later.

Reference example: https://deploy-beta-dusky-55.vercel.app/ (company header, customer, billing
period, hours, hourly rate, free hours, previous credit/debt, subtotal, transfer fee, total,
color themes, customer notices, print).

## Data model (packages/db/prisma/schema.prisma)

`enum InvoiceStatus { UNPAID, PAID, VOID }` (mirrored in `@ayah/shared` enums).

**PaymentTemplate** — singleton global template (the "main template").
- `id Int @id @default(autoincrement())`
- `configJson Json` — the whole editable template (company, theme colors, fees, notes, footer,
  payment instructions, due-days). Follows the repo's JSON-config convention (Game.configJson,
  Certificate.themeJson).
- `updatedById Int?` + relation to User (`PaymentTemplateUpdatedBy`)
- `createdAt`, `updatedAt`
- Usecase treats it as a singleton: `findFirst()`; auto-creates a default row if none.

**Invoice** — 1:1 with Subscription.
- `id`, `subscriptionId Int @unique` + `subscription Subscription @relation(onDelete: Cascade)`
- `invoiceNumber String @unique` (e.g. `INV-000123`, derived from subscription id; stable across regenerate)
- `status InvoiceStatus @default(UNPAID)`
- Snapshot amounts (computed at generate/regenerate): `currency String`, `hours Decimal? @db.Decimal(8,2)`,
  `hourlyRate Decimal? @db.Decimal(10,2)`, `subtotal Decimal @db.Decimal(10,2)`,
  `transferFee Decimal @db.Decimal(10,2) @default(0)`, `total Decimal @db.Decimal(10,2)`
- Adjustable (admin-editable) figures: `freeHours Decimal @db.Decimal(8,2) @default(0)`,
  `previousCredit Decimal @db.Decimal(10,2) @default(0)`, `previousDebt Decimal @db.Decimal(10,2) @default(0)`
- `configJson Json` — per-invoice copy of the template (editable subset)
- `issueDate DateTime @default(now())`, `billingPeriodLabel String?`, `dueDate DateTime?`
- `notes String? @db.Text`, `createdById Int?` + relation
- `createdAt`, `updatedAt`
- Back-relation on Subscription: `invoice Invoice?`

### Amount computation (usecase)
- `hours = subscription.totalHours`
- `hourlyRate = plan.hourlyRate` (fallback: `priceCharged / hours` when no plan)
- `subtotal = subscription.priceCharged` (the already-discounted charged amount — "comes from the subscription")
- `transferFee = round(subtotal * fees.transferFeePercent/100 + fees.transferFeeFixed)`
- `total = subtotal + transferFee + previousDebt - previousCredit`
- `freeHours` is informational (shown on the invoice).

### Generate vs Regenerate vs Edit
- **Generate** (first time): create Invoice, snapshot amounts, copy `configJson` from the global template.
- **Regenerate**: keep `invoiceNumber`/`status`; re-copy `configJson` from the **current** global
  template, recompute amounts from the subscription + existing adjustable figures.
- **Edit**: PATCH only editable fields — per-invoice `configJson` overrides, `freeHours`,
  `previousCredit`, `previousDebt`, `notes`, `billingPeriodLabel`, `dueDate`, `status`. Never
  hours/hourlyRate/subtotal (those derive from the subscription).

## Shared (packages/shared)
- `permissions.js`: `INVOICE_PERMISSIONS { VIEW, LIST, GENERATE, EDIT }`,
  `PAYMENT_TEMPLATE_PERMISSIONS { VIEW, MANAGE }`. Register in `PERMISSIONS`. Admin auto-gets all.
  PARENT += INVOICE.VIEW, INVOICE.LIST (scoped to their children). STUDENT += INVOICE.VIEW (own).
- `messages-codes/invoice.js` + `paymentTemplate.js`; export via index.
- `messages-names.js`: `invoiceMessages`, `paymentTemplateMessages`.

## Backend (server/src/modules)
Two modules following route→controller→usecase→repo→dto→validation→messages.

**paymentTemplates** — `/payment-templates`
- `GET /` (VIEW) → singleton (auto-create default). `PUT /` (MANAGE) → update configJson.

**invoices** — `/invoices`
- `GET /` (LIST) admin paginated list.
- `GET /:id` (VIEW, scoped).
- `GET /subscription/:subscriptionId` (VIEW, scoped) → invoice for a subscription (or null).
- `POST /subscription/:subscriptionId/generate` (GENERATE) → generate or regenerate.
- `PATCH /:id` (EDIT) → edit editable fields.

Scope: reuse the subscription access pattern (admin all; parent → linked children; student → self)
via `subscriptionRepo.getById` + role check.

Register both routers in `server/src/routes.js`.

## Frontend (web/src)
- `features/invoices/` — `InvoiceDocument.jsx` (printable invoice, reads configJson + amounts,
  RTL/LTR, color theme like CertificateCard), `InvoiceDialog.jsx` (view + Regenerate + Edit + Print),
  `config/invoicesText.js`, `config/constant.js`, `components/InvoiceEditForm.jsx`.
- Subscriptions list page: add an **Invoice** row action → opens `InvoiceDialog`.
- `features/paymentTemplate/` — `pages/PaymentTemplateSettingsPage.jsx` (AppForm-driven settings +
  live `InvoiceDocument` preview with sample data), `config/paymentTemplateText.js`, `config/constant.js`.
- Route: `app/[lng]/dashboard/payment-template-settings/page.jsx`.
- Nav: add `paymentTemplate` admin item to `navModel.js` + icon + label in `dashboardText.js`.
- i18n: add `invoiceMessages` + `paymentTemplateMessages` to `web/src/i18n/locales/messagesCodes.js` (ar+en).

## Out of scope
Real payment processing / gateway integration, multi-currency conversion, invoice email delivery,
server-side PDF generation (print uses the browser, matching certificates).
