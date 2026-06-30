"use client";

// ===========================================================================
// Unified document export — PDF / PNG / print for any printable document node
// (certificates, invoices, …).
//
// THE PROBLEM this solves: capturing the live on-screen node makes the output
// depend on the device — on a phone the node is ~360px wide, so the PDF came out
// tiny / low-res / mobile-laid-out. Here we FORCE the node to a fixed A4 design
// size (device-independent) off-screen, let it reflow (incl. any ResizeObserver
// auto-fitter), capture at high resolution, then restore it. The result is the
// SAME A4 document whether you download from a 4K monitor or a phone.
//
// Two page shapes:
//   - "fit"      → the document already has an A4 aspect (certificates). Scale it
//                  to fit one page, centered.
//   - "paginate" → the document is content-tall (invoices). Lock it to the page
//                  width and split across A4 pages when it overflows.
// ===========================================================================

import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

// CSS-pixel width we force a node to before capture — A4 at ~96dpi. The capture
// pixelRatio then multiplies this for print-grade resolution.
const DESIGN_WIDTH = { portrait: 794, landscape: 1123 };

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function triggerDownload(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function escapeHtml(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
}

const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Capture `node` at a fixed, device-independent A4 design width. We force ONLY
 * the node's width (in place) — never its position. html-to-image clones the
 * node together with its inline styles, so giving it an off-screen position here
 * would draw the clone off-canvas and yield a blank image; instead we widen it in
 * place (briefly, behind the click) and rely on html-to-image rendering the clone
 * standalone (ancestor clipping/scroll don't affect the capture). Waits for fonts
 * + reflow + any auto-fitter to settle, rasterizes, then restores the styles.
 * Returns a PNG data URL + the captured CSS size.
 */
async function captureNodeFixed(node, { orientation = "portrait", pixelRatio = 2 } = {}) {
  if (!node) throw new Error("captureNodeFixed: missing node");
  const designW = DESIGN_WIDTH[orientation] || DESIGN_WIDTH.portrait;

  // These are class-driven (emotion/MUI) on our documents, so the inline values
  // are empty strings — overriding then clearing them hands styling back to the
  // original CSS cleanly. We touch ONLY width/maxWidth/margin (no position).
  const s = node.style;
  const keys = ["margin", "width", "maxWidth"];
  const saved = {};
  keys.forEach((k) => (saved[k] = s[k]));

  s.margin = "0";
  s.width = `${designW}px`;
  s.maxWidth = `${designW}px`;

  try {
    if (typeof document !== "undefined" && document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        /* fonts API missing/failed — capture anyway */
      }
    }
    // Two frames + a short pause: lets a ResizeObserver-driven auto-fitter
    // (e.g. the certificate's FitToBox) recompute its scale at the new size.
    await raf();
    await raf();
    await wait(200);

    const rect = node.getBoundingClientRect();
    const dataUrl = await toPng(node, {
      pixelRatio,
      cacheBust: true,
      backgroundColor: "#ffffff",
      // Round the box UP — html-to-image otherwise floors a fractional width,
      // which in RTL shaves the right-most (leading) Arabic pixels.
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
    });
    return { dataUrl, width: rect.width, height: rect.height };
  } finally {
    keys.forEach((k) => (s[k] = saved[k]));
  }
}

/**
 * Download `node` as an A4 PDF.
 *   orientation: "portrait" | "landscape"
 *   mode:        "fit" (aspect doc, one page, centered) | "paginate" (tall doc)
 */
export async function downloadNodeAsPdf(
  node,
  { filename = "document.pdf", orientation = "portrait", mode = "paginate", pixelRatio = 2 } = {},
) {
  const { dataUrl } = await captureNodeFixed(node, { orientation, pixelRatio });
  const img = await loadImage(dataUrl);
  const isLandscape = orientation === "landscape";
  const pdf = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const marginX = 10;
  const marginY = 10;

  if (mode === "fit") {
    // Scale to fit within the page (aspect preserved) and center.
    const ratio = Math.min(
      (pageW - marginX * 2) / img.width,
      (pageH - marginY * 2) / img.height,
    );
    const w = img.width * ratio;
    const h = img.height * ratio;
    pdf.addImage(dataUrl, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h, undefined, "FAST");
    pdf.save(filename);
    return;
  }

  // Paginate: lock to the page width; split across pages when taller than one.
  const imgW = pageW - marginX * 2;
  const imgH = (img.height * imgW) / img.width;
  const innerH = pageH - marginY * 2;
  if (imgH <= innerH) {
    pdf.addImage(dataUrl, "PNG", marginX, marginY, imgW, imgH, undefined, "FAST");
  } else {
    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(dataUrl, "PNG", marginX, marginY + position, imgW, imgH, undefined, "FAST");
    heightLeft -= innerH;
    while (heightLeft > 0) {
      position -= innerH;
      pdf.addPage();
      pdf.addImage(dataUrl, "PNG", marginX, marginY + position, imgW, imgH, undefined, "FAST");
      heightLeft -= innerH;
    }
  }
  pdf.save(filename);
}

/** Download `node` as a PNG, captured at the fixed A4 design size. */
export async function downloadNodeAsPng(
  node,
  { filename = "document.png", orientation = "portrait", pixelRatio = 2 } = {},
) {
  const { dataUrl } = await captureNodeFixed(node, { orientation, pixelRatio });
  triggerDownload(dataUrl, filename);
}

/**
 * Print `node`: rasterize at the fixed A4 size, drop the image full-page into a
 * popup with an A4 @page rule, and open the print dialog. Returns false if the
 * popup was blocked.
 */
export async function printNodeAsPdf(
  node,
  { orientation = "portrait", title = "Document" } = {},
) {
  const { dataUrl } = await captureNodeFixed(node, { orientation });
  const size = orientation === "landscape" ? "landscape" : "portrait";
  const docHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4 ${size}; margin: 8mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
  img { max-width: 100%; max-height: 100vh; object-fit: contain; }
</style>
</head>
<body>
  <img src="${dataUrl}" alt="" />
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.focus(); window.print(); }, 250);
    });
  </script>
</body>
</html>`;

  const blob = new Blob([docHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank", "width=1040,height=760");
  if (!w) {
    URL.revokeObjectURL(url);
    return false;
  }
  w.focus();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}
