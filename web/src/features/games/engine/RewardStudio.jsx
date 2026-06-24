"use client";

// RewardStudio — shown after all stars are earned, ONLY when
// configJson.rewardStudio exists. The child picks a cover color and up to 5
// stickers with a live phone-style preview, then continues to the certificate.
// Replay restarts the whole game.

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "../../../i18n/client.js";
import { BounceIn } from "../animations/index.js";

const STICKER_POS = [
  [16, 60], [70, 40], [40, 78], [78, 72], [22, 30],
];

export default function RewardStudio({ studio, onContinue, onReplay, sounds, setGuide }) {
  const { t } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const colors = studio?.coverColors || ["#FFC107", "#22C55E", "#3B82F6"];
  const stickerPool = studio?.stickers || ["⭐", "👑", "🚀"];

  const [color, setColor] = useState(colors[colors.length - 1]);
  const [chosen, setChosen] = useState([]);

  function addSticker(s) {
    if (chosen.length >= 5) {
      sounds?.play("wrong");
      setGuide?.(gd.studioMax, "bad");
      return;
    }
    sounds?.play("star");
    setChosen((prev) => [...prev, s]);
    setGuide?.(gd.studioAdded, "good");
  }

  function clearStickers() {
    sounds?.play("tap");
    setChosen([]);
  }

  return (
    <BounceIn style={{ width: "100%" }}>
      <Typography sx={{ textAlign: "center", color: "#6536e0", fontWeight: 900, fontSize: 19 }}>
        {gd.studioTitle}
      </Typography>
      <Typography sx={{ textAlign: "center", color: "#6b6790", fontSize: 13, mt: 0.5 }}>
        {gd.studioSubtitle}
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 1.75, alignItems: "start", mt: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 13, my: 1 }}>{gd.studioPickColor}</Typography>
          <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
            {colors.map((c) => (
              <motion.button
                key={c}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => { sounds?.play("pick"); setColor(c); }}
                aria-label={`color ${c}`}
                style={{
                  width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
                  border: "3px solid #fff", boxShadow: c === color ? "0 0 0 3px #6536e0" : "0 0 0 2px #e6e2fb",
                  background: c, position: "relative", color: "#fff", fontWeight: 900, fontSize: 14,
                }}
              >
                {c === color ? "✓" : ""}
              </motion.button>
            ))}
          </Box>

          <Typography sx={{ fontWeight: 800, fontSize: 13, mt: 2, mb: 1 }}>{gd.studioPickStickers}</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
            {stickerPool.map((s, i) => (
              <motion.button
                key={`${s}-${i}`}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => addSticker(s)}
                style={{
                  border: "2px solid #ece8ff", borderRadius: 12, padding: "10px 0",
                  fontSize: 22, cursor: "pointer", background: "#fff", fontFamily: "inherit",
                }}
              >
                {s}
              </motion.button>
            ))}
          </Box>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={clearStickers}
            style={{
              marginTop: 10, width: "100%", border: "none", borderRadius: 16,
              padding: "12px", fontWeight: 900, fontSize: 14, cursor: "pointer",
              background: "#eef0fb", color: "#2b2350", fontFamily: "inherit",
            }}
          >
            {gd.studioClear}
          </motion.button>
        </Box>

        {/* live preview */}
        <Box
          sx={{
            borderRadius: "26px", height: 250, p: 1.5, position: "relative", overflow: "hidden",
            boxShadow: "inset 0 0 0 4px rgba(0,0,0,0.06)", transition: "background .2s",
            background: color,
          }}
        >
          <Box sx={{ width: 50, height: 6, borderRadius: 6, background: "rgba(0,0,0,0.25)", mx: "auto", mt: 0.5, mb: 1.5 }} />
          <Box sx={{ background: "rgba(255,255,255,0.92)", borderRadius: "12px", p: 1, textAlign: "center", fontSize: 11, fontWeight: 800, color: "#2b2350" }}>
            📱
          </Box>
          {chosen.map((s, i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.2 }}
              style={{
                position: "absolute", fontSize: 26,
                top: `${STICKER_POS[i][0]}%`, insetInlineStart: `${STICKER_POS[i][1]}%`,
              }}
            >
              {s}
            </motion.span>
          ))}
        </Box>
      </Box>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => { sounds?.play("win"); onContinue(); }}
        style={{
          marginTop: 18, width: "100%", border: "none", borderRadius: 16, padding: "15px",
          fontWeight: 900, fontSize: 16, cursor: "pointer", color: "#fff", fontFamily: "inherit",
          background: "linear-gradient(90deg, #ff5fa2, #7c4dff)",
        }}
      >
        {gd.studioToCert}
      </motion.button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => { sounds?.play("tap"); onReplay(); }}
        style={{
          marginTop: 10, width: "100%", border: "none", borderRadius: 16, padding: "13px",
          fontWeight: 900, fontSize: 14, cursor: "pointer", background: "#eef0fb", color: "#2b2350",
          fontFamily: "inherit",
        }}
      >
        {gd.replay}
      </motion.button>
    </BounceIn>
  );
}
