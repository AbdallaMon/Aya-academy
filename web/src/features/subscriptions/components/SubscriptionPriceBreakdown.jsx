"use client";

import { Chip, Stack, Typography } from "@mui/material";
import { formatMoney } from "../../../shared/lib/money.js";
import { resolveDiscount } from "../../subscriptionDetail/config/constant.js";
import { useSubscriptionsText } from "../config/subscriptionsText.js";

export default function SubscriptionPriceBreakdown({
  subscription,
  invoice,
  txt,
  align = "flex-start",
}) {
  const fallbackTxt = useSubscriptionsText();
  const labels = { ...fallbackTxt, ...(txt ?? {}) };
  const { base, amount, code, hasDiscount } = resolveDiscount({
    subscription,
    invoice,
  });
  const currency = subscription?.currency;

  if (!hasDiscount) {
    return (
      <Typography variant="body2" fontWeight={700}>
        {formatMoney(subscription?.priceCharged, currency)}
      </Typography>
    );
  }

  return (
    <Stack spacing={0.4} alignItems={align}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textDecoration: "line-through" }}
      >
        {labels.basePrice}: {formatMoney(base, currency)}
      </Typography>
      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
        <Typography variant="caption" color="success.main" fontWeight={700}>
          {labels.discount}: -{formatMoney(amount, currency)}
        </Typography>
        {code ? (
          <Chip
            size="small"
            color="success"
            variant="outlined"
            label={`${labels.coupon}: ${code}`}
            sx={{ height: 20, fontSize: "0.68rem" }}
          />
        ) : null}
      </Stack>
      <Typography variant="body2" fontWeight={800}>
        {labels.netPrice}: {formatMoney(subscription?.priceCharged, currency)}
      </Typography>
    </Stack>
  );
}
