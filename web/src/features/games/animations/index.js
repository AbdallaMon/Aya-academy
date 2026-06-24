"use client";

// Reusable framer-motion animation library for the Aya game engine.
//
// Exports 5 reusable animations as both variant objects (for `motion.*`
// `variants`) and ready-to-use wrapper components:
//   - bounceIn      → <BounceIn>      : pops elements in (task enter, options)
//   - slideIn       → <SlideIn>       : slides content in from a side (RTL-aware)
//   - jelly         → jelly()         : wobble on success / correct feedback
//   - sparkleTrail  → <SparkleTrail>  : floating ✨ burst behind stars / rewards
//   - pulseGlow     → <PulseGlow>     : breathing glow for the active CTA / call key
//
// Wrappers are thin so the engine can compose them anywhere. All are JS/JSX.

import { motion } from "framer-motion";

// ── 1. bounceIn ──────────────────────────────────────────────────────────────
export const bounceIn = {
  hidden: { opacity: 0, scale: 0.6, y: 14 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 480, damping: 18, mass: 0.7 },
  },
  exit: { opacity: 0, scale: 0.85, transition: { duration: 0.15 } },
};

export function BounceIn({ children, delay = 0, style, ...rest }) {
  return (
    <motion.div
      variants={bounceIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay }}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// ── 2. slideIn ───────────────────────────────────────────────────────────────
// RTL-aware: pass dir="rtl" to slide from the inline-start side correctly.
export function slideInVariants(from = "bottom", distance = 40) {
  const offset = {
    bottom: { y: distance },
    top: { y: -distance },
    start: { x: distance }, // RTL start = right; LTR consumers pass "left"
    left: { x: -distance },
    right: { x: distance },
  }[from] || { y: distance };
  return {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { type: "spring", stiffness: 360, damping: 30 },
    },
    exit: { opacity: 0, ...offset, transition: { duration: 0.18 } },
  };
}

export const slideIn = slideInVariants("bottom");

export function SlideIn({ children, from = "bottom", distance = 40, delay = 0, style, ...rest }) {
  return (
    <motion.div
      variants={slideInVariants(from, distance)}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay }}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// ── 3. jelly ─────────────────────────────────────────────────────────────────
// A wobble used for "correct!" feedback. Use as an `animate` target via jelly().
export function jelly(active = true) {
  if (!active) return {};
  return {
    scale: [1, 1.18, 0.94, 1.06, 1],
    rotate: [0, -3, 3, -1.5, 0],
    transition: { duration: 0.55, ease: "easeInOut" },
  };
}

export function Jelly({ children, trigger, style, ...rest }) {
  return (
    <motion.div animate={trigger ? jelly(true) : { scale: 1 }} style={style} {...rest}>
      {children}
    </motion.div>
  );
}

// ── 4. sparkleTrail ──────────────────────────────────────────────────────────
// A short burst of floating sparkle emojis. Renders absolutely-positioned
// particles inside a relative parent; auto-cleans via AnimatePresence in caller.
const SPARKLE_EMOJIS = ["✨", "⭐", "🌟", "💫"];

export const sparkleTrail = {
  hidden: { opacity: 0, scale: 0.4, y: 0 },
  visible: (i) => ({
    opacity: [0, 1, 0],
    scale: [0.4, 1.1, 0.6],
    y: -50 - i * 8,
    x: (i % 2 === 0 ? 1 : -1) * (10 + i * 6),
    transition: { duration: 0.9, ease: "easeOut", delay: i * 0.05 },
  }),
};

export function SparkleTrail({ count = 6, emojis = SPARKLE_EMOJIS, size = 22 }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        display: "grid",
        placeItems: "center",
        overflow: "visible",
        zIndex: 4,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={sparkleTrail}
          initial="hidden"
          animate="visible"
          style={{ position: "absolute", fontSize: size }}
        >
          {emojis[i % emojis.length]}
        </motion.span>
      ))}
    </div>
  );
}

// ── 5. pulseGlow ─────────────────────────────────────────────────────────────
// A gentle breathing scale + shadow for the active CTA (e.g. ready call key).
export const pulseGlow = {
  animate: {
    scale: [1, 1.06, 1],
    boxShadow: [
      "0 8px 18px rgba(35,196,131,0.30)",
      "0 10px 28px rgba(35,196,131,0.55)",
      "0 8px 18px rgba(35,196,131,0.30)",
    ],
    transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
  },
};

export function PulseGlow({ children, active = true, color = "rgba(35,196,131,0.5)", style, ...rest }) {
  const variant = active
    ? {
        scale: [1, 1.06, 1],
        boxShadow: [
          `0 8px 18px ${color}`,
          `0 12px 30px ${color}`,
          `0 8px 18px ${color}`,
        ],
        transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
      }
    : { scale: 1 };
  return (
    <motion.div animate={variant} style={style} {...rest}>
      {children}
    </motion.div>
  );
}

// A small reusable shake (gentle wrong feedback) — handy for renderers.
export const shake = {
  shake: {
    x: [0, -8, 8, -6, 6, 0],
    transition: { duration: 0.45 },
  },
  still: { x: 0 },
};
