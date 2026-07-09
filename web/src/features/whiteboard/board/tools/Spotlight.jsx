"use client";

import { useEffect, useRef, useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup, keyframes } from "@mui/material";
import { MdHighlight } from "react-icons/md";

// Beam radius presets (px). The teacher widens/narrows the flashlight.
const SIZES = [
  { key: "sm", r: 110, ar: "صغير", en: "Small" },
  { key: "md", r: 190, ar: "متوسط", en: "Medium" },
  { key: "lg", r: 300, ar: "كبير", en: "Large" },
];

// Gentle fade-in so the darkness doesn't slam on.
const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

// Paint the dark mask: transparent center → near-opaque edge (the "hole").
const maskFor = (x, y, r) =>
  `radial-gradient(circle ${r}px at ${x}px ${y}px, transparent 0, transparent ${r * 0.7}px, rgba(0,0,0,0.86) ${r}px)`;

// Warm torch glow so the beam edge reads as light, not just a cut-out.
const glowFor = (x, y, r) =>
  `radial-gradient(circle ${r}px at ${x}px ${y}px, rgba(255,214,140,0) ${r * 0.55}px, rgba(255,190,90,0.35) ${r * 0.85}px, rgba(255,190,90,0) ${r}px)`;

export default function Spotlight({ active, rootRef, playSound, ar = true }) {
  const [sizeKey, setSizeKey] = useState("md");
  const maskRef = useRef(null); // dark overlay element
  const glowRef = useRef(null); // warm ring element
  const rRef = useRef(190); // current beam radius (read inside rAF)
  const targetRef = useRef({ x: 0, y: 0 }); // pointer target
  const posRef = useRef({ x: 0, y: 0 }); // smoothed position
  const rafRef = useRef(0);

  // Keep the radius ref in sync so the animation loop always sees the latest.
  useEffect(() => {
    rRef.current = SIZES.find((s) => s.key === sizeKey)?.r ?? 190;
  }, [sizeKey]);

  useEffect(() => {
    if (!active) return;

    // Soft "torch on" cue (once, never per-frame).
    playSound?.("whoosh");

    const root = rootRef?.current;
    const rect = root?.getBoundingClientRect();
    // Start centred on the board.
    const start = rect
      ? { x: rect.width / 2, y: rect.height / 2 }
      : { x: 0, y: 0 };
    targetRef.current = { ...start };
    posRef.current = { ...start };

    // clientX/Y → board-local coords (fullscreen-safe via live rect).
    const toLocal = (cx, cy) => {
      const r = root?.getBoundingClientRect();
      if (!r) return targetRef.current;
      return { x: cx - r.left, y: cy - r.top };
    };
    const onMouse = (e) => {
      targetRef.current = toLocal(e.clientX, e.clientY);
    };
    const onTouch = (e) => {
      const t = e.touches?.[0];
      if (t) targetRef.current = toLocal(t.clientX, t.clientY);
    };

    window.addEventListener("pointermove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    // Smooth follow: lerp toward the pointer and repaint the gradients.
    const tick = () => {
      const p = posRef.current;
      const t = targetRef.current;
      p.x += (t.x - p.x) * 0.25;
      p.y += (t.y - p.y) * 0.25;
      const r = rRef.current;
      if (maskRef.current)
        maskRef.current.style.background = maskFor(p.x, p.y, r);
      if (glowRef.current)
        glowRef.current.style.background = glowFor(p.x, p.y, r);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, rootRef, playSound]);

  if (!active) return null;

  const changeSize = (_e, val) => {
    if (!val) return;
    setSizeKey(val);
    playSound?.("tick");
  };

  return (
    <>
      {/* Dark mask with the moving flashlight hole */}
      <Box
        ref={maskRef}
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 7,
          pointerEvents: "auto",
          cursor: "none",
          animation: `${fadeIn} .28s ease-out`,
        }}
      />
      {/* Warm beam glow (screen-blended so it only lights, never darkens) */}
      <Box
        ref={glowRef}
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 8,
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />
      {/* Beam-size control (RTL-safe, above the mask) */}
      <ToggleButtonGroup
        exclusive
        size="small"
        value={sizeKey}
        onChange={changeSize}
        sx={{
          position: "absolute",
          bottom: 16,
          insetInlineStart: 16,
          zIndex: 9,
          pointerEvents: "auto",
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        {SIZES.map((s) => (
          <ToggleButton key={s.key} value={s.key} sx={{ gap: 0.5, fontWeight: 700 }}>
            <MdHighlight />
            {ar ? s.ar : s.en}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </>
  );
}
