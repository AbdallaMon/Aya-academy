"use client";

// Decorative motif primitives + the motif chooser painted behind the certificate
// content. Purely presentational; driven by the resolved decoration + accent.

import { Box } from "@mui/material";
import { tint } from "./helpers.js";

// ── Decorative primitives ─────────────────────────────────────────────────────

function Star({ size = 18, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
      </svg>
    </Box>
  );
}

function Dot({ size = 12, color, ...sx }) {
  return (
    <Box
      component="span"
      sx={{ position: "absolute", width: size, height: size, borderRadius: "50%", bgcolor: color, ...sx }}
    />
  );
}

function Balloon({ size = 26, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size * 1.5} viewBox="0 0 24 36" fill="currentColor">
        <ellipse cx="12" cy="11" rx="10" ry="12" />
        <path d="M12 23 L9 27 H15 Z" />
        <path d="M12 27 q3 4 -1 8" stroke={color} strokeWidth="1" fill="none" />
      </svg>
    </Box>
  );
}

function Crescent({ size = 30, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        {/* A crescent: a disc with an offset disc punched out. */}
        <path d="M16.5 3a9 9 0 1 0 4.5 7.8A7 7 0 1 1 16.5 3z" />
      </svg>
    </Box>
  );
}

// A rosette / award badge with a ribbon tail — used for the "badges" motif.
function Badge({ size = 38, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size * 1.4} viewBox="0 0 40 56" fill="none">
        {/* ribbon tails */}
        <path d="M14 30 L11 52 L20 45 L29 52 L26 30 Z" fill={color} opacity="0.85" />
        {/* rosette */}
        <circle cx="20" cy="18" r="15" fill={color} />
        <circle cx="20" cy="18" r="10" fill="#fff" opacity="0.85" />
        <path
          d="M20 11l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z"
          fill={color}
        />
      </svg>
    </Box>
  );
}

// A heart — used for the "hearts" motif.
function Heart({ size = 22, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21s-7.5-4.6-10-9.2C.5 8.5 2 5 5.5 5 8 5 9.5 6.8 12 9c2.5-2.2 4-4 6.5-4C22 5 23.5 8.5 22 11.8 19.5 16.4 12 21 12 21z" />
      </svg>
    </Box>
  );
}

// A four-point sparkle — used for the "sparkles" motif.
function Sparkle({ size = 22, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0 C 13 8 16 11 24 12 C 16 13 13 16 12 24 C 11 16 8 13 0 12 C 8 11 11 8 12 0 Z" />
      </svg>
    </Box>
  );
}

// A small confetti rectangle (rotated) — used for the "confetti" motif.
function Confetti({ size = 12, color, rotate = 0, ...sx }) {
  return (
    <Box
      component="span"
      sx={{
        position: "absolute",
        width: size,
        height: size * 0.5,
        borderRadius: 0.5,
        bgcolor: color,
        transform: `rotate(${rotate}deg)`,
        ...sx,
      }}
    />
  );
}

// A Ramadan-style lantern (فانوس) — used for the "lanterns" motif.
function Lantern({ size = 30, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size * 1.6} viewBox="0 0 30 48" fill="none">
        <line x1="15" y1="0" x2="15" y2="6" stroke={color} strokeWidth="1.5" />
        <path d="M9 7 H21 L19 11 H11 Z" fill={color} />
        <rect x="7" y="11" width="16" height="22" rx="3" fill={color} opacity="0.9" />
        <rect x="10.5" y="14" width="9" height="16" rx="2" fill="#fff" opacity="0.8" />
        <path d="M11 33 H19 L17 38 H13 Z" fill={color} />
        <circle cx="15" cy="40" r="2.4" fill={color} />
      </svg>
    </Box>
  );
}

// A simple five-petal flower — used for the "florals" motif.
function Flower({ size = 30, color, core, ...sx }) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        {petals.map((a) => (
          <ellipse
            key={a}
            cx="20"
            cy="9"
            rx="6"
            ry="10"
            fill={color}
            opacity="0.9"
            transform={`rotate(${a} 20 20)`}
          />
        ))}
        <circle cx="20" cy="20" r="6" fill={core || "#fff"} />
      </svg>
    </Box>
  );
}

