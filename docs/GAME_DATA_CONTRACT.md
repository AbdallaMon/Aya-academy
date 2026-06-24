# Game Data Contract — single source for seed ↔ React `<GamePlayer>`

> The backend `seed` authors games as DB rows; the React engine (`web/src/features/games`)
> renders **only** from this data (fetched via the games API). Both sides MUST follow this
> contract. Kids ≤7 rules always apply (no failure, gentle retry, sounds, stars, certificate).

## Game (row)
- `slug` — kebab-case unique id (also the public URL).
- `titleAr` / `titleEn`, `descriptionAr` / `descriptionEn`.
- `type` = `INTERACTIVE` (default) | `QUIZ` | `STORY`.
- `isPublic` — `true` shows it as the free landing game.
- `isActive` — visible/playable.
- `passThreshold` — min correct tasks to earn the certificate (null ⇒ always pass).
- `configJson` — see below.
- `questions[]` (ordered by `order`) — one per **task/screen**.

### `configJson`
```jsonc
{
  "theme":  { "primary": "#7c5cff", "accent": "#23c483", "warn": "#ff7aa8", "bg": "#fff7fb" },
  "hero":   { "emoji": "🧒", "nameAr": "عبّود", "nameEn": "Aboud" },     // optional mascot
  "avatars": [                                                            // optional avatar picker
    { "id": "explorer", "emoji": "🧑‍🚀", "labelAr": "مستكشف", "labelEn": "Explorer" }
  ],
  "stars": 4,                                                            // header stars (defaults to questions.length)
  "certificate": { "titleAr": "وسام الذهب", "titleEn": "Gold Medal", "emoji": "👑" },
  "reward":      { "giftNameAr": "نجمة ذهبية", "giftNameEn": "Gold Star", "emoji": "🌟" },
  "rewardStudio": {                                                      // optional end-screen studio
    "coverColors": ["#ffd166","#06d6a0","#ef476f","#118ab2"],
    "stickers": ["🌟","🐱","🌙","🕌","❤️"]
  }
}
```

## GameQuestion (row) — `kind` drives the renderer skin
Common fields: `order`, `kind`, `promptAr`/`promptEn` (the guide bubble text), `mediaJson`, `options[]`.

`options[]` (ordered): `labelAr`/`labelEn`, `emoji?`, `isCorrect`, `feedbackAr?`/`feedbackEn?`.
> The student-facing API **strips `isCorrect`**; the engine learns correctness only from the
> attempt grading round-trip OR (for instant kid feedback) the engine treats a tap as correct/incorrect
> purely client-side using a per-option `tone` in `mediaJson.optionMeta` when present (no answer leak needed
> for tone coloring). Grading/score is sent to `POST /games/:id/attempt`.

### Per-`kind` `mediaJson`
- **MULTIPLE_CHOICE** — `{ "layout": "list" }`. Plain choice list. (right time, polite reply, "which is a pillar?")
- **EMOJI_CHOICE** — `{ "layout": "grid" }`. Big-emoji option cards (match dhikr → situation).
- **TAP_CHOICE** — `{ "mode": "catch", "rounds": 6 }`. Tap the good items as they appear; each option is an item with `isCorrect` (good deed) or not. Options act as the item pool.
- **SCENARIO** — `{ "sceneEmoji": "📞", "captionAr": "...", "captionEn": "..." }` + choice options (wrong-number caller).
- **PHONE_CALL** — alias of SCENARIO with a phone frame.
- **DIALPAD** — `{ "sequence": "5555", "thenChoose": true }`. Tap the digits in order → unlocks the choice options.
- **TONE_SLIDER** — `{ "min": 0, "max": 100, "goodMin": 40, "goodMax": 60, "labels": { "lowAr": "...", "midAr": "...", "highAr": "..." } }`. Correct = land in the good zone. No `options[]` needed (synthetic correct/feedback in mediaJson: `goodAr/goodEn`, `badAr/badEn`).

### Phase D kinds (animation games) — `mediaJson` shapes
These 5 kinds carry ALL their data in `mediaJson` (no `options[]` rows). Each screen is ONE
graded task = ONE star; completing the screen calls the engine's `onCorrect` once. All enforce
the kids' rules: gentle retry, soft chimes, NEVER a loss / game-over.

