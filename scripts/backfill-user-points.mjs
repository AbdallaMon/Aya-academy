#!/usr/bin/env node
// ===========================================================================
// One-off backfill — reset every student's cached `User.points` to the TRUE sum
// of their Point ledger.
//
// Why: the cached counter drifted above the ledger because the old game/quiz
// flow bumped `User.points` directly without writing a Point row (the
// since-fixed double-count bug). This realigns the cache with the ledger so the
// dashboard hero / rank / parent overview all show the real, badge-only total.
// Idempotent: safe to run repeatedly. Points now derive purely from `Point`.
//
//   node scripts/backfill-user-points.js
// ===========================================================================

import { USER_ROLES } from "@ayah/shared";
import { prisma } from "@ayah/db/prisma.client.js";

async function main() {
  const sums = await prisma.point.groupBy({
    by: ["studentId"],
    _sum: { amount: true },
  });
  const sumById = new Map(sums.map((s) => [s.studentId, s._sum.amount ?? 0]));

  const students = await prisma.user.findMany({
    where: { role: USER_ROLES.STUDENT },
    select: { id: true, name: true, points: true },
  });

  let changed = 0;
  for (const s of students) {
    const correct = sumById.get(s.id) ?? 0;
    if (s.points !== correct) {
      await prisma.user.update({ where: { id: s.id }, data: { points: correct } });
      console.log(`user ${s.id} (${s.name ?? ""}): ${s.points} -> ${correct}`);
      changed += 1;
    }
  }

  console.log(
    `Done. ${students.length} students checked, ${changed} corrected.`,
  );
}

main()
  .catch((err) => {
    console.error("backfill failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
