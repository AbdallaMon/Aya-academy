"use client";

// Certificate detail — fetches a single certificate and renders the full-size,
// printable CertificateCard with ALWAYS-VISIBLE, permanent export actions
// (Download PDF / Download PNG / Print). Works for ANY authorized viewer
// (student / parent / teacher / admin) — the buttons are never role-gated; the
// backend already authorizes the GET by certificate.view + object scope.

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  MdArrowBack,
  MdArrowForward,
  MdDownload,
  MdPictureAsPdf,
  MdPrint,
} from "react-icons/md";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { EmptyState } from "../../../shared/components/index.js";
import { CERTIFICATES_URL } from "../config/constant.js";
import { useCertificatesText } from "../config/certificatesText.js";
import CertificateCard from "../components/CertificateCard.jsx";

// Resolve a certificate's page orientation from its (template + own) themeJson,
// so the exported PDF/print orientation matches the rendered card.
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

export default function CertificateDetailPage({ certificateId }) {
  const txt = useCertificatesText();
  const { lng } = useTranslation();
  const rtl = lng !== "en";
  const BackIcon = rtl ? MdArrowForward : MdArrowBack;

  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.CERTIFICATE.VIEW);

  const [busy, setBusy] = useState(null); // "print" | "pdf" | "png" | null
  const certViewRef = useRef(null);

  const {
    data: certificate,
    isLoading,
    error,
  } = useRequest({
    url: `${CERTIFICATES_URL}/${certificateId}`,
    method: "get",
    autoFetch: canView,
    syncToUrl: false,
  });

  // Capture the LIVE rendered certificate node (WYSIWYG, orientation-correct)
  // and run a print/download via the shared export helpers.
  const runExport = async (kind) => {
    const node = certViewRef.current?.querySelector("[data-certificate-root]");
    if (!node || busy) return;
    setBusy(kind);
    try {
      const lib = await import("../lib/exportCertificate.js");
      const orientation = orientationOf(certificate);
      const base = `certificate-${certificate?.id ?? certificateId ?? ""}`;
      if (kind === "print") {
        await lib.printCertificateNode(node, { orientation, title: txt.detailTitle });
      } else if (kind === "pdf") {
        await lib.downloadCertificatePdf(node, `${base}.pdf`, { orientation });
      } else {
        await lib.downloadCertificatePng(node, `${base}.png`);
      }
    } catch {
      /* capture/popup failed — leave the page so the user can retry */
    } finally {
      setBusy(null);
    }
  };

  const backButton = (
    <Button
      component={Link}
      href={localePath(lng, `/dashboard/${CERTIFICATES_URL}`)}
      startIcon={<BackIcon />}
      size="small"
      sx={{ mb: 2 }}
    >
      {txt.back}
    </Button>
  );

  if (!canView) return null;

  if (isLoading && !certificate) {
    return (
      <Stack alignItems="center" sx={{ py: 10 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (error || !certificate) {
    return (
      <Box>
        {backButton}
        <EmptyState
          title={txt.notFoundTitle}
          body={txt.notFoundBody}
          icon={<Box sx={{ fontSize: 48 }}>🔍</Box>}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      {backButton}

      {/* Action bar — always-visible, permanent export buttons (no role gate). */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1.5}
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" fontWeight={800}>
          {txt.detailTitle}
        </Typography>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<MdDownload />}
            disabled={!!busy}
            onClick={() => runExport("png")}
          >
            {txt.downloadImage}
          </Button>
          <Button
            variant="outlined"
            startIcon={<MdPictureAsPdf />}
            disabled={!!busy}
            onClick={() => runExport("pdf")}
          >
            {txt.downloadPdf}
          </Button>
          <Button
            variant="contained"
            startIcon={<MdPrint />}
            disabled={!!busy}
            onClick={() => runExport("print")}
          >
            {txt.print}
          </Button>
        </Stack>
      </Stack>

      {/* The full-size, printable certificate. */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: 4,
          bgcolor: "action.hover",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box ref={certViewRef} sx={{ width: "100%", maxWidth: 1100 }}>
          <CertificateCard certificate={certificate} printable />
        </Box>
      </Paper>
    </Box>
  );
}
