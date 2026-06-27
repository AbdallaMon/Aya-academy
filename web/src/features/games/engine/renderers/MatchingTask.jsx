"use client";

// MatchingTask — kind MATCHING. Match pairs (e.g. a Quran letter ↔ a word/emoji).
// mediaJson.pairs = [{ id, leftAr/leftEn, leftEmoji?, rightAr/rightEn, rightEmoji? }].
// Tap a card on the LEFT column, then its partner on the RIGHT column.
//
// Kids rules (no failure, always a nudge toward the answer):
//   • Picking a card plays its own "select" note; the picked card is highlighted
//     and a soft line (gd.matchPicked) invites the child to find its partner.
//   • A correct pair = "match" chime + a strong connect celebration: both cards
//     pulse/scale toward each other (a little "snap together") plus the sparkle
//     trail, then they lock. The LAST pair adds the full "win" fanfare.
//   • A wrong pair = a gentle "wrong" note + a soft shake, both reset, NEVER a
//     loss. After 2 wrong tries, one correct pair softly glows as a hint so the
//     child is never stuck.
// When every pair is matched the whole task passes (onCorrect → one star for the
// screen). Columns are shuffled deterministically by index so it stays kid-simple
// but not perfectly aligned.

import { useMemo, useRef, useState, useEffect } from "react";
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

function Card({ side, item, lng, state, hint, connecting, onTap }) {
  const label = pickText(item, side, lng);
  const emoji = side === "left" ? item.leftEmoji : item.rightEmoji;
  const matched = state === "matched";
  const selected = state === "selected";
  const wrong = state === "wrong";

  const border = matched
    ? "#18c08f"
    : selected
      ? "#7c4dff"
      : wrong
        ? "#ff5fa2"
        : hint
          ? "#ffb43d"
          : "#ece8ff";
  const bg = matched
    ? "#e7fbf3"
    : selected
      ? "#f3efff"
      : wrong
        ? "#ffeef2"
        : hint
          ? "#fff6e2"
          : "#fff";

  // a correct match "snaps together": left card nudges toward the right (toward
  // the inline-end), right card toward the left — a quick connect, then settle.
  const connectX = side === "left" ? [0, 10, 0] : [0, -10, 0];
  const animate = wrong
    ? shake.shake
    : connecting
      ? { x: connectX, scale: [1, 1.12, 1], transition: { duration: 0.5, ease: "easeOut" } }
      : matched
        ? jelly(true)
        : hint
          ? { scale: [1, 1.06, 1], transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" } }
          : { x: 0, scale: 1 };

  return (
    <motion.button
      type="button"
      disabled={matched}
      onClick={onTap}
      animate={animate}
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
        boxShadow: selected
          ? "0 0 0 4px #7c4dff22"
          : hint
            ? "0 0 0 4px #ffb43d33"
            : matched
              ? "0 6px 14px rgba(24,192,143,0.18)"
              : "none",
        opacity: matched ? 0.92 : 1,
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
  const [connectAt, setConnectAt] = useState(null); // pair id playing the connect snap
  const [hintId, setHintId] = useState(null); // a correct pair softly glowing as a hint
  const wrongCountRef = useRef(0);
  const doneRef = useRef(false);
  const timers = useRef([]);

  // never leave a timer dangling on unmount (question swap / game exit)
  useEffect(
    () => () => {
      timers.current.forEach((id) => clearTimeout(id));
      timers.current = [];
    },
    [],
  );

  function later(fn, ms) {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }

  function resolve(leftId, rightId) {
    if (leftId === rightId) {
      // a correct match: distinct "match" chime + a strong connect celebration.
      sounds?.play("match");
      setConnectAt(leftId);
      setSparkAt(leftId);
      setHintId(null); // any hint is resolved once a pair connects
      setMatched((prev) => {
        const next = new Set(prev);
        next.add(leftId);
        if (next.size >= pairs.length && !doneRef.current) {
          doneRef.current = true;
          sounds?.play("win");
          // brief beat so the last sparkle reads before the task passes.
          later(() => onCorrect({ matched: next.size, feedback: gd.matchDone }), 500);
        }
        return next;
      });
      setPickLeft(null);
      setPickRight(null);
      later(() => setConnectAt(null), 520);
      later(() => setSparkAt(null), 700);
    } else {
      sounds?.play("wrong");
      onWrong({ feedback: gd.matchWrong });
      setWrongIds({ left: leftId, right: rightId });
      wrongCountRef.current += 1;
      // after 2 gentle misses, softly glow one still-unmatched correct pair so
      // the child gets a lead and is never stuck.
      if (wrongCountRef.current >= 2) {
        const lead = pairs.find((p) => !matched.has(p.id));
        if (lead) {
          setHintId(lead.id);
          later(() => setHintId(null), 2600);
        }
      }
      later(() => {
        setWrongIds(null);
        setPickLeft(null);
        setPickRight(null);
      }, 480);
    }
  }

  function tapLeft(id) {
    if (matched.has(id) || doneRef.current) return;
    sounds?.play("select");
    setPickLeft(id);
    if (pickRight != null) resolve(id, pickRight);
  }

  function tapRight(id) {
    if (matched.has(id) || doneRef.current) return;
    sounds?.play("select");
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

  // exactly one card picked and waiting for its partner → encourage the child.
  // (no need to read doneRef here: on completion both picks are already cleared.)
  const onePicked = (pickLeft != null) !== (pickRight != null) && !wrongIds;

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

      {/* one-card-picked encouragement — appears only while waiting for a partner */}
      <Box sx={{ minHeight: 22, textAlign: "center" }}>
        <AnimatePresence>
          {onePicked ? (
            <motion.span
              key="picked"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              style={{
                display: "inline-block",
                background: "#f3efff",
                color: "#6536e0",
                fontSize: 12,
                fontWeight: 800,
                padding: "4px 12px",
                borderRadius: 999,
              }}
            >
              {gd.matchPicked}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {leftOrder.map((p) => (
            <Box key={`l-${p.id}`} sx={{ position: "relative" }}>
              <Card
                side="left"
                item={p}
                lng={lng}
                state={stateFor("left", p.id)}
                hint={hintId === p.id}
                connecting={connectAt === p.id}
                onTap={() => tapLeft(p.id)}
              />
              <AnimatePresence>
                {sparkAt === p.id ? <SparkleTrail count={7} size={18} /> : null}
              </AnimatePresence>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {rightOrder.map((p) => (
            <Box key={`r-${p.id}`} sx={{ position: "relative" }}>
              <Card
                side="right"
                item={p}
                lng={lng}
                state={stateFor("right", p.id)}
                hint={hintId === p.id}
                connecting={connectAt === p.id}
                onTap={() => tapRight(p.id)}
              />
              <AnimatePresence>
                {sparkAt === p.id ? <SparkleTrail count={7} size={18} /> : null}
              </AnimatePresence>
            </Box>
          ))}
        </Box>
      </Box>

      <Typography sx={{ textAlign: "center", color: "#5a4ea8", fontSize: 12, fontWeight: 700 }}>
        {gd.matchTapHint}
      </Typography>
    </Box>
  );
}
