"use client";

import { Chip, Link as MuiLink, Stack, Typography } from "@mui/material";
import Link from "next/link";
import {
  MdCheck,
  MdClose,
  MdCancel,
  MdReceiptLong,
  MdEdit,
  MdAutorenew,
  MdOpenInNew,
} from "react-icons/md";
import { RowActionsMenu } from "../../../shared/components/index.js";
import { localePath } from "../../../i18n/routing.js";
import { formatMoney } from "../../../shared/lib/money.js";
import { STATUS_COLOR } from "./constant.js";
import { INVOICE_STATUS_COLOR } from "../../invoices/config/constant.js";

/**
 * Column descriptors for the subscriptions list.
 *
 * Factory (not inline) so the page component stays thin — mirrors the reference
 * `<feature>Columns.js` convention. The page passes text, locale, the invoices
 * text hook, the router, capability flags and the row-action handlers.
 *
 * @param {object} params
 * @param {object} params.txt          subscriptionsText hook result
 * @param {string} params.lng          active locale
 * @param {object} params.invoiceTxt   invoicesText hook result
 * @param {object} params.router       next/navigation router (for the view action)
 * @param {object} params.can          { approve, cancel, edit, renew, viewInvoice }
 * @param {boolean} params.hasRowActions whether the actions column is shown at all
 * @param {object} params.actions      { openInvoice, openEditHours, openRenew, approve, openReject, cancel }
 */
