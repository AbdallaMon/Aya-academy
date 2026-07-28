"use client";

import { useState } from "react";
import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import { MdWidgets, MdChevronLeft } from "react-icons/md";
import { BOARD_TOOLS } from "./config/tools.js";

// Vertical, collapsible palette down the inline-start edge (vertically centred,
// where Excalidraw keeps no UI of its own). Each button toggles its tool; active
// tools glow. Lives inside the board root so it stays usable in fullscreen.
export default function BoardToolbar({ activeKeys, onToggle, ar = true, footer = null }) {
  const [open, setOpen] = useState(true);
  // Popper takes PHYSICAL placements only ("inline-end" crashes it). The bar sits
  // on the inline-start edge, so tooltips point toward the canvas: right in LTR,
  // left in RTL.
  const tipSide = ar ? "left" : "right";

  return (
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        insetInlineStart: 8,
        zIndex: 10,
      }}
    >
      <Stack spacing={1} alignItems="center">
        <Tooltip
          title={ar ? "الأدوات" : "Tools"}
          placement={tipSide}
          slotProps={{ tooltip: { dir: ar ? "rtl" : "ltr" } }}
        >
          <IconButton
            onClick={() => setOpen((v) => !v)}
            sx={{ bgcolor: "primary.main", color: "#fff", boxShadow: 3, "&:hover": { bgcolor: "primary.dark" } }}
          >
            {open ? <MdChevronLeft /> : <MdWidgets />}
          </IconButton>
        </Tooltip>

        {open &&
          BOARD_TOOLS.map((t) => {
            const on = activeKeys.has(t.key);
            const Icon = t.icon;
            return (
              <Tooltip
                key={t.key}
                title={ar ? t.labelAr : t.labelEn}
                placement={tipSide}
                slotProps={{ tooltip: { dir: ar ? "rtl" : "ltr" } }}
              >
                <IconButton
                  onClick={() => onToggle(t)}
                  sx={{
                    bgcolor: on ? "secondary.main" : "background.paper",
                    color: on ? "#fff" : "text.primary",
                    boxShadow: 2,
                    transition: "transform .1s",
                    "&:hover": { bgcolor: on ? "secondary.dark" : "background.paper", transform: "scale(1.08)" },
                  }}
                >
                  <Icon />
                </IconButton>
              </Tooltip>
            );
          })}

        {/* Board-level controls (background, fullscreen) live here too, so nothing
            floats over Excalidraw's own top toolbar / library button. */}
        {open && footer}
      </Stack>
    </Box>
  );
}
