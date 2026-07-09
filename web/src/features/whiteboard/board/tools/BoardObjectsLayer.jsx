"use client";

import { useCallback, useRef, useState } from "react";
import { Box } from "@mui/material";
import { MdClose, MdAdd, MdRemove, MdViewInAr, MdAddCircle, MdRotateRight, Md3dRotation } from "react-icons/md";

// Sensible starting size per tile type — used as the base for the resize buttons.
const BASE_SIZE = { letter: 68, emoji: 64, node: 22 };
const clampSize = (t, s) => Math.min(t === "node" ? 60 : 220, Math.max(t === "node" ? 14 : 28, s));

// The playful manipulatives layer that floats above the Excalidraw canvas:
//   - "letter"  → a magnetic alphabet tile the teacher can grab and slide
//   - "emoji"   → a big sticker
//   - "node"    → a titled box for building a mind-map / tree
//   - "edge"    → a string tying two nodes together
//
// Positions are stored as fractions (0..1) of the board so they stay put across
// resizes and fullscreen. The container itself is click-through (pointerEvents
// none); only the tiles capture the pointer, so drawing still works between them.
//
// Objects live in the shared board-data blob via `objects` / setters from the
// persistence hook — every move/link/delete is saved automatically.
export default function BoardObjectsLayer({
  objects = [],
  updateObject,
  removeObject,
  onAddChild,
  rootRef,
  playSound,
}) {
  // Live drag position for the grabbed tile (committed on release) + the id.
  const [drag, setDrag] = useState(null); // { id, xf, yf }
  // In-progress connection dragged out of a node's link handle.
  const [link, setLink] = useState(null); // { fromId, xf, yf }
  // Live rotation while spinning a tile by its rotate handle.
  const [rot, setRot] = useState(null); // { id, deg }
  const rotRef = useRef(0);
  // Live 3D tilt (depth/Z) while dragging the tilt handle.
  const [tilt, setTilt] = useState(null); // { id, tx, ty }
  const tiltRef = useRef({ tx: 0, ty: 0 });
  const dragMoved = useRef(false);

  const nodes = objects.filter((o) => o.type === "node");
  const edges = objects.filter((o) => o.type === "edge");
  const tiles = objects.filter((o) => o.type !== "edge");

  // clientX/Y → board fraction (fullscreen-safe: rect is live each call).
  const toFraction = useCallback(
    (clientX, clientY) => {
      const rect = rootRef?.current?.getBoundingClientRect();
      if (!rect || !rect.width || !rect.height) return { xf: 0.5, yf: 0.5 };
      const xf = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const yf = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      return { xf, yf };
    },
    [rootRef]
  );

  const posOf = (o) =>
    drag && drag.id === o.id ? { xf: drag.xf, yf: drag.yf } : { xf: o.x, yf: o.y };

  // ── dragging a tile ──────────────────────────────────────────
  const startDrag = (e, o) => {
    if (e.button != null && e.button !== 0) return;
    e.stopPropagation();
    dragMoved.current = false;
    const move = (ev) => {
      const p = ev.touches?.[0] ?? ev;
      dragMoved.current = true;
      setDrag({ id: o.id, ...toFraction(p.clientX, p.clientY) });
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
      if (dragMoved.current) {
        const p = ev.changedTouches?.[0] ?? ev;
        const f = toFraction(p.clientX, p.clientY);
        updateObject?.(o.id, { x: f.xf, y: f.yf });
        playSound?.(o.type === "letter" ? "magnet" : "letter");
      }
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
  };

  // ── dragging a connection out of a node handle ───────────────
  const startLink = (e, node) => {
    e.stopPropagation();
    const move = (ev) => {
      const p = ev.touches?.[0] ?? ev;
      setLink({ fromId: node.id, ...toFraction(p.clientX, p.clientY) });
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
      const p = ev.changedTouches?.[0] ?? ev;
      const target = document
        .elementFromPoint(p.clientX, p.clientY)
        ?.closest("[data-node-id]");
      const toId = target?.getAttribute("data-node-id");
      if (toId && toId !== node.id) {
        updateObject?.(`edge-${node.id}-${toId}`, {
          type: "edge",
          from: node.id,
          to: toId,
          create: true,
        });
        playSound?.("magnet");
      }
      setLink(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
  };

  // ── spinning a tile by its rotate handle ─────────────────────
  const startRotate = (e, o) => {
    e.stopPropagation();
    const tileEl = e.currentTarget.closest("[data-tile]");
    const rect = tileEl?.getBoundingClientRect();
    // Rotation is about the tile centre, which stays put while spinning.
    const cx = rect ? rect.left + rect.width / 2 : 0;
    const cy = rect ? rect.top + rect.height / 2 : 0;
    const move = (ev) => {
      const p = ev.touches?.[0] ?? ev;
      const deg = (Math.atan2(p.clientY - cy, p.clientX - cx) * 180) / Math.PI + 90;
      rotRef.current = deg;
      setRot({ id: o.id, deg });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
      updateObject?.(o.id, { rotation: Math.round(rotRef.current) });
      playSound?.("letter");
      setRot(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
  };

  const rotOf = (o) => (rot && rot.id === o.id ? rot.deg : o.rotation || 0);

  // ── tilting a tile into depth (3D) by its tilt handle ────────
  const startTilt = (e, o) => {
    e.stopPropagation();
    const tileEl = e.currentTarget.closest("[data-tile]");
    const rect = tileEl?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : 0;
    const cy = rect ? rect.top + rect.height / 2 : 0;
    const move = (ev) => {
      const p = ev.touches?.[0] ?? ev;
      // Horizontal drag spins around Y, vertical around X — clamped so the tile
      // never turns fully edge-on (invisible). Gives a real "into the screen" feel.
      const ty = Math.max(-72, Math.min(72, (p.clientX - cx) * 0.6));
      const tx = Math.max(-72, Math.min(72, -(p.clientY - cy) * 0.6));
      tiltRef.current = { tx, ty };
      setTilt({ id: o.id, tx, ty });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
      updateObject?.(o.id, {
        tiltX: Math.round(tiltRef.current.tx),
        tiltY: Math.round(tiltRef.current.ty),
      });
      playSound?.("magnet");
      setTilt(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
  };

  const tiltOf = (o) =>
    tilt && tilt.id === o.id
      ? { tx: tilt.tx, ty: tilt.ty }
      : { tx: o.tiltX || 0, ty: o.tiltY || 0 };

  const nodeById = (id) => nodes.find((n) => n.id === id);

  return (
    <Box sx={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
      {/* Edges (strings between tree nodes) + the live linking line. */}
      <Box
        component="svg"
        sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      >
        {edges.map((edge) => {
          const a = posOf(nodeById(edge.from) || {});
          const b = posOf(nodeById(edge.to) || {});
          if (!nodeById(edge.from) || !nodeById(edge.to)) return null;
          return (
            <line
              key={edge.id}
              x1={`${a.xf * 100}%`}
              y1={`${a.yf * 100}%`}
              x2={`${b.xf * 100}%`}
              y2={`${b.yf * 100}%`}
              stroke={edge.color || "#5c7cfa"}
              strokeWidth="4"
              strokeLinecap="round"
            />
          );
        })}
        {link &&
          (() => {
            const a = posOf(nodeById(link.fromId) || {});
            return (
              <line
                x1={`${a.xf * 100}%`}
                y1={`${a.yf * 100}%`}
                x2={`${link.xf * 100}%`}
                y2={`${link.yf * 100}%`}
                stroke="#5c7cfa"
                strokeWidth="4"
                strokeDasharray="8 8"
                strokeLinecap="round"
              />
            );
          })()}
      </Box>

      {/* Tiles: magnetic letters, emoji stickers, tree nodes. */}
      {tiles.map((o) => {
        const { xf, yf } = posOf(o);
        const resize = (factor) => {
          const cur = o.size || BASE_SIZE[o.type] || 48;
          updateObject?.(o.id, { size: clampSize(o.type, Math.round(cur * factor)) });
          playSound?.("letter");
        };
        return (
          <Box
            key={o.id}
            data-tile
            data-node-id={o.type === "node" ? o.id : undefined}
            onPointerDown={(e) => startDrag(e, o)}
            onTouchStart={(e) => startDrag(e, o)}
            // Position via the inline `style` prop — NOT sx — so stylis-plugin-rtl
            // can't mirror left/right in Arabic (pointer coords are physical).
            style={{
              position: "absolute",
              left: `${xf * 100}%`,
              top: `${yf * 100}%`,
              transform: "translate(-50%, -50%)",
              touchAction: "none",
            }}
            sx={{
              pointerEvents: "auto",
              cursor: drag?.id === o.id ? "grabbing" : "grab",
              userSelect: "none",
              "& .ctl": { opacity: 0, transition: "opacity .15s" },
              "&:hover .ctl": { opacity: 1 },
            }}
          >
            {/* Only the tile visual transforms — controls/handles stay upright.
                perspective + rotateX/Y give the 3D "into the screen" tilt; rotate
                is the flat 2D spin. */}
            {(() => {
              const t = tiltOf(o);
              return (
                <Box
                  style={{
                    transform: `perspective(700px) rotateX(${t.tx}deg) rotateY(${t.ty}deg) rotate(${rotOf(o)}deg)`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {renderTile(o)}
                </Box>
              );
            })()}

            {/* Hover control pill (resize / style / add-child / delete). */}
            <Box
              className="ctl"
              onPointerDown={(e) => e.stopPropagation()}
              sx={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                mb: 0.5,
                display: "flex",
                gap: 0.5,
                p: 0.5,
                borderRadius: 999,
                bgcolor: "rgba(0,0,0,.55)",
                boxShadow: 2,
                pointerEvents: "auto",
              }}
            >
              <Ctl title="أصغر" onClick={() => resize(1 / 1.2)}><MdRemove size={15} /></Ctl>
              <Ctl title="أكبر" onClick={() => resize(1.2)}><MdAdd size={15} /></Ctl>
              {o.type === "letter" && (
                <Ctl
                  title="مجسم / مسطّح"
                  onClick={() => {
                    updateObject?.(o.id, { variant: o.variant === "flat" ? "magnet" : "flat" });
                    playSound?.("magnet");
                  }}
                >
                  <MdViewInAr size={15} />
                </Ctl>
              )}
              {o.type === "node" && (
                <Ctl
                  title="فرع جديد"
                  color="#69db7c"
                  onClick={() => onAddChild?.(o)}
                >
                  <MdAddCircle size={15} />
                </Ctl>
              )}
              <Ctl
                title="حذف"
                color="#ff5c7a"
                onClick={() => {
                  removeObject?.(o.id);
                  playSound?.("pop");
                }}
              >
                <MdClose size={15} />
              </Ctl>
            </Box>

            {/* Link handle for tree nodes — drag it onto another node to tie them. */}
            {o.type === "node" && (
              <Box
                onPointerDown={(e) => startLink(e, o)}
                onTouchStart={(e) => startLink(e, o)}
                style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", touchAction: "none" }}
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  bgcolor: "#5c7cfa",
                  border: "3px solid #fff",
                  boxShadow: 2,
                  cursor: "crosshair",
                }}
              />
            )}

            {/* Two drag handles below letters/stickers: green = flat 2D spin,
                purple = 3D tilt into depth. Both appear on hover, stay upright. */}
            {(o.type === "letter" || o.type === "emoji") && (
              <Box
                className="ctl"
                onPointerDown={(e) => e.stopPropagation()}
                style={{ position: "absolute", bottom: -16, left: "50%", transform: "translateX(-50%)", touchAction: "none" }}
                sx={{ display: "flex", gap: 0.75 }}
              >
                <Box
                  title="لف (2D)"
                  onPointerDown={(e) => startRotate(e, o)}
                  onTouchStart={(e) => startRotate(e, o)}
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    bgcolor: "#20c997",
                    color: "#fff",
                    border: "3px solid #fff",
                    boxShadow: 2,
                    cursor: "grab",
                    display: "grid",
                    placeItems: "center",
                    touchAction: "none",
                  }}
                >
                  <MdRotateRight size={15} />
                </Box>
                <Box
                  title="إمالة (3D)"
                  onPointerDown={(e) => startTilt(e, o)}
                  onTouchStart={(e) => startTilt(e, o)}
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    bgcolor: "#845ef7",
                    color: "#fff",
                    border: "3px solid #fff",
                    boxShadow: 2,
                    cursor: "grab",
                    display: "grid",
                    placeItems: "center",
                    touchAction: "none",
                  }}
                >
                  <Md3dRotation size={15} />
                </Box>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// A round hover-control button used above each tile.
function Ctl({ children, onClick, title, color = "#fff" }) {
  return (
    <Box
      title={title}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      sx={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        bgcolor: "rgba(255,255,255,.15)",
        color,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        "&:hover": { bgcolor: "rgba(255,255,255,.3)" },
      }}
    >
      {children}
    </Box>
  );
}

// Visual for each tile type.
function renderTile(o) {
  if (o.type === "emoji") {
    return (
      <Box sx={{ fontSize: o.size || 64, lineHeight: 1, filter: "drop-shadow(0 3px 4px rgba(0,0,0,.25))" }}>
        {o.value}
      </Box>
    );
  }
  if (o.type === "node") {
    return (
      <Box
        sx={{
          px: 2,
          py: 1,
          borderRadius: 3,
          bgcolor: o.color || "#fff3bf",
          color: "#3a2f0b",
          fontWeight: 800,
          fontSize: o.size || 22,
          boxShadow: "0 4px 0 rgba(0,0,0,.12), 0 8px 18px rgba(0,0,0,.18)",
          border: "3px solid rgba(255,255,255,.7)",
          maxWidth: 260,
          textAlign: "center",
          whiteSpace: "pre-wrap",
        }}
      >
        {o.value}
      </Box>
    );
  }
  // letter — "flat" is just a big coloured glyph (no tile background); the default
  // "magnet" is a chunky 3D magnetic tile.
  const size = o.size || 68;
  if (o.variant === "flat") {
    return (
      <Box
        sx={{
          color: o.color || "#ff922b",
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1,
          WebkitTextStroke: "2px rgba(255,255,255,.9)",
          textShadow: "0 3px 6px rgba(0,0,0,.25)",
        }}
      >
        {o.value}
      </Box>
    );
  }
  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        borderRadius: 2.5,
        bgcolor: o.color || "#ff922b",
        color: "#fff",
        fontWeight: 900,
        fontSize: size * 0.55,
        boxShadow:
          "inset 0 3px 6px rgba(255,255,255,.5), inset 0 -4px 8px rgba(0,0,0,.25), 0 6px 12px rgba(0,0,0,.25)",
        textShadow: "0 2px 2px rgba(0,0,0,.3)",
      }}
    >
      {o.value}
    </Box>
  );
}
