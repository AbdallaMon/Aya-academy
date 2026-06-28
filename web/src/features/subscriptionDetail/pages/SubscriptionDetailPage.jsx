"use client";

import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { MdArrowBack } from "react-icons/md";
import Link from "next/link";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { EmptyState } from "../../../shared/components/index.js";
import { SUBSCRIPTIONS_URL, STATUS_COLOR } from "../config/constant.js";
import { useSubscriptionDetailText } from "../config/subscriptionDetailText.js";

export default function SubscriptionDetailPage({ subscriptionId }) {
  const txt = useSubscriptionDetailText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();

  const canView = hasPermission(PERMISSIONS.SUBSCRIPTION.VIEW);

  const {
    data: subscription,
    isLoading,
    error,
  } = useRequest({
    url: `${SUBSCRIPTIONS_URL}/${subscriptionId}`,
    method: "get",
    autoFetch: canView,
    syncToUrl: false,
  });

  if (!canView) return null;

  if (isLoading && !subscription) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (error || !subscription) {
    return (
      <EmptyState
        title={txt.notFound}
        body={txt.notFoundBody}
        icon={<Box sx={{ fontSize: 48 }}>🔍</Box>}
      />
    );
  }

  const studentName =
    subscription.student?.name || `#${subscription.studentId ?? subscription.id}`;

  return (
    <Box>
      <Button
        component={Link}
        href={localePath(lng, `/dashboard/subscriptions`)}
        startIcon={<MdArrowBack />}
        size="small"
        sx={{ mb: 2 }}
      >
        {txt.back}
      </Button>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {studentName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {txt.subscriptionId} {subscription.id}
          </Typography>
        </Box>
        <Chip
          color={STATUS_COLOR[subscription.status] || "default"}
          label={txt[subscription.status] || subscription.status}
        />
      </Stack>
    </Box>
  );
}
