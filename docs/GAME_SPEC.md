# Game Spec — "مغامرة آداب الاتصال الذكي" (Aboud)

Reference: a kids' (≤7 yrs) interactive Arabic/RTL adventure that teaches phone/communication manners (آداب الاتصال). Faithful, playable standalone prototype lives at **[web/public/aboud-game.html](../web/public/aboud-game.html)** — open it directly in a browser (double-click) to play. This is the model every Ayah Academy game follows.

## Golden rules (kids ≤ 7)
- **No "wrong → move on" and no failure.** A wrong choice plays a gentle animation (shake + sad guide face 😢) + an encouraging message, and lets the child **retry**. No score penalty, no game-over.
- **Sounds everywhere:** tap/success/error chimes (Web Audio) + Arabic speech for prompts/praise; a 🔊 mute toggle in the header.
- **Reactive UI:** choices/sliders change the screen live (the guide bubble, emoji, colors, bars all respond).
- Playful, big emojis, rounded gradients, a phone-frame card. Arabic-first, RTL.

## Shell
- **Header:** hero name + avatar, **4 stars** (fill as tasks pass), score `X / 4`, 🔊 toggle. Accent turns green on success, pink on a wrong attempt.
- **Guide bubble:** speaks the current prompt / praise / gentle correction.

## Flow
1. **Avatar select** — pick Aboud's look (🧑‍🚀 مستكشف / 🦸 عبود / 🤠 راعي / 🤿 غواص). Selecting updates header + greeting live. Green CTA starts.
2. **4 tasks, one star each** (retry-until-right):
   - **Task 1 — Dial + polite reply:** a **dialpad** (tap 5·5·5·5 → green call), then a **multiple-choice** of replies colored by tone (⚠️ demanding / 💚 polite ✓ / 📢 shouting).
   - **Task 2 — Voice tone:** a **slider**; emoji + sound-bars + description update live; correct = middle (😊 معتدل). Confirm button reflects state (purple when good / orange otherwise).
   - **Task 3 — Right time to call:** multiple choice (late night ✗ / afternoon ✓ / family lunch ✗) with explanations.
   - **Task 4 — Wrong-number caller:** scenario + multiple choice (hang up ✗ / kindly correct ✓ / shout ✗).
3. **Reward studio** (after 4 stars): pick **cover color** + add up to **5 stickers**, live phone preview, replay.
4. **Certificate modal:** 👑 "وسام الهاتف الذهبي الساحر" with the hero's name + thanks.

## Data-model mapping (how a game is authored via seed → backend)
- **Game**: `slug`, `titleAr/En`, `type = INTERACTIVE`, `isPublic` (free landing game), `passThreshold`, `configJson` (avatars, cover colors, stickers, certificate text).
- **GameQuestion** (one per task): `order`, `kind` ∈ `{ DIALPAD, MULTIPLE_CHOICE, TONE_SLIDER, SCENARIO, ... }`, `promptAr/En`, `mediaJson` (per-kind props: dial sequence; slider zones; scenario text; center emoji/caption; good/bad messages).
- **GameOption** (for choice tasks): `labelAr/En`, `emoji`, `isCorrect`, `feedbackAr/En`, plus a `tone` flag in option metadata (good/warn/bad) for card coloring.
- **GameAttempt**: stars/score, `answersJson`, `passed`, links a **Certificate** on completion.
- `GameQuestionKind` enum now includes `DIALPAD` + `TONE_SLIDER` (schema + `@ayah/shared` in sync).

## Build plan
1. ✅ Standalone HTML prototype (done — the reference implementation).
2. Frontend core (Next.js JS + theme + RTL + i18n) — then port the prototype into a **React `<GamePlayer>` engine** with per-`kind` renderers (`DialpadTask`, `ChoiceTask`, `ToneSliderTask`, `RewardStudio`, `Certificate`).
3. `games` backend module (list/view/assign/attempt) + **seed** this adventure (and an Islamic-manners variant) into the DB; the React engine renders from the seeded data.
4. Each game/quiz pass issues a Certificate + optional coupon/gift reward.
