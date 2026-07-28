import { useState } from "react";

// Make a floating tool panel draggable by a header handle.
//
// Usage:
//   const { dragStyle, dragHandle } = useDraggable(rootRef);
//   <Paper data-panel style={dragStyle} sx={{ ...default corner... }}>
//     <Stack {...dragHandle}> header (grab me) </Stack>
//   </Paper>
//
// Position is applied through the returned `dragStyle` (an inline `style` object),
// NOT sx — stylis-plugin-rtl mirrors sx left/right in Arabic, and pointer coords
// are physical. Until the panel is moved, dragStyle is undefined so the panel keeps
// whatever default corner its sx defines.
export function useDraggable(rootRef) {
  const [pos, setPos] = useState(null); // { left, top } in root-local px

  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    const panelEl = e.currentTarget.closest("[data-panel]");
    const panel = panelEl?.getBoundingClientRect();
    const root = rootRef?.current?.getBoundingClientRect();
    if (!panel || !root) return;
    const offX = e.clientX - panel.left;
    const offY = e.clientY - panel.top;
    const move = (ev) => {
      const p = ev.touches?.[0] ?? ev;
      const left = Math.min(root.width - 48, Math.max(0, p.clientX - root.left - offX));
      const top = Math.min(root.height - 48, Math.max(0, p.clientY - root.top - offY));
      setPos({ left, top });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
  };

  // Clear the logical corner + any centering transform when moved, so physical
  // left/top from the pointer win cleanly.
  const dragStyle = pos
    ? { insetInlineStart: "auto", insetInlineEnd: "auto", transform: "none", left: pos.left, top: pos.top }
    : undefined;

  return {
    dragStyle,
    dragHandle: { onPointerDown, style: { cursor: "grab", touchAction: "none" } },
  };
}
