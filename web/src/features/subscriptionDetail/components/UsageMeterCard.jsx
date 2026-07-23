"use client";

import { Card, CardContent, Typography, Stack } from "@mui/material";
import { formatDurationMinutes } from "../../../shared/lib/money.js";
import { useTranslation } from "../../../i18n/client.js";
import SubscriptionPriceBreakdown from "../../subscriptions/components/SubscriptionPriceBreakdown.jsx";

/**
 * Meter for an open (accumulating) or frozen USAGE subscription. v2 STORED model:
 * the hours + price are stored directly on the subscription (recomputed on every
 * session mutation), so this renders `sub.subsHours` / `sub.priceCharged` with no
 * usage-preview fetch. While UPCOMING the stored number grows with every logged
 * session; once it leaves UPCOMING (frozen) it shows the "ready to invoice" hint.
 *
 * @param {object} props
 * @param {object} props.sub  the USAGE subscription row (subsHours/priceCharged/
 *                            currency/status). Falsy → renders nothing.
 * @param {object} props.txt  useSubscriptionsText() result
 */
export default function UsageMeterCard({ sub, txt }) {
  const { lng } = useTranslation();
  if (!sub) return null;
  const frozen = !["PENDING", "UPCOMING"].includes(sub.status);

  return (
    <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
      <CardContent>
        <Typography variant="overline" color="info.main">
          {txt.accumulatingTitle}
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography variant="h4">
            {formatDurationMinutes(sub.subsMinutes ?? 0, lng)}
          </Typography>
          <SubscriptionPriceBreakdown
            subscription={sub}
            invoice={sub.invoice}
            txt={txt}
            align="flex-end"
          />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {frozen ? txt.frozenHint : txt.liveHint}
        </Typography>
      </CardContent>
    </Card>
  );
}
