#!/usr/bin/env node
// ===========================================================================
// Manual usage-billing runner — forces the end-of-month "promotion" on demand.
//
// This is the SAME logic the end-of-month cron runs (subscriptionScheduler →
// subscriptionUsecase.generateMonthlyUsageInvoices). The ONLY difference is that
// the cron first checks `isLastDayOfMonth(now)`; this script skips that guard and
// runs it immediately. It adds NO new logic of its own — it is a thin driver that
// calls the existing usecase method, which in turn goes through the proper
// subscription repo/usecase methods (findOpenUsageSubscription, createSubscription,
// resolveUsageHours, ensureInvoice, ...).
//
// What it does per active student (see generateMonthlyUsageInvoices):
//   • finds/creates the next-month USAGE subscription,
//   • freezes its hours (actual PRESENT unbilled hours → plan hours → lowest plan),
//   • stamps the billed sessions, sets the sub PENDING, and generates its invoice.
// It is idempotent: a student whose next-month sub is already frozen is skipped.
//
// Usage:
//   npm run usage:bill              # bill the CURRENT month now
//   npm run usage:bill 2026-07-31   # bill the month that contains this date
//
// Env: loads server/.env explicitly so it works no matter which cwd npm uses.
// ===========================================================================

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the server's env BEFORE importing anything that reads process.env. The
// modules below also `import "dotenv/config"`, but dotenv never overrides vars
// that are already set, so this explicit load wins regardless of cwd.
dotenv.config({ path: path.resolve(__dirname, "../server/.env") });

// Dynamic imports so the dotenv load above runs first.
const { prisma } = await import("@aya/db/prisma.client.js");
const { subscriptionUsecase } = await import(
  "../server/src/modules/finance/subscriptions/subscription.usecase.js"
);

function parseDateArg(arg) {
  if (!arg) return new Date();
  const d = new Date(arg);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date argument: "${arg}" (expected e.g. 2026-07-31)`);
  }
  return d;
}

async function main() {
  const now = parseDateArg(process.argv[2]);
  console.log(
    `[usage-billing] forcing month-close billing for the month containing ${now.toISOString()} ...`,
  );

  const result = await subscriptionUsecase.generateMonthlyUsageInvoices(now);

  console.log(
    `[usage-billing] done — invoiced: ${result.invoiced}, skipped: ${result.skipped}, failed: ${result.failed}`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("[usage-billing] FAILED:", err?.stack || err);
    await prisma.$disconnect();
    process.exit(1);
  });
