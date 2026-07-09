"use client";

import { useRef, useState } from "react";
import { Box, IconButton, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { MdClose, MdDragIndicator } from "react-icons/md";
import { useDraggable } from "./useDraggable.js";

// Sticker palette. Tapping an emoji drops a big draggable sticker on the board.
const GROUPS = {
  faces: "😀 😄 😍 🤩 😎 🥳 😴 🤔 😇 🙂 😅 🤗".split(" "),
  animals: "🐱 🐶 🦁 🐯 🐼 🐨 🐰 🦊 🐸 🐝 🦋 🐬".split(" "),
  nature: "🌟 ⭐ 🌈 ☀️ 🌙 ⛅ 🌸 🌷 🌳 🍀 🌻 🔥".split(" "),
  food: "🍎 🍓 🍉 🍌 🍇 🍪 🍭 🍫 🧁 🍩 🥕 🍯".split(" "),
  fun: "🎈 🎉 🎁 🏆 🥇 ⚽ 🚀 ✨ 💎 🎨 🎵 ❤️".split(" "),
};

const TABS = [
  { key: "faces", emoji: "😀" },
  { key: "animals", emoji: "🐱" },
  { key: "nature", emoji: "🌟" },
  { key: "food", emoji: "🍎" },
  { key: "fun", emoji: "🎈" },
];

export default function EmojiPanel({ active, rootRef, addObject, playSound, ar = true, onClose }) {
  const [group, setGroup] = useState("faces");
  const count = useRef(0);
  const { dragStyle, dragHandle } = useDraggable(rootRef);

  if (!active) return null;

  const drop = (value) => {
    const n = count.current++;
    const x = 0.5 + (((n % 5) - 2) * 0.07);
    const y = 0.42 + ((Math.floor(n / 5) % 3) * 0.1);
    addObject?.({ type: "emoji", value, size: 64, x, y });
    playSound?.("sticker");
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
        maxWidth: 300,
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Box {...dragHandle} sx={{ display: "flex", alignItems: "center", gap: 0.5, flexGrow: 1, color: "text.secondary" }}>
          <MdDragIndicator />
          <Typography sx={{ fontWeight: 800, color: "text.primary" }}>{ar ? "😀 ملصقات" : "😀 Stickers"}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <MdClose />
        </IconButton>
      </Stack>

      <ToggleButtonGroup
        size="small"
        exclusive
        value={group}
        onChange={(_, v) => v && setGroup(v)}
        sx={{ mb: 1.5, flexWrap: "wrap" }}
      >
        {TABS.map((t) => (
          <ToggleButton key={t.key} value={t.key} sx={{ fontSize: 18, px: 1 }}>
            {t.emoji}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {GROUPS[group].map((em, i) => (
          <Box
            key={em + i}
            onClick={() => drop(em)}
            sx={{
              fontSize: 30,
              width: 46,
              height: 46,
              display: "grid",
              placeItems: "center",
              borderRadius: 2,
              cursor: "pointer",
              "&:hover": { bgcolor: "action.hover", transform: "scale(1.15)" },
              transition: "transform .1s",
            }}
          >
            {em}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
