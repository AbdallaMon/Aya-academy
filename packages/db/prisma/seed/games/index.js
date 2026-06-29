// @ts-check
// Seeds every game (each lives in its own file in this folder), then runs the
// game-level safety nets: retire removed games and guarantee one free game.
import { ensureFreeGame } from "./helpers.js";
import { seedPhoneManners } from "./phoneManners.js";
import { seedIslamicManners } from "./islamicManners.js";
import { seedGoodDeedsCatch } from "./goodDeedsCatch.js";
import { seedDhikrTreasure } from "./dhikrTreasure.js";
import { seedPrayerStars } from "./prayerStars.js";
import { seedWuduSteps } from "./wuduSteps.js";
import { seedAzkarMatch } from "./azkarMatch.js";
import { seedPillarsBuild } from "./pillarsBuild.js";
import { seedLettersMatch } from "./lettersMatch.js";
import { seedQiblaCompass } from "./qiblaCompass.js";
import { seedRamadanHero } from "./ramadanHero.js";
import { seedDecorateMosque } from "./decorateMosque.js";
import { seedKindWords } from "./kindWords.js";

export async function seedGames() {
  await seedPhoneManners();
  await seedIslamicManners();
  await seedGoodDeedsCatch();
  // Two falling-from-the-sky catch games, right after "Catch the Good Deeds".
  // await seedDhikrTreasure();
  // await seedPrayerStars();
  // await seedWuduSteps();
  // await seedAzkarMatch();
  // await seedPillarsBuild();

  // ── Phase D animation games ──
  // await seedLettersMatch();
  // await seedQiblaCompass();
  // await seedRamadanHero();
  // await seedDecorateMosque();
  // await seedKindWords();

  // Safety net: the public /free-game page must always have a game to show. If
  // nothing is flagged isFree (older DB, or the chosen game was deactivated),
  // promote one automatically.
  await ensureFreeGame();
}
