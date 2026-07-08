"use client";

import { Chip, Stack, Typography } from "@mui/material";
import { MdEdit, MdDelete, MdLocalOffer } from "react-icons/md";
import { RowActionsMenu } from "../../../shared/components/index.js";
import { formatMoney } from "../../../shared/lib/money.js";

/**
 * Column descriptors for the plans list.
 *
 * Factory (not inline) so the page component stays thin — mirrors the reference
 * `<feature>Columns.js` convention. The page passes text, locale, the hourly
 * rate + currency (price is derived), capability flags and the row-action
 * handlers.
 *
 * @param {object} params
 * @param {object} params.txt         plansText hook result
 * @param {string} params.lng         active locale
 * @param {number|string} params.hourlyRate  global hourly rate (price = hours × rate)
 * @param {string} params.currency    active currency code
 * @param {object} params.can         { edit, delete }
 * @param {object} params.actions     { onEdit, onDiscounts, onDelete }
 */
export function buildPlansColumns({ txt, lng, hourlyRate, currency, can, actions }) {
  return [
    {
      field: "title",
      headerName: txt.title,
      width: 240,
      renderCell: ({ row }) => (
        <Stack>
          <Typography fontWeight={700}>
            {lng === "en" ? row.titleEn : row.titleAr}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {lng === "en" ? row.titleAr : row.titleEn}
          </Typography>
        </Stack>
      ),
    },
    { field: "hours", headerName: txt.hours, width: 90 },
    {
      field: "price",
      headerName: txt.price,
      width: 220,
      renderCell: ({ row }) => {
        const monthly = Number(row.hours) * Number(hourlyRate || 0);
        return (
          <Typography fontWeight={700} variant="body2">
            {`${formatMoney(monthly, currency)} ${txt.perMonth}`}
          </Typography>
        );
      },
    },
    {
      field: "isFeatured",
      headerName: txt.featured,
      width: 100,
      renderCell: ({ row }) =>
        row.isFeatured ? <Chip size="small" color="warning" label={txt.yes} /> : "—",
    },
    {
      field: "isActive",
      headerName: txt.active,
      width: 100,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          color={row.isActive ? "success" : "default"}
          label={row.isActive ? txt.yes : txt.no}
        />
      ),
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
              label: (row._count?.coupons ?? 0)
                ? `${txt.discounts} (${row._count.coupons})`
                : txt.discounts,
              icon: <MdLocalOffer />,
              color: "secondary",
              onClick: () => actions.onDiscounts(row),
              hidden: !can.edit,
            },
            {
              label: txt.delete,
              icon: <MdDelete />,
              color: "error",
              onClick: () => actions.onDelete(row),
              hidden: !can.delete,
            },
          ]}
        />
      ),
    },
  ];
}
