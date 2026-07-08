"use client";

// Live preview panel — renders the certificate exactly as it will be issued,
// from the preview object shaped like an API certificate. Sticky on md+.

import { Stack, Typography } from "@mui/material";
import CertificateCard from "../CertificateCard.jsx";

export default function PreviewPanel({ previewCertificate, txt }) {
  return (
    <Stack spacing={1} sx={{ position: { md: "sticky" }, top: { md: 8 } }}>
      <Typography variant="subtitle2" color="text.secondary">
        {txt.previewLabel}
      </Typography>
      <CertificateCard certificate={previewCertificate} />
    </Stack>
  );
}
