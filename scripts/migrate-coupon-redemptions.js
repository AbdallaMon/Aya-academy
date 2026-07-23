#!/usr/bin/env node

import { prisma } from "@aya/db/prisma.client.js";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const historical = await prisma.subscription.findMany({
    where: { couponId: { not: null } },
    select: { id: true, couponId: true, studentId: true },
    orderBy: { id: "asc" },
  });

  // Keep the first known subscription for each permanent business key.
  const uniqueUses = new Map();
  for (const row of historical) {
    const key = `${row.couponId}:${row.studentId}`;
    if (!uniqueUses.has(key)) uniqueUses.set(key, row);
  }

  if (dryRun) {
    const existing = await prisma.couponRedemption.count();
    console.log({
      dryRun: true,
      historicalSubscriptions: historical.length,
      uniqueStudentCouponUses: uniqueUses.size,
      existingLedgerRows: existing,
    });
    return;
  }

  const inserted = await prisma.couponRedemption.createMany({
    data: [...uniqueUses.values()].map((row) => ({
      couponId: row.couponId,
      studentId: row.studentId,
      subscriptionId: row.id,
    })),
    skipDuplicates: true,
  });

  const [ledgerCounts, coupons] = await Promise.all([
    prisma.couponRedemption.groupBy({
      by: ["couponId"],
      _count: { _all: true },
    }),
    prisma.coupon.findMany({
      select: { id: true, redemptionsCount: true },
    }),
  ]);
  const countsByCoupon = new Map(
    ledgerCounts.map((row) => [row.couponId, row._count._all]),
  );

  let countersRaised = 0;
  for (const coupon of coupons) {
    const ledgerCount = countsByCoupon.get(coupon.id) ?? 0;
    // Never lower the lifetime counter: deleted historical rows cannot be
    // reconstructed, and coupon consumption is intentionally irreversible.
    if (ledgerCount <= coupon.redemptionsCount) continue;
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { redemptionsCount: ledgerCount },
    });
    countersRaised += 1;
  }

  console.log({
    dryRun: false,
    historicalSubscriptions: historical.length,
    uniqueStudentCouponUses: uniqueUses.size,
    insertedLedgerRows: inserted.count,
    couponCountersRaised: countersRaised,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
