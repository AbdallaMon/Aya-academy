"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
  keyframes,
  useTheme,
} from "@mui/material";
import {
  MdStar,
  MdAdd,
  MdRemove,
  MdClose,
  MdRefresh,
  MdOpenInFull,
  MdCloseFullscreen,
  MdDragIndicator,
} from "react-icons/md";
import { useDraggable } from "./useDraggable.js";

// Happy little "you got a star!" pop for the row that just scored.
const pop = keyframes`
  0%   { transform: scale(1); }
  40%  { transform: scale(1.06); }
  70%  { transform: scale(0.99); }
  100% { transform: scale(1); }
`;

// Bigger wiggle when a child hits a milestone (every 5th star).
const party = keyframes`
  0%   { transform: scale(1) rotate(0deg); }
  25%  { transform: scale(1.08) rotate(-2deg); }
  50%  { transform: scale(1.05) rotate(2deg); }
  75%  { transform: scale(1.08) rotate(-1deg); }
  100% { transform: scale(1) rotate(0deg); }
`;

// Full-screen "you're in the lead!" name burst.
const burstIn = keyframes`
  0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
  55%  { transform: translate(-50%, -50%) scale(1.12); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
`;

// Confetti raining down over the whole board during the leader celebration.
const fall = keyframes`
  0%   { transform: translateY(-20vh) rotate(0deg); opacity: 0; }
  12%  { opacity: 1; }
  100% { transform: translateY(115vh) rotate(360deg); opacity: 0; }
`;

const MAX_GLYPHS = 5; // Show up to 5 ⭐ then collapse to "×N".

// Deterministic confetti pieces (index-driven positions — never Math.random in render).
const CONFETTI = Array.from({ length: 16 }, (_, i) => i);

// Render a child's score as star glyphs (capped) — kids read stars faster than numbers.
const starGlyphs = (n) => {
  if (n <= 0) return "";
  if (n <= MAX_GLYPHS) return "⭐".repeat(n);
  return `⭐×${n}`;
};

