"use client";

// DialpadTask — tap mediaJson.sequence digits in order, then the green call key.
// Kids rules: no loss, the correct digits ALWAYS stay put, and the child is
// always shown which digit to press next.
//
// Forgiving + guided:
//   • The display shows the ACTUAL digits typed. Each box is green when it
//     matches its position, red (with a shake) when it doesn't.
//   • The CURRENT box shows a faint "ghost" of the digit to press, and the right
//     key GLOWS on the pad — so the child always knows "which number do I press?".
//   • Every key plays its own "ring" tone (sounds.playDigit).
//   • A wrong digit is NOT auto-removed — it stays (red) and the CLEAR key glows
//     so the child can fix it; the correct digits before it are untouched.
//   • If all boxes are full but not yet correct, a new tap REPLACES the last
//     digit (instead of being rejected) so fixing the last box is effortless.
//
// Per the contract, a DIALPAD with `thenChoose` is followed by a MULTIPLE_CHOICE
// question; completing the dial simply advances (lights a star).

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "../../../../i18n/client.js";
import { PulseGlow, RingPulse, shake } from "../../animations/index.js";

const PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "call", "0", "del"];

const KEY_PULSE = {
  scale: [1, 1.12, 1],
  boxShadow: [
    "0 0 0 0 rgba(124,77,255,0)",
    "0 0 0 6px rgba(124,77,255,0.35)",
    "0 0 0 0 rgba(124,77,255,0)",
  ],
};
const DEL_PULSE = {
  scale: [1, 1.08, 1],
  boxShadow: [
    "0 0 0 0 rgba(255,95,162,0)",
    "0 0 0 6px rgba(255,95,162,0.45)",
    "0 0 0 0 rgba(255,95,162,0)",
  ],
};

