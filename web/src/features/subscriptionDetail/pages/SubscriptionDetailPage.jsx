"use client";

import { useState } from "react";
import { Box, Button, Chip, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import { MdArrowBack } from "react-icons/md";
import Link from "next/link";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { EmptyState } from "../../../shared/components/index.js";
import {
  SUBSCRIPTIONS_URL,
  INVOICES_URL,
  STATUS_COLOR,
  invoiceSubscriptionPath,
} from "../config/constant.js";
import { useSubscriptionDetailText } from "../config/subscriptionDetailText.js";
import SubscriptionCard from "../components/SubscriptionCard.jsx";
import InvoiceCard from "../components/InvoiceCard.jsx";
import SubscriptionActions from "../components/SubscriptionActions.jsx";

export default function SubscriptionDetailPage({ subscriptionId }) {
  const txt = useSubscriptionDetailText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();

  const canView = hasPermission(PERMISSIONS.SUBSCRIPTION.VIEW);
  const canViewInvoice = hasPermission(PERMISSIONS.INVOICE.VIEW);
  const canGenerateInvoice = hasPermission(PERMISSIONS.INVOICE.GENERATE);
  const canEditInvoice = hasPermission(PERMISSIONS.INVOICE.EDIT);

  // Lazy second fetch: load the invoice only once the subscription resolves.
  const [loadInvoice, setLoadInvoice] = useState(false);

  const {
    data: subscription,
    isLoading,
    error,
    triggerRefetch: refetchSubscription,
  } = useRequest({
    url: `${SUBSCRIPTIONS_URL}/${subscriptionId}`,
    method: "get",
    autoFetch: canView,
    syncToUrl: false,
    onSuccess: () => setLoadInvoice(true),
  });

  const { data: invoice, triggerRefetch: refetchInvoice } = useRequest({
    url: `${INVOICES_URL}/${invoiceSubscriptionPath(subscriptionId)}`,
    method: "get",
    autoFetch: loadInvoice && canViewInvoice,
    syncToUrl: false,
  });

  // Any action (renew/change-plan/activate/send/mark-paid) refetches both.
  function refetchAll() {
    refetchSubscription();
    refetchInvoice();
  }

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

      <SubscriptionActions
        subscription={subscription}
        invoice={invoice || null}
        txt={txt}
        onChanged={refetchAll}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SubscriptionCard subscription={subscription} invoice={invoice} txt={txt} />
        </Grid>
        {canViewInvoice && (
          <Grid size={{ xs: 12, md: 6 }}>
            <InvoiceCard
              subscriptionId={subscription.id}
              invoice={invoice || null}
              txt={txt}
              canGenerate={canGenerateInvoice}
              canEdit={canEditInvoice}
              onChanged={refetchInvoice}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
