"use client";

// Certificate export helpers — turn a rendered certificate DOM node into a
// downloadable PNG / PDF, or print it. Everything is rasterized from the SAME
// on-screen node, so the output is exactly what the user sees (WYSIWYG): the
// auto-fit scaling, fonts, colors and decorations are all preserved, and we
// sidestep the @media-print reflow quirks entirely.
//
// On mobile there is often no real "print" — so PNG / PDF download is the
// primary path there, and printing is the desktop convenience.

import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

// Escape text injected into the print document.
function escapeHtml(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
}

// Rasterize a certificate node to a high-resolution PNG data URL. Waits for web
// fonts first so Arabic renders with the chosen font, not a fallback.
export async function certificateToPng(node, { pixelRatio = 2.5 } = {}) {
  if (!node) throw new Error("certificateToPng: missing node");
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* fonts API missing/failed — capture anyway */
    }
  }
  return toPng(node, {
    pixelRatio,
    cacheBust: true,
    backgroundColor: "#ffffff",
  });
}

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

// Download the certificate as a PNG image.
export async function downloadCertificatePng(node, filename = "certificate.png", opts) {
  const dataUrl = await certificateToPng(node, opts);
  triggerDownload(dataUrl, filename);
}

// Download the certificate as an A4 PDF (orientation-aware), with the image
// fitted to the page (aspect preserved) and centered.
export async function downloadCertificatePdf(
  node,
  filename = "certificate.pdf",
  { orientation = "landscape", ...opts } = {},
) {
  const dataUrl = await certificateToPng(node, opts);
  const img = await loadImage(dataUrl);
  const isPortrait = orientation === "portrait";
  const pdf = new jsPDF({
    orientation: isPortrait ? "portrait" : "landscape",
    unit: "mm",
    format: "a4",
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 6; // mm
  const ratio = Math.min((pageW - margin * 2) / img.width, (pageH - margin * 2) / img.height);
  const w = img.width * ratio;
  const h = img.height * ratio;
  pdf.addImage(dataUrl, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h, undefined, "FAST");
  pdf.save(filename);
}

// Print just the certificate: render the captured image full-page in a popup and
// open the print dialog. Returns false if the popup was blocked.
export async function printCertificateNode(
  node,
  { orientation = "landscape", title = "Certificate" } = {},
) {
  const dataUrl = await certificateToPng(node);
  const size = orientation === "portrait" ? "portrait" : "landscape";
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
