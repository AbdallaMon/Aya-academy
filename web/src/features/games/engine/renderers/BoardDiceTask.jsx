"use client";

// BoardDiceTask — kind BOARD_DICE. «سُلّم الأخلاق»: a gentle snakes-&-ladders
// board. Tap the die to roll (1..6), the token hops forward, and good-manners
// squares give a friendly LADDER climb up (with a happy message); careless
// squares are a tiny SLIDE back (never harsh, always with a kind nudge). Reach
// the final square = win → the task passes (onCorrect → one star). No game-over.
//
// Interactive & forgiving (per the owner's golden rule — NO failure ever):
//   • Rolling the die plays a soft tumble ("roll") while the faces shuffle, then
//     a "pop" when it settles — every step has its own distinct sound.
//   • Landing on a LADDER: a bright climb sound + the token HOPS upward (a happy
//     up-animation) + a green "yay, a kind deed lifted you" toast.
//   • Landing on a SLIDE: a gentle "slip" sound (never the harsh wrong chime) +
//     the token slides DOWN softly + a warm "no worries, next time's better"
//     toast — a nudge, never a punishment.
//   • Reaching the end: a full "win" fanfare + a confetti burst.
//
// mediaJson: {
//   size: number of squares (default 16),
//   squares: { "<index>": { type: "ladder"|"slide", to: <index>,
//                            msgAr/msgEn, emoji? } },
//   winAr/winEn?: message on reaching the end
// }
//
// Note: Math.random is fine in the browser here (per task brief).

import { useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "../../../../i18n/client.js";
import { pickText } from "../helpers.js";
import { jelly, SparkleTrail, Confetti } from "../../animations/index.js";

const DIE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

// Per-move token animation: a happy upward hop for a ladder, a soft droop for a
// slide, and a gentle bob otherwise. Distinct so the child *sees* the outcome.
function tokenMotion(move) {
  if (move === "ladder") {
    return {
      y: [0, -16, -6, -14, 0],
      scale: [1, 1.18, 1.04, 1.12, 1],
      rotate: [0, -6, 6, -3, 0],
      transition: { duration: 0.7, ease: "easeOut" },
    };
  }
  if (move === "slide") {
    return {
      y: [0, 4, 10, 5, 0],
      scale: [1, 0.92, 0.96, 0.94, 1],
      rotate: [0, 4, -3, 2, 0],
      transition: { duration: 0.7, ease: "easeInOut" },
    };
  }
  return jelly(true);
}

export default function BoardDiceTask({ question, onCorrect, sounds }) {
  const { t, lng } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const media = question.mediaJson || {};
  const size = media.size ?? 16;
  const squares = media.squares || {};
  const last = size - 1;

  const [pos, setPos] = useState(0);
  const [die, setDie] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [won, setWon] = useState(false);
  const [toast, setToast] = useState(null); // landed-square message
  const [move, setMove] = useState(null); // "ladder" | "slide" | null → token anim
  const doneRef = useRef(false);
  const busyRef = useRef(false);

  // Build a serpentine (boustrophedon) grid so the path snakes row by row.
  const cols = 4;
  const grid = useMemo(() => {
    const rows = Math.ceil(size / cols);
    const out = [];
    for (let r = rows - 1; r >= 0; r--) {
      const rowStart = r * cols;
      const row = Array.from({ length: cols }, (_, c) => rowStart + c).filter((i) => i < size);
      out.push(r % 2 === 1 ? [...row].reverse() : row);
    }
    return out;
  }, [size]);

  function finishAt(index) {
    if (index >= last && !doneRef.current) {
      doneRef.current = true;
      setWon(true);
      sounds?.play("win");
      setTimeout(() => onCorrect({ reached: index, feedback: pickText(media, "win", lng) || gd.boardWin }), 700);
    }
  }

  function applySquare(landed) {
    const rule = squares[String(landed)];
    if (!rule) {
      finishAt(landed);
      busyRef.current = false;
      return;
    }
    const isLadder = rule.type === "ladder";
    // Fall back to a kind default message so the toast is never empty.
    const msg = pickText(rule, "msg", lng) || (isLadder ? gd.boardLadder : gd.boardSlide);
    if (isLadder) {
      sounds?.play("climb"); // bright rising glissando — a happy lift up
    } else {
      sounds?.play("slip"); // soft downward glide — gentle, never harsh
    }
    setTimeout(() => {
      const dest = Math.max(0, Math.min(last, rule.to ?? landed));
      setMove(isLadder ? "ladder" : "slide"); // drive the token hop/slide anim
      setPos(dest);
      // surface the square's kind message as a local toast under the board.
      setToast({ msg, type: rule.type, emoji: rule.emoji });
      setTimeout(() => {
        setToast(null);
        setMove(null);
        finishAt(dest);
        busyRef.current = false;
      }, 1100);
    }, 450);
  }

  function roll() {
    if (rolling || won || doneRef.current || busyRef.current) return;
    busyRef.current = true;
    setRolling(true);
    setMove(null);
    sounds?.play("roll"); // a little tumble of soft clicks while it spins
    // quick face shuffle for feel
    let ticks = 0;
    const spin = setInterval(() => {
      setDie(1 + ((Math.random() * 6) | 0));
      if (++ticks >= 6) {
        clearInterval(spin);
        const value = 1 + ((Math.random() * 6) | 0);
        setDie(value);
        setRolling(false);
        sounds?.play("pop"); // it settles with a happy pop
        setPos((cur) => {
          const landed = Math.min(last, cur + value);
          setTimeout(() => applySquare(landed), 350);
          return landed;
        });
      }
    }, 70);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, position: "relative" }}>
      {/* board */}
      <Box
        sx={{
          background: "linear-gradient(180deg,#fbf7ff,#f3efff)",
          border: "2px solid #ece8ff",
          borderRadius: "18px",
          p: 1.25,
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
        }}
      >
        {grid.map((row, ri) => (
          <Box key={ri} sx={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 0.75 }}>
            {row.map((index) => {
              const rule = squares[String(index)];
              const here = pos === index;
              const isEnd = index === last;
              const bg = isEnd
                ? "#fff2c2"
                : rule?.type === "ladder"
                  ? "#e7fbf3"
                  : rule?.type === "slide"
                    ? "#ffeef2"
                    : "#fff";
              const border = isEnd
                ? "#ffce4a"
                : rule?.type === "ladder"
                  ? "#b5f0db"
                  : rule?.type === "slide"
                    ? "#ffd5de"
                    : "#ece8ff";
              return (
                <Box
                  key={index}
                  sx={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    border: `2px solid ${border}`,
                    background: bg,
                    borderRadius: 12,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 20,
                  }}
                >
                  <span style={{ position: "absolute", top: 2, insetInlineStart: 4, fontSize: 9, fontWeight: 800, color: "#9a92c4" }}>
                    {index + 1}
                  </span>
                  <span>{isEnd ? "🏆" : rule?.emoji || (rule?.type === "ladder" ? "🪜" : rule?.type === "slide" ? "🛝" : "")}</span>
                  {here ? (
                    <motion.span
                      layoutId="board-token"
                      animate={tokenMotion(move)}
                      style={{ position: "absolute", bottom: 2, fontSize: 22, zIndex: 2 }}
                    >
                      🧒
                    </motion.span>
                  ) : null}
                  {/* a little sparkle ring on the square we just hopped UP to */}
                  {here && move === "ladder" ? <SparkleTrail count={5} size={16} /> : null}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* toast for the landed-square message (color-matched to ladder/slide) */}
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <Box
            sx={{
              borderRadius: "14px",
              px: 1.5,
              py: 1,
              fontWeight: 800,
              fontSize: 13,
              textAlign: "center",
              color: toast.type === "ladder" ? "#0fa377" : "#b9760a",
              background: toast.type === "ladder" ? "#e7fbf3" : "#fff6e2",
              border: `2px solid ${toast.type === "ladder" ? "#b5f0db" : "#ffe2a6"}`,
            }}
          >
            {toast.emoji ? `${toast.emoji} ` : ""}
            {toast.msg}
          </Box>
        </motion.div>
      ) : null}

      {/* die + roll */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, justifyContent: "center" }}>
        <motion.div
          animate={rolling ? { rotate: [0, -14, 14, -10, 10, -6, 0], scale: [1, 1.08, 0.96, 1.06, 1] } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "#fff",
            border: "2px solid #ece8ff",
            display: "grid",
            placeItems: "center",
            fontSize: 44,
            lineHeight: 1,
            color: "#6536e0",
          }}
        >
          {DIE_FACES[die - 1]}
        </motion.div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          animate={!rolling && !won ? { scale: [1, 1.03, 1] } : { scale: 1 }}
          transition={!rolling && !won ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
          onClick={roll}
          disabled={rolling || won}
          style={{
            border: "none",
            borderRadius: 16,
            padding: "16px 22px",
            fontWeight: 900,
            fontSize: 16,
            cursor: rolling || won ? "default" : "pointer",
            color: "#fff",
            fontFamily: "inherit",
            opacity: rolling || won ? 0.7 : 1,
            background: "linear-gradient(180deg, #8a5bff, #6536e0)",
          }}
        >
          {won ? gd.boardReached : gd.boardRoll}
        </motion.button>
      </Box>

      <Typography sx={{ textAlign: "center", color: "#6b6790", fontSize: 12, fontWeight: 700 }}>
        {gd.boardHint}
      </Typography>

      {/* big celebration on reaching the top */}
      {won ? (
        <>
          <SparkleTrail count={10} size={26} />
          <Confetti count={28} />
        </>
      ) : null}
    </Box>
  );
}
