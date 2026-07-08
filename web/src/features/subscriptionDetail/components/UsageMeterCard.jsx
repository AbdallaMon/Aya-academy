"use client";

import { Card, CardContent, Typography, Stack, Skeleton } from "@mui/material";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { formatMoney, formatHours } from "../../../shared/lib/money.js";
import { SUBSCRIPTIONS_URL } from "../config/constant.js";

/**
 * Live meter for an open (accumulating) or frozen USAGE subscription. Fetches
 * `GET /subscriptions/:id/usage-preview` and renders the consumed hours + the
 * projected price. While UPCOMING the number grows with every logged session;
 * once frozen it shows the "ready to invoice" hint instead of the live one.
 */
export default function UsageMeterCard({ subscriptionId, txt }) {
  const { data, isLoading } = useRequest({
    url: `${SUBSCRIPTIONS_URL}/${subscriptionId}/usage-preview`,
    method: "get",
    autoFetch: true,
    syncToUrl: false,
  });

  if (isLoading && !data) return <Skeleton variant="rounded" height={140} />;

  return (
    <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
      <CardContent>
        <Typography variant="overline" color="info.main">
          {txt.accumulatingTitle}
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="h4">{formatHours(data?.usageHours ?? 0)}</Typography>
          <Typography variant="h6" color="text.secondary">
            ≈ {formatMoney(data?.projectedPrice ?? 0, data?.currency)}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {data?.frozen ? txt.frozenHint : txt.liveHint}
        </Typography>
      </CardContent>
    </Card>
  );
}
