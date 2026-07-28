"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { MdCasino, MdRefresh, MdClose, MdDragIndicator } from "react-icons/md";
import { useDraggable } from "./useDraggable.js";

// Kid-friendly vibrant palette; segments cycle by index (never random in render).
// Ordered so adjacent slices alternate warm/cool for clear separation.
const PALETTE = [
  "#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff",
  "#ff9f45", "#a66cff", "#ff6fb5", "#38c6d9",
];

// Generic encouraging tokens for the "surprise" wheel when no students exist.
const SURPRISE_AR = ["نجم ⭐", "بطل 🦸", "شاطر 👏", "ممتاز 🌟", "رائع 🎉", "مبدع ✨"];
const SURPRISE_EN = ["Star ⭐", "Hero 🦸", "Bravo 👏", "Great 🌟", "Awesome 🎉", "Genius ✨"];

// Wheel geometry.
const SIZE = 300;
const C = SIZE / 2; // center x/y
const R = 118; // wheel radius (leaves room for the rim, bulbs and pointer)
const BULBS = 16; // evenly-spaced prize-wheel dots on the rim
const SPIN_MS = 4600;

// Clockwise angle from 12 o'clock → SVG point (y grows downward).
const pointAt = (deg, r) => {
  const rad = (deg * Math.PI) / 180;
  return { x: C + r * Math.sin(rad), y: C - r * Math.cos(rad) };
};

