"use client";

import { useState } from "react";
import { Box, Chip, IconButton, MenuItem, Select, Stack } from "@mui/material";
import { MdExpandMore, MdCelebration } from "react-icons/md";
import { REACTIONS } from "./config/reactions.js";

// Collapsible bottom bar: optional student selector + a button per reaction.
// Starts collapsed as a clear pill so it never crowds the board; tap it to open,
// tap the chevron to close again. Firing calls onFire(reactionKey, name|null).
export default function ReactionBar({ students = [], onFire, ar = true }) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");

  const nameFor = (id) =>
    students.find((s) => String(s.id) === String(id))?.name || null;

  return (
    <Box
      sx={{
        position: "absolute",
        insetInline: 0,
        bottom: 0,
        // Above the laser/spotlight capture overlays so the reaction chips stay
        // clickable even while a pointer tool is active.
        zIndex: 12,
        pointerEvents: "none",
      }}
    >
      <Stack alignItems="center">
        {open ? (
          // Close handle when the tray is open.
          <IconButton
            aria-label={ar ? "إغلاق لوحة التشجيع" : "Close encouragement panel"}
            onClick={() => setOpen(false)}
            sx={{ pointerEvents: "auto", bgcolor: "background.paper", boxShadow: 2, mb: 1 }}
          >
            <MdExpandMore />
          </IconButton>
        ) : (
          // Collapsed pill — obvious "open me" affordance.
          <Chip
            icon={<MdCelebration />}
            clickable
            onClick={() => setOpen(true)}
            label={ar ? "تحفيز وتشجيع 🎉" : "Encouragement & rewards 🎉"}
            sx={{
              pointerEvents: "auto",
              bgcolor: "background.paper",
              boxShadow: 3,
              fontWeight: 800,
              fontSize: 15,
              py: 2.4,
              px: 1,
              mb: 2,
            }}
          />
        )}
        {open && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              pointerEvents: "auto",
              bgcolor: "background.paper",
              borderRadius: 3,
              boxShadow: 4,
              px: 2,
              py: 1,
              mb: 2,
              flexWrap: "wrap",
              maxWidth: "95vw",
              justifyContent: "center",
            }}
          >
            {students.length > 0 && (
              <Select
                size="small"
                displayEmpty
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                MenuProps={{
                  slotProps: { paper: { dir: ar ? "rtl" : "ltr" } },
                }}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="">
                  <em>{ar ? "بدون اسم" : "No name"}</em>
                </MenuItem>
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            )}
            {REACTIONS.map((r) => (
              <Chip
                key={r.key}
                clickable
                label={`${r.emoji} ${ar ? r.labelAr : r.labelEn}`}
                onClick={() => onFire?.(r.key, nameFor(studentId))}
                sx={{ fontSize: 18, py: 2.2 }}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
