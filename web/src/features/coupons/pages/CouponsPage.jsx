"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import {
  DataTable,
  PageHeader,
  useConfirm,
} from "../../../shared/components/index.js";
import { COUPONS_URL, COUPON_SOURCES } from "../config/constant.js";
import { useAppSettings } from "../../settings/hooks/useAppSettings.js";
import { useCouponsText } from "../config/couponsText.js";
import { buildCouponsColumns } from "../config/couponsColumns.js";
import { buildCouponsFilters } from "../config/couponsFilters.js";
import CouponFormDialog from "../components/CouponFormDialog.jsx";

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
    () =>
      buildCouponsColumns({
        txt,
        lng,
        currency,
        can: { edit: canEdit, delete: canDelete },
        actions: { onEdit, onDelete },
      }),
    [txt, lng, canEdit, canDelete, currency],
  );

  const filterConfig = useMemo(
    () => buildCouponsFilters({ txt, sourceOptions }),
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
