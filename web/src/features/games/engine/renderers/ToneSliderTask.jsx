"use client";

// ToneSliderTask — a slider with live emoji + sound-bars + caption. Correct =
// landing in [goodMin, goodMax]. No options; correctness comes from the slider
// position. Confirming in the good zone lights a star; outside = gentle retry.

import { useMemo, useState } from "react";
import { Box, Slider, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "../../../../i18n/client.js";
import { pickText } from "../helpers.js";

export default function ToneSliderTask({ question, onCorrect, onWrong, sounds }) {
  const { t, lng } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const media = question.mediaJson || {};
  const min = media.min ?? 0;
  const max = media.max ?? 100;
  const goodMin = media.goodMin ?? 34;
  const goodMax = media.goodMax ?? 66;

  const [value, setValue] = useState(Math.round((min + max) / 2));

  const zone = useMemo(() => {
    if (value < goodMin) return "low";
    if (value > goodMax) return "high";
    return "mid";
  }, [value, goodMin, goodMax]);

  const labels = media.labels || {};
  const lowLabel = pickText(labels, "low", lng) || gd.toneLow;
  const midLabel = pickText(labels, "mid", lng) || gd.toneMid;
  const highLabel = pickText(labels, "high", lng) || gd.toneHigh;

  const face = zone === "mid" ? "😊" : zone === "low" ? "🤫" : "😣";
  const desc = zone === "mid" ? gd.toneMid : zone === "low" ? gd.toneLow : gd.toneHigh;
  const descColor = zone === "mid" ? "#0fa377" : "#b9760a";

  const goodMsg = pickText(media, "good", lng) || gd.greatJob;
  const badMsg = pickText(media, "bad", lng) || gd.toneWrong;

  const level = Math.round(((value - min) / (max - min || 1)) * 7) + 1;

  function handleChange(_, next) {
    const v = Array.isArray(next) ? next[0] : next;
    setValue(v);
    sounds?.play("tap");
  }

  function confirm() {
    if (zone === "mid") {
      sounds?.play("correct");
      onCorrect({ value, feedback: goodMsg });
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
        }}
      >
        {/* live sound bars */}
        <Box sx={{ display: "flex", gap: "5px", justifyContent: "center", alignItems: "flex-end", height: 40 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.i
              key={i}
              animate={{
                height: i < level ? 10 + i * 4 : 6,
                backgroundColor:
                  zone === "mid" ? "#18c08f" : zone === "high" ? "#ff6b8a" : "#c9c2ec",
              }}
              style={{ width: 7, borderRadius: 4, display: "inline-block" }}
            />
          ))}
        </Box>

        <motion.div
          key={face}
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 16 }}
          style={{ fontSize: 60, textAlign: "center", margin: "8px 0" }}
        >
          {face}
        </motion.div>

        <Typography sx={{ textAlign: "center", fontWeight: 800, fontSize: 13, minHeight: 38, lineHeight: 1.5, color: descColor }}>
          {desc}
        </Typography>

        <Slider
          value={value}
          min={min}
          max={max}
          onChange={handleChange}
          aria-label="tone"
          sx={{ mt: 1, color: zone === "mid" ? "#18c08f" : "#7c4dff" }}
        />

        <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#6b6790", mt: 0.5 }}>
          <span>{lowLabel}</span>
          <span>{midLabel}</span>
          <span>{highLabel}</span>
        </Box>
      </Box>

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
          marginTop: 6,
          background:
            zone === "mid"
              ? "linear-gradient(180deg, #8a5bff, #6536e0)"
              : "linear-gradient(180deg, #ffb43d, #f6970a)",
        }}
      >
        {zone === "mid" ? gd.toneConfirmGood : gd.toneConfirmTry}
      </motion.button>
    </Box>
  );
}
