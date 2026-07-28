#!/usr/bin/env node

import { prisma } from "@ayah/db/prisma.client.js";

const MINUTES_PER_HOUR = 60;
const ALREADY_MINUTES_THRESHOLD = 30;
const dryRun = process.argv.includes("--dry-run");

function convertLegacyValue(value) {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`Invalid legacy duration: ${String(value)}`);
  }
  if (numeric >= ALREADY_MINUTES_THRESHOLD) {
    return { minutes: Math.round(numeric), alreadyMinutes: true };
  }
  return {
    minutes: Math.round(numeric * MINUTES_PER_HOUR),
    alreadyMinutes: false,
  };
}

function makeStats() {
  return { checked: 0, updated: 0, multiplied: 0, alreadyMinutes: 0 };
}

async function migrateSessions() {
  const rows = await prisma.sessionLog.findMany({
    where: {
      durationMinutes: null,
      durationHours: { not: null },
    },
    select: { id: true, durationHours: true },
    orderBy: { id: "asc" },
  });
  const stats = makeStats();

  for (const row of rows) {
    stats.checked += 1;
    const result = convertLegacyValue(row.durationHours);
    if (!result) continue;
    if (result.alreadyMinutes) stats.alreadyMinutes += 1;
    else stats.multiplied += 1;

    if (!dryRun) {
      await prisma.sessionLog.update({
        where: { id: row.id },
        data: { durationMinutes: result.minutes },
      });
    }
    stats.updated += 1;
  }
  return stats;
}

async function migrateSubscriptions() {
  const rows = await prisma.subscription.findMany({
    where: {
      OR: [
        { subsMinutes: null, subsHours: { not: null } },
        { remainingMinutes: null, remainingHours: { not: null } },
      ],
    },
    select: {
      id: true,
      subsMinutes: true,
      remainingMinutes: true,
      subsHours: true,
      remainingHours: true,
    },
    orderBy: { id: "asc" },
  });
  const stats = makeStats();

  for (const row of rows) {
    stats.checked += 1;
    const data = {};
    const conversions = [];

    if (row.subsMinutes == null && row.subsHours != null) {
      const result = convertLegacyValue(row.subsHours);
      data.subsMinutes = result.minutes;
      conversions.push(result);
    }
    if (row.remainingMinutes == null && row.remainingHours != null) {
      const result = convertLegacyValue(row.remainingHours);
      data.remainingMinutes = result.minutes;
      conversions.push(result);
    }
    if (!Object.keys(data).length) continue;

    stats.alreadyMinutes += conversions.filter((r) => r.alreadyMinutes).length;
    stats.multiplied += conversions.filter((r) => !r.alreadyMinutes).length;
    if (!dryRun) {
      await prisma.subscription.update({ where: { id: row.id }, data });
    }
    stats.updated += 1;
  }
  return stats;
}

async function migrateInvoices() {
  const rows = await prisma.invoice.findMany({
    where: {
      minutes: null,
      hours: { not: null },
    },
    select: { id: true, hours: true },
    orderBy: { id: "asc" },
  });
  const stats = makeStats();

  for (const row of rows) {
    stats.checked += 1;
    const result = convertLegacyValue(row.hours);
    if (!result) continue;
    if (result.alreadyMinutes) stats.alreadyMinutes += 1;
    else stats.multiplied += 1;

    if (!dryRun) {
      await prisma.invoice.update({
        where: { id: row.id },
        data: { minutes: result.minutes },
      });
    }
    stats.updated += 1;
  }
  return stats;
}

function printStats(label, stats) {
  console.log(
    `${label}: checked=${stats.checked}, updated=${stats.updated}, ` +
      `hours×60=${stats.multiplied}, already-minutes=${stats.alreadyMinutes}`,
  );
}

async function main() {
  console.log(
    `${dryRun ? "DRY RUN" : "MIGRATION"}: values >= ${ALREADY_MINUTES_THRESHOLD} ` +
      "are copied as minutes; all other legacy values are multiplied by 60.",
  );
  const sessions = await migrateSessions();
  const subscriptions = await migrateSubscriptions();
  const invoices = await migrateInvoices();

  printStats("SessionLog", sessions);
  printStats("Subscription", subscriptions);
  printStats("Invoice", invoices);
  console.log(dryRun ? "Dry run complete. No rows changed." : "Minute migration complete.");
}

main()
  .catch((error) => {
    console.error("Minute migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
