"use client";

import { useState } from "react";
import { Box, IconButton, Popover, Stack, Tooltip } from "@mui/material";
import { MdFormatColorFill } from "react-icons/md";

// A quick palette to recolor the WHOLE canvas background, plus a custom picker.
const SWATCHES = [
  "#ffffff", // white
  "#1e1e1e", // chalkboard black
  "#0b5d3b", // green board
  "#fdf6e3", // warm paper
  "#e7f5ff", // sky
  "#fff0f6", // pink
  "#f3f0ff", // lavender
  "#fff9db", // sunny
];

export default function BoardBackgroundPicker({ onPick }) {
  const [anchor, setAnchor] = useState(null);

  const pick = (color) => {
    onPick?.(color);
    setAnchor(null);
  };

  return (
    <>
      <Tooltip title="لون الخلفية">
        <IconButton
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{ bgcolor: "background.paper", boxShadow: 2 }}
        >
          <MdFormatColorFill />
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Box sx={{ p: 1.5, maxWidth: 220 }}>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {SWATCHES.map((c) => (
              <Box
                key={c}
                onClick={() => pick(c)}
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  bgcolor: c,
                  cursor: "pointer",
                  border: "2px solid rgba(0,0,0,.15)",
                  transition: "transform .1s",
                  "&:hover": { transform: "scale(1.12)" },
                }}
              />
            ))}
            <Box
              component="label"
              sx={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                cursor: "pointer",
                border: "2px dashed rgba(0,0,0,.3)",
                display: "grid",
                placeItems: "center",
                fontSize: 12,
              }}
            >
              🎨
              <input
                type="color"
                onChange={(e) => pick(e.target.value)}
                style={{ display: "none" }}
              />
            </Box>
          </Stack>
        </Box>
      </Popover>
    </>
  );
}
