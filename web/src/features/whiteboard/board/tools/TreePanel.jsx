"use client";

import { useRef, useState } from "react";
import { Box, Button, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import { MdAdd, MdClose, MdDragIndicator } from "react-icons/md";
import { useDraggable } from "./useDraggable.js";

// Mind-map / tree builder. The teacher types a title and drops it as a box; then
// drags the little blue dot under one box onto another to tie them together
// (that string-drawing lives in BoardObjectsLayer). Great for lesson outlines,
// word families, story maps — "عناوين مربوطة ببعض زي شجرة".
const NODE_COLORS = ["#fff3bf", "#d3f9d8", "#d0ebff", "#ffe3e3", "#f3d9fa", "#e5dbff"];

export default function TreePanel({ active, rootRef, addObject, playSound, ar = true, onClose }) {
  const [text, setText] = useState("");
  const count = useRef(0);
  const { dragStyle, dragHandle } = useDraggable(rootRef);

  if (!active) return null;

  const add = () => {
    const value = text.trim() || (ar ? "عنوان" : "Title");
    const n = count.current++;
    const x = 0.35 + (((n % 4) - 1.5) * 0.12);
    const y = 0.3 + ((Math.floor(n / 4) % 3) * 0.16);
    addObject?.({ type: "node", value, color: NODE_COLORS[n % NODE_COLORS.length], x, y });
    playSound?.("pop");
    setText("");
  };

  return (
    <Paper
      data-panel
      elevation={6}
      style={dragStyle}
      sx={{
        position: "absolute",
        insetInlineStart: 64,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 8,
        p: 1.5,
        borderRadius: 4,
        width: 260,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Box {...dragHandle} sx={{ display: "flex", alignItems: "center", gap: 0.5, flexGrow: 1, color: "text.secondary" }}>
          <MdDragIndicator />
          <Typography sx={{ fontWeight: 800, color: "text.primary" }}>{ar ? "🌳 خريطة عناوين" : "🌳 Title map"}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <MdClose />
        </IconButton>
      </Stack>

      <Stack spacing={1}>
        <TextField
          size="small"
          fullWidth
          multiline
          maxRows={3}
          placeholder={ar ? "اكتب عنوان…" : "Type a title…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button variant="contained" startIcon={<MdAdd />} onClick={add} sx={{ borderRadius: 3, fontWeight: 800 }}>
          {ar ? "أضف عنوان" : "Add title"}
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          {ar
            ? "اسحب النقطة الزرقاء تحت أي عنوان وحطها على عنوان تاني عشان تربطهم ببعض. 🔗"
            : "Drag the blue dot under a title onto another to link them. 🔗"}
        </Typography>
      </Stack>
    </Paper>
  );
}
