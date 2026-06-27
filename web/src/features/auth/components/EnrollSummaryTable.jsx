"use client";

import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
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

export default function EnrollSummaryTable({ items, plans, lng, txt }) {
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
