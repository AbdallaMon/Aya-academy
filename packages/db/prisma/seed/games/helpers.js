// @ts-check
import { prisma } from "../../../prisma.client.js";

/** Delete all GameQuestion rows for a game (cascades to GameOption). */
export async function clearGameQuestions(gameId) {
  await prisma.gameQuestion.deleteMany({ where: { gameId } });
}

// Remove a retired game from an already-seeded DB. Prefer a full delete (so it
// vanishes from the games list); if it has graded attempts (whose certificates
// restrict deletion), fall back to deactivating it so it simply stops showing.
export async function removeRetiredGame(slug) {
  const game = await prisma.game.findUnique({ where: { slug } });
  if (!game) return;
  try {
    await prisma.game.delete({ where: { id: game.id } });
    console.log(`[seed] retired game ${slug} — deleted`);
  } catch {
    await prisma.game.update({
      where: { id: game.id },
      data: { isActive: false, isPublic: false, isFree: false },
    });
    console.log(`[seed] retired game ${slug} — deactivated (had history)`);
  }
}

// Guarantee exactly-at-least-one public free-trial game. Called at the end of
// the seed: if no game is flagged isFree, promote one (prefer a public + active
// game, else any game) and make it public + active so /free-game always works.
export async function ensureFreeGame() {
  const freeCount = await prisma.game.count({ where: { isFree: true } });
  if (freeCount > 0) {
    console.log(`[seed] free game already set (${freeCount}).`);
    return;
  }

  const pick =
    (await prisma.game.findFirst({
      where: { isPublic: true, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, slug: true },
    })) ??
    (await prisma.game.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true, slug: true },
    }));

  if (!pick) {
    console.log("[seed] no games found — could not auto-set a free game.");
    return;
  }

  await prisma.game.update({
    where: { id: pick.id },
    data: { isFree: true, isPublic: true, isActive: true },
  });
  console.log(`[seed] auto-selected free game: ${pick.slug}`);
}

