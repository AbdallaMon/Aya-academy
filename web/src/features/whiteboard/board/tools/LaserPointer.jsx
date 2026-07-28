"use client";

import { useEffect, useRef, useState } from "react";
import { Box, keyframes } from "@mui/material";

// The halo "breathes" so the dot feels alive while resting. Scale ONLY — any
// translate here would get flipped by stylis-plugin-rtl (sx keyframes) and shove
// the halo off-centre from the point. Centering is done on an outer wrapper via
// the inline `style` prop instead.
const pulse = keyframes`
  0%   { transform: scale(0.9); }
  50%  { transform: scale(1.15); }
  100% { transform: scale(0.9); }
`;

// Kid-friendly laser colors. Each carries a core + glow so the halo matches.
const LASERS = [
  { key: "red", ar: "أحمر", en: "Red", core: "#ff1744", glow: "rgba(255,23,68,.65)" },
  { key: "green", ar: "أخضر", en: "Green", core: "#00e676", glow: "rgba(0,230,118,.6)" },
  { key: "blue", ar: "أزرق", en: "Blue", core: "#2979ff", glow: "rgba(41,121,255,.6)" },
  {
    key: "rainbow",
    ar: "قوس قزح",
    en: "Rainbow",
    core: "#ff1744",
    glow: "rgba(255,23,68,.6)",
    rainbow: true,
  },
];

const TRAIL_MAX = 12; // Cap so the comet tail stays light and leak-free.

