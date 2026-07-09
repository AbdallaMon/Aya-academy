"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Box, IconButton, Tooltip } from "@mui/material";
import { MdFullscreen } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { useBoardPersistence } from "./lib/useBoardPersistence.js";
import { boardChannel } from "./lib/boardChannel.js";
import { playReactionSound, playBoardSound } from "./lib/boardSounds.js";
import { REACTIONS } from "./config/reactions.js";
import { BOARD_TOOLS } from "./config/tools.js";
import ReactionOverlay from "./ReactionOverlay.jsx";
import ReactionBar from "./ReactionBar.jsx";
import BoardBackgroundPicker from "./BoardBackgroundPicker.jsx";
import BoardToolbar from "./BoardToolbar.jsx";
import BoardObjectsLayer from "./tools/BoardObjectsLayer.jsx";

// Excalidraw touches window/document — never SSR it. BoardCanvas is a thin
// client-only wrapper that also swaps in our trimmed MainMenu.
const BoardCanvas = dynamic(() => import("./BoardCanvas.jsx"), { ssr: false });

// Unique id for a placed manipulative — only ever called from a click/drag
// handler (browser), so Date.now()/randomUUID are safe here.
function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `o-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

export default function WhiteboardBoard({
  sessionKey,
  students = [],
  sessionId = null,
  canUpload = false,
  token = null,
}) {
  const { lng } = useTranslation();
  const ar = lng !== "en";
  const rootRef = useRef(null);
  const burstId = useRef(0);
  const [api, setApi] = useState(null);
  const {
    initialData,
    onChange,
    hydrate,
    objects,
    setObjects,
    background,
    setBackground,
  } = useBoardPersistence(sessionKey, { sessionId, canUpload, token });

  // Which tools are on. Exclusive modes (laser/spotlight) share one slot; panels
  // (letters, emoji, tree, timer, names) each toggle independently.
  const [activeMode, setActiveMode] = useState(null);
  const [openPanels, setOpenPanels] = useState(() => new Set());

  const activeKeys = useMemo(() => {
    const s = new Set(openPanels);
    if (activeMode) s.add(activeMode);
    return s;
  }, [openPanels, activeMode]);

  const toggleTool = (tool) => {
    if (tool.mode === "exclusive") {
      setActiveMode((cur) => (cur === tool.key ? null : tool.key));
    } else {
      setOpenPanels((cur) => {
        const next = new Set(cur);
        if (next.has(tool.key)) next.delete(tool.key);
        else next.add(tool.key);
        return next;
      });
    }
  };
  const closePanel = (key) =>
    setOpenPanels((cur) => {
      const next = new Set(cur);
      next.delete(key);
      return next;
    });

  // ── shared object layer ops (persisted via setObjects) ──
  const addObject = (obj) => setObjects((prev) => [...prev, { id: makeId(), ...obj }]);
  const updateObject = (id, patch) =>
    setObjects((prev) => {
      if (patch?.create) {
        if (prev.some((o) => o.id === id)) return prev; // edge already tied
        const rest = { ...patch };
        delete rest.create;
        return [...prev, { id, ...rest }];
      }
      return prev.map((o) => (o.id === id ? { ...o, ...patch } : o));
    });
  const removeObject = (id) =>
    setObjects((prev) => prev.filter((o) => o.id !== id && o.from !== id && o.to !== id));

  // Grow the title map: spawn a fresh node offset from its parent (tree-like) and
  // tie it back automatically. One state write keeps node + edge in sync.
  const addChildNode = (parent) => {
    const id = makeId();
    const x = Math.min(0.95, Math.max(0.05, (parent.x ?? 0.5) + 0.14));
    const y = Math.min(0.95, Math.max(0.05, (parent.y ?? 0.4) + 0.16));
    setObjects((prev) => [
      ...prev,
      { id, type: "node", value: ar ? "عنوان" : "Title", color: parent.color, x, y },
      { id: `edge-${parent.id}-${id}`, type: "edge", from: parent.id, to: id },
    ]);
    playBoardSound("pop");
  };

  // Rebuild saved images once the Excalidraw API is ready.
  useEffect(() => {
    if (api) hydrate(api);
  }, [api, hydrate]);

  // Keep Excalidraw's canvas fill in sync with the chosen background. Image
  // scenes need a transparent canvas so the art shows through from behind.
  useEffect(() => {
    if (!api) return;
    if (background?.type === "image") {
      api.updateScene({ appState: { viewBackgroundColor: "transparent" } });
    } else if (background?.type === "color") {
      api.updateScene({ appState: { viewBackgroundColor: background.value } });
    }
  }, [api, background]);

  const goFullscreen = () => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  };

  const pickBackground = (bg) => {
    setBackground(bg);
    if (bg?.type === "image") api?.updateScene({ appState: { viewBackgroundColor: "transparent" } });
    else api?.updateScene({ appState: { viewBackgroundColor: bg?.value } });
  };

  const fire = (key, studentName) => {
    const def = REACTIONS.find((r) => r.key === key);
    playReactionSound(def?.sound);
    boardChannel.emitReaction({ id: ++burstId.current, key, studentName });
  };

  const toolProps = {
    rootRef,
    api,
    students,
    objects,
    addObject,
    updateObject,
    removeObject,
    playSound: playBoardSound,
    ar,
  };

  return (
    <Box ref={rootRef} sx={{ position: "fixed", inset: 0, bgcolor: "#fff" }}>
      {/* Childish scene background — sits BEHIND the transparent Excalidraw canvas. */}
      {background?.type === "image" && (
        <Box sx={{ position: "absolute", inset: 0, zIndex: 0, background: background.css }} />
      )}

      <Box sx={{ position: "absolute", inset: 0 }}>
        <BoardCanvas
          excalidrawAPI={setApi}
          initialData={initialData}
          onChange={onChange}
          langCode={ar ? "ar-SA" : "en"}
          UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false } }}
        />
      </Box>

      {/* Draggable manipulatives (magnetic letters, stickers, title map). */}
      <BoardObjectsLayer
        objects={objects}
        updateObject={updateObject}
        removeObject={removeObject}
        onAddChild={addChildNode}
        rootRef={rootRef}
        playSound={playBoardSound}
      />

      {/* Tool palette (inline-start) — background + fullscreen ride along in its
          footer so nothing overlaps Excalidraw's own top toolbar / library. */}
      <BoardToolbar
        activeKeys={activeKeys}
        onToggle={toggleTool}
        ar={ar}
        footer={
          <>
            <BoardBackgroundPicker onPick={pickBackground} ar={ar} />
            <Tooltip title={ar ? "ملء الشاشة" : "Fullscreen"} placement={ar ? "left" : "right"}>
              <IconButton onClick={goFullscreen} sx={{ bgcolor: "background.paper", boxShadow: 2 }}>
                <MdFullscreen />
              </IconButton>
            </Tooltip>
          </>
        }
      />

      {/* Mounted tools — each shows/acts only when its key is active. */}
      {BOARD_TOOLS.map((t) => {
        const Comp = t.Component;
        const active = t.mode === "exclusive" ? activeMode === t.key : openPanels.has(t.key);
        return <Comp key={t.key} active={active} onClose={() => closePanel(t.key)} {...toolProps} />;
      })}

      <ReactionOverlay />
      <ReactionBar students={students} onFire={fire} ar={ar} />
    </Box>
  );
}
