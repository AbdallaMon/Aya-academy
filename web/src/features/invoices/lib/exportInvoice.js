"use client";

// Invoice export — rasterize the rendered invoice DOM node and download it as an
// A4 (portrait) PDF. Captured from the SAME on-screen node so the output is
// exactly what the user sees (fonts, RTL, colors). A tall invoice is split across
// multiple pages instead of being shrunk to fit one.

import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Rasterize a node to a high-resolution PNG data URL. Waits for web fonts first
// so Arabic renders with the chosen font, not a fallback.
async function nodeToPng(node, { pixelRatio = 2 } = {}) {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* fonts API missing/failed — capture anyway */
    }
  }
  // Round the capture box UP. html-to-image otherwise floors a fractional width,
  // which in RTL shaves the right-most (leading) pixels off the Arabic text.
  const rect = node.getBoundingClientRect();
  return toPng(node, {
    pixelRatio,
    cacheBust: true,
    backgroundColor: "#ffffff",
    width: Math.ceil(rect.width),
    height: Math.ceil(rect.height),
  });
}

// Download the invoice node as an A4-portrait PDF (multi-page when tall).
export async function downloadInvoicePdf(node, filename = "invoice.pdf", opts) {
  if (!node) throw new Error("downloadInvoicePdf: missing node");
  const dataUrl = await nodeToPng(node, opts);
  const img = await loadImage(dataUrl);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  // Generous side margins so the invoice clears the printer's non-printable
  // edge — at 8mm the right side was being clipped on print. 12mm sits safely
  // inside the printable area of typical home/office printers.
  const marginX = 12; // mm
  const marginY = 10; // mm
  const innerH = pageH - marginY * 2;

  const imgW = pageW - marginX * 2;
  const imgH = (img.height * imgW) / img.width;

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

  pdf.save(filename);
}
