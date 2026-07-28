"use client";

import { Chip, Stack, Typography } from "@mui/material";
import { MdEdit, MdDelete } from "react-icons/md";
import { RowActionsMenu } from "../../../shared/components/index.js";
import { formatMoney } from "../../../shared/lib/money.js";

/**
 * Derive a coupon's lifecycle state for the table (mirror of the server's
 * `couponStatusConditions`): disabled (isActive:false) → consumed (expired by
 * date OR usage cap reached) → otherwise active.
 */
function couponState(row) {
  if (!row.isActive) return "disabled";
  const now = Date.now();
  if (row.endsAt && new Date(row.endsAt).getTime() < now) return "consumed";
  if (
    row.maxRedemptions != null &&
    (row.redemptionsCount ?? 0) >= row.maxRedemptions
  ) {
    return "consumed";
  }
  return "active";
}

/**
 * Column descriptors for the coupons list.
 *
 * Factory (not inline) so the page component stays thin — mirrors the reference
 * `<feature>Columns.js` convention. The page passes text, locale, the active
 * currency, capability flags and the row-action handlers.
 *
 * @param {object} params
 * @param {object} params.txt       couponsText hook result
 * @param {string} params.lng       active locale
 * @param {string} params.currency  active currency code
 * @param {object} params.can       { edit, delete }
 * @param {object} params.actions   { onEdit, onDelete }
 */
export function buildCouponsColumns({ txt, lng, currency, can, actions }) {
  return [
    {
      field: "code",
      headerName: txt.code,
      width: 160,
      renderCell: ({ row }) => (
        <Typography fontWeight={700}>{row.code}</Typography>
      ),
    },
    {
      field: "type",
      headerName: txt.type,
      width: 110,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          color="secondary"
          label={row.type === "FIXED" ? txt.fixed : txt.percent}
        />
      ),
    },
    {
      field: "value",
      headerName: txt.value,
      width: 110,
      renderCell: ({ row }) => (
        <Typography fontWeight={700}>
          {row.type === "FIXED"
            ? formatMoney(Number(row.value), currency)
            : `${Number(row.value)}%`}
        </Typography>
      ),
    },
    {
      field: "source",
      headerName: txt.source,
      width: 130,
      renderCell: ({ row }) =>
        row.source ? (
          <Chip size="small" variant="outlined" label={txt[row.source] || row.source} />
        ) : (
          "—"
        ),
    },
    {
      field: "scope",
      headerName: txt.scope,
      width: 110,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          variant="outlined"
          label={
            row.billingPeriod === "MONTHLY"
              ? txt.monthly
              : row.billingPeriod === "YEARLY"
                ? txt.yearly
                : txt.both
          }
        />
      ),
    },
    {
      field: "usage",
      headerName: txt.usage,
      width: 110,
      renderCell: ({ row }) =>
        `${row.redemptionsCount ?? 0} / ${
          row.maxRedemptions ?? txt.unlimited
        }`,
    },
    {
      field: "plans",
      headerName: txt.plans,
      width: 220,
      renderCell: ({ row }) => {
        const links = row.plans ?? [];
        if (!links.length) {
          return (
            <Chip size="small" variant="outlined" label={txt.allPlans} />
          );
        }
        const nameOf = (link) =>
          (lng === "ar" ? link.plan?.titleAr : link.plan?.titleEn) ||
          link.plan?.titleEn ||
          `#${link.planId}`;
        const shown = links.slice(0, 2);
        const extra = links.length - shown.length;
        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {shown.map((link) => (
              <Chip
                key={link.planId}
                size="small"
                color="primary"
                variant="outlined"
                label={nameOf(link)}
              />
            ))}
            {extra > 0 && <Chip size="small" label={`+${extra}`} />}
          </Stack>
        );
      },
    },
    {
      field: "status",
      headerName: txt.status,
      width: 120,
      renderCell: ({ row }) => {
        const state = couponState(row);
        const map = {
          active: { color: "success", variant: "filled", label: txt.enabled },
          consumed: { color: "warning", variant: "outlined", label: txt.consumed },
          disabled: { color: "default", variant: "outlined", label: txt.disabled },
        };
        const cfg = map[state];
        return (
          <Chip
            size="small"
            color={cfg.color}
            variant={cfg.variant}
            label={cfg.label}
          />
        );
      },
    },
    {
      field: "actions",
      type: "actions",
      headerName: txt.actions,
      width: 80,
      renderCell: ({ row }) => (
        <RowActionsMenu
          actions={[
            {
              label: txt.edit,
              icon: <MdEdit />,
              onClick: () => actions.onEdit(row),
              hidden: !can.edit,
            },
            {
              label: txt.delete,
              icon: <MdDelete />,
              color: "error",
              onClick: () => actions.onDelete(row),
              hidden: !(can.delete && row.isActive),
            },
          ]}
        />
      ),
    },
  ];
}
