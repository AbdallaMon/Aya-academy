"use client";

// Invoice export — thin wrapper over the shared, device-independent document
// exporter (web/src/shared/lib/pdfExport.js). The invoice is a content-tall A4
// portrait document, so it uses "paginate" mode (locked to the page width, split
// across pages when long). Capturing happens at a fixed A4 design width, so the
// PDF is the same on desktop and mobile — not the on-screen (screen-sized) node.

import { downloadNodeAsPdf } from "../../../shared/lib/pdfExport.js";

// Download the invoice node as an A4-portrait PDF (multi-page when tall).
export async function downloadInvoicePdf(node, filename = "invoice.pdf") {
  await downloadNodeAsPdf(node, { filename, orientation: "portrait", mode: "paginate" });
}
