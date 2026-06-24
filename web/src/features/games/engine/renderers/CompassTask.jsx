"use client";

// CompassTask — kind COMPASS. A radial "ToneSlider": aim a needle toward the
// Qibla (the Kaaba 🕋) and confirm when it lands within tolerance. The needle
// angle is driven by a slider (touch-friendly, no drag math) over 0..359°.
// Landing within [target ± tolerance] = pulseGlow CTA + chime + star. Outside =
// gentle "warmer/colder" hint + retry. NEVER a loss.
//
// mediaJson: { targetAngle: 0..359, tolerance: degrees (default 18),
//   labelAr/labelEn?, goodAr/goodEn?, badAr/badEn?, nearAr/nearEn? }

import { useMemo, useState } from "react";
import { Box, Slider, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "../../../../i18n/client.js";
import { pickText } from "../helpers.js";
import { PulseGlow } from "../../animations/index.js";

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

  const delta = useMemo(() => angleDelta(angle, target), [angle, target]);
  const onTarget = delta <= tolerance;
  const near = delta <= tolerance * 2.4;

  const label = pickText(media, "label", lng) || gd.compassLabel;
  const goodMsg = pickText(media, "good", lng) || gd.compassGood;
  const badMsg = pickText(media, "bad", lng) || gd.compassBad;
  const nearMsg = pickText(media, "near", lng) || gd.compassNear;

  const hint = onTarget ? gd.compassOnTarget : near ? nearMsg : gd.compassFar;
  const hintColor = onTarget ? "#0fa377" : near ? "#b9760a" : "#6b6790";

  function handleChange(_, next) {
    const v = Array.isArray(next) ? next[0] : next;
    setAngle(v);
    sounds?.play("tap");
  }

  function confirm() {
    if (onTarget) {
      sounds?.play("correct");
      onCorrect({ angle, feedback: goodMsg });
    } else {
      sounds?.play("wrong");
      onWrong({ feedback: badMsg });
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
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
                top: 6,
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 24,
                lineHeight: 1,
                filter: onTarget ? "none" : "grayscale(0.4) opacity(0.75)",
              }}
            >
              🕋
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
    </Box>
  );
}
