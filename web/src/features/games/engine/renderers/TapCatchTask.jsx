"use client";

// TapCatchTask — the TAP_CHOICE "catch" mechanic. Good-deed options float up
// over mediaJson.rounds; the options array is the item pool (good = isCorrect /
// optionMeta.tone 'good', bad = otherwise). Tap a good item → star chime +
// sparkle + progress. Tap a bad item → gentle bounce-back + soft chime, NEVER a
// loss. When `rounds` good deeds are collected, the whole task passes (onCorrect).

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "../../../../i18n/client.js";
import { pickText, isOptionCorrect } from "../helpers.js";

let UID = 0;

export default function TapCatchTask({ question, onCorrect, onWrong, sounds }) {
  const { t, lng } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const media = question.mediaJson || {};
  const goal = media.rounds ?? 6;

  const pool = (question.options || []).map((o, i) => ({
    ...o,
    _good: isOptionCorrect(o, i, media),
  }));
  const goodPool = pool.filter((o) => o._good);
  const badPool = pool.filter((o) => !o._good);

  const [bubbles, setBubbles] = useState([]);
  const [collected, setCollected] = useState(0);
  const collectedRef = useRef(0);
  const doneRef = useRef(false);

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
      const dur = 4.4 + Math.random() * 1.8;
      return [...prev, { id, item, bad: isBad, left, dur }];
    });
  }, [goodPool, badPool]);

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

  function handleTap(bubble) {
    if (doneRef.current) return;
    if (bubble.bad) {
      sounds?.play("wrong");
      onWrong({ feedback: pickText(bubble.item, "feedback", lng) || gd.catchBadTap });
      return;
    }
    sounds?.play("star");
    removeBubble(bubble.id);
    const next = collectedRef.current + 1;
    collectedRef.current = next;
    setCollected(next);
    if (next >= goal) {
      doneRef.current = true;
      sounds?.play("win");
      onCorrect({ collected: next, feedback: gd.catchDone });
    }
    // mid-progress: no advance yet; the guide keeps the encouraging prompt.
  }

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
        <span>🚀</span>
      </Box>

      {/* arena */}
      <Box
        sx={{
          position: "relative",
          height: 360,
          borderRadius: "20px",
          overflow: "hidden",
          background:
            "radial-gradient(120px 120px at 50% 110%, #dff0ff 0%, transparent 70%), linear-gradient(180deg,#eaf5ff,#f7fbff)",
          border: "2px solid #d9ecff",
        }}
      >
        <AnimatePresence>
          {bubbles.map((b) => (
            <motion.button
              key={b.id}
              type="button"
              initial={{ bottom: -90, opacity: 0 }}
              animate={{ bottom: "100%", opacity: 1, x: [0, 16, -12, 0] }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ bottom: { duration: b.dur, ease: "linear" }, x: { duration: b.dur, repeat: 0 }, opacity: { duration: 0.3 } }}
              onAnimationComplete={() => removeBubble(b.id)}
              onClick={() => handleTap(b)}
              style={{
                position: "absolute",
                left: `${b.left}%`,
                border: b.bad ? "2px solid #ffd5de" : "2px solid #b5f0db",
                background: b.bad ? "#ffeef2" : "#e7fbf3",
                borderRadius: 18,
                padding: "10px 12px",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                width: 92,
              }}
            >
              <span style={{ fontSize: 30, lineHeight: 1 }}>{b.item.emoji || "💛"}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#2b2350", textAlign: "center" }}>
                {pickText(b.item, "label", lng)}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </Box>

      <Typography sx={{ textAlign: "center", color: "#6b6790", fontSize: 12 }}>
        {gd.catchHint}
      </Typography>
    </Box>
  );
}
