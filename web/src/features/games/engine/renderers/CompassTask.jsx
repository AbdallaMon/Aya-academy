"use client";

// CompassTask — kind COMPASS. A radial "ToneSlider": aim a needle toward the
// Qibla (the Kaaba 🕋) and confirm when it lands within tolerance. The needle
// angle is driven by a slider (touch-friendly, no drag math) over 0..359°.
// Landing within [target ± tolerance] = pulseGlow CTA + chime + star. Outside =
// gentle "warmer/colder" hint + retry. NEVER a loss.
//
// Interactive & forgiving upgrades (owner's goal: more intense, every step its
// own sound, correct vs wrong clearly distinct, never a loss):
//   • Turning the needle SINGS — playTick(closeness) raises the pitch as the
//     child nears the Qibla (audible "warmer/colder"), instead of a flat tap.
//   • Entering tolerance fires a "lock" chime ONCE (state-guarded) + a RingPulse
//     halo blooming around the Kaaba 🕋, which also un-greys and pops.
//   • confirm(): on-target → "correct" + a confetti/sparkle celebration;
//     otherwise → "wrong" + a gentle shake on the button (never punishment),
//     keeping the live warmer/colder hint so the child is never lost.
//
// mediaJson: { targetAngle: 0..359, tolerance: degrees (default 18),
//   labelAr/labelEn?, goodAr/goodEn?, badAr/badEn?, nearAr/nearEn? }

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Slider, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "../../../../i18n/client.js";
import { pickText } from "../helpers.js";
import { Confetti, PulseGlow, RingPulse, SparkleTrail, shake } from "../../animations/index.js";

// Smallest absolute difference between two angles on a 360° circle.
function angleDelta(a, b) {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}

export default function CompassTask({ question, onCorrect, onWrong, sounds }) {
  const { t, lng } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const media = question.mediaJson || {};
  const target = ((media.targetAngle ?? 0) % 360 + 360) % 360;
  const tolerance = media.tolerance ?? 18;

  const [angle, setAngle] = useState(0);
  const [celebrate, setCelebrate] = useState(false); // confetti after a correct confirm
  const [tryShake, setTryShake] = useState(false); // gentle wobble on the button when wrong
  const wasOnTargetRef = useRef(false); // so "lock" fires only on ENTERING tolerance
  const shakeTimer = useRef(null);

  const delta = useMemo(() => angleDelta(angle, target), [angle, target]);
  const onTarget = delta <= tolerance;
  const near = delta <= tolerance * 2.4;

  // Fire the warm "lock" chime ONCE, the moment the needle enters tolerance.
  useEffect(() => {
    if (onTarget && !wasOnTargetRef.current) {
      wasOnTargetRef.current = true;
      sounds?.play("lock");
    } else if (!onTarget && wasOnTargetRef.current) {
      wasOnTargetRef.current = false;
    }
  }, [onTarget, sounds]);

  useEffect(
    () => () => {
      clearTimeout(shakeTimer.current);
    },
    [],
  );

  const label = pickText(media, "label", lng) || gd.compassLabel;
  const goodMsg = pickText(media, "good", lng) || gd.compassGood;
  const badMsg = pickText(media, "bad", lng) || gd.compassBad;
  const nearMsg = pickText(media, "near", lng) || gd.compassNear;

  const hint = onTarget ? gd.compassOnTarget : near ? nearMsg : gd.compassFar;
  // High-contrast, on-theme hint colours on the pale lilac panel: green when
  // locked, warm-amber when "warmer", deep lilac when still searching.
  const hintColor = onTarget ? "#0c8f68" : near ? "#c25a00" : "#5a5680";

  function handleChange(_, next) {
    const v = Array.isArray(next) ? next[0] : next;
    if (v === angle) return; // skip redundant fires so the pitch doesn't stutter
    setAngle(v);
    // The needle "sings": closeness 0..1 (1 = right on the Qibla) → pitch rises
    // as the child nears the Kaaba (audible warmer/colder).
    const closeness = 1 - angleDelta(v, target) / 180;
    sounds?.playTick?.(closeness);
  }

  function confirm() {
    if (onTarget) {
      sounds?.play("correct");
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1100);
      onCorrect({ angle, feedback: goodMsg });
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
          border: "2px solid #ece8ff",
          borderRadius: "18px",
          p: 2.25,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* compass dial */}
        <Box
          sx={{
            position: "relative",
            width: 200,
            height: 200,
            borderRadius: "50%",
            border: `6px solid ${onTarget ? "#18c08f" : "#d7cffb"}`,
            background:
              "radial-gradient(circle at 50% 38%, #ffffff, #f3efff 70%)",
            display: "grid",
            placeItems: "center",
            transition: "border-color .3s",
          }}
        >
          {/* the fixed Kaaba target marker sits at the target bearing */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              transform: `rotate(${target}deg)`,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 2,
                left: "50%",
                transform: "translateX(-50%)",
                width: 34,
                height: 34,
                display: "grid",
                placeItems: "center",
              }}
            >
              {/* halo blooms around the Kaaba the instant the needle locks on */}
              {onTarget ? <RingPulse color="#18c08f" count={2} size={40} /> : null}
              <motion.span
                animate={
                  onTarget
                    ? { scale: [1, 1.35, 1], rotate: [0, -8, 8, 0] }
                    : { scale: 1, rotate: 0 }
                }
                transition={onTarget ? { duration: 0.6 } : { duration: 0.2 }}
                style={{
                  fontSize: 24,
                  lineHeight: 1,
                  zIndex: 1,
                  filter: onTarget ? "none" : "grayscale(0.4) opacity(0.75)",
                }}
              >
                🕋
              </motion.span>
            </Box>
          </Box>

          {/* the movable needle */}
          <motion.div
            animate={{ rotate: angle }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            style={{
              position: "absolute",
              width: 8,
              height: 86,
              top: 14,
              left: "calc(50% - 4px)",
              transformOrigin: "50% 86px",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                margin: "0 auto",
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderBottom: `20px solid ${onTarget ? "#18c08f" : "#7c4dff"}`,
              }}
            />
            <div
              style={{
                width: 6,
                height: 64,
                margin: "0 auto",
                borderRadius: 4,
                background: onTarget ? "#18c08f" : "#7c4dff",
              }}
            />
          </motion.div>

          {/* hub */}
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: onTarget ? "#0fa377" : "#6536e0",
              zIndex: 2,
            }}
          />
        </Box>

        <Typography sx={{ fontWeight: 800, fontSize: 13, mt: 1.5, color: "#2b2350", textAlign: "center" }}>
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: 13, minHeight: 36, lineHeight: 1.5, color: hintColor, textAlign: "center" }}>
          {hint}
        </Typography>

        <Slider
          value={angle}
          min={0}
          max={359}
          onChange={handleChange}
          aria-label="compass"
          sx={{ width: "100%", mt: 0.5, color: onTarget ? "#18c08f" : "#7c4dff" }}
        />
      </Box>

      <PulseGlow active={onTarget} style={{ borderRadius: 16 }}>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          animate={tryShake ? shake.shake : { x: 0 }}
          transition={tryShake ? { duration: 0.45 } : { duration: 0.2 }}
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
            background: onTarget
              ? "linear-gradient(180deg, #20cf99, #0fa377)"
              : "linear-gradient(180deg, #8a5bff, #6536e0)",
          }}
        >
          {onTarget ? gd.compassConfirmGood : gd.compassConfirmTry}
        </motion.button>
      </PulseGlow>

      {/* a short celebration burst when they confirm the right Qibla */}
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
