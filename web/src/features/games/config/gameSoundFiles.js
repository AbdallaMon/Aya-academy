// Optional audio-file overrides for each game.
//
// Put audio files inside web/public/sounds/games/<game-slug>/ and set the
// matching value to its public URL, for example:
//   correct: "/sounds/games/kind-words/correct.mp3"
//
// Keep a value null to preserve the current generated Web Audio sound.
export const GAME_SOUND_FILES = {
  "azkar-match": {
    tap: null,
    star: null,
    win: null,
    correct: null,
    wrong: null,
  },

  "decorate-mosque": {
    tap: null,
    star: null,
    win: null,
    pick: null,
    paint: null,
    oops: null,
    stamp: null,
  },

  "dhikr-treasure": {
    tap: null,
    star: null,
    win: null,
    catch: null,
    oops: null,
  },

  "good-deeds-catch": {
    tap: null,
    star: null,
    win: null,
    catch: null,
    oops: null,
  },

  "islamic-manners": {
    tap: null,
    star: null,
    win: null,
    correct: null,
    wrong: null,
  },

  "kind-words": {
    tap: null,
    star: null,
    win: null,
    correct: null,
    wrong: null,
  },

  "letters-match": {
    tap: null,
    star: null,
    win: null,
    select: null,
    match: null,
    wrong: null,
  },

  "phone-manners": {
    tap: null,
    star: null,
    win: null,
    pick: null,
    correct: null,
    wrong: null,
    oops: null,
    ring: "/sounds/games/phone-manners/ring.wav",
    lock: null,
    digit: null,
    liveTick: null,
    stamp: null,
  },

  "pillars-build": {
    tap: null,
    star: null,
    win: null,
    correct: null,
    wrong: null,
  },

  "prayer-stars": {
    tap: null,
    star: null,
    win: null,
    catch: null,
    oops: null,
  },

  "qibla-compass": {
    tap: null,
    star: null,
    win: null,
    lock: null,
    liveTick: null,
    correct: null,
    wrong: null,
  },

  "ramadan-hero": {
    tap: null,
    star: null,
    win: null,
    pick: null,
    place: null,
    stamp: null,
    wrong: null,
  },

  "wudu-steps": {
    tap: null,
    star: null,
    win: null,
    correct: null,
    wrong: null,
  },
};

export function getGameSoundFile(gameSlug, soundName) {
  return GAME_SOUND_FILES[gameSlug]?.[soundName] || null;
}
