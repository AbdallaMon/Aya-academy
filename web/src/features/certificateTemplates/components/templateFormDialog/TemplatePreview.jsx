"use client";

import { Box, Stack, Typography } from "@mui/material";
import CertificateCard from "../../../certificates/components/CertificateCard.jsx";

// Sticky live-preview column feeding the synthetic (debounced) certificate into
// the shared CertificateCard.
export default function TemplatePreview({ txt, previewCertificate }) {
  return (
    <Stack spacing={1} sx={{ position: { md: "sticky" }, top: { md: 8 } }}>
      <Typography variant="subtitle2" color="text.secondary">
        {txt.previewLabel}
      </Typography>
      <Box>
        <CertificateCard certificate={previewCertificate} />
      </Box>
    </Stack>
  );
}
