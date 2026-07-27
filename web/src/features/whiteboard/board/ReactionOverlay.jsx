"use client";

import { useEffect, useRef, useState } from "react";
import { Box, keyframes } from "@mui/material";
import { boardChannel } from "./lib/boardChannel.js";
import { createBoardConfetti } from "./lib/boardConfetti.js";
import {
  REACTIONS,
  BURST_COUNT,
  DEFAULT_PRAISE_AR,
  DEFAULT_PRAISE_EN,
} from "./config/reactions.js";

const floatUp = keyframes`
  0%   { transform: translateY(0) scale(0.5) rotate(0deg); opacity: 0; }
  12%  { opacity: 1; }
  100% { transform: translateY(-92vh) scale(1.15) rotate(18deg); opacity: 0; }
`;
const popIn = keyframes`
  0%   { transform: scale(0.2) rotate(-6deg); opacity: 0; }
  18%  { transform: scale(1.25) rotate(3deg); opacity: 1; }
  82%  { transform: scale(1) rotate(0deg); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
`;

export default function ReactionOverlay({ ar = true }) {
  const [bursts, setBursts] = useState([]);
  const canvasRef = useRef(null);
  const confettiRef = useRef(null);

  useEffect(() => {
    confettiRef.current = createBoardConfetti(canvasRef.current);
  }, []);

  useEffect(() => {
    return boardChannel.onReaction((r) => {
      const def = REACTIONS.find((x) => x.key === r.key);
      if (!def) return;

      // Confetti (bound to the in-board canvas, so it survives fullscreen).
      if (def.confetti) confettiRef.current?.fire(def.confetti, def.color);

      // Deterministic spread (no Math.random) so particles fan out evenly.
      const particles = Array.from({ length: BURST_COUNT }).map((_, i) => ({
        left: 4 + ((i * 89) % 92),
        delay: (i % 8) * 0.11,
        dur: 2.3 + (i % 5) * 0.35,
        size: 26 + (i % 4) * 10,
      }));

      // Name banner: show for ANY reaction once a student is chosen (falling back
      // to a default praise), or when the reaction carries its own praise.
      const praiseWord = ar
        ? def.praiseAr || DEFAULT_PRAISE_AR
        : def.praiseEn || DEFAULT_PRAISE_EN;
      const banner = r.studentName
        ? ar
          ? `${praiseWord} يا ${r.studentName}`
          : `${praiseWord}, ${r.studentName}!`
        : ar
          ? def.praiseAr || null
          : def.praiseEn || null;

      const burst = { id: r.id, emoji: def.emoji, banner, color: def.color, particles };
      setBursts((b) => [...b, burst]);
      setTimeout(() => {
        setBursts((b) => b.filter((x) => x.id !== burst.id));
      }, 4200);
    });
  }, [ar]);

  return (
    <>
      <Box
        component="canvas"
        ref={canvasRef}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 4,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 5,
        }}
      >
        {bursts.map((burst) => (
          <Box key={burst.id}>
            {burst.particles.map((p, i) => (
              <Box
                key={i}
                style={{ left: `${p.left}%` }}
                sx={{
                  position: "absolute",
                  bottom: 0,
                  fontSize: p.size,
                  animation: `${floatUp} ${p.dur}s ease-out ${p.delay}s forwards`,
                }}
              >
                {burst.emoji}
              </Box>
            ))}
            {burst.banner && (
              <Box
                sx={{
                  position: "absolute",
                  top: "38%",
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  transform: "translateY(-50%)",
                }}
              >
                <Box
                  dir={ar ? "rtl" : "ltr"}
                  sx={{
                    animation: `${popIn} 3.2s ease-out forwards`,
                    width: "max-content",
                    maxWidth: "92vw",
                    fontSize: { xs: 32, sm: 46, md: 70 },
                    fontWeight: 900,
                    lineHeight: 1.2,
                    textAlign: "center",
                    color: burst.color,
                    WebkitTextStroke: "2px #fff",
                    textShadow:
                      "0 4px 0 rgba(255,255,255,.9), 0 10px 24px rgba(0,0,0,.28)",
                    whiteSpace: "normal",
                    overflowWrap: "anywhere",
                  }}
                >
                  {burst.emoji} {burst.banner}
                </Box>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </>
  );
}