function RainbowArc({ accent }) {
  const bands = ["#FF6B6B", "#FFA94D", "#FFD43B", "#51CF66", "#4DABF7", accent || "#9775FA"];
  return (
    <Box sx={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", lineHeight: 0, opacity: 0.9 }}>
      <svg width="240" height="120" viewBox="0 0 240 120">
        {bands.map((c, i) => (
          <path
            key={c}
            d={`M ${20 + i * 8} 120 A ${100 - i * 8} ${100 - i * 8} 0 0 1 ${220 - i * 8} 120`}
            fill="none"
            stroke={c}
            strokeWidth="8"
          />
        ))}
      </svg>
    </Box>
  );
}

// An 8-point Islamic star — used for the "geometric" motif.
function EightStar({ size = 30, color, ...sx }) {
  return (
    <Box component="span" sx={{ position: "absolute", lineHeight: 0, color, ...sx }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path
          d="M24 2 30 12 42 8 38 20 48 24 38 28 42 40 30 36 24 46 18 36 6 40 10 28 0 24 10 20 6 8 18 12Z"
          fill={color}
          opacity="0.9"
        />
        <circle cx="24" cy="24" r="6" fill="#fff" opacity="0.85" />
      </svg>
    </Box>
  );
}

// A corner flourish (filigree swirl) for the "elegant" motif. `corner` is one of
// "tl" | "tr" | "bl" | "br"; the SVG is mirrored/positioned accordingly.
function Flourish({ color, corner = "tl", size = 96 }) {
  const flipX = corner === "tr" || corner === "br";
  const flipY = corner === "bl" || corner === "br";
  const pos = {
    tl: { top: 18, left: 18 },
    tr: { top: 18, right: 18 },
    bl: { bottom: 18, left: 18 },
    br: { bottom: 18, right: 18 },
  }[corner];
  return (
    <Box
      component="span"
      sx={{
        position: "absolute",
        lineHeight: 0,
        color,
        opacity: 0.8,
        transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
        transformOrigin: "center",
        ...pos,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <path
          d="M6 6 C 6 40 22 46 50 48 M6 6 C 40 6 46 22 48 50 M6 6 C 18 18 24 24 30 30"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="50" cy="48" r="2.6" fill={color} />
        <circle cx="48" cy="50" r="2.6" fill={color} />
      </svg>
    </Box>
  );
}

// ── Motif chooser ─────────────────────────────────────────────────────────────

export default function Decoration({ decoration, accent }) {
  const sec = tint(accent, 0.55);
  switch (decoration) {
    case "stars":
      return (
        <>
          <Star size={22} color={accent} top={18} left={28} />
          <Star size={14} color={sec} top={52} left={64} />
          <Star size={18} color={accent} top={24} right={36} />
          <Star size={12} color={sec} bottom={40} left={40} />
          <Star size={20} color={accent} bottom={26} right={44} />
          <Star size={14} color={sec} bottom={60} right={90} />
        </>
      );
    case "balloons":
      return (
        <>
          <Balloon size={26} color="#FF6B6B" top={16} left={26} />
          <Balloon size={22} color={accent} top={28} left={70} />
          <Balloon size={24} color="#4DABF7" top={18} right={32} />
          <Balloon size={20} color="#FFD43B" top={34} right={74} />
          <Dot size={10} color={sec} bottom={34} left={44} />
          <Dot size={8} color={accent} bottom={50} right={52} />
        </>
      );
    case "rainbow":
      return (
        <>
          <RainbowArc accent={accent} />
          <Dot size={12} color="#FF6B6B" bottom={30} left={36} />
          <Dot size={10} color="#FFD43B" bottom={48} left={64} />
          <Dot size={12} color="#4DABF7" bottom={30} right={36} />
          <Dot size={10} color="#51CF66" bottom={48} right={64} />
        </>
      );
    case "crescent":
      return (
        <>
          <Crescent size={34} color={accent} top={18} left={28} />
          <Star size={12} color="#FFD43B" top={48} left={70} />
          <Star size={10} color={sec} top={28} left={92} />
          <Crescent size={26} color={tint(accent, 0.3)} bottom={26} right={36} />
          <Star size={14} color="#FFD43B" bottom={52} right={78} />
          <Star size={9} color={sec} bottom={36} left={50} />
        </>
      );
    case "badges":
      return (
        <>
          <Badge size={40} color={accent} top={14} left={24} />
          <Badge size={30} color="#FFA94D" top={22} right={30} />
          <Star size={12} color="#FFD43B" top={60} left={72} />
          <Badge size={26} color={tint(accent, 0.25)} bottom={22} left={42} />
          <Star size={11} color="#FFD43B" bottom={48} right={56} />
        </>
      );
    case "geometric":
      return (
        <>
          <EightStar size={30} color={accent} top={16} left={22} />
          <EightStar size={20} color={sec} top={26} left={66} />
          <EightStar size={28} color={accent} top={16} right={22} />
          <EightStar size={18} color={sec} bottom={28} left={48} />
          <EightStar size={30} color={accent} bottom={20} right={24} />
          <EightStar size={18} color={sec} bottom={48} right={80} />
        </>
      );
    case "elegant":
      return (
        <>
          <Flourish color={accent} corner="tl" />
          <Flourish color={accent} corner="tr" />
          <Flourish color={accent} corner="bl" />
          <Flourish color={accent} corner="br" />
        </>
      );
    case "confetti":
      return (
        <>
          <Confetti size={14} color="#FF6B6B" rotate={20} top={18} left={30} />
          <Confetti size={12} color={accent} rotate={-30} top={40} left={70} />
          <Confetti size={13} color="#4DABF7" rotate={45} top={22} right={40} />
          <Confetti size={11} color="#FFD43B" rotate={-15} top={54} right={84} />
          <Dot size={8} color="#51CF66" top={70} left={120} />
          <Confetti size={13} color="#9775FA" rotate={30} bottom={30} left={44} />
          <Confetti size={12} color={sec} rotate={-25} bottom={50} left={96} />
          <Confetti size={13} color="#FFA94D" rotate={15} bottom={28} right={48} />
          <Dot size={9} color="#FF6B6B" bottom={56} right={96} />
        </>
      );
    case "hearts":
      return (
        <>
          <Heart size={24} color="#E0457B" top={16} left={28} />
          <Heart size={16} color={accent} top={48} left={70} />
          <Heart size={20} color="#FF6B6B" top={20} right={34} />
          <Heart size={14} color={sec} bottom={40} left={46} />
          <Heart size={22} color="#E0457B" bottom={24} right={42} />
          <Heart size={14} color={accent} bottom={58} right={92} />
        </>
      );
    case "lanterns":
      return (
        <>
          <Lantern size={30} color={accent} top={12} left={26} />
          <Lantern size={22} color={sec} top={20} left={72} />
          <Lantern size={26} color={accent} top={12} right={32} />
          <Star size={12} color="#FFD43B" top={64} left={120} />
          <Lantern size={22} color={tint(accent, 0.25)} bottom={20} right={40} />
          <Star size={11} color="#FFD43B" bottom={50} left={60} />
        </>
      );
    case "florals":
      return (
        <>
          <Flower size={34} color={accent} core={sec} top={16} left={24} />
          <Flower size={22} color={sec} core="#fff" top={26} left={70} />
          <Flower size={30} color={accent} core={sec} top={16} right={26} />
          <Flower size={20} color={tint(accent, 0.3)} core="#fff" bottom={28} left={50} />
          <Flower size={32} color={accent} core={sec} bottom={20} right={26} />
          <Flower size={20} color={sec} core="#fff" bottom={50} right={84} />
        </>
      );
    case "sparkles":
      return (
        <>
          <Sparkle size={24} color={sec} top={16} left={28} />
          <Sparkle size={14} color={accent} top={48} left={66} />
          <Sparkle size={20} color={sec} top={22} right={34} />
          <Sparkle size={12} color={accent} bottom={44} left={48} />
          <Sparkle size={22} color={sec} bottom={24} right={40} />
          <Sparkle size={14} color={accent} bottom={58} right={92} />
        </>
      );
    case "none":
      return null;
    case "classic":
    default:
      return (
        <>
          <Dot size={14} color={accent} top={24} left={30} />
          <Dot size={9} color={sec} top={46} left={58} />
          <Dot size={14} color={accent} top={24} right={30} />
          <Dot size={9} color={sec} top={46} right={58} />
          <Dot size={12} color={sec} bottom={28} left={48} />
          <Dot size={12} color={sec} bottom={28} right={48} />
        </>
      );
  }
}