export default function StarsBoard({
  active,
  rootRef,
  students = [],
  playSound,
  ar = true,
  onClose,
}) {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  const { dragStyle, dragHandle } = useDraggable(rootRef);

  // Session-local scores keyed by student id. No persistence needed.
  const [scores, setScores] = useState({});
  // The row currently celebrating: { id, kind: "pop" | "party" }.
  const [celebrate, setCelebrate] = useState(null);
  // Big mode makes the whole card kid-tappable-large.
  const [big, setBig] = useState(false);
  // Full-screen leader moment: { name } while showing, else null.
  const [leaderCeleb, setLeaderCeleb] = useState(null);

  const celebrateRef = useRef(0); // timeout id that clears the row animation.
  const leaderCelebRef = useRef(0); // timeout id that clears the full-screen overlay.

  // Clear any pending timers on unmount so nothing fires after we're gone.
  useEffect(() => {
    return () => {
      clearTimeout(celebrateRef.current);
      clearTimeout(leaderCelebRef.current);
    };
  }, []);

  const hasStudents = students.length > 0;

  // Current leader (>0 stars). No leader while everyone is at zero — never a "loser".
  const leaderId = useMemo(() => {
    let best = null;
    let top = 0;
    for (const s of students) {
      const v = scores[s.id] || 0;
      if (v > top) {
        top = v;
        best = s.id;
      }
    }
    return top > 0 ? best : null;
  }, [students, scores]);

  if (!active) return null;

  const score = (id) => scores[id] || 0;

  // Size tokens — everything keys off `big` (real sizes, never a blurry CSS scale).
  const D = big
    ? { width: 460, list: 460, rowP: 1.5, title: 22, star: 28, name: 20, sc: 18, btn: 46, ico: 24 }
    : { width: 300, list: 320, rowP: 1, title: 18, star: 24, name: 15, sc: 14, btn: 34, ico: 18 };

  // Briefly flag a row so it plays its animation, then auto-clear.
  const flash = (id, kind) => {
    setCelebrate({ id, kind });
    clearTimeout(celebrateRef.current);
    celebrateRef.current = setTimeout(() => setCelebrate(null), 700);
  };

  // Joyful full-screen "you're in the lead!" — fires only on a genuine lead change.
  const celebrateLeader = (name) => {
    setLeaderCeleb({ name });
    playSound?.("firework");
    setTimeout(() => playSound?.("cheer"), 260);
    clearTimeout(leaderCelebRef.current);
    leaderCelebRef.current = setTimeout(() => setLeaderCeleb(null), 2500);
  };

  const addStar = (id) => {
    const next = score(id) + 1;
    const milestone = next % 5 === 0; // every 5th star is a party.
    if (milestone) {
      playSound?.("cheer");
      setTimeout(() => playSound?.("sparkle"), 160);
    } else {
      playSound?.("sparkle");
    }
    flash(id, milestone ? "party" : "pop");

    // Lead-change check: sole new top scorer who wasn't the leader a moment ago.
    let maxOther = 0;
    for (const s of students) {
      if (s.id !== id) maxOther = Math.max(maxOther, score(s.id));
    }
    if (next > 0 && next > maxOther && id !== leaderId) {
      const child = students.find((s) => s.id === id);
      if (child) celebrateLeader(child.name);
    }

    setScores((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeStar = (id) => {
    if (score(id) === 0) return; // never below 0, and no sound when nothing changes.
    playSound?.("tick"); // soft acknowledgement.
    setScores((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
  };

  // Gentle "back to zero for everyone" — a fresh, no-blame start.
  const resetAll = () => {
    setScores({});
    setCelebrate(null);
    playSound?.("whoosh");
  };

  return (
    <>
      <Paper
        data-panel
        elevation={0}
        style={dragStyle}
        sx={{
          position: "absolute",
          zIndex: 9,
          pointerEvents: "auto",
          // Static, RTL-safe corner — a constant inset mirrors correctly under stylis-rtl.
          top: 84,
          insetInlineStart: 16,
          width: D.width,
          maxWidth: "92vw",
          p: 2,
          borderRadius: 6,
          border: "3px solid",
          borderColor: "primary.light",
          boxShadow: "0 18px 44px rgba(0,0,0,.22)",
          bgcolor: "background.paper",
          userSelect: "none",
        }}
      >
        {/* Header: title (grab to move) + size toggle + close (✕). */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Box {...dragHandle} sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            <MdDragIndicator color={theme.palette.text.secondary} />
            <MdStar size={D.star} color={accent} />
            <Typography sx={{ fontWeight: 900, fontSize: D.title, color: "primary.main" }}>
              {ar ? "⭐ لوحة النجوم" : "⭐ Star board"}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setBig((b) => !b)}
            aria-label={big ? (ar ? "حجم عادي" : "Normal size") : ar ? "حجم كبير" : "Large size"}
            sx={{ bgcolor: "action.hover", "&:hover": { bgcolor: "action.selected" } }}
          >
            {big ? <MdCloseFullscreen /> : <MdOpenInFull />}
          </IconButton>
          <IconButton
            size="small"
            onClick={onClose}
            aria-label={ar ? "إغلاق" : "Close"}
            sx={{ bgcolor: "action.hover", "&:hover": { bgcolor: "action.selected" } }}
          >
            <MdClose />
          </IconButton>
        </Stack>

        {/* Empty state — friendly nudge to add kids to the session. */}
        {!hasStudents ? (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <Typography sx={{ fontSize: 40, mb: 1 }}>🧒</Typography>
            <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
              {ar ? "أضف طلاب للجلسة" : "Add students to the session"}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Scrollable list — one cheerful row per attending child. */}
            <Stack
              spacing={1}
              sx={{ maxHeight: D.list, overflowY: "auto", pr: 0.5, mb: 1.5 }}
            >
              {students.map((s) => {
                const n = score(s.id);
                const isLeader = s.id === leaderId;
                const anim = celebrate?.id === s.id ? celebrate.kind : null;
                return (
                  <Stack
                    key={s.id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      p: D.rowP,
                      borderRadius: 3,
                      bgcolor: isLeader ? "primary.light" : "action.hover",
                      color: isLeader ? "primary.contrastText" : "text.primary",
                      animation:
                        anim === "party"
                          ? `${party} 0.7s ease-in-out`
                          : anim === "pop"
                            ? `${pop} 0.5s ease-out`
                            : "none",
                    }}
                  >
                    {/* Name + leader crown (never a "loser" marker for anyone else). */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: D.name,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {isLeader ? "👑 " : ""}
                        {s.name}
                      </Typography>
                      <Typography sx={{ fontSize: D.sc, lineHeight: 1.2, minHeight: 18 }}>
                        {anim === "party" ? "🎉 " : ""}
                        {starGlyphs(n)}
                        <Box component="span" sx={{ fontWeight: 900, opacity: 0.85 }}>
                          {" "}
                          {n}
                        </Box>
                      </Typography>
                    </Box>

                    {/* −1 (never below 0) */}
                    <IconButton
                      onClick={() => removeStar(s.id)}
                      disabled={n === 0}
                      aria-label={ar ? "نجمة أقل" : "Remove a star"}
                      sx={{
                        width: D.btn,
                        height: D.btn,
                        bgcolor: "background.paper",
                        color: "text.secondary",
                        boxShadow: 1,
                        "&:hover": { bgcolor: "background.paper" },
                      }}
                    >
                      <MdRemove size={D.ico} />
                    </IconButton>

                    {/* +1 */}
                    <IconButton
                      onClick={() => addStar(s.id)}
                      aria-label={ar ? "نجمة زيادة" : "Add a star"}
                      sx={{
                        width: D.btn,
                        height: D.btn,
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        boxShadow: 2,
                        "&:hover": { bgcolor: "primary.dark" },
                      }}
                    >
                      <MdAdd size={D.ico} />
                    </IconButton>
                  </Stack>
                );
              })}
            </Stack>

            {/* Footer: gentle "zero everyone" reset for a fresh round. */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<MdRefresh />}
              onClick={resetAll}
              sx={{ borderRadius: 3, fontWeight: 800, py: 0.75 }}
            >
              {ar ? "تصفير الكل" : "Reset all"}
            </Button>
          </>
        )}
      </Paper>

      {/* Full-screen leader celebration — sibling of the card so inset:0 fills the whole board. */}
      {leaderCeleb && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 40,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {/* Confetti shower — deterministic per-index positions and delays. */}
          {CONFETTI.map((i) => (
            <Box
              key={i}
              component="span"
              sx={{
                position: "absolute",
                top: 0,
                insetInlineStart: `${(i * 6 + 4) % 100}%`,
                fontSize: 26 + (i % 4) * 6,
                animation: `${fall} ${1.8 + (i % 5) * 0.25}s linear ${(i % 6) * 0.18}s both`,
              }}
            >
              {i % 2 === 0 ? "⭐" : "🎉"}
            </Box>
          ))}

          {/* The star of the moment — HUGE and centered. */}
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              insetInlineStart: "50%",
              transform: "translate(-50%, -50%)",
              px: 4,
              py: 3,
              maxWidth: "90%",
              textAlign: "center",
              borderRadius: 8,
              bgcolor: "rgba(255,255,255,.94)",
              boxShadow: "0 24px 60px rgba(0,0,0,.3)",
              animation: `${burstIn} 0.6s cubic-bezier(0.2, 0.9, 0.25, 1) both`,
            }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: 30, sm: 46 },
                lineHeight: 1.2,
                color: "primary.main",
              }}
            >
              {ar
                ? `🎉 ${leaderCeleb.name} في الصدارة! 👑`
                : `🎉 ${leaderCeleb.name} is in the lead! 👑`}
            </Typography>
          </Box>
        </Box>
      )}
    </>
  );
}
