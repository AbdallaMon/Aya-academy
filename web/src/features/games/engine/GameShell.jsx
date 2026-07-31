"use client";

// GameShell — the phone-frame chrome shared by every game: gradient header
// (hero name + avatar), a star row that fills as tasks pass, the X/N score, a
// 🔊 mute toggle, and the guide bubble (prompt / praise / gentle correction).
// Accent turns green on success and pink on a wrong attempt — purely cosmetic
// feedback for kids, matching the HTML prototype.

import { Box, IconButton, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { jelly, Confetti } from "../animations/index.js";

// Header gradients are kept DARK so white title/subtitle text always clears
// WCAG AA contrast (≥4.5:1) on every part of the gradient — the old bright
// purple→pink / light-green / light-pink failed contrast against white.
const GRADIENT = "linear-gradient(90deg, #6a32d6, #c42a6a)"; // white ≈ 6.8:1 → 5.4:1
const GOOD = "linear-gradient(90deg, #0a7d5e, #0a8462)"; // white ≈ 5.1:1 → 4.7:1
const BAD = "linear-gradient(90deg, #cc2e63, #b8285a)"; // white ≈ 5.1:1 → 6.0:1

function StarRow({ filled, total }) {
  return (
    <Box sx={{ fontSize: 22, letterSpacing: "2px", lineHeight: 1 }}>
      {Array.from({ length: total }).map((_, i) => {
        const on = i < filled;
        const isLatest = i === filled - 1;
        return (
          <motion.span
            key={i}
            style={{ display: "inline-block" }}
            animate={isLatest ? jelly(true) : { scale: 1 }}
          >
            {on ? "⭐" : "☆"}
          </motion.span>
        );
      })}
    </Box>
  );
}

export default function GameShell({
  heroName,
  avatarEmoji,
  guideEmoji,
  stars,
  totalStars,
  score,
  mood, // "good" | "bad" | null
  muted,
  onToggleMute,
  soundLabel = "Sound",
  guideText,
  subtitle,
  starLabel = "⭐",
  burst = 0, // bump this to fire a confetti celebration
  children,
}) {
  const headerBg = mood === "good" ? GOOD : mood === "bad" ? BAD : GRADIENT;
  const guideBg =
    mood === "good" ? "#e7fbf3" : mood === "bad" ? "#ffeef2" : "#fff6e2";
  const guideBorder =
    mood === "good" ? "#18c08f" : mood === "bad" ? "#ff5fa2" : "#ffd33d";

  return (
    <Box
      sx={{
        width: 460,
        maxWidth: "100%",
        background: "#c7c1f7",
        borderRadius: "40px",
        p: "12px",
        boxShadow: "0 18px 50px rgba(70, 50, 140, 0.18)",
        mx: "auto",
      }}
    >
      <Box
        sx={{
          background: "#fff",
          borderRadius: "30px",
          overflow: "hidden",
          position: "relative",
          // Fixed 720 on tablet+ keeps the "phone" framing; on small phones let it
          // grow with content so the advance/finish button is never pushed off-screen.
          minHeight: { xs: "auto", sm: 720 },
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* header */}
        <Box
          sx={{
            background: headerBg,
            color: "#fff",
            px: 2,
            pt: 1.75,
            pb: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.25,
            transition: "background .3s",
          }}
        >
          {/* soft shadow keeps the white title/subtitle readable on EVERY part
              of the colored header (purple→pink, green or pink moods). */}
          <Box sx={{ textAlign: "start", lineHeight: 1.3, textShadow: "0 1px 4px rgba(0,0,0,0.28)" }}>
            <Typography component="b" sx={{ fontSize: 17, fontWeight: 900, display: "block" }}>
              {heroName}
            </Typography>
            {subtitle ? (
              <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, opacity: 1 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          <Box
            sx={{
              width: 46, height: 46, borderRadius: "14px",
              background: "rgba(255,255,255,0.18)", display: "grid",
              placeItems: "center", fontSize: 26, flex: "none",
            }}
          >
            {avatarEmoji}
          </Box>
        </Box>

        {/* star + score bar */}
        <Box
          sx={{
            background: headerBg,
            color: "#fff",
            px: 2,
            pb: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "background .3s",
          }}
        >
          <IconButton
            onClick={onToggleMute}
            aria-label={soundLabel}
            sx={{
              background: "rgba(255,255,255,0.2)", color: "#fff",
              width: 36, height: 36, fontSize: 16,
              "&:hover": { background: "rgba(255,255,255,0.32)" },
            }}
          >
            {muted ? "🔇" : "🔊"}
          </IconButton>
          <StarRow filled={stars} total={totalStars} />
          <Box
            sx={{
              background: "rgba(0,0,0,0.22)", borderRadius: 999,
              px: 1.5, py: 0.5, fontSize: 12, fontWeight: 800,
            }}
          >
            {score} / {totalStars} {starLabel}
          </Box>
        </Box>

        {/* guide bubble */}
        <Box
          sx={{
            display: "flex", gap: 1.25, alignItems: "flex-start",
            px: 2, py: 1.75, borderBottom: `4px solid ${guideBorder}`,
            background: guideBg, transition: "background .3s, border-color .3s",
          }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 52, height: 52, borderRadius: 14, background: "#fff",
              display: "grid", placeItems: "center", fontSize: 30, flex: "none",
              boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
            }}
          >
            {mood === "bad" ? "😢" : guideEmoji}
          </motion.div>
          <Box sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.6, flex: 1, color: "#2b2350" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={guideText}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {guideText}
              </motion.div>
            </AnimatePresence>
          </Box>
        </Box>

        {/* body (task router renders here) */}
        <Box sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </Box>

        {/* celebration confetti overlay — re-keyed on each star/win so it
            replays from the start; the pieces fade themselves out. */}
        {burst > 0 ? <Confetti key={burst} count={30} /> : null}
      </Box>
    </Box>
  );
}