- **MATCHING** (`MatchingTask`) — match pairs (letter ↔ word/emoji). Tap a card on one side,
  then its partner on the other. Correct pair = chime + jelly + sparkle + lock; wrong pair =
  gentle shake + reset. Screen passes when every pair is matched.
  ```jsonc
  { "pairs": [
      { "id": "alif", "leftAr": "أ", "leftEn": "Alif", "leftEmoji": "🔤",
        "rightAr": "أرنب", "rightEn": "Rabbit", "rightEmoji": "🐰" }
  ] }
  ```
  `leftEmoji`/`rightEmoji` are optional; `left*` renders the left column, `right*` the right.

- **COMPASS** (`CompassTask`) — radial ToneSlider. A slider (0..359°) rotates a needle toward a
  fixed Kaaba 🕋 marker. Landing within `targetAngle ± tolerance` and confirming passes the screen.
  ```jsonc
  { "targetAngle": 90, "tolerance": 20,
    "labelAr": "...", "labelEn": "...",
    "goodAr": "...", "goodEn": "...", "badAr": "...", "badEn": "...",
    "nearAr": "...", "nearEn": "..." }   // near* optional ("warmer" hint)
  ```

- **CALENDAR_DROP** (`CalendarDropTask`) — touch-friendly tap-pick-then-tap-slot (NOT HTML5 drag).
  Tap a deed in the tray to lift it, then tap the correct calendar slot. Right slot = chime +
  sticker lands + sparkle; wrong slot = gentle bounce + the item's feedback, deed returns. Screen
  passes when every item is placed.
  ```jsonc
  {
    "slots": [ { "id": "morning", "labelAr": "...", "labelEn": "...", "emoji": "🌅" } ],
    "items": [ { "id": "fasting", "slotId": "morning", "labelAr": "صيام", "labelEn": "Fasting",
                 "emoji": "🍽️", "feedbackAr": "...", "feedbackEn": "..." } ]
  }
  ```
  Each item's `slotId` names the slot it belongs to (the answer key); `feedbackAr/En` shows on a
  wrong placement.

- **COLORING** (`ColoringTask`) — pure creative play, NO wrong answers. Pick a palette color, tap
  a mosque-SVG region to fill it. Screen passes when every listed region is colored at least once.
  ```jsonc
  {
    "palette": ["#ffd166", "#06d6a0", "#ef476f", "#118ab2", "#8a5bff", "#ffffff"],
    "regions": [ { "id": "dome", "nameAr": "القبة", "nameEn": "Dome" } ]
  }
  ```
  Valid region `id`s (the built-in SVG): `sky`, `dome`, `body`, `door`, `minaret`, `crescent`.
  List any subset; unlisted regions render dimmed and aren't required. `name*` is descriptive only.

- **BOARD_DICE** (`BoardDiceTask`) — snakes-&-ladders. Tap the die to roll (1..6, `Math.random`),
  the token hops; good-manners squares LADDER up, careless squares SLIDE down a little (gentle
  chime, kind message — never harsh). Reaching the last square passes the screen.
  ```jsonc
  {
    "size": 16,
    "winAr": "...", "winEn": "...",
    "squares": {
      "2": { "type": "ladder", "to": 6, "emoji": "🤝", "msgAr": "...", "msgEn": "..." },
      "7": { "type": "slide",  "to": 3, "emoji": "😠", "msgAr": "...", "msgEn": "..." }
    }
  }
  ```
  `squares` is keyed by the 0-based square index; `to` is the 0-based destination index.

### Optional per-option visual tone (kid coloring, no answer leak)
`mediaJson.optionMeta`: `[{ "tone": "good"|"warn"|"bad" }, ...]` aligned to options order — used ONLY for card coloring; not authoritative for scoring.

## Attempt round-trip
Engine collects `answersJson` (per-task chosen option ids / slider value / dial success) and the
computed `correctCount` + `totalQuestions`, then `POST /games/:id/attempt`. Server returns
`{ attempt, passed, certificate }`. The engine shows the **reward studio** then the **certificate**.

## Phase D kinds — now LIVE in the enum (schema + @aya/shared + prisma generated)
`MATCHING`, `COMPASS`, `CALENDAR_DROP`, `COLORING`, `BOARD_DICE` are implemented as renderers
(registered in `engine/renderers/index.js`) and seeded as: `letters-match`, `qibla-compass`,
`ramadan-hero`, `decorate-mosque`, `akhlaq-ladder`. See the per-kind `mediaJson` shapes above.
