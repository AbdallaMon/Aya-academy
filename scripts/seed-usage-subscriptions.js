#!/usr/bin/env node
// ===========================================================================
// On-demand "promotion" runner — seeds next-month USAGE subscriptions.
//
// For every currently-active student, ensures their NEXT-month open USAGE
// subscription exists and its hours are recomputed from THIS month's sessions.
// It does NOT freeze or invoice (that is the month-close job — see
// scripts/run-usage-billing.js / `npm run usage:bill`). It is a thin driver that
// calls the existing usecase method subscriptionUsecase.seedOpenUsageSubscriptions,
// which goes through the proper repo/usecase methods
// (listActiveStudentsWithPlan → recomputeOpenUsageSubscription →
// findOpenUsageSubscription / createSubscription / updateSubscription).
//
// Idempotent: a student who already has an open next-month sub gets it
// refreshed; a frozen one is left untouched.
//
// Usage:
//   npm run usage:seed              # seed next-month subs relative to today
//   npm run usage:seed 2026-07-15   # seed relative to this date (→ next month)
//
// Env: loads server/.env explicitly so it works regardless of cwd.
// ===========================================================================

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the server env BEFORE importing anything that reads process.env.
dotenv.config({ path: path.resolve(__dirname, "../server/.env") });

const { prisma } = await import("@aya/db/prisma.client.js");
const { subscriptionUsecase } = await import(
  "../server/src/modules/finance/subscriptions/subscription.usecase.js"
);

function parseDateArg(arg) {
  if (!arg) return new Date();
  const d = new Date(arg);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date argument: "${arg}" (expected e.g. 2026-07-15)`);
  }
  return d;
}

async function main() {
  const now = parseDateArg(process.argv[2]);
  console.log(
    `[usage-seed] seeding next-month USAGE subscriptions relative to ${now.toISOString()} ...`,
  );

  const result = await subscriptionUsecase.seedOpenUsageSubscriptions(now);

  console.log(
    `[usage-seed] done — processed: ${result.processed}, failed: ${result.failed}`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("[usage-seed] FAILED:", err?.stack || err);
    await prisma.$disconnect();
    process.exit(1);
  });
