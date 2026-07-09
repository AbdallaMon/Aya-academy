"use client";

import { useState } from "react";
import { Box, IconButton, Popover, Stack, Tooltip, Typography } from "@mui/material";
import { MdFormatColorFill } from "react-icons/md";
import { BOARD_BACKGROUNDS } from "./config/backgrounds.js";

// A quick palette to recolor the WHOLE canvas background, plus a custom picker,
// plus a gallery of childish scene backgrounds (rendered behind the canvas).
// onPick receives a background descriptor:
//   { type: "color", value: "#hex" }  |  { type: "image", key, css }
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

// Read an uploaded image, downscale it (so the base64 stays small enough for
// localStorage + the board-data blob), and return a ready CSS `background` value.
function fileToBackgroundCss(file, maxDim = 1600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        // JPEG keeps photos tiny; PNGs with transparency would balloon.
        const dataURL = canvas.toDataURL("image/jpeg", 0.72);
        resolve(`url("${dataURL}") center center / cover no-repeat`);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function BoardBackgroundPicker({ onPick, ar = true }) {
  const [anchor, setAnchor] = useState(null);

  const pickColor = (value) => {
    onPick?.({ type: "color", value });
    setAnchor(null);
  };
  const pickImage = (bg) => {
    onPick?.({ type: "image", key: bg.key, css: bg.css });
    setAnchor(null);
  };
  const pickUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;
    try {
      const css = await fileToBackgroundCss(file);
      onPick?.({ type: "image", key: "custom", css });
      setAnchor(null);
    } catch {
      /* unreadable image — ignore, board keeps its current background */
    }
  };

  return (
    <>
      <Tooltip title={ar ? "الخلفية" : "Background"}>
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
        <Box sx={{ p: 1.5, maxWidth: 320 }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {ar ? "لون" : "Colour"}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 0.5, mb: 1.5 }}>
            {SWATCHES.map((c) => (
              <Box
                key={c}
                onClick={() => pickColor(c)}
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
                onChange={(e) => pickColor(e.target.value)}
                style={{ display: "none" }}
              />
            </Box>
          </Stack>

          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {ar ? "مناظر" : "Scenes"}
          </Typography>
          <Box
            sx={{
              mt: 0.5,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 1,
            }}
          >
            {/* Upload your own background image. */}
            <Tooltip title={ar ? "ارفع صورة من عندك" : "Upload your own image"}>
              <Box
                component="label"
                sx={{
                  height: 46,
                  borderRadius: 2,
                  cursor: "pointer",
                  border: "2px dashed",
                  borderColor: "primary.main",
                  color: "primary.main",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 22,
                  transition: "transform .1s",
                  "&:hover": { transform: "scale(1.06)" },
                }}
              >
                🖼️
                <input type="file" accept="image/*" onChange={pickUpload} style={{ display: "none" }} />
              </Box>
            </Tooltip>
            {BOARD_BACKGROUNDS.map((bg) => (
              <Tooltip key={bg.key} title={ar ? bg.labelAr : bg.labelEn}>
                <Box
                  onClick={() => pickImage(bg)}
                  sx={{
                    height: 46,
                    borderRadius: 2,
                    cursor: "pointer",
                    background: bg.css,
                    border: "2px solid rgba(0,0,0,.12)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 20,
                    transition: "transform .1s",
                    "&:hover": { transform: "scale(1.06)" },
                  }}
                >
                  {bg.emoji}
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Box>
      </Popover>
    </>
  );
}
