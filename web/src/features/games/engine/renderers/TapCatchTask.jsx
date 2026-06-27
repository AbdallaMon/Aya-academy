"use client";

// TapCatchTask — the TAP_CHOICE "catch" mechanic. Good items appear over
// mediaJson.rounds; the options array is the item pool (good = isCorrect /
// optionMeta.tone 'good', bad = otherwise). Tap a good item → a juicy catch
// chime + sparkle burst + progress. Tap a bad item → a gentle bounce-back + soft
// "oops", NEVER a loss. When `rounds` good items are collected, the whole task
// passes (onCorrect).
//
// What makes it interactive & forgiving (kids rule: no failure, only nudges):
//   • Each event has its OWN sound: catching a good item = "catch" (a quick
//     rising pop + air sparkle), the item that completes the goal = "win",
//     tapping a bad item = "oops" (soft, never harsh), and a good item escaping
//     plays nothing punishing — just a tiny encouraging line (gd.catchMiss).
//   • A good catch fires a sparkle burst at the exact spot the item vanished, so
//     the success reads instantly even as new items keep floating.
//   • Floating items are bigger and cuter (soft shadow, gentle idle wobble) so a
//     child can clearly tell good (warm green) from not-good (rosy).
//
// mediaJson knobs (all optional, fully backward-compatible):
//   mode: "catch" (the only mode)
//   rounds: number of good items to collect (default 6)
//   direction: "up" (default — float up from the ground) | "fall" (drop from sky)
//   speed: "slow" | "normal" (default) | "fast" — tunes item travel time
//   goalEmoji: emoji shown on the progress meter (default 🚀)
//   catcherEmoji: emoji shown at the catch line (basket/chest/moon…) — fall only
//   hintAr/hintEn, doneAr/doneEn: per-game overrides for the chrome strings
//   arena: { from, to, glow, border } — per-game arena palette

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "../../../../i18n/client.js";
import { pickText, isOptionCorrect, flashPalette } from "../helpers.js";
import { useSelectFlash } from "../../hooks/useSelectFlash.js";
import { SparkleTrail } from "../../animations/index.js";

let UID = 0;
let BURST_UID = 0;

// speed → [minDuration, extraRandom] seconds for one item's travel.
const SPEED = {
  slow: [5.4, 1.8],
  normal: [4.4, 1.8],
  fast: [3.0, 1.4],
};

