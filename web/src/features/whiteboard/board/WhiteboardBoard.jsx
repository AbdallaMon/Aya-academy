"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { Box, IconButton, Tooltip } from "@mui/material";
import { MdFullscreen } from "react-icons/md";
import "@excalidraw/excalidraw/index.css";
import { useBoardPersistence } from "./lib/useBoardPersistence.js";
import { boardChannel } from "./lib/boardChannel.js";
import { playReactionSound } from "./lib/boardSounds.js";
import { REACTIONS } from "./config/reactions.js";
import ReactionOverlay from "./ReactionOverlay.jsx";
import ReactionBar from "./ReactionBar.jsx";

// Excalidraw touches window/document — never SSR it.
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false },
);

export default function WhiteboardBoard({ sessionKey, title, students = [] }) {
  const rootRef = useRef(null);
  const burstId = useRef(0);
  const { initialData, onChange } = useBoardPersistence(sessionKey);

  const goFullscreen = () => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  };

  const fire = (key, studentName) => {
    const def = REACTIONS.find((r) => r.key === key);
    playReactionSound(def?.sound);
    boardChannel.emitReaction({ id: ++burstId.current, key, studentName });
  };

  return (
    <Box ref={rootRef} sx={{ position: "fixed", inset: 0, bgcolor: "#fff" }}>
      <Box sx={{ position: "absolute", inset: 0 }}>
        <Excalidraw
          initialData={initialData}
          onChange={onChange}
          langCode="ar-SA"
          UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false } }}
        />
      </Box>

      {/* Fullscreen toggle (top, above the canvas) */}
      <Box sx={{ position: "absolute", top: 12, insetInlineEnd: 12, zIndex: 5 }}>
        <Tooltip title={title || ""}>
          <IconButton
            onClick={goFullscreen}
            sx={{ bgcolor: "background.paper", boxShadow: 2 }}
          >
            <MdFullscreen />
          </IconButton>
        </Tooltip>
      </Box>

      <ReactionOverlay />
      <ReactionBar students={students} onFire={fire} />
    </Box>
  );
}
