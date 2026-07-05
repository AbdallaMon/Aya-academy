"use client";

import { useState } from "react";
import { Box, Chip, IconButton, MenuItem, Select, Stack } from "@mui/material";
import { MdEmojiEmotions, MdExpandMore } from "react-icons/md";
import { REACTIONS } from "./config/reactions.js";

// Collapsible bottom bar: optional student selector + a button per reaction.
// Firing calls onFire(reactionKey, studentName|null). Student choice is optional.
export default function ReactionBar({ students = [], onFire }) {
  const [open, setOpen] = useState(true);
  const [studentId, setStudentId] = useState("");

  const nameFor = (id) =>
    students.find((s) => String(s.id) === String(id))?.name || null;

  return (
    <Box
      sx={{
        position: "absolute",
        insetInline: 0,
        bottom: 0,
        zIndex: 6,
        pointerEvents: "none",
      }}
    >
      <Stack alignItems="center">
        <IconButton
          onClick={() => setOpen((v) => !v)}
          sx={{ pointerEvents: "auto", bgcolor: "background.paper", boxShadow: 2, mb: 1 }}
        >
          {open ? <MdExpandMore /> : <MdEmojiEmotions />}
        </IconButton>
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
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="">
                  <em>بدون اسم</em>
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
                label={`${r.emoji} ${r.labelAr}`}
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
