"use client";

// ToneSliderTask — a slider with live emoji + sound-bars + caption. Correct =
// landing in [goodMin, goodMax]. No options; correctness comes from the slider
// position. Confirming in the good zone lights a star; outside = gentle retry.
//
// Interactive & forgiving upgrades (owner's goal: more intense, every step its
// own sound, correct vs wrong clearly distinct, never a loss):
//   • Dragging the slider SINGS — playTick(ratio) glides the pitch with the
//     value (a little theremin), instead of one flat "tap" on every change.
//   • Entering the golden "mid" zone fires a "lock" cue ONCE (state-guarded) +
//     a RingPulse halo around the happy face + a breathing glow on the button —
//     so the child feels "you got it, press now!".
//   • The sound-bars + face are livelier: bars dance with a per-bar wobble in
//     the good zone, the face wiggles when locked.
//   • confirm(): mid → "correct" + a confetti/sparkle celebration; otherwise
//     "wrong" + a gentle shake on the button (never punishment) + the existing
//     hint that points to the middle, so they always know the fix.

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Slider, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "../../../../i18n/client.js";
import { pickText } from "../helpers.js";
import { Confetti, RingPulse, SparkleTrail, shake } from "../../animations/index.js";

export default function ToneSliderTask({ question, onCorrect, onWrong, sounds }) {
  const { t, lng } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const media = question.mediaJson || {};
  const min = media.min ?? 0;
  const max = media.max ?? 100;
  const goodMin = media.goodMin ?? 34;
  const goodMax = media.goodMax ?? 66;

  const [value, setValue] = useState(Math.round((min + max) / 2));
  const [celebrate, setCelebrate] = useState(false); // confetti after a correct confirm
  const [tryShake, setTryShake] = useState(false); // gentle wobble on the button when wrong
  const wasMidRef = useRef(false); // so "lock" fires only on ENTERING the zone
  const shakeTimer = useRef(null);

  const zone = useMemo(() => {
    if (value < goodMin) return "low";
    if (value > goodMax) return "high";
    return "mid";
  }, [value, goodMin, goodMax]);

  const locked = zone === "mid";

  // 0..1 position of the slider — drives both the live pitch and the bars.
  const ratio = (value - min) / (max - min || 1);

  // Fire the warm "lock" chime + halo ONCE, the moment we enter the golden zone.
  useEffect(() => {
    if (locked && !wasMidRef.current) {
      wasMidRef.current = true;
      sounds?.play("lock");
    } else if (!locked && wasMidRef.current) {
      wasMidRef.current = false;
    }
  }, [locked, sounds]);

  useEffect(
    () => () => {
      clearTimeout(shakeTimer.current);
    },
    [],
  );

  const labels = media.labels || {};
  const lowLabel = pickText(labels, "low", lng) || gd.toneLow;
  const midLabel = pickText(labels, "mid", lng) || gd.toneMid;
  const highLabel = pickText(labels, "high", lng) || gd.toneHigh;

  const face = locked ? "😊" : zone === "low" ? "🤫" : "😣";
  const desc = locked ? gd.toneMid : zone === "low" ? gd.toneLow : gd.toneHigh;
  // High-contrast, on-theme caption colours: green when golden, warm-amber when
  // off (both read clearly on the pale lilac panel).
  const descColor = locked ? "#0c8f68" : zone === "low" ? "#7a5bd6" : "#c25a00";

  const goodMsg = pickText(media, "good", lng) || gd.greatJob;
  const badMsg = pickText(media, "bad", lng) || gd.toneWrong;

  const level = Math.round(ratio * 7) + 1;

  function handleChange(_, next) {
    const v = Array.isArray(next) ? next[0] : next;
    if (v === value) return; // skip redundant fires so the pitch doesn't stutter
    setValue(v);
    // The slider "sings": pitch rises/falls with the value (theremin feel).
    sounds?.playTick?.((v - min) / (max - min || 1));
  }

  function confirm() {
    if (locked) {
      sounds?.play("correct");
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1100);
      onCorrect({ value, feedback: goodMsg });
    } else {
      sounds?.play("wrong");
      setTryShake(true);
      clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setTryShake(false), 480);
      onWrong({ feedback: badMsg });
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, position: "relative" }}>
      <Box
        sx={{
          background: "#faf9ff",
          border: `2px solid ${locked ? "#bff0df" : "#ece8ff"}`,
          borderRadius: "18px",
          p: 2.25,
          transition: "border-color .3s",
        }}
      >
        {/* live sound bars — dance with the value; in the golden zone each bar
            wobbles on its own beat so the meter feels alive */}
        <Box sx={{ display: "flex", gap: "5px", justifyContent: "center", alignItems: "flex-end", height: 40 }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const on = i < level;
            const barColor = locked ? "#18c08f" : zone === "high" ? "#ff6b8a" : "#c9c2ec";
            return (
              <motion.i
                key={i}
                animate={{
                  height: on ? (locked ? [10 + i * 4, 16 + i * 4, 10 + i * 4] : 10 + i * 4) : 6,
                  backgroundColor: barColor,
                }}
                transition={
                  on && locked
                    ? { duration: 0.5 + i * 0.05, repeat: Infinity, ease: "easeInOut" }
                    : { type: "spring", stiffness: 320, damping: 18 }
                }
                style={{ width: 7, borderRadius: 4, display: "inline-block" }}
              />
            );
          })}
        </Box>

        {/* the face, with a "locked-on" halo + a happy wiggle when golden */}
        <Box sx={{ position: "relative", margin: "8px 0", display: "grid", placeItems: "center" }}>
          {locked ? <RingPulse color="#18c08f" count={2} size={88} /> : null}
          <motion.div
            key={face}
            initial={{ scale: 0.6 }}
            animate={
              locked
                ? { scale: 1, rotate: [0, -6, 6, -3, 0] }
                : { scale: 1, rotate: 0 }
            }
            transition={
              locked
                ? { rotate: { duration: 0.6 }, scale: { type: "spring", stiffness: 400, damping: 16 } }
                : { type: "spring", stiffness: 400, damping: 16 }
            }
            style={{ fontSize: 60, textAlign: "center", zIndex: 1 }}
          >
            {face}
          </motion.div>
        </Box>

        <Typography sx={{ textAlign: "center", fontWeight: 800, fontSize: 13, minHeight: 38, lineHeight: 1.5, color: descColor }}>
          {desc}
        </Typography>

        <Slider
          value={value}
          min={min}
          max={max}
          onChange={handleChange}
          aria-label={gd.toneSliderHint}
          sx={{ mt: 1, color: locked ? "#18c08f" : "#7c4dff" }}
        />

        <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#5a5680", mt: 0.5 }}>
          <span>{lowLabel}</span>
          <span>{midLabel}</span>
          <span>{highLabel}</span>
        </Box>
      </Box>

      {/* confirm button: breathes when golden, gives a gentle shake when off */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        animate={
          tryShake
            ? shake.shake
            : locked
              ? {
                  scale: [1, 1.04, 1],
                  boxShadow: [
                    "0 8px 18px rgba(24,192,143,0.30)",
                    "0 12px 30px rgba(24,192,143,0.55)",
                    "0 8px 18px rgba(24,192,143,0.30)",
                  ],
                }
              : { scale: 1, boxShadow: "0 6px 16px rgba(101,54,224,0.22)" }
        }
        transition={
          tryShake
            ? { duration: 0.45 }
            : locked
              ? { duration: 1.3, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.25 }
        }
        onClick={confirm}
        style={{
          border: "none",
          borderRadius: 16,
          padding: "15px 18px",
          fontWeight: 900,
          fontSize: 16,
          cursor: "pointer",
          width: "100%",
          color: "#fff",
          fontFamily: "inherit",
          marginTop: 6,
          background: locked
            ? "linear-gradient(180deg, #20cf99, #0fa377)"
            : "linear-gradient(180deg, #8a5bff, #6536e0)",
        }}
      >
        {locked ? gd.toneConfirmGood : gd.toneConfirmTry}
      </motion.button>

      {/* a short celebration burst when they confirm the golden voice */}
      <AnimatePresence>
        {celebrate ? (
          <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <Confetti count={26} />
            <SparkleTrail count={7} />
          </Box>
        ) : null}
      </AnimatePresence>
    </Box>
  );
}
