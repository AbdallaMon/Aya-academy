"use client";

// MatchingTask — kind MATCHING. Match pairs (e.g. a Quran letter ↔ a word/emoji).
// mediaJson.pairs = [{ id, leftAr/leftEn, leftEmoji?, rightAr/rightEn, rightEmoji? }].
// Tap a card on the LEFT column, then its partner on the RIGHT column. A correct
// pair = chime + jelly + star sparkle and both cards lock. A wrong pair = gentle
// bounce + soft chime, both reset, NEVER a loss. When every pair is matched the
// whole task passes (onCorrect → one star for the screen). Columns are shuffled
// deterministically by index so it stays kid-simple but not perfectly aligned.

import { useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "../../../../i18n/client.js";
import { pickText } from "../helpers.js";
import { jelly, shake, SparkleTrail } from "../../animations/index.js";

// A tiny, stable shuffle (no Math.random) so the same pairs render the same way
// across re-renders — offset each side by a different fixed step.
function rotate(list, by) {
  if (list.length === 0) return list;
  const n = ((by % list.length) + list.length) % list.length;
  return [...list.slice(n), ...list.slice(0, n)];
}

function Card({ side, item, lng, state, onTap }) {
  const label = pickText(item, side, lng);
  const emoji = side === "left" ? item.leftEmoji : item.rightEmoji;
  const matched = state === "matched";
  const selected = state === "selected";
  const wrong = state === "wrong";

  const border = matched
    ? "#b5f0db"
    : selected
      ? "#7c4dff"
      : wrong
        ? "#ff5fa2"
        : "#ece8ff";
  const bg = matched ? "#e7fbf3" : selected ? "#f3efff" : wrong ? "#ffeef2" : "#fff";

  return (
    <motion.button
      type="button"
      disabled={matched}
      onClick={onTap}
      animate={wrong ? shake.shake : matched ? jelly(true) : { x: 0, scale: 1 }}
      whileTap={matched ? undefined : { scale: 0.96 }}
      style={{
        position: "relative",
        border: `2px solid ${border}`,
        background: bg,
        borderRadius: 16,
        padding: "12px 8px",
        minHeight: 64,
        cursor: matched ? "default" : "pointer",
        fontFamily: "inherit",
        color: "#2b2350",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        boxShadow: selected ? "0 0 0 4px #7c4dff22" : "none",
        opacity: matched ? 0.85 : 1,
      }}
    >
      {emoji ? <span style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</span> : null}
      {label ? (
        <span style={{ fontSize: 13, fontWeight: 800, textAlign: "center", lineHeight: 1.3 }}>
          {label}
        </span>
      ) : null}
      {matched ? (
        <span style={{ position: "absolute", top: 4, insetInlineEnd: 6, fontSize: 14 }}>✅</span>
      ) : null}
    </motion.button>
  );
}

export default function MatchingTask({ question, onCorrect, onWrong, sounds }) {
  const { t, lng } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const media = question.mediaJson || {};
  const pairs = useMemo(() => media.pairs || [], [media.pairs]);

  const leftOrder = useMemo(() => rotate(pairs, 0), [pairs]);
  const rightOrder = useMemo(() => rotate(pairs, 1), [pairs]);

  const [matched, setMatched] = useState(() => new Set());
  const [pickLeft, setPickLeft] = useState(null); // pair id
  const [pickRight, setPickRight] = useState(null);
  const [wrongIds, setWrongIds] = useState(null); // { left, right }
  const [sparkAt, setSparkAt] = useState(null); // pair id that just matched
  const doneRef = useRef(false);

  function resolve(leftId, rightId) {
    if (leftId === rightId) {
      sounds?.play("star");
      setSparkAt(leftId);
      setMatched((prev) => {
        const next = new Set(prev);
        next.add(leftId);
        if (next.size >= pairs.length && !doneRef.current) {
          doneRef.current = true;
          sounds?.play("win");
          // brief beat so the last sparkle reads before the task passes.
          setTimeout(() => onCorrect({ matched: next.size, feedback: gd.matchDone }), 500);
        }
        return next;
      });
      setPickLeft(null);
      setPickRight(null);
      setTimeout(() => setSparkAt(null), 700);
    } else {
      sounds?.play("wrong");
      onWrong({ feedback: gd.matchWrong });
      setWrongIds({ left: leftId, right: rightId });
      setTimeout(() => {
        setWrongIds(null);
        setPickLeft(null);
        setPickRight(null);
      }, 480);
    }
  }

  function tapLeft(id) {
    if (matched.has(id) || doneRef.current) return;
    sounds?.play("tap");
    setPickLeft(id);
    if (pickRight != null) resolve(id, pickRight);
  }

  function tapRight(id) {
    if (matched.has(id) || doneRef.current) return;
    sounds?.play("tap");
    setPickRight(id);
    if (pickLeft != null) resolve(pickLeft, id);
  }

  function stateFor(side, id) {
    if (matched.has(id)) return "matched";
    if (wrongIds && wrongIds[side] === id) return "wrong";
    if (side === "left" && pickLeft === id) return "selected";
    if (side === "right" && pickRight === id) return "selected";
    return "idle";
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
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
          {gd.matchProgress}: {matched.size} / {pairs.length} 💞
        </span>
        <span>{gd.matchHint}</span>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {leftOrder.map((p) => (
            <Box key={`l-${p.id}`} sx={{ position: "relative" }}>
              <Card side="left" item={p} lng={lng} state={stateFor("left", p.id)} onTap={() => tapLeft(p.id)} />
              <AnimatePresence>
                {sparkAt === p.id ? <SparkleTrail count={6} size={18} /> : null}
              </AnimatePresence>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {rightOrder.map((p) => (
            <Box key={`r-${p.id}`} sx={{ position: "relative" }}>
              <Card side="right" item={p} lng={lng} state={stateFor("right", p.id)} onTap={() => tapRight(p.id)} />
              <AnimatePresence>
                {sparkAt === p.id ? <SparkleTrail count={6} size={18} /> : null}
              </AnimatePresence>
            </Box>
          ))}
        </Box>
      </Box>

      <Typography sx={{ textAlign: "center", color: "#6b6790", fontSize: 12 }}>
        {gd.matchTapHint}
      </Typography>
    </Box>
  );
}
