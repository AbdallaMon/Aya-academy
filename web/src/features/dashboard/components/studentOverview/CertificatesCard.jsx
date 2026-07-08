"use client";

import Link from "next/link";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MdArrowForward, MdEmojiEvents, MdWorkspacePremium } from "react-icons/md";
import { localePath } from "@/i18n/routing.js";
import { iconColor } from "@/shared/ui/iconColor.js";
import { localizedField } from "../../../notifications/config/notificationsText.js";

// "My certificates" achievement card — recent certificates + a link to the full
// certificates page.
export default function CertificatesCard({ txt, lng, theme, certificates }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <MdWorkspacePremium color={iconColor(theme, "secondary")} size={22} />
            <Typography variant="subtitle1" fontWeight={800}>
              {txt.certificates}
            </Typography>
          </Stack>
          <Button
            size="small"
            component={Link}
            href={localePath(lng, "/dashboard/certificates")}
            endIcon={
              <Box sx={{ display: "flex", transform: lng === "en" ? "none" : "scaleX(-1)" }}>
                <MdArrowForward />
              </Box>
            }
          >
            {txt.viewDetails}
          </Button>
        </Stack>
        {certificates.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            {txt.noCertsYet}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {certificates.map((c) => (
              <Stack
                key={c.id}
                direction="row"
                alignItems="center"
                gap={1.25}
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: (t) => alpha(t.palette.warning.main, 0.08),
                }}
              >
                <MdEmojiEvents color={iconColor(theme, "secondary")} size={22} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={800} noWrap sx={{ color: "text.primary" }}>
                    {localizedField(c, "title", lng)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(c.issuedAt).toLocaleDateString(
                      lng === "ar" ? "ar-EG" : "en-US",
                    )}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
