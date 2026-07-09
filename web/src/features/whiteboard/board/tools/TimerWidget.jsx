"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
  keyframes,
  useTheme,
} from "@mui/material";
import {
  MdTimer,
  MdPlayArrow,
  MdPause,
  MdRefresh,
  MdAdd,
  MdRemove,
  MdDragIndicator,
  MdCelebration,
  MdClose,
} from "react-icons/md";

// Gentle "it's alive" bounce for the whole card when time is up — never a jarring alarm.
const celebrate = keyframes`
  0%   { transform: scale(1) rotate(0deg); }
  25%  { transform: scale(1.05) rotate(-1.5deg); }
  50%  { transform: scale(1.02) rotate(1.5deg); }
  75%  { transform: scale(1.05) rotate(-1deg); }
  100% { transform: scale(1) rotate(0deg); }
`;

// Quick-pick durations (minutes) — big friendly chips for tiny fingers.
const QUICK_MINUTES = [1, 2, 3, 5, 10];

const RING = 168; // SVG viewport size for the countdown ring.
const R = 74; // Ring radius.
const C = 2 * Math.PI * R; // Circumference for the dasharray math.

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const pad2 = (n) => String(n).padStart(2, "0");

export default function TimerWidget({ active, rootRef, playSound, ar = true, onClose }) {
  const theme = useTheme();
  const accent = theme.palette.primary.main;

  // Entered duration (setup) and live countdown.
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0); // Duration we started from — drives the ring + reset.
  const [phase, setPhase] = useState("setup"); // "setup" | "running" | "paused" | "done"
  const remainingRef = useRef(0); // Countdown source of truth, read inside the interval.

  // Free drag: null → rest at the default corner; else explicit root-local px.
  const [pos, setPos] = useState(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null); // { offX, offY } grab offset inside the panel.
  const panelRef = useRef(null);

  // One real interval, tied to the running phase, that survives re-renders. All the
  // state changes happen inside the tick callback (not synchronously in the effect
  // body), so the countdown, final-seconds tick and zero celebration live together.
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      const next = Math.max(0, remainingRef.current - 1);
      remainingRef.current = next;
      setRemaining(next);
      // Soft "tick" in the final few seconds — a quiet heads-up, not a blare.
      if (next > 0 && next <= 3) playSound?.("tick");
      // Reaching zero: stop and celebrate gently (happy chime, then a little cheer).
      if (next === 0) {
        setPhase("done");
        playSound?.("ding");
        setTimeout(() => playSound?.("cheer"), 380);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, playSound]);

  // Drag: attach window listeners only while grabbing, and auto-clean on unmount.
  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      const rect = rootRef.current?.getBoundingClientRect();
      const d = dragRef.current;
      if (!rect || !d) return;
      const left = clamp(e.clientX - rect.left - d.offX, 4, rect.width - 60);
      const top = clamp(e.clientY - rect.top - d.offY, 4, rect.height - 60);
      setPos({ left, top });
    };
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, rootRef]);

  if (!active) return null;

  const grab = (e) => {
    const panel = panelRef.current?.getBoundingClientRect();
    if (!panel) return;
    dragRef.current = { offX: e.clientX - panel.left, offY: e.clientY - panel.top };
    setDragging(true);
  };

  const startOrResume = () => {
    if (phase === "paused") return setPhase("running"); // Resume where we left off.
    const duration = minutes * 60 + seconds;
    if (duration <= 0) return;
    setTotal(duration);
    remainingRef.current = duration;
    setRemaining(duration);
    setPhase("running");
    playSound?.("pop");
  };

  const pause = () => {
    setPhase("paused");
    playSound?.("tick");
  };

  // Back to the setup screen with the entered duration intact.
  const reset = () => {
    setPhase("setup");
    remainingRef.current = 0;
    setRemaining(0);
    playSound?.("whoosh");
  };

  const pick = (m) => {
    setMinutes(m);
    setSeconds(0);
    playSound?.("tick");
  };

  const bumpMin = (d) => setMinutes((m) => clamp(m + d, 0, 99));
  const bumpSec = (d) => setSeconds((s) => clamp(s + d, 0, 59));

  const isSetup = phase === "setup";
  const isDone = phase === "done";
  const shown = isSetup ? minutes * 60 + seconds : remaining;
  const fraction = isSetup ? 1 : clamp(remaining / (total || 1), 0, 1);
  const dash = C * (1 - fraction); // How much of the ring has drained away.

  // A compact +/- stepper — deliberately big and tappable for touch screens.
  // A plain render helper (not a nested component) so its subtree never remounts.
  const renderStepper = (label, value, onPlus, onMinus) => (
    <Stack alignItems="center" spacing={0.5}>
      <IconButton
        onClick={onPlus}
        sx={{ bgcolor: "action.hover", "&:hover": { bgcolor: "action.selected" } }}
      >
        <MdAdd />
      </IconButton>
      <Box
        sx={{
          minWidth: 56,
          textAlign: "center",
          fontSize: 30,
          fontWeight: 900,
          lineHeight: 1,
          color: "text.primary",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {pad2(value)}
      </Box>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
        {label}
      </Typography>
      <IconButton
        onClick={onMinus}
        sx={{ bgcolor: "action.hover", "&:hover": { bgcolor: "action.selected" } }}
      >
        <MdRemove />
      </IconButton>
    </Stack>
  );

  return (
    <Paper
      ref={panelRef}
      elevation={0}
      sx={{
        position: "absolute",
        zIndex: 9,
        pointerEvents: "auto",
        width: 300,
        p: 2,
        borderRadius: 6,
        border: "3px solid",
        borderColor: "primary.light",
        boxShadow: "0 18px 44px rgba(0,0,0,.22)",
        bgcolor: "background.paper",
        userSelect: "none",
        animation: isDone ? `${celebrate} 0.9s ease-in-out infinite` : "none",
        // Rest at a friendly corner until the teacher drags it somewhere else.
        ...(pos ? {} : { top: 84, insetInlineEnd: 16 }),
      }}
      // When dragged, position with PHYSICAL left/top via `style` (sx left/right
      // get mirrored by stylis-plugin-rtl in Arabic); clear the logical corner.
      style={pos ? { insetInlineStart: "auto", insetInlineEnd: "auto", left: pos.left, top: pos.top } : undefined}
    >
      {/* Header handle — grab here to reposition anywhere over the board. */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        onPointerDown={grab}
        sx={{
          mb: 1.5,
          cursor: dragging ? "grabbing" : "grab",
          color: "primary.main",
          touchAction: "none",
        }}
      >
        <MdDragIndicator />
        <MdTimer size={22} />
        <Typography sx={{ fontWeight: 900, fontSize: 18, flexGrow: 1 }}>
          {ar ? "المؤقت" : "Timer"}
        </Typography>
        <IconButton
          size="small"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          sx={{ color: "text.secondary" }}
        >
          <MdClose />
        </IconButton>
      </Stack>

      {/* Countdown ring with the big readable MM:SS in its heart. */}
      <Box sx={{ position: "relative", width: RING, height: RING, mx: "auto" }}>
        <Box component="svg" viewBox={`0 0 ${RING} ${RING}`} sx={{ width: "100%", height: "100%" }}>
          <circle
            cx={RING / 2}
            cy={RING / 2}
            r={R}
            fill="none"
            stroke={theme.palette.action.hover}
            strokeWidth={12}
          />
          <circle
            cx={RING / 2}
            cy={RING / 2}
            r={R}
            fill="none"
            stroke={accent}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={dash}
            // Start the ring at 12 o'clock and deplete clockwise.
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            style={{ transition: "stroke-dashoffset 0.9s linear" }}
          />
        </Box>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 46,
                fontWeight: 900,
                lineHeight: 1,
                color: isDone ? "primary.main" : "text.primary",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {pad2(Math.floor(shown / 60))}:{pad2(shown % 60)}
            </Typography>
            {isDone && (
              <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" sx={{ mt: 0.5 }}>
                <MdCelebration color={accent} />
                <Typography sx={{ fontWeight: 800, color: "primary.main" }}>
                  {ar ? "الوقت خلص!" : "Time's up!"}
                </Typography>
              </Stack>
            )}
          </Box>
        </Box>
      </Box>

      {/* Setup: pick a duration with steppers or one-tap chips. */}
      {isSetup && (
        <>
          <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 1.5 }}>
            {renderStepper(ar ? "دقائق" : "Min", minutes, () => bumpMin(1), () => bumpMin(-1))}
            <Box sx={{ fontSize: 30, fontWeight: 900, color: "text.disabled", alignSelf: "center" }}>:</Box>
            {renderStepper(ar ? "ثواني" : "Sec", seconds, () => bumpSec(5), () => bumpSec(-5))}
          </Stack>
          <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={0.75} sx={{ mt: 1.5 }}>
            {QUICK_MINUTES.map((m) => (
              <Chip
                key={m}
                label={ar ? `${m} د` : `${m}m`}
                onClick={() => pick(m)}
                color={minutes === m && seconds === 0 ? "primary" : "default"}
                sx={{ fontWeight: 800, borderRadius: 3 }}
              />
            ))}
          </Stack>
        </>
      )}

      {/* Controls — clean split between setup, running, paused and done. */}
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        {phase === "running" ? (
          <Button
            fullWidth
            variant="contained"
            color="warning"
            startIcon={<MdPause />}
            onClick={pause}
            sx={{ borderRadius: 3, fontWeight: 800, py: 1 }}
          >
            {ar ? "إيقاف" : "Pause"}
          </Button>
        ) : (
          !isDone && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<MdPlayArrow />}
              onClick={startOrResume}
              sx={{ borderRadius: 3, fontWeight: 800, py: 1 }}
            >
              {phase === "paused" ? (ar ? "استكمال" : "Resume") : ar ? "ابدأ" : "Start"}
            </Button>
          )
        )}
        {!isSetup && (
          <Button
            fullWidth={isDone}
            variant="outlined"
            startIcon={<MdRefresh />}
            onClick={reset}
            sx={{ borderRadius: 3, fontWeight: 800, py: 1, minWidth: 112 }}
          >
            {ar ? "إعادة" : "Reset"}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
