"use client";

// Certificate export — thin wrappers over the shared, device-independent
// document exporter (web/src/shared/lib/pdfExport.js). The certificate has an A4
// aspect, so it uses "fit" mode (scaled to one page, centered). Capturing always
// happens at a fixed A4 design size, so the output is identical on desktop and
// mobile — not the on-screen (screen-sized) node it used to grab.

import {
  downloadNodeAsPdf,
  downloadNodeAsPng,
  printNodeAsPdf,
} from "../../../shared/lib/pdfExport.js";

// Download the certificate as a PNG image (captured at the fixed A4 size).
export async function downloadCertificatePng(
  node,
  filename = "certificate.png",
  { orientation = "landscape" } = {},
) {
  await downloadNodeAsPng(node, { filename, orientation });
}

// Download the certificate as an A4 PDF (orientation-aware), fitted to one page.
export async function downloadCertificatePdf(
  node,
  filename = "certificate.pdf",
  { orientation = "landscape" } = {},
) {
  await downloadNodeAsPdf(node, { filename, orientation, mode: "fit" });
}

// Print just the certificate (A4, orientation-aware). Returns false if blocked.
export async function printCertificateNode(
  node,
  { orientation = "landscape", title = "Certificate" } = {},
) {
  return printNodeAsPdf(node, { orientation, title });
}
