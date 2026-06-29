// @ts-check
// Seed entry point. Each domain lives in its own file under ./seed/ (and every
// game in its own file under ./seed/games/); this file just wires them together
// in order and handles connect/disconnect.
import { prisma } from "../prisma.client.js";

import { seedAdmin } from "./seed/admin.js";
import { seedBadges } from "./seed/badges.js";
import { seedCertificateTemplates } from "./seed/certificateTemplates.js";
import { seedQuizBank } from "./seed/quizBank.js";
import { seedAppSettings } from "./seed/appSettings.js";
import { seedPlans } from "./seed/plans.js";
import { seedGames } from "./seed/games/index.js";

async function main() {
  console.log("[seed] starting...");

  const admin = await seedAdmin();
  const badgeCodes = await seedBadges();
  await seedCertificateTemplates();
  await seedQuizBank(admin.id);
  await seedAppSettings();
  await seedPlans();

  await seedGames();

  console.log(`\n[seed] done.`);
  console.log(`  admin      : ${admin.email}`);
  console.log(`  categories : عقيدة, آداب وأخلاق, قرآن وسور (3)`);
  console.log(`  bank qs    : up to 8 defined (skips existing)`);
  console.log(
    `  games      : phone-manners(6q) | islamic-manners(6q) | good-deeds-catch(1q/20opts) | dhikr-treasure(1q/11opts) | prayer-stars(1q/11opts) | wudu-steps(4q) | azkar-match(4q) | pillars-build(4q)`,
  );
  console.log(
    `  games (D)  : letters-match(2q/MATCHING) | qibla-compass(3q/COMPASS) | ramadan-hero(2q/CALENDAR_DROP) | decorate-mosque(1q/COLORING) | kind-words`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
