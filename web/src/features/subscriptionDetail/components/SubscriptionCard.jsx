"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "../../../i18n/client.js";
import { formatMoney, formatHours } from "../../../shared/lib/money.js";
import { resolveDiscount } from "../config/constant.js";

function Row({ label, children }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ textAlign: "end" }}>{children}</Box>
    </Stack>
  );
}

function fmtDate(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

/**
 * Read-only subscription card: plan, billing period, dates, hours, and a
 * price + discount breakdown. The breakdown prefers the invoice snapshot
 * (passed in via `invoice`) and falls back to the subscription coupon.
 */
export default function SubscriptionCard({ subscription, invoice, txt }) {
  const { lng } = useTranslation();
  const currency = subscription.currency;
  const planTitle = subscription.plan
    ? lng === "en"
      ? subscription.plan.titleEn
      : subscription.plan.titleAr
    : "—";

  const periodKey = subscription.billingPeriod;
  const periodLabel = txt[periodKey] || periodKey || "—";

  const { base, amount, code, hasDiscount } = resolveDiscount({
    subscription,
    invoice,
  });

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          {txt.subscriptionCardTitle}
        </Typography>

        <Stack spacing={1.25}>
          <Row label={txt.plan}>
            <Typography variant="body2" fontWeight={600}>
              {planTitle}
            </Typography>
          </Row>
          <Row label={txt.billingPeriod}>
            <Typography variant="body2">{periodLabel}</Typography>
          </Row>
          <Row label={txt.startDate}>
            <Typography variant="body2">{fmtDate(subscription.startDate)}</Typography>
          </Row>
          <Row label={txt.endDate}>
            <Typography variant="body2">{fmtDate(subscription.endDate)}</Typography>
          </Row>
          <Row label={txt.totalHours}>
            <Typography variant="body2">{formatHours(subscription.totalHours)}</Typography>
          </Row>
          <Row label={txt.remainingHours}>
            <Typography variant="body2">{formatHours(subscription.remainingHours)}</Typography>
          </Row>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography
          variant="subtitle2"
          fontWeight={700}
          color="text.secondary"
          sx={{ mb: 1 }}
        >
          {txt.priceBreakdown}
        </Typography>

        <Stack spacing={1.25}>
          {hasDiscount && (
            <>
              <Row label={txt.basePrice}>
                <Typography variant="body2">{formatMoney(base, currency)}</Typography>
              </Row>
              <Row label={txt.discount}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {code && (
                    <Chip
                      size="small"
                      variant="outlined"
                      color="success"
                      label={`${txt.coupon}: ${code}`}
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                  )}
                  <Typography variant="body2" color="success.main">
                    -{formatMoney(amount, currency)}
                  </Typography>
                </Stack>
              </Row>
            </>
          )}
          <Row label={txt.netPrice}>
            <Typography variant="body1" fontWeight={800}>
              {formatMoney(subscription.priceCharged, currency)}
            </Typography>
          </Row>
        </Stack>
      </CardContent>
    </Card>
  );
}
