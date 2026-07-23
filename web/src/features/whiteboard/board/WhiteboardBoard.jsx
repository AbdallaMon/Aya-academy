"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, IconButton, Tooltip } from "@mui/material";
import { MdFullscreen, MdLanguage } from "react-icons/md";
import {
  getLocaleFromPathname,
  swapLocale,
} from "../../../i18n/routing.js";
import { useBoardPersistence } from "./lib/useBoardPersistence.js";
import { useBoardLibraryAdapter } from "./lib/useBoardLibrary.js";
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
  canManageLibrary = false,
  token = null,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const boardLanguage = getLocaleFromPathname(pathname);
  const ar = boardLanguage === "ar";
  const rootRef = useRef(null);
  const burstId = useRef(0);
  const libraryDeselectFrameRef = useRef(0);
  const [api, setApi] = useState(null);
  const [boardViewport, setBoardViewport] = useState(null);
  const libraryAdapter = useBoardLibraryAdapter(canManageLibrary);
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

  const handleBoardChange = useCallback(
    (elements, appState, files) => {
      onChange(elements, appState, files);
      const rootRect = rootRef.current?.getBoundingClientRect();
      const nextViewport = {
        zoom: appState?.zoom?.value ?? 1,
        scrollX: appState?.scrollX ?? 0,
        scrollY: appState?.scrollY ?? 0,
        offsetLeft: appState?.offsetLeft ?? 0,
        offsetTop: appState?.offsetTop ?? 0,
        rootLeft: rootRect?.left ?? 0,
        rootTop: rootRect?.top ?? 0,
        rootWidth: rootRect?.width ?? 0,
        rootHeight: rootRect?.height ?? 0,
      };
      setBoardViewport((current) =>
        current &&
        current.zoom === nextViewport.zoom &&
        current.scrollX === nextViewport.scrollX &&
        current.scrollY === nextViewport.scrollY &&
        current.offsetLeft === nextViewport.offsetLeft &&
        current.offsetTop === nextViewport.offsetTop &&
        current.rootLeft === nextViewport.rootLeft &&
        current.rootTop === nextViewport.rootTop &&
        current.rootWidth === nextViewport.rootWidth &&
        current.rootHeight === nextViewport.rootHeight
          ? current
          : nextViewport,
      );
    },
    [onChange],
  );

  const switchBoardLanguage = useCallback(() => {
    const nextLanguage = ar ? "en" : "ar";
    const query = searchParams?.toString();
    const nextPath = swapLocale(pathname, nextLanguage);
    router.push(query ? `${nextPath}?${query}` : nextPath);
  }, [ar, pathname, router, searchParams]);

  // Excalidraw intentionally leaves newly inserted library items selected.
  // On a teaching board that feels like the item is still "stuck" to the
  // viewport while panning/zooming. Detect library-origin duplicates while the
  // library sidebar is open, then return to a clean selection on the next frame.
  const finishLibraryInsert = useCallback(
    (nextElements, previousElements) => {
      if (!api || nextElements.length <= previousElements.length) return;
      const appState = api.getAppState?.();
      const sidebar = appState?.openSidebar;
      const isLibraryOpen =
        sidebar?.name === "default" &&
        (!sidebar.tab || sidebar.tab === "library");
      if (!isLibraryOpen) return;

      window.cancelAnimationFrame(libraryDeselectFrameRef.current);
      libraryDeselectFrameRef.current = window.requestAnimationFrame(() => {
        api.setActiveTool?.({ type: "selection" });
        api.updateScene?.({
          appState: {
            selectedElementIds: {},
            selectedGroupIds: {},
            activeEmbeddable: null,
          },
        });
        api.focusContainer?.();
      });
    },
    [api],
  );

  useEffect(
    () => () =>
      window.cancelAnimationFrame(libraryDeselectFrameRef.current),
    [],
  );

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

  const scenePositionForFraction = useCallback(
    (x = 0.5, y = 0.5) => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect || !boardViewport) return null;
      const zoom = boardViewport.zoom || 1;
      return {
        sceneX:
          (rect.left + x * rect.width - boardViewport.offsetLeft) / zoom -
          boardViewport.scrollX,
        sceneY:
          (rect.top + y * rect.height - boardViewport.offsetTop) / zoom -
          boardViewport.scrollY,
      };
    },
    [boardViewport],
  );

  // Upgrade previously saved overlay objects from viewport fractions to real
  // scene coordinates. Their first rendered position stays unchanged, then
  // future board zoom and pan operations affect them like canvas elements.
  useEffect(() => {
    if (!boardViewport) return;
    const needsMigration = objects.some(
      (object) =>
        object.type !== "edge" &&
        (!Number.isFinite(object.sceneX) ||
          !Number.isFinite(object.sceneY)),
    );
    if (!needsMigration) return;

    setObjects((current) =>
      current.map((object) => {
        if (
          object.type === "edge" ||
          (Number.isFinite(object.sceneX) &&
            Number.isFinite(object.sceneY))
        ) {
          return object;
        }
        const scenePosition = scenePositionForFraction(object.x, object.y);
        return scenePosition ? { ...object, ...scenePosition } : object;
      }),
    );
  }, [boardViewport, objects, scenePositionForFraction, setObjects]);

  // ── shared object layer ops (persisted via setObjects) ──
  const addObject = (obj) => {
    const scenePosition =
      obj.type === "edge"
        ? null
        : scenePositionForFraction(obj.x, obj.y);
    setObjects((prev) => [
      ...prev,
      { id: makeId(), ...obj, ...(scenePosition || {}) },
    ]);
  };
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
    const rect = rootRef.current?.getBoundingClientRect();
    const childScenePosition =
      rect &&
      boardViewport &&
      Number.isFinite(parent.sceneX) &&
      Number.isFinite(parent.sceneY)
        ? {
            sceneX:
              parent.sceneX +
              (rect.width * 0.14) / (boardViewport.zoom || 1),
            sceneY:
              parent.sceneY +
              (rect.height * 0.16) / (boardViewport.zoom || 1),
          }
        : scenePositionForFraction(x, y);
    setObjects((prev) => [
      ...prev,
      {
        id,
        type: "node",
        value: ar ? "عنوان" : "Title",
        color: parent.color,
        x,
        y,
        ...(childScenePosition || {}),
      },
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
    <Box
      ref={rootRef}
      dir={ar ? "rtl" : "ltr"}
      sx={{ position: "fixed", inset: 0, bgcolor: "#fff" }}
    >
      {/* Childish scene background — sits BEHIND the transparent Excalidraw canvas. */}
      {background?.type === "image" && (
        <Box sx={{ position: "absolute", inset: 0, zIndex: 0, background: background.css }} />
      )}

      <Box sx={{ position: "absolute", inset: 0 }}>
        <BoardCanvas
          excalidrawAPI={setApi}
          boardApi={api}
          libraryAdapter={libraryAdapter}
          initialData={initialData}
          onChange={handleBoardChange}
          onDuplicate={finishLibraryInsert}
          langCode={ar ? "ar-SA" : "en"}
          renderTopRightUI={() => (
            <IconButton
              aria-label={ar ? "Switch to English" : "التحويل إلى العربية"}
              title={ar ? "Switch to English" : "التحويل إلى العربية"}
              onClick={switchBoardLanguage}
              sx={{
                gap: 0.5,
                px: 1,
                borderRadius: 2,
                bgcolor: "background.paper",
                boxShadow: 2,
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              <MdLanguage />
              <Box component="span">{ar ? "EN" : "ع"}</Box>
            </IconButton>
          )}
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
        ar={ar}
        viewport={boardViewport}
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
            <Tooltip
              title={ar ? "ملء الشاشة" : "Fullscreen"}
              placement={ar ? "left" : "right"}
              slotProps={{ tooltip: { dir: ar ? "rtl" : "ltr" } }}
            >
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

      <ReactionOverlay ar={ar} />
      <ReactionBar students={students} onFire={fire} ar={ar} />
    </Box>
  );
}
