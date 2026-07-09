"use client";

import { useRef, useState } from "react";
import { Box, Chip, IconButton, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { MdClose, MdDragIndicator } from "react-icons/md";
import { useDraggable } from "./useDraggable.js";

// Magnetic-letter palette. Tapping a letter drops a chunky, grabbable tile onto
// the board (handled by BoardObjectsLayer). Arabic letters, English A–Z, and
// digits — the three things a young Quran-academy pupil practises writing.
const SETS = {
  ar: "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي".split(" "),
  en: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  num: "٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩".split(" "),
};

// Bright magnet colours cycled as letters are added, so the board looks playful.
const COLORS = ["#ff922b", "#4dabf7", "#69db7c", "#ffd43b", "#f783ac", "#9775fa", "#ff6b6b", "#38d9a9"];

const SIZES = { sm: 52, md: 68, lg: 92 };

export default function LettersPanel({ active, rootRef, addObject, playSound, ar = true, onClose }) {
  const [set, setSet] = useState("ar");
  const [variant, setVariant] = useState("magnet"); // magnet (3D) | flat (no background)
  const [size, setSize] = useState("md");
  const count = useRef(0);
  const { dragStyle, dragHandle } = useDraggable(rootRef);

  if (!active) return null;

  const drop = (value) => {
    const n = count.current++;
    // Fan the tiles out from the centre so they don't stack on one spot.
    const x = 0.5 + (((n % 5) - 2) * 0.07);
    const y = 0.42 + ((Math.floor(n / 5) % 3) * 0.1);
    addObject?.({
      type: "letter",
      value,
      color: COLORS[n % COLORS.length],
      variant,
      size: SIZES[size],
      x,
      y,
    });
    playSound?.("magnet");
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
          <Typography sx={{ fontWeight: 800, color: "text.primary" }}>{ar ? "🔠 حروف ممغنطة" : "🔠 Magnetic letters"}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <MdClose />
        </IconButton>
      </Stack>

      <ToggleButtonGroup
        size="small"
        exclusive
        value={set}
        onChange={(_, v) => v && setSet(v)}
        sx={{ mb: 1.5 }}
      >
        <ToggleButton value="ar">عربي</ToggleButton>
        <ToggleButton value="en">ABC</ToggleButton>
        <ToggleButton value="num">١٢٣</ToggleButton>
      </ToggleButtonGroup>

      {/* Style (3D magnet vs flat, no background) + size for new letters. */}
      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
        <ToggleButtonGroup size="small" exclusive value={variant} onChange={(_, v) => v && setVariant(v)}>
          <ToggleButton value="magnet">{ar ? "مجسّم" : "3D"}</ToggleButton>
          <ToggleButton value="flat">{ar ? "بدون خلفية" : "Flat"}</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup size="small" exclusive value={size} onChange={(_, v) => v && setSize(v)}>
          <ToggleButton value="sm">{ar ? "ص" : "S"}</ToggleButton>
          <ToggleButton value="md">{ar ? "و" : "M"}</ToggleButton>
          <ToggleButton value="lg">{ar ? "ك" : "L"}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {SETS[set].map((ch, i) => (
          <Chip
            key={ch + i}
            clickable
            label={ch}
            onClick={() => drop(ch)}
            sx={{
              fontSize: 20,
              fontWeight: 800,
              width: 44,
              height: 44,
              borderRadius: 2,
              color: "#fff",
              bgcolor: COLORS[i % COLORS.length],
              "& .MuiChip-label": { px: 0 },
              "&:hover": { bgcolor: COLORS[i % COLORS.length], transform: "scale(1.08)" },
              transition: "transform .1s",
            }}
          />
        ))}
      </Box>
    </Paper>
  );
}
