"use client";

import { useEffect, useState } from "react";
import { Box, keyframes } from "@mui/material";
import { boardChannel } from "./lib/boardChannel.js";
import { REACTIONS, BURST_COUNT } from "./config/reactions.js";

const floatUp = keyframes`
  0%   { transform: translateY(0) scale(0.6); opacity: 0; }
  15%  { opacity: 1; }
  100% { transform: translateY(-90vh) scale(1.1); opacity: 0; }
`;
const popIn = keyframes`
  0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
  20%  { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  80%  { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
`;

export default function ReactionOverlay() {
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    return boardChannel.onReaction((r) => {
      const def = REACTIONS.find((x) => x.key === r.key);
      if (!def) return;
      // Deterministic spread (no Math.random needed) so particles fan out evenly.
      const particles = Array.from({ length: BURST_COUNT }).map((_, i) => ({
        left: 5 + ((i * 97) % 90),
        delay: (i % 7) * 0.12,
        dur: 2.4 + (i % 5) * 0.3,
        size: 26 + (i % 4) * 8,
      }));
      const praise = def.praiseAr
        ? r.studentName
          ? `${def.praiseAr} يا ${r.studentName}`
          : def.praiseAr
        : null;
      const burst = { id: r.id, emoji: def.emoji, praise, particles };
      setBursts((b) => [...b, burst]);
      setTimeout(() => {
        setBursts((b) => b.filter((x) => x.id !== burst.id));
      }, 4200);
    });
  }, []);

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 4,
      }}
    >
      {bursts.map((burst) => (
        <Box key={burst.id}>
          {burst.particles.map((p, i) => (
            <Box
              key={i}
              sx={{
                position: "absolute",
                bottom: 0,
                insetInlineStart: `${p.left}%`,
                fontSize: p.size,
                animation: `${floatUp} ${p.dur}s ease-out ${p.delay}s forwards`,
              }}
            >
              {burst.emoji}
            </Box>
          ))}
          {burst.praise && (
            <Box
              sx={{
                position: "absolute",
                top: "40%",
                insetInlineStart: "50%",
                transform: "translate(-50%, -50%)",
                animation: `${popIn} 3.2s ease-out forwards`,
                fontSize: { xs: 40, md: 72 },
                fontWeight: 800,
                color: "#ff7a00",
                textShadow: "0 3px 0 #fff, 0 6px 18px rgba(0,0,0,.25)",
                whiteSpace: "nowrap",
              }}
            >
              {burst.praise}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}