export default function TapCatchTask({ question, onCorrect, onWrong, sounds }) {
  const { t, lng } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const media = question.mediaJson || {};
  const goal = media.rounds ?? 6;
  const falling = media.direction === "fall";
  const [durMin, durRand] = SPEED[media.speed] || SPEED.normal;

  // per-game overrides fall back to the shared chrome strings.
  const hintText = pickText(media, "hint", lng) || gd.catchHint;
  const doneText = pickText(media, "done", lng) || gd.catchDone;
  const goalEmoji = media.goalEmoji || "🚀";
  const arena = media.arena || {};
  const arenaFrom = arena.from || "#eaf5ff";
  const arenaTo = arena.to || "#f7fbff";
  const arenaGlow = arena.glow || "#dff0ff";
  const arenaBorder = arena.border || "#d9ecff";

  const pool = (question.options || []).map((o, i) => ({
    ...o,
    _good: isOptionCorrect(o, i, media),
  }));
  const goodPool = pool.filter((o) => o._good);
  const badPool = pool.filter((o) => !o._good);

  const [bubbles, setBubbles] = useState([]);
  const [collected, setCollected] = useState(0);
  const [bursts, setBursts] = useState([]); // transient sparkle bursts at catch spots
  const [missNote, setMissNote] = useState(false); // soft "it flew away" hint
  const collectedRef = useRef(0);
  const doneRef = useRef(false);
  const missTimer = useRef(null);
  const { fire, flashFor } = useSelectFlash();

  useEffect(
    () => () => {
      if (missTimer.current) clearTimeout(missTimer.current);
    },
    [],
  );

  const spawn = useCallback(() => {
    if (doneRef.current) return;
    setBubbles((prev) => {
      if (prev.length >= 4) return prev;
      const isBad = Math.random() < 0.28 && badPool.length > 0;
      const src = isBad ? badPool : goodPool;
      if (src.length === 0) return prev;
      const item = src[(Math.random() * src.length) | 0];
      const id = ++UID;
      const left = 6 + Math.random() * 70; // % within arena
      const dur = durMin + Math.random() * durRand;
      return [...prev, { id, item, bad: isBad, left, dur }];
    });
  }, [goodPool, badPool, durMin, durRand]);

  // spawn loop
  useEffect(() => {
    if (goodPool.length === 0) return undefined;
    spawn();
    const a = setTimeout(spawn, 500);
    const interval = setInterval(spawn, 1100);
    return () => {
      clearTimeout(a);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spawn]);

  function removeBubble(id) {
    setBubbles((prev) => prev.filter((b) => b.id !== id));
  }

  // pop a short-lived sparkle burst at a horizontal spot (so the catch reads).
  function addBurst(left) {
    const id = ++BURST_UID;
    setBursts((prev) => [...prev, { id, left }]);
    setTimeout(() => setBursts((prev) => prev.filter((x) => x.id !== id)), 900);
  }

  // a good item floated off-screen untapped: no loss, just a gentle nudge.
  function handleEscape(bubble) {
    removeBubble(bubble.id);
    if (doneRef.current || bubble.bad) return;
    // surface a soft, encouraging line without punishing progress.
    setMissNote(true);
    if (missTimer.current) clearTimeout(missTimer.current);
    missTimer.current = setTimeout(() => setMissNote(false), 1600);
  }

  function handleTap(bubble) {
    if (doneRef.current) return;
    // flash the tapped bubble: green (good catch) / red (wrong tap), then revert.
    fire(bubble.id, !bubble.bad);
    if (bubble.bad) {
      sounds?.play("oops");
      onWrong({ feedback: pickText(bubble.item, "feedback", lng) || gd.catchBadTap });
      return;
    }
    // a distinct, juicy catch: catch chime + a sparkle burst where it vanished.
    sounds?.play("catch");
    addBurst(bubble.left);
    removeBubble(bubble.id);
    const next = collectedRef.current + 1;
    collectedRef.current = next;
    setCollected(next);
    if (next >= goal) {
      doneRef.current = true;
      sounds?.play("win");
      onCorrect({ collected: next, feedback: doneText });
    }
    // mid-progress: no advance yet; the guide keeps the encouraging prompt.
  }

  // direction-aware motion: rise from the ground, or drop from the sky.
  const motionProps = falling
    ? {
        initial: { top: -90, opacity: 0 },
        animate: { top: "100%", opacity: 1, x: [0, 16, -12, 0] },
      }
    : {
        initial: { bottom: -90, opacity: 0 },
        animate: { bottom: "100%", opacity: 1, x: [0, 16, -12, 0] },
      };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {/* progress meter */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f3f1ff",
          border: "2px solid #ece8ff",
          borderRadius: "14px",
          px: 1.5,
          py: 1,
          fontWeight: 800,
          fontSize: 13,
          color: "#6536e0",
        }}
      >
        <span>
          {gd.catchProgress}: {collected} / {goal} ⭐
        </span>
        <Box sx={{ flex: 1, mx: 1.5, height: 10, background: "#e6e2fb", borderRadius: 999, overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${(collected / goal) * 100}%` }}
            style={{ height: "100%", background: "linear-gradient(90deg,#18c08f,#20cf99)" }}
          />
        </Box>
        <span>{goalEmoji}</span>
      </Box>

      {/* arena */}
      <Box
        sx={{
          position: "relative",
          height: 360,
          borderRadius: "20px",
          overflow: "hidden",
          background: `radial-gradient(120px 120px at 50% ${
            falling ? "-10%" : "110%"
          }, ${arenaGlow} 0%, transparent 70%), linear-gradient(180deg,${arenaFrom},${arenaTo})`,
          border: `2px solid ${arenaBorder}`,
        }}
      >
        <AnimatePresence>
          {bubbles.map((b) => {
            const fp = flashPalette(flashFor(b.id));
            return (
            <motion.button
              key={b.id}
              type="button"
              initial={motionProps.initial}
              animate={{
                ...motionProps.animate,
                // a gentle idle wobble makes each item feel alive & cuter.
                rotate: [0, -6, 6, -3, 0],
                scale: [0.9, 1, 1, 1, 1],
              }}
              exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.22 } }}
              transition={{
                [falling ? "top" : "bottom"]: { duration: b.dur, ease: "linear" },
                x: { duration: b.dur, repeat: 0 },
                rotate: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 0.4 },
                opacity: { duration: 0.3 },
              }}
              onAnimationComplete={() => handleEscape(b)}
              onClick={() => handleTap(b)}
              whileTap={{ scale: 1.18 }}
              style={{
                position: "absolute",
                left: `${b.left}%`,
                border: `3px solid ${fp ? fp.border : b.bad ? "#ffc0cf" : "#7fe6c4"}`,
                background: fp ? fp.bg : b.bad ? "#fff1f5" : "#e7fbf3",
                transition: "background-color .2s, border-color .2s",
                borderRadius: 20,
                padding: "12px 12px",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                width: 96,
                boxShadow: b.bad
                  ? "0 6px 14px rgba(214,67,106,0.18)"
                  : "0 6px 16px rgba(24,192,143,0.22)",
              }}
            >
              <span style={{ fontSize: 34, lineHeight: 1 }}>{b.item.emoji || "💛"}</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: b.bad ? "#b03a5b" : "#0c7a59",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {pickText(b.item, "label", lng)}
              </span>
            </motion.button>
            );
          })}
        </AnimatePresence>

        {/* transient catch bursts — a sparkle pop where a good item was caught */}
        <AnimatePresence>
          {bursts.map((bu) => (
            <Box
              key={bu.id}
              sx={{
                position: "absolute",
                left: `${bu.left}%`,
                top: "50%",
                width: 96,
                height: 96,
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <SparkleTrail count={7} size={20} />
            </Box>
          ))}
        </AnimatePresence>

        {/* catch line (fall mode): a friendly catcher at the bottom */}
        {falling && media.catcherEmoji ? (
          <Box
            sx={{
              position: "absolute",
              bottom: 6,
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 40,
              pointerEvents: "none",
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.15))",
            }}
          >
            {media.catcherEmoji}
          </Box>
        ) : null}

        {/* soft "it flew away!" nudge — appears briefly, never punishes */}
        <AnimatePresence>
          {missNote ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              style={{
                position: "absolute",
                left: "50%",
                bottom: 12,
                transform: "translateX(-50%)",
                background: "rgba(101,54,224,0.92)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 800,
                padding: "6px 12px",
                borderRadius: 999,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                boxShadow: "0 6px 16px rgba(101,54,224,0.35)",
              }}
            >
              {gd.catchMiss}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Box>

      <Typography sx={{ textAlign: "center", color: "#5a4ea8", fontSize: 12, fontWeight: 700 }}>
        {hintText}
      </Typography>
    </Box>
  );
}