export default function LaserPointer({ active, rootRef, playSound, ar = true }) {
  const [laser, setLaser] = useState(LASERS[0]);
  const [dot, setDot] = useState(null); // { x, y } in root-local coords, or null when off-board.
  const [trail, setTrail] = useState([]); // Rendered comet points, newest first (from state, not a ref).
  const [hue, setHue] = useState(0); // Rendered rainbow hue (from state, not a ref).
  const trailRef = useRef([]); // Working buffer the rAF loop mutates before flushing to state.
  const rafRef = useRef(0);
  const pointRef = useRef(null); // Latest pointer position, written in handlers / read in rAF.
  const idRef = useRef(0);

  // Keep the latest playSound without making the rAF/activation effect depend on it.
  const playSoundRef = useRef(playSound);
  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);

  // A soft one-shot when laser mode turns on (never per-move).
  useEffect(() => {
    if (active) playSoundRef.current?.("whoosh");
  }, [active]);

  // Drive the trail + rainbow hue from a single rAF loop; capture happens on the overlay below.
  useEffect(() => {
    if (!active) return;

    let hueLocal = 0;
    const tick = () => {
      const p = pointRef.current;
      const buf = trailRef.current;
      if (p) {
        // Only push when the pointer actually moved (keeps the tail meaningful).
        const head = buf[0];
        if (!head || Math.hypot(head.x - p.x, head.y - p.y) > 3) {
          buf.unshift({ x: p.x, y: p.y, id: ++idRef.current });
          if (buf.length > TRAIL_MAX) buf.pop();
        }
      } else if (buf.length) {
        buf.pop(); // Pointer left the board — let the tail drain out.
      }
      hueLocal = (hueLocal + 6) % 360;
      setTrail(buf.slice()); // Flush a snapshot so render reads state, not the ref.
      setHue(hueLocal);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      trailRef.current = [];
      pointRef.current = null;
      setTrail([]);
      setDot(null);
    };
  }, [active]);

  if (!active) return null;

  // Convert a client point → root-local coords (survives fullscreen).
  const toLocal = (clientX, clientY) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const track = (e) => {
    const t = e.touches?.[0] || e;
    const local = toLocal(t.clientX, t.clientY);
    if (!local) return;
    pointRef.current = local;
    setDot(local);
  };

  const leave = () => {
    pointRef.current = null;
    setDot(null);
  };

  const coreColor = laser.rainbow ? `hsl(${hue}, 95%, 55%)` : laser.core;
  const glowColor = laser.rainbow ? `hsla(${hue}, 95%, 55%, .6)` : laser.glow;

  return (
    <Box
      onMouseMove={track}
      onTouchMove={track}
      onTouchStart={track}
      onMouseLeave={leave}
      onTouchEnd={leave}
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 6,
        pointerEvents: "auto",
        cursor: "none",
        touchAction: "none",
        overflow: "hidden",
      }}
    >
      {/* Comet tail: older points sit deeper in the array → smaller and fainter. */}
      {trail.map((p, i) => {
        const f = 1 - i / TRAIL_MAX; // 1 at the head, →0 at the tail.
        return (
          <Box
            key={p.id}
            // Position via inline `style` — sx `left` is flipped to `right` by
            // stylis-plugin-rtl in Arabic, which mirrors the laser. Physical coords.
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${
                0.35 + f * 0.65
              })`,
            }}
            sx={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              pointerEvents: "none",
              opacity: f * 0.5,
              background: `radial-gradient(circle, ${coreColor} 0%, ${glowColor} 55%, transparent 72%)`,
            }}
          />
        );
      })}

      {/* The live laser dot: a crisp bright point exactly under the cursor, wrapped
          in a soft breathing halo. Every layer is centred with translate(-50%,-50%)
          so the point sits dead-centre on the pointer. */}
      {dot && (
        <Box
          // Physical positioning via `style` so RTL can't mirror the dot.
          style={{ position: "absolute", left: 0, top: 0, transform: `translate(${dot.x}px, ${dot.y}px)` }}
          sx={{ pointerEvents: "none" }}
        >
          {/* Soft outer halo — centred by the wrapper (inline style), the inner box
              only scales, so RTL can't shove it off the point. */}
          <Box style={{ position: "absolute", left: 0, top: 0, width: 84, height: 84, transform: "translate(-50%, -50%)" }}>
            <Box
              sx={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                filter: "blur(8px)",
                animation: `${pulse} 1.4s ease-in-out infinite`,
                background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              }}
            />
          </Box>
          {/* Tight coloured glow ring around the point. */}
          <Box
            style={{ position: "absolute", left: 0, top: 0, transform: "translate(-50%, -50%)" }}
            sx={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${coreColor} 0%, ${glowColor} 55%, transparent 75%)`,
              boxShadow: `0 0 14px 5px ${glowColor}`,
            }}
          />
          {/* The crisp point itself — small, bright, dead-centre. */}
          <Box
            style={{ position: "absolute", left: 0, top: 0, transform: "translate(-50%, -50%)" }}
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: `radial-gradient(circle at 40% 35%, #fff 0%, #fff 30%, ${coreColor} 75%)`,
              boxShadow: `0 0 6px 1px #fff`,
            }}
          />
        </Box>
      )}

      {/* Tiny color row in a bottom corner — unobtrusive, clicks pass to buttons. */}
      <Box
        sx={{
          position: "absolute",
          bottom: 16,
          insetInlineStart: 16,
          zIndex: 7,
          display: "flex",
          gap: 1,
          p: 0.75,
          borderRadius: 999,
          bgcolor: "rgba(0,0,0,.35)",
          backdropFilter: "blur(4px)",
          pointerEvents: "auto",
          cursor: "auto",
        }}
      >
        {LASERS.map((l) => {
          const selected = l.key === laser.key;
          return (
            <Box
              key={l.key}
              role="button"
              title={ar ? l.ar : l.en}
              onClick={() => {
                setLaser(l);
                playSoundRef.current?.("tick");
              }}
              sx={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                cursor: "pointer",
                border: selected ? "2px solid #fff" : "2px solid rgba(255,255,255,.35)",
                transform: selected ? "scale(1.15)" : "scale(1)",
                transition: "transform .12s",
                background: l.rainbow
                  ? "conic-gradient(#ff1744,#ff9100,#ffea00,#00e676,#2979ff,#d500f9,#ff1744)"
                  : l.core,
                "&:hover": { transform: "scale(1.2)" },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
