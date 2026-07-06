"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import { MdFullscreen } from "react-icons/md";
import "@excalidraw/excalidraw/index.css";
import { useBoardPersistence } from "./lib/useBoardPersistence.js";
import { boardChannel } from "./lib/boardChannel.js";
import { playReactionSound } from "./lib/boardSounds.js";
import { REACTIONS } from "./config/reactions.js";
import ReactionOverlay from "./ReactionOverlay.jsx";
import ReactionBar from "./ReactionBar.jsx";
import BoardBackgroundPicker from "./BoardBackgroundPicker.jsx";

// Excalidraw touches window/document — never SSR it.
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false },
);

export default function WhiteboardBoard({
  sessionKey,
  title,
  students = [],
  sessionId = null,
  canUpload = false,
  token = null,
}) {
  const rootRef = useRef(null);
  const burstId = useRef(0);
  const [api, setApi] = useState(null);
  const { initialData, onChange, hydrate } = useBoardPersistence(sessionKey, {
    sessionId,
    canUpload,
    token,
  });

  // Rebuild saved images once the Excalidraw API is ready.
  useEffect(() => {
    if (api) hydrate(api);
  }, [api, hydrate]);

  const goFullscreen = () => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  };

  const setBackground = (color) => {
    api?.updateScene({ appState: { viewBackgroundColor: color } });
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
          excalidrawAPI={setApi}
          initialData={initialData}
          onChange={onChange}
          langCode="ar-SA"
          UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false } }}
        />
      </Box>

      {/* Top controls (above the canvas): background color + fullscreen */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ position: "absolute", top: 12, insetInlineEnd: 12, zIndex: 6 }}
      >
        <BoardBackgroundPicker onPick={setBackground} />
        <Tooltip title={title || ""}>
          <IconButton onClick={goFullscreen} sx={{ bgcolor: "background.paper", boxShadow: 2 }}>
            <MdFullscreen />
          </IconButton>
        </Tooltip>
      </Stack>

      <ReactionOverlay />
      <ReactionBar students={students} onFire={fire} />
    </Box>
  );
}
