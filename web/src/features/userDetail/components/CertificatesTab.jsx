"use client";

import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { MdWorkspacePremium } from "react-icons/md";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";

/** Certificates: count + a link to the filtered certificates list. */
export default function CertificatesTab({ overview, studentId, txt }) {
  const { lng } = useTranslation();
  const count = overview?.certificatesCount ?? 0;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <MdWorkspacePremium size={32} color="#F59E0B" />
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>
              {txt.certificatesTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {txt.certificatesCount}: <strong>{count}</strong>
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="outlined"
          startIcon={<MdWorkspacePremium />}
          component={Link}
          href={localePath(lng, `/dashboard/certificates?studentId=${studentId}`)}
        >
          {txt.viewCertificates}
        </Button>
      </CardContent>
    </Card>
  );
}
