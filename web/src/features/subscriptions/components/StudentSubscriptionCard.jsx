"use client";

// Combined current + next subscription card for ONE student, used above the
// full-history table inside the student-details subscriptions tab. It fetches the
// student's rows from the scoped list endpoint (GET /subscriptions?studentId=…,
// which returns RAW rows) and picks the current (ACTIVE) + next (open UPCOMING
// USAGE) sub client-side. Its action bar refetches this card after any change.

import { useMemo } from "react";
import { Box, CircularProgress } from "@mui/material";
import { PERMISSIONS } from "@ayah/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { SUBSCRIPTIONS_URL } from "../config/constant.js";
import { useSubscriptionsText } from "../config/subscriptionsText.js";
import { selectSubscriptionPeriods } from "../config/subscriptionPeriods.js";
import SubscriptionSummaryCard from "./SubscriptionSummaryCard.jsx";

export default function StudentSubscriptionCard({ studentId, onChanged }) {
  const txt = useSubscriptionsText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.SUBSCRIPTION.LIST);

  const { data, isLoading, triggerRefetch } = useRequest({
    url: SUBSCRIPTIONS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canList && Boolean(studentId),
    syncToUrl: false,
    initialParams: studentId ? { studentId: Number(studentId) } : undefined,
  });

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const { current, next } = useMemo(
    () => selectSubscriptionPeriods(rows),
    [rows],
  );

  function refetch() {
    triggerRefetch();
    onChanged?.();
  }

  if (!canList) return null;

  if (isLoading && rows.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Nothing current/upcoming: the full-history table below already covers the
  // ended/pending rows — skip an empty card.
  if (!current && !next) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <SubscriptionSummaryCard
        studentId={studentId}
        current={current}
        next={next}
        txt={txt}
        lng={lng}
        onChanged={refetch}
        detailed
        hideHeader
      />
    </Box>
  );
}
