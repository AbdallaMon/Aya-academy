"use client";

// ColoringTask — kind COLORING. «زيّن مسجدك»: a simple mosque SVG. Pick a color
// from the palette, then tap a region to fill it. Pure creative play — there are
// NO wrong answers. When every region has been colored at least once, the task
// completes (onCorrect → one star). Each fill plays a soft "pop" + a little jelly
// on the region.
//
// mediaJson: {
//   palette: ["#hex", ...],
//   regions: [{ id, nameAr/nameEn? }]   // ids must match the SVG region ids below
// }
// The SVG has 6 named regions: sky, dome, body, door, minaret, crescent. A game
// can color any subset by listing them in `regions`.

import { useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "../../../../i18n/client.js";
import { Confetti, SparkleTrail } from "../../animations/index.js";

const DEFAULT_PALETTE = ["#ffd166", "#06d6a0", "#ef476f", "#118ab2", "#8a5bff", "#ffffff"];
const ALL_REGIONS = ["sky", "dome", "body", "door", "minaret", "crescent"];
const BASE = "#efeafc"; // un-colored region fill

export default function ColoringTask({ question, onCorrect, sounds }) {
  const { t } = useTranslation();
  const gd = t("gamesData", { returnObjects: true }) || {};
  const media = question.mediaJson || {};
  const palette = media.palette?.length ? media.palette : DEFAULT_PALETTE;
  const regionIds = useMemo(
    () => (media.regions?.length ? media.regions.map((r) => r.id) : ALL_REGIONS),
    [media.regions],
  );

  const [color, setColor] = useState(palette[0]);
  const [fills, setFills] = useState({}); // regionId -> color
  const [pulse, setPulse] = useState(null);
  const [splash, setSplash] = useState(null); // { key, color } — a paint "splash" burst
  const [celebrate, setCelebrate] = useState(false);
  const doneRef = useRef(false);
  const splashKey = useRef(0);

  const coloredCount = Object.keys(fills).length;

  function fillRegion(id) {
    if (!regionIds.includes(id) || doneRef.current) return;
    sounds?.play("paint"); // airy brush swish for each stroke
    setPulse(id);
    setTimeout(() => setPulse(null), 350);
    // a little color-tinted "splash" of sparkles for every brush stroke
    splashKey.current += 1;
    setSplash({ key: splashKey.current, color });
    setTimeout(() => setSplash(null), 850);
    setFills((prev) => {
      const next = { ...prev, [id]: color };
      const allColored = regionIds.every((r) => next[r]);
      if (allColored && !doneRef.current) {
        doneRef.current = true;
        setCelebrate(true);
        sounds?.play("win");
        setTimeout(() => onCorrect({ fills: next, feedback: gd.coloringDone }), 600);
      }
      return next;
    });
  }

  const fillFor = (id) => fills[id] || BASE;
  const isActive = (id) => regionIds.includes(id);
  const dimmed = (id) => (isActive(id) ? 1 : 0.35);

  function region(id, node) {
    return (
      <motion.g
        key={id}
        onClick={() => fillRegion(id)}
        animate={pulse === id ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 0.35 }}
        style={{
          cursor: isActive(id) ? "pointer" : "default",
          transformOrigin: "center",
          opacity: dimmed(id),
        }}
      >
        {node}
      </motion.g>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {/* progress */}
      <Box
        sx={{
          background: "#f3f1ff",
          border: "2px solid #ece8ff",
          borderRadius: "14px",
          px: 1.5,
          py: 1,
          fontWeight: 800,
          fontSize: 13,
          color: "#6536e0",
          textAlign: "center",
        }}
      >
        {gd.coloringProgress}: {coloredCount} / {regionIds.length} 🎨
      </Box>

      {/* canvas */}
      <Box
        sx={{
          position: "relative",
          background: "linear-gradient(180deg,#f7fbff,#eef4ff)",
          border: "2px solid #d9ecff",
          borderRadius: "20px",
          p: 1,
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg viewBox="0 0 240 240" width="100%" style={{ maxWidth: 280 }}>
          {region(
            "sky",
            <rect x="6" y="6" width="228" height="170" rx="16" fill={fillFor("sky")} stroke="#cdbcff" strokeWidth="2" />,
          )}
          {region(
            "crescent",
            <g>
              <circle cx="186" cy="44" r="16" fill={fillFor("crescent")} stroke="#cdbcff" strokeWidth="2" />
              <circle cx="192" cy="40" r="13" fill={fillFor("sky")} />
            </g>,
          )}
          {region(
            "minaret",
            <rect x="30" y="70" width="26" height="106" rx="6" fill={fillFor("minaret")} stroke="#cdbcff" strokeWidth="2" />,
          )}
          {region(
            "body",
            <rect x="74" y="104" width="120" height="72" rx="8" fill={fillFor("body")} stroke="#cdbcff" strokeWidth="2" />,
          )}
          {region(
            "dome",
            <path
              d="M74 104 Q134 44 194 104 Z"
              fill={fillFor("dome")}
              stroke="#cdbcff"
              strokeWidth="2"
            />,
          )}
          {region(
            "door",
            <path
              d="M118 176 L118 134 Q134 118 150 134 L150 176 Z"
              fill={fillFor("door")}
              stroke="#cdbcff"
              strokeWidth="2"
            />,
          )}
          {/* ground line (decoration, not colorable) */}
          <rect x="6" y="176" width="228" height="10" rx="5" fill="#cdbcff" opacity="0.5" />
        </svg>

        {/* per-stroke color "splash": a tiny burst of dots tinted to the chosen
            color, so every paint feels juicy. */}
        <AnimatePresence>
          {splash ? (
            <Box
              key={splash.key}
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                display: "grid",
                placeItems: "center",
                zIndex: 4,
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                return (
                  <motion.span
                    key={i}
                    initial={{ x: 0, y: 0, scale: 0.5, opacity: 0 }}
                    animate={{
                      x: Math.cos(angle) * (26 + i * 2),
                      y: Math.sin(angle) * (26 + i * 2),
                      scale: [0.5, 1.1, 0.4],
                      opacity: [0, 1, 0],
                    }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    style={{
                      position: "absolute",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: splash.color,
                      border: "2px solid #ffffff",
                      boxShadow: `0 0 8px ${splash.color}`,
                    }}
                  />
                );
              })}
            </Box>
          ) : null}
        </AnimatePresence>

        {/* finishing the whole mosque: confetti + a big sparkle shower */}
        {celebrate ? (
          <>
            <Confetti count={26} />
            <SparkleTrail count={12} size={26} />
          </>
        ) : null}
      </Box>

      {/* palette */}
      <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
        {palette.map((c, index) => {
          const selected = c === color;
          return (
            <motion.button
              key={c}
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => { sounds?.play("pick"); setColor(c); }}
              aria-label={`${gd.colorLabel} ${index + 1}`}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: c,
                cursor: "pointer",
                border: selected ? "3px solid #2b2350" : "3px solid #ece8ff",
                boxShadow: selected ? "0 0 0 4px #7c4dff33" : "none",
              }}
            />
          );
        })}
      </Box>

      <Typography sx={{ textAlign: "center", color: "#6b6790", fontSize: 12 }}>
        {gd.coloringHint}
      </Typography>
    </Box>
  );
}
