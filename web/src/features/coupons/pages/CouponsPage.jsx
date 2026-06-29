"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { MdEdit, MdDelete } from "react-icons/md";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import {
  DataTable,
  PageHeader,
  RowActionsMenu,
  useConfirm,
} from "../../../shared/components/index.js";
import { COUPONS_URL, COUPON_SOURCES } from "../config/constant.js";
import { formatMoney } from "../../../shared/lib/money.js";
import { useAppSettings } from "../../settings/hooks/useAppSettings.js";
import { useCouponsText } from "../config/couponsText.js";
import CouponFormDialog from "../components/CouponFormDialog.jsx";

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

export default function CouponsPage() {
  const txt = useCouponsText();
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.COUPON.LIST);
  const canCreate = hasPermission(PERMISSIONS.COUPON.CREATE);
  const canEdit = hasPermission(PERMISSIONS.COUPON.EDIT);
  const canDelete = hasPermission(PERMISSIONS.COUPON.DELETE);
  const { currency } = useAppSettings({ enabled: canList });

  const {
    data,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    isLoading,
    filters,
    setFilters,
    triggerRefetch,
  } = useRequest({
    url: COUPONS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canList,
  });

  // Default the list to the ACTIVE coupons (the "normal" view). Seed once so the
  // user can still switch to All/Disabled/Consumed (or deep-link a status).
  const didSeedStatus = useRef(false);
  useEffect(() => {
    if (didSeedStatus.current) return;
    didSeedStatus.current = true;
    if (filters.status === undefined) {
      setFilters((prev) => ({ ...prev, status: "active" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useOpen();
  const [selected, setSelected] = useState(null);

  const mut = useMultiRequest({
    url: COUPONS_URL,
    onSuccess: () => triggerRefetch(),
  });

  function onCreate() {
    setSelected(null);
    form.open();
  }
  function onEdit(row) {
    setSelected(row);
    form.open();
  }
  async function onDelete(row) {
    const ok = await confirm({ title: txt.deleteConfirm, intent: "danger" });
    if (!ok) return;
    await mut.deleteRequest(String(row.id));
  }

  const sourceOptions = useMemo(
    () =>
      COUPON_SOURCES.reduce((acc, s) => {
        acc[s] = txt[s] || s;
        return acc;
      }, {}),
    [txt],
  );

  const columns = useMemo(
    () => [
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
                onClick: () => onEdit(row),
                hidden: !canEdit,
              },
              {
                label: txt.delete,
                icon: <MdDelete />,
                color: "error",
                onClick: () => onDelete(row),
                hidden: !(canDelete && row.isActive),
              },
            ]}
          />
        ),
      },
    ],
    [txt, lng, canEdit, canDelete, currency],
  );

  const filterConfig = useMemo(
    () => [
      { type: "search", key: "search", label: txt.code },
      {
        type: "enum",
        key: "source",
        label: txt.source,
        options: { ALL: txt.all, ...sourceOptions },
      },
      {
        type: "enum",
        key: "status",
        label: txt.status,
        options: {
          ALL: txt.all,
          active: txt.enabled,
          disabled: txt.disabled,
          consumed: txt.consumed,
        },
      },
    ],
    [txt, sourceOptions],
  );

  if (!canList) return null;

  return (
    <Box>
      <PageHeader
        title={txt.pageTitle}
        description={txt.pageDescription}
        createLabel={txt.create}
        onCreate={canCreate ? onCreate : undefined}
      />

      <DataTable
        initialRows={data || []}
        columns={columns}
        total={total}
        page={page}
        rowsPerPage={pageSize}
        setPage={setPage}
        setRowsPerPage={setPageSize}
        loading={isLoading}
        filters={filters}
        setFilters={setFilters}
        filterConfig={filterConfig}
        noContainer
      />

      <CouponFormDialog
        open={form.isOpen}
        onClose={form.close}
        coupon={selected}
        onSaved={triggerRefetch}
      />
    </Box>
  );
}
