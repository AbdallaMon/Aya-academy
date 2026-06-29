"use client";

import Link from "next/link";
import { Box, Button, Stack, Typography } from "@mui/material";
import { MdLock } from "react-icons/md";
import { useTranslation } from "../../i18n/client.js";
import { localePath } from "../../i18n/routing.js";

// Shown in place (no redirect) when a feature is blocked by subscription status.
// variant="student" → gentle, kid-appropriate, NO billing/CTA.
// variant="parent"  → clear + actionable, with a renew CTA.
export default function SubscriptionLockedState({
  variant = "student",
  childName = "",
  renewHref = "/dashboard/children",
}) {
  const { t, lng } = useTranslation();
  const c = t("subscriptionLock", { returnObjects: true }) || {};
  const isParent = variant === "parent";

  const title = isParent
    ? (c.parentTitle || "").replace("{name}", childName || "")
    : c.studentTitle;
  const body = isParent ? c.parentBody : c.studentBody;

  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        py: { xs: 6, md: 8 },
        px: 2,
      }}
    >
      <Stack spacing={2} alignItems="center" sx={{ maxWidth: 460 }}>
        <Box
          sx={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: "action.hover",
          }}
        >
          <MdLock size={40} color="#94A3B8" />
        </Box>
        <Typography variant="h5" fontWeight={900}>
          {title}
        </Typography>
        <Typography color="text.secondary">{body}</Typography>
        {isParent && (
          <Button
            component={Link}
            href={localePath(lng, renewHref)}
            variant="contained"
            size="large"
            sx={{ borderRadius: 999, px: 4, fontWeight: 800, mt: 1 }}
          >
            {c.renewCta}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