export default function DialpadTask({ question, onCorrect, onWrong, sounds }) {
  const { t } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const sequence = useMemo(
    () => String(question.mediaJson?.sequence ?? "").split(""),
    [question],
  );

  const [dialed, setDialed] = useState([]);
  const [shakeAt, setShakeAt] = useState(null);
  const [calling, setCalling] = useState(false);
  const shakeTimer = useRef(null);

  const ready = dialed.join("") === sequence.join("") && sequence.length > 0;
  const full = dialed.length >= sequence.length;
  // The slot to fill next — or the last slot if full but not yet correct (so a
  // new tap fixes that slot instead of being rejected).
  const targetIndex = full ? sequence.length - 1 : dialed.length;
  const nextCorrectKey = sequence[targetIndex];
  // A wrong digit is sitting somewhere → point the child to CLEAR.
  const hasWrong = dialed.some((d, i) => d !== sequence[i]);

  useEffect(() => () => clearTimeout(shakeTimer.current), []);

  function flashShake(idx) {
    setShakeAt(idx);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShakeAt(null), 520);
  }

  function pressDigit(k) {
    if (calling) return;
    sounds?.playDigit?.(k); // a unique "ring" note per key
    if (ready) {
      // already complete & correct — just nudge to press call
      sounds?.play("oops");
      onWrong({ feedback: gd.dialReady });
      return;
    }
    const idx = targetIndex;
    const correct = k === sequence[idx];
    // Append, or REPLACE the last digit when full — correct digits already
    // entered always stay put.
    setDialed((prev) =>
      prev.length >= sequence.length ? [...prev.slice(0, -1), k] : [...prev, k],
    );
    if (!correct) {
      flashShake(idx);
      sounds?.play("oops");
      onWrong({ feedback: gd.dialWrongDigit });
    }
  }

  function pressDelete() {
    if (calling) return;
    if (dialed.length === 0) {
      sounds?.play("oops");
      onWrong({ feedback: gd.dialEmptyDel });
      return;
    }
    sounds?.play("tap");
    setDialed((prev) => prev.slice(0, -1));
  }

  function pressCall() {
    if (calling) return;
    if (ready) {
      sounds?.play("ring");
      setCalling(true);
      onCorrect({ dialSuccess: true, feedback: gd.calling });
    } else {
      sounds?.play("wrong");
      onWrong({ feedback: dialed.length ? gd.dialWrong : gd.dialHint });
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, position: "relative" }}>
      {/* typed-digits display */}
      <Box>
        <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#6b6790", mb: 0.5, textAlign: "center" }}>
          📞 {gd.dialTyped}
        </Typography>
        <motion.div
          animate={shakeAt != null ? shake.shake : { x: 0 }}
          style={{
            background: "#f3f1ff",
            border: "2px solid #ece8ff",
            borderRadius: 16,
            minHeight: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "8px 10px",
          }}
        >
          {sequence.map((digit, i) => {
            const typed = i < dialed.length;
            const isCursor = i === targetIndex && !ready && !calling;
            const correct = typed && dialed[i] === sequence[i];
            const bg = !typed ? "#fff" : correct ? "#e7fbf3" : "#ffeef2";
            const border = isCursor
              ? "#7c4dff"
              : !typed
                ? "#e6e2fb"
                : correct
                  ? "#18c08f"
                  : "#ff5fa2";
            const color = !typed ? "#cdc7ee" : correct ? "#0fa377" : "#d6436a";
            return (
              <motion.div
                key={i}
                animate={
                  isCursor
                    ? { scale: [1, 1.08, 1], borderColor: ["#7c4dff", "#c3adff", "#7c4dff"] }
                    : { scale: 1 }
                }
                transition={isCursor ? { duration: 1.1, repeat: Infinity } : { duration: 0.2 }}
                style={{
                  width: 40,
                  height: 48,
                  borderRadius: 12,
                  border: `2px solid ${border}`,
                  background: bg,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 24,
                  fontWeight: 900,
                  color,
                  flex: "none",
                }}
              >
                {typed ? (
                  dialed[i]
                ) : (
                  // ghost of the digit to press here (only on the active box)
                  <span style={{ color: "#c9bdf2", fontWeight: 900 }}>
                    {isCursor ? digit : "•"}
                  </span>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </Box>

      {/* keypad */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.25 }}>
        {PAD_KEYS.map((k) => {
          if (k === "call") {
            return (
              <PulseGlow key="call" active={ready && !calling} style={{ borderRadius: 16 }}>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  animate={ready && !calling ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={ready && !calling ? { duration: 0.9, repeat: Infinity } : {}}
                  onClick={pressCall}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 16,
                    padding: "16px 0",
                    fontSize: 22,
                    fontWeight: 900,
                    cursor: "pointer",
                    color: "#fff",
                    background: "linear-gradient(180deg, #20cf99, #0fa377)",
                    fontFamily: "inherit",
                  }}
                  aria-label="call"
                >
                  📞
                </motion.button>
              </PulseGlow>
            );
          }
          if (k === "del") {
            // glow CLEAR when there's a wrong digit to fix
            const delGlow = hasWrong && !calling;
            return (
              <motion.button
                key="del"
                type="button"
                whileTap={{ scale: 0.94 }}
                animate={delGlow ? DEL_PULSE : { scale: 1, boxShadow: "0 0 0 0 rgba(0,0,0,0)" }}
                transition={delGlow ? { duration: 0.9, repeat: Infinity } : { duration: 0.2 }}
                onClick={pressDelete}
                style={{
                  border: "2px solid #ffd5de",
                  background: "#ffeef2",
                  color: "#d6436a",
                  borderRadius: 16,
                  padding: "16px 0",
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {gd.dialClear}
              </motion.button>
            );
          }
          // glow the next correct key — but not while a wrong digit needs clearing
          const glow = !ready && !calling && !hasWrong && nextCorrectKey === k;
          return (
            <motion.button
              key={k}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => pressDigit(k)}
              animate={glow ? KEY_PULSE : { scale: 1, boxShadow: "0 0 0 0 rgba(0,0,0,0)" }}
              transition={glow ? { duration: 0.9, repeat: Infinity } : { duration: 0.2 }}
              style={{
                background: glow ? "#f3efff" : "#fff",
                border: `2px solid ${glow ? "#7c4dff" : "#ece8ff"}`,
                borderRadius: 16,
                padding: "16px 0",
                fontSize: 22,
                fontWeight: 900,
                cursor: "pointer",
                color: "#2b2350",
                fontFamily: "inherit",
              }}
            >
              {k}
            </motion.button>
          );
        })}
      </Box>

      <Typography sx={{ textAlign: "center", color: "#6b6790", fontSize: 12 }}>
        {hasWrong ? gd.dialWrongDigit : ready ? gd.dialReady : gd.dialHint}
      </Typography>

      {/* ringing overlay after a correct call */}
      {calling ? (
        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <RingPulse color="#18c08f" count={3} size={120} />
          <motion.div
            animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            style={{ fontSize: 56, zIndex: 4 }}
          >
            📞
          </motion.div>
        </Box>
      ) : null}
    </Box>
  );
}
