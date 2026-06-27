"use client";

import {
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { formatMoney } from "../../../shared/lib/money.js";

/** Resolve the {base, net, discountAmount, currency} a child will be charged. */
function priceFor(child, plans) {
  const plan = plans.find((p) => p.id === child.planId);
  if (!plan) return null;
  const cycle = child.billingPeriod === "YEARLY" ? plan.yearly : plan.monthly;
  const base = cycle?.base ?? 0;
  // valid typed coupon → its quoted net; otherwise the plan's auto-effective.
  const net =
    child.coupon?.status === "valid" && child.coupon.quote?.net != null
      ? child.coupon.quote.net
      : cycle?.effective ?? base;
  return {
    plan,
    base,
    net,
    discountAmount: Math.max(0, base - net),
    currency: plan.currency,
  };
}

/** One label:value row used in the mobile card layout. */
function Row({ label, value, strong }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={strong ? 800 : 500}>
        {value}
      </Typography>
    </Stack>
  );
}

export default function EnrollSummaryTable({ items, plans, lng, txt }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });

  // ── Mobile: a stacked card per student (tables don't fit phones) ──
  if (isMobile) {
    return (
      <Stack spacing={2}>
        {items.map((child, i) => {
          const p = priceFor(child, plans);
          const planTitle = p
            ? lng === "en"
              ? p.plan.titleEn
              : p.plan.titleAr
            : "—";
          return (
            <Card key={i} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography fontWeight={800}>
                    {child.name || `${txt.childNumber} ${i + 1}`}
                  </Typography>
                  <Chip
                    size="small"
                    color="success"
                    label={txt.firstSessionFree}
                  />
                </Stack>
                <Divider sx={{ mb: 1 }} />
                <Stack spacing={0.75}>
                  <Row label={txt.colPlan} value={planTitle} />
                  <Row
                    label={txt.colCycle}
                    value={
                      child.billingPeriod === "YEARLY" ? txt.yearly : txt.monthly
                    }
                  />
                  <Row
                    label={txt.colBase}
                    value={p ? formatMoney(p.base, p.currency) : "—"}
                  />
                  {p && p.discountAmount > 0 && (
                    <Row
                      label={txt.colDiscount}
                      value={`-${formatMoney(p.discountAmount, p.currency)}`}
                    />
                  )}
                  <Row
                    label={txt.colNet}
                    value={p ? formatMoney(p.net, p.currency) : "—"}
                    strong
                  />
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    );
  }

  // ── Desktop / tablet: the full table ──
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{txt.colChild}</TableCell>
            <TableCell>{txt.colPlan}</TableCell>
            <TableCell>{txt.colCycle}</TableCell>
            <TableCell align="right">{txt.colBase}</TableCell>
            <TableCell align="right">{txt.colDiscount}</TableCell>
            <TableCell align="right">{txt.colNet}</TableCell>
            <TableCell>{txt.colGift}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((child, i) => {
            const p = priceFor(child, plans);
            return (
              <TableRow key={i}>
                <TableCell>
                  {child.name || `${txt.childNumber} ${i + 1}`}
                </TableCell>
                <TableCell>
                  {p ? (lng === "en" ? p.plan.titleEn : p.plan.titleAr) : "—"}
                </TableCell>
                <TableCell>
                  {child.billingPeriod === "YEARLY" ? txt.yearly : txt.monthly}
                </TableCell>
                <TableCell align="right">
                  {p ? formatMoney(p.base, p.currency) : "—"}
                </TableCell>
                <TableCell align="right">
                  {p && p.discountAmount > 0
                    ? `-${formatMoney(p.discountAmount, p.currency)}`
                    : "—"}
                </TableCell>
                <TableCell align="right">
                  {p ? formatMoney(p.net, p.currency) : "—"}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color="success"
                    label={txt.firstSessionFree}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