export function buildSubscriptionsColumns({
  txt,
  lng,
  invoiceTxt,
  router,
  can,
  hasRowActions,
  actions,
}) {
  const CANCELLABLE = ["PENDING", "UPCOMING", "ACTIVE"];

  return [
    {
      field: "student",
      headerName: txt.student,
      width: 180,
      renderCell: ({ row }) =>
        row.student?.id ? (
          <MuiLink
            component={Link}
            href={localePath(lng, `/dashboard/users/${row.student.id}`)}
            underline="hover"
            fontWeight={700}
          >
            {row.student.name || `#${row.student.id}`}
          </MuiLink>
        ) : (
          row.student?.name || `#${row.studentId}`
        ),
    },
    {
      field: "studentEmail",
      headerName: txt.studentEmail,
      width: 220,
      sortable: false,
      renderCell: ({ row }) => row.student?.email || "—",
    },
    {
      field: "parents",
      headerName: txt.parents,
      width: 200,
      sortable: false,
      renderCell: ({ row }) => {
        const parents = row.student?.parents || [];
        if (parents.length === 0) return "—";
        return (
          <Stack spacing={0.25}>
            {parents.map((p) => (
              <MuiLink
                key={p.id}
                component={Link}
                href={localePath(lng, `/dashboard/users/${p.id}`)}
                underline="hover"
                variant="body2"
              >
                {p.name || `#${p.id}`}
              </MuiLink>
            ))}
          </Stack>
        );
      },
    },
    {
      field: "parentPhone",
      headerName: txt.parentPhone,
      width: 150,
      sortable: false,
      renderCell: ({ row }) => {
        const parents = row.student?.parents || [];
        if (parents.length === 0) return "—";
        return (
          <Stack spacing={0.25}>
            {parents.map((p) => (
              <Typography key={p.id} variant="body2">
                {p.phone || "—"}
              </Typography>
            ))}
          </Stack>
        );
      },
    },
    {
      field: "parentEmail",
      headerName: txt.parentEmail,
      width: 220,
      sortable: false,
      renderCell: ({ row }) => {
        const parents = row.student?.parents || [];
        if (parents.length === 0) return "—";
        return (
          <Stack spacing={0.25}>
            {parents.map((p) => (
              <Typography key={p.id} variant="body2" noWrap>
                {p.email || "—"}
              </Typography>
            ))}
          </Stack>
        );
      },
    },
    {
      field: "plan",
      headerName: txt.plan,
      width: 170,
      renderCell: ({ row }) =>
        row.plan ? (lng === "en" ? row.plan.titleEn : row.plan.titleAr) : "—",
    },
    {
      field: "subsHours",
      headerName: txt.subsHours,
      width: 110,
      sortable: false,
      renderCell: ({ row }) => row.subsHours ?? "—",
    },
    {
      field: "remainingHours",
      headerName: txt.remainingHours,
      width: 120,
      sortable: false,
      renderCell: ({ row }) => row.remainingHours ?? "—",
    },
    {
      field: "status",
      headerName: txt.status,
      width: 150,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          color={STATUS_COLOR[row.status] || "default"}
          label={txt[row.status] || row.status}
        />
      ),
    },
    {
      field: "invoicePaid",
      headerName: invoiceTxt.paymentStatus,
      width: 140,
      sortable: false,
      renderCell: ({ row }) =>
        row.invoice ? (
          <Chip
            size="small"
            color={INVOICE_STATUS_COLOR[row.invoice.status] || "default"}
            label={invoiceTxt[row.invoice.status] || row.invoice.status}
          />
        ) : (
          "—"
        ),
    },
    {
      field: "price",
      headerName: txt.price,
      width: 150,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack spacing={0.25} alignItems="flex-start">
          <Typography variant="body2" fontWeight={700}>
            {formatMoney(row.priceCharged, row.currency)}
          </Typography>
          {row.coupon && (
            <Chip
              size="small"
              color="success"
              variant="outlined"
              label={`${txt.discount} ${
                row.coupon.type === "PERCENT"
                  ? `${Number(row.coupon.value)}%`
                  : formatMoney(row.coupon.value, row.currency)
              }`}
              sx={{ height: 18, fontSize: "0.65rem" }}
            />
          )}
        </Stack>
      ),
    },
    {
      field: "end",
      headerName: txt.end,
      width: 120,
      renderCell: ({ row }) =>
        row.endDate ? new Date(row.endDate).toLocaleDateString() : "—",
    },
    ...(hasRowActions
      ? [
          {
            field: "actions",
            type: "actions",
            headerName: txt.actions,
            width: 80,
            renderCell: ({ row }) => {
              const showApprove = can.approve && row.status === "PENDING";
              const showCancel =
                can.cancel && CANCELLABLE.includes(row.status);
              // Renew only applies to an ended subscription (EXPIRED/CANCELLED).
              // The backend blocks renewing an ACTIVE/PENDING sub for everyone,
              // admins included.
              const showRenew =
                can.renew &&
                (row.status === "EXPIRED" || row.status === "CANCELLED");
              return (
                <RowActionsMenu
                  actions={[
                    {
                      label: txt.view,
                      icon: <MdOpenInNew />,
                      onClick: () =>
                        router.push(
                          localePath(
                            lng,
                            `/dashboard/subscriptions/${row.id}`,
                          ),
                        ),
                    },
                    {
                      label: invoiceTxt.invoice,
                      icon: <MdReceiptLong />,
                      onClick: () => actions.openInvoice(row),
                      hidden: !can.viewInvoice,
                    },
                    {
                      label: txt.editHours,
                      icon: <MdEdit />,
                      onClick: () => actions.openEditHours(row),
                      hidden: !can.edit,
                    },
                    {
                      label: txt.renew,
                      icon: <MdAutorenew />,
                      color: "primary",
                      onClick: () => actions.openRenew(row),
                      hidden: !showRenew,
                    },
                    {
                      label: txt.approve,
                      icon: <MdCheck />,
                      color: "success",
                      onClick: () => actions.approve(row),
                      hidden: !showApprove,
                    },
                    {
                      label: txt.reject,
                      icon: <MdClose />,
                      color: "error",
                      onClick: () => actions.openReject(row),
                      hidden: !showApprove,
                    },
                    {
                      label: txt.cancelSubscription,
                      icon: <MdCancel />,
                      color: "warning",
                      onClick: () => actions.cancel(row),
                      hidden: !showCancel,
                    },
                  ]}
                />
              );
            },
          },
        ]
      : []),
  ];
}