// Pie slice path for a segment spanning [a0, a1] degrees (clockwise from top).
const slicePath = (a0, a1) => {
  const p0 = pointAt(a0, R);
  const p1 = pointAt(a1, R);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${C} ${C} L ${p0.x} ${p0.y} A ${R} ${R} 0 ${large} 1 ${p1.x} ${p1.y} Z`;
};

const short = (name) => (name.length > 11 ? `${name.slice(0, 10)}…` : name);

export default function NamePicker({ active, rootRef, students = [], playSound, ar = true, onClose }) {
  const { dragStyle, dragHandle } = useDraggable(rootRef);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null); // { name }
  const [removeChosen, setRemoveChosen] = useState(false);
  const [picked, setPicked] = useState([]); // student ids already drawn

  const pendingRef = useRef(null); // captured winner during the spin
  const tickRef = useRef(0); // interval id for spin "tick" clicks
  const endRef = useRef(0); // safety timeout id

  // Build the wheel entries: student names, minus already-picked ones (optional).
  const hasStudents = students.length > 0;
  const activeStudents = useMemo(
    () => (removeChosen ? students.filter((s) => !picked.includes(s.id)) : students),
    [students, removeChosen, picked],
  );
  const everyoneDone = hasStudents && removeChosen && activeStudents.length === 0;
  const entries = useMemo(() => {
    if (everyoneDone) return [];
    if (activeStudents.length > 0) return activeStudents;
    const tokens = ar ? SURPRISE_AR : SURPRISE_EN;
    return tokens.map((name, i) => ({ id: `surprise-${i}`, name }));
  }, [everyoneDone, activeStudents, ar]);

  // Clear any running timers when the tool closes or unmounts.
  useEffect(() => {
    return () => {
      clearInterval(tickRef.current);
      clearTimeout(endRef.current);
    };
  }, []);

  if (!active) return null;

  const finish = () => {
    clearInterval(tickRef.current);
    clearTimeout(endRef.current);
    const chosen = pendingRef.current;
    setSpinning(false);
    if (!chosen) return;
    setWinner({ name: chosen.name });
    // "Someone won!" — triumphant fanfare + applause.
    playSound?.("win");
    playSound?.("clap");
    if (removeChosen && !String(chosen.id).startsWith("surprise-")) {
      setPicked((p) => (p.includes(chosen.id) ? p : [...p, chosen.id]));
    }
  };

  const spin = () => {
    if (spinning || entries.length === 0) return;
    const n = entries.length;
    const seg = 360 / n;

    // Randomness lives inside the click handler (safe — not during render).
    const idx = Math.floor(Math.random() * n);
    const jitter = (Math.random() - 0.5) * seg * 0.7; // land off-center, still inside
    const mid = (idx + 0.5) * seg;

    pendingRef.current = entries[idx];
    setWinner(null);
    setSpinning(true);
    playSound?.("spin");

    // Playful ticks while it whirls.
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => playSound?.("tick"), 320);

    // Rotate forward by several full turns, then align the winner under the pointer
    // (pointer sits at the top, i.e. rotation ≡ -mid mod 360).
    const fullTurns = 5 + Math.floor(Math.random() * 3);
    setRotation((prev) => {
      const targetMod = (((-mid - jitter) % 360) + 360) % 360;
      const prevMod = ((prev % 360) + 360) % 360;
      let delta = targetMod - prevMod;
      if (delta < 0) delta += 360;
      return prev + fullTurns * 360 + delta;
    });

    // Safety net in case transitionend does not fire.
    clearTimeout(endRef.current);
    endRef.current = setTimeout(finish, SPIN_MS + 250);
  };

  const resetTurns = () => {
    setPicked([]);
    setWinner(null);
    playSound?.("pop");
  };

  const fontFor = entries.length > 8 ? 11 : entries.length > 5 ? 13 : 15;

  return (
    <Box
      data-panel
      style={dragStyle}
      sx={{
        position: "absolute",
        top: "50%",
        insetInlineStart: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9,
        pointerEvents: "auto",
        bgcolor: "background.paper",
        borderRadius: 4,
        boxShadow: 8,
        p: 2,
        width: "min(92vw, 360px)",
        textAlign: "center",
      }}
    >
      <IconButton
        size="small"
        onClick={onClose}
        sx={{ position: "absolute", top: 6, insetInlineEnd: 6, color: "text.secondary" }}
      >
        <MdClose />
      </IconButton>
      <Box
        {...dragHandle}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 1 }}
      >
        <MdDragIndicator color="#9aa" />
        <Typography sx={{ fontWeight: 900, fontSize: 20 }}>
          🎡 {ar ? "عجلة الأسماء" : "Name Wheel"}
        </Typography>
      </Box>

      {!hasStudents && (
        <Typography sx={{ color: "text.secondary", fontSize: 13, mb: 1 }}>
          {ar
            ? "أضف طلاب للجلسة عشان تلف العجلة"
            : "Add students to the session to spin the wheel"}
        </Typography>
      )}

      {/* The wheel (or a friendly "everyone had a turn" note) */}
      <Box sx={{ position: "relative", width: SIZE, maxWidth: "100%", mx: "auto" }}>
        {everyoneDone ? (
          <Box sx={{ py: 6 }}>
            <Typography sx={{ fontSize: 40 }}>🎉</Typography>
            <Typography sx={{ fontWeight: 800, mb: 2 }}>
              {ar ? "الكل أخد دور! برافو 👏" : "Everyone had a turn! 👏"}
            </Typography>
            <Button variant="contained" startIcon={<MdRefresh />} onClick={resetTurns}>
              {ar ? "من الأول" : "Start over"}
            </Button>
          </Box>
        ) : (
          <>
            <Box
              component="svg"
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              sx={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
            >
              <defs>
                {/* 3D gloss: bright top-left highlight fading to a soft bottom shade */}
                <radialGradient id="npGloss" cx="50%" cy="32%" r="72%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
                  <stop offset="42%" stopColor="#ffffff" stopOpacity="0.12" />
                  <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
                </radialGradient>
                {/* Glossy golden hub cap */}
                <radialGradient id="npHub" cx="38%" cy="32%" r="78%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="55%" stopColor="#fff4d6" />
                  <stop offset="100%" stopColor="#f2c14e" />
                </radialGradient>
                <linearGradient id="npPointer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6b6b" />
                  <stop offset="100%" stopColor="#e02f43" />
                </linearGradient>
                <linearGradient id="npRim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5a4632" />
                  <stop offset="100%" stopColor="#2f2418" />
                </linearGradient>
                <filter id="npShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.28" />
                </filter>
                <filter id="npPointerShadow" x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.35" />
                </filter>
                <filter id="npWin" x="-40%" y="-40%" width="180%" height="180%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ffd166" floodOpacity="0.95" />
                </filter>
              </defs>

              {/* Dark rim backing + soft drop shadow under the whole wheel */}
              <circle cx={C} cy={C} r={R + 7} fill="url(#npRim)" filter="url(#npShadow)" />

              {/* Rotating wheel: coloured slices + names */}
              <g
                onTransitionEnd={(e) => {
                  if (e.propertyName === "transform" && spinning) finish();
                }}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: `${C}px ${C}px`,
                  transition: spinning
                    ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.9, 0.25, 1)`
                    : "none",
                }}
              >
                {entries.map((s, i) => {
                  const seg = 360 / entries.length;
                  const a0 = i * seg;
                  const a1 = a0 + seg;
                  const mid = a0 + seg / 2;
                  const lp = pointAt(mid, R * 0.6);
                  const isWin = !!winner && !spinning && s.name === winner.name;
                  return (
                    <g key={s.id}>
                      <path
                        d={slicePath(a0, a1)}
                        fill={PALETTE[i % PALETTE.length]}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        opacity={winner && !spinning && !isWin ? 0.7 : 1}
                      />
                      {isWin && (
                        <path
                          d={slicePath(a0, a1)}
                          fill="#ffffff"
                          fillOpacity="0.28"
                          stroke="#ffd166"
                          strokeWidth="4"
                          strokeLinejoin="round"
                          filter="url(#npWin)"
                        />
                      )}
                      {/* Name follows the slice; white halo keeps it readable on any colour */}
                      <text
                        x={lp.x}
                        y={lp.y}
                        fill="#2a2320"
                        fontSize={fontFor}
                        fontWeight="800"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        stroke="#ffffff"
                        strokeWidth="2.6"
                        strokeLinejoin="round"
                        paintOrder="stroke"
                        transform={`rotate(${mid} ${lp.x} ${lp.y})`}
                      >
                        {short(s.name)}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Rim ring drawn over the slice edges for a clean border */}
              <circle cx={C} cy={C} r={R} fill="none" stroke="url(#npRim)" strokeWidth="6" />

              {/* Evenly-spaced bulbs around the rim (deterministic) */}
              {Array.from({ length: BULBS }).map((_, i) => {
                const bp = pointAt((360 / BULBS) * i, R);
                return (
                  <circle
                    key={`bulb-${i}`}
                    cx={bp.x}
                    cy={bp.y}
                    r="3.4"
                    fill={i % 2 ? "#fff7cc" : "#ffd166"}
                    stroke="#8a6d2f"
                    strokeWidth="0.8"
                  />
                );
              })}

              {/* Static gloss so the shine stays put while the wheel spins */}
              <circle cx={C} cy={C} r={R - 3} fill="url(#npGloss)" pointerEvents="none" />

              {/* Center hub cap with a star + soft gloss */}
              <circle cx={C} cy={C} r="22" fill="url(#npHub)" stroke="#c99a2e" strokeWidth="2.5" />
              <circle cx={C} cy={C - 5} r="12" fill="#ffffff" opacity="0.35" />
              <text x={C} y={C + 1} fontSize="20" textAnchor="middle" dominantBaseline="middle">
                ⭐
              </text>

              {/* Pointer/marker at the top, pointing INTO the wheel */}
              <path
                d={`M ${C} ${C - R + 6} L ${C - 13} ${C - R - 20} Q ${C} ${C - R - 30} ${C + 13} ${C - R - 20} Z`}
                fill="url(#npPointer)"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinejoin="round"
                filter="url(#npPointerShadow)"
              />
            </Box>

            {/* Winner celebration */}
            {winner && !spinning && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  insetInlineStart: "50%",
                  transform: "translate(-50%, -50%)",
                  px: 3,
                  py: 1.75,
                  borderRadius: 999,
                  border: "3px solid #ffd166",
                  background: "linear-gradient(135deg, #fff9e8 0%, #ffffff 55%, #fff2f7 100%)",
                  boxShadow: "0 10px 26px rgba(0,0,0,.28)",
                  animation: "namePickerPop .55s cubic-bezier(.18,.9,.28,1.2)",
                  "@keyframes namePickerPop": {
                    "0%": { transform: "translate(-50%,-50%) scale(.3)", opacity: 0 },
                    "60%": { transform: "translate(-50%,-50%) scale(1.15)", opacity: 1 },
                    "100%": { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 24,
                    whiteSpace: "nowrap",
                    color: "#2a2320",
                    textShadow: "0 2px 0 rgba(255,255,255,.8)",
                  }}
                >
                  {winner.name} 🌟
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      {!everyoneDone && (
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={winner ? <MdRefresh /> : <MdCasino />}
            disabled={spinning || entries.length === 0}
            onClick={spin}
            sx={{ fontWeight: 900, fontSize: 18, borderRadius: 3 }}
          >
            {spinning
              ? ar ? "بتلف..." : "Spinning..."
              : winner
                ? ar ? "لِف تاني!" : "Spin again!"
                : ar ? "لِف!" : "Spin!"}
          </Button>

          {hasStudents && (
            <FormControlLabel
              sx={{ justifyContent: "center", m: 0 }}
              control={
                <Switch
                  size="small"
                  checked={removeChosen}
                  onChange={(e) => setRemoveChosen(e.target.checked)}
                />
              }
              label={
                <Typography sx={{ fontSize: 13 }}>
                  {ar ? "شيل اللي اتختار (عشان الكل ياخد دور)" : "Remove picked (everyone gets a turn)"}
                </Typography>
              }
            />
          )}
        </Stack>
      )}
    </Box>
  );
}
