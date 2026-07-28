"use client";

// Landscape auto-fitter. In landscape the A4 box is short but a certificate can
// carry a LOT of optional content, so we render the content at a fixed design
// width and SCALE the whole block down so it always fits — nothing is ever cut
// off. Portrait already has the vertical room, so it is rendered untouched.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box } from "@mui/material";

export const LANDSCAPE_DESIGN_W = 840; // px — the design canvas width landscape lays out at
export const LANDSCAPE_DESIGN_H = 594; // px — A4 landscape height for 840w (840 × 210/297)
const FIT_INSET = 26; // px — keep scaled content clear of the decorative frame

// useLayoutEffect on the server (SSR) logs a warning; fall back to useEffect there.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Measures its own box + the natural size of its child and scales the child to
// fit (never upscales past 1). Re-measures on any size change (incl. web-font
// swap, which changes text height) via a ResizeObserver on both nodes.
function FitToBoxInner({ children }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useIsoLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return undefined;

    const measure = () => {
      const availW = outer.clientWidth;
      const availH = outer.clientHeight;
      // offsetWidth/Height are the PRE-transform layout size, so reading them
      // while a scale() is applied is stable (no measurement feedback loop).
      const natW = inner.offsetWidth;
      const natH = inner.offsetHeight;
      if (!availW || !availH || !natW || !natH) return;
      const next = Math.min(1, availW / natW, availH / natH);
      setScale((prev) => (Math.abs(prev - next) > 0.004 ? next : prev));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <Box
      ref={outerRef}
      sx={{
        position: "absolute",
        inset: `${FIT_INSET}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Box
        ref={innerRef}
        sx={{
          flexShrink: 0,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// Wraps the certificate body in the auto-fitter for landscape; passes it through
// untouched for portrait (which has the room and is rendered at full size).
export default function FitToBox({ enabled, children }) {
  if (!enabled) return children;
  return <FitToBoxInner>{children}</FitToBoxInner>;
}
