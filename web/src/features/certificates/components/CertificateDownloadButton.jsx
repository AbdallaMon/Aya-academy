"use client";

// Reusable "download certificate" button.
//
// Self-contained: given a certificateId it fetches the full certificate record
// (GET /certificates/:id) on first click, renders a CertificateCard into a
// HIDDEN offscreen container (kept in the DOM so html-to-image can rasterize it
// — mirrors the offscreen-render-then-export pattern in CertificatesPage), waits
// for web fonts, then triggers a PDF download via exportCertificate.
//
// If certificateId is null/undefined it renders nothing — so callers can drop it
// in unconditionally next to a row/result and it only appears when a cert exists.
//
// Pass `certificate` directly (the full record, e.g. the one returned by the
// attempt endpoint) to skip the fetch entirely.

import { useRef, useState } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import { MdDownload } from "react-icons/md";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { useTranslation } from "../../../i18n/client.js";
import { CERTIFICATES_URL } from "../config/constant.js";
import CertificateCard from "./CertificateCard.jsx";

const LABELS = {
  ar: { download: "تحميل الشهادة", error: "تعذّر تحميل الشهادة، حاول مرة أخرى." },
  en: { download: "Download certificate", error: "Couldn't download the certificate, try again." },
};

// Resolve the certificate page orientation from its (template + own) themeJson,
// so the PDF page orientation matches the rendered card.
function parseTheme(themeJson) {
  if (!themeJson) return {};
  if (typeof themeJson === "object") return themeJson;
  try {
    return JSON.parse(themeJson) || {};
  } catch {
    return {};
  }
}
function orientationOf(cert) {
  const theme = {
    ...parseTheme(cert?.template?.themeJson),
    ...parseTheme(cert?.themeJson),
  };
  return theme.orientation === "portrait" ? "portrait" : "landscape";
}

export default function CertificateDownloadButton({
  certificateId,
  certificate: certificateProp = null,
  label,
  size = "small",
  variant = "outlined",
  fileName,
}) {
  const { lng } = useTranslation();
  const txt = LABELS[lng === "en" ? "en" : "ar"];
  const { showToast } = useToast();

  // The cert we render offscreen: either the one passed in, or one we fetch.
  const [cert, setCert] = useState(certificateProp);
  const [busy, setBusy] = useState(false);
  const nodeRef = useRef(null);

  const { fetchData } = useRequest({
    url: CERTIFICATES_URL,
    method: "get",
    autoFetch: false,
    syncToUrl: false,
  });

  // Nothing to offer when there's no certificate reference at all.
  if (!certificateId && !certificateProp) return null;

  // Wait a tick for React to flush the offscreen card into the DOM.
  const nextFrame = () =>
    new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const handleDownload = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Ensure we have the full record.
      let record = cert || certificateProp;
      if (!record) {
        const res = await fetchData(String(certificateId));
        record = res?.data;
        if (!record) throw new Error("no certificate");
        setCert(record);
        // Give React a frame to mount the offscreen card with the new record.
        await nextFrame();
      }

      const node = nodeRef.current?.querySelector("[data-certificate-root]");
      if (!node) throw new Error("no node");

      const lib = await import("../lib/exportCertificate.js");
      const orientation = orientationOf(record);
      const base = fileName || `certificate-${record?.id ?? certificateId ?? ""}`;
      await lib.downloadCertificatePdf(node, `${base}.pdf`, { orientation });
    } catch {
      showToast({ message: txt.error, severity: "error" });
    } finally {
      setBusy(false);
    }
  };

  const renderCert = cert || certificateProp;

  return (
    <>
      <Button
        size={size}
        variant={variant}
        startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <MdDownload />}
        disabled={busy}
        onClick={handleDownload}
      >
        {label || txt.download}
      </Button>

      {/* Hidden offscreen render target — in the DOM (so html-to-image can
          capture it) but visually off-screen. Only mounted once we have a
          record to paint. */}
      {renderCert && (
        <Box
          ref={nodeRef}
          aria-hidden
          sx={{
            position: "fixed",
            top: 0,
            left: "-99999px",
            width: 1100,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <CertificateCard certificate={renderCert} printable />
        </Box>
      )}
    </>
  );
}
