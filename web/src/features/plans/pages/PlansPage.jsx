"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import { MdEdit, MdDelete, MdLocalOffer } from "react-icons/md";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import {
  DataTable,
  FormDialog,
  PageHeader,
  RHFTextField,
  RHFTextArea,
  RHFSwitch,
  RowActionsMenu,
  applyApiErrorsToForm,
  useConfirm,
} from "../../../shared/components/index.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { PLANS_URL } from "../config/constant.js";
import { formatMoney } from "../../../shared/lib/money.js";
import { useAppSettings } from "../../settings/hooks/useAppSettings.js";
import { usePlansText } from "../config/plansText.js";
import PlanCouponsDialog from "../components/PlanCouponsDialog.jsx";
import PlanPriceFields from "../components/PlanPriceFields.jsx";

const FORM_ID = "plan-form";

function makeDefaults(plan) {
  if (plan) {
    return {
      titleAr: plan.titleAr ?? "",
      titleEn: plan.titleEn ?? "",
      descriptionAr: plan.descriptionAr ?? "",
      descriptionEn: plan.descriptionEn ?? "",
      hours: plan.hours ?? "",
      sortOrder: plan.sortOrder ?? 0,
      isFeatured: Boolean(plan.isFeatured),
      isActive: plan.isActive ?? true,
    };
  }
  return {
    titleAr: "",
    titleEn: "",
    descriptionAr: "",
    descriptionEn: "",
    isActive: true,
    isFeatured: false,
    sortOrder: 0,
    hours: "",
  };
}

export default function PlansPage() {
  const txt = usePlansText();
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.PLAN.LIST);
  const canCreate = hasPermission(PERMISSIONS.PLAN.CREATE);
  const canEdit = hasPermission(PERMISSIONS.PLAN.EDIT);
  const canDelete = hasPermission(PERMISSIONS.PLAN.DELETE);

  // Price is derived from the single global hourly rate + currency.
  const { hourlyRate, currency } = useAppSettings({ enabled: canList });

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
    url: PLANS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canList,
  });

  const form = useOpen();
  const discountsDialog = useOpen();
  const [selected, setSelected] = useState(null);
  const isEdit = Boolean(selected?.id);

  const { control, handleSubmit, reset, watch, setError } = useForm({
    defaultValues: makeDefaults(selected),
    mode: "onTouched",
  });

  // Re-seed the form whenever the dialog opens (create vs the selected row).
  useEffect(() => {
    if (!form.isOpen) return;
    reset(makeDefaults(selected));
  }, [form.isOpen, selected, reset]);

  // List/delete refetch only. The create/edit form mutates through its own
  // single useRequest below (so it can auto-toast + bind field errors).
  const mut = useMultiRequest({
    url: PLANS_URL,
    onSuccess: () => triggerRefetch(),
  });

  const { fetchData: savePlan, isLoading: isSaving } = useRequest({
    url: PLANS_URL,
    method: isEdit ? "put" : "post",
    shouldAutoToast: true,
    onSuccess: () => {
      triggerRefetch();
      form.close();
    },
    onError: (err) =>
      applyApiErrorsToForm(err, setError, {
        labelMap: {
          titleAr: txt.titleAr,
          titleEn: txt.titleEn,
          descriptionAr: txt.descriptionAr,
          descriptionEn: txt.descriptionEn,
          hours: txt.hours,
          sortOrder: txt.sortOrder,
        },
        showToast,
        suppressFallbackToast: true,
      }),
  });

  function onCreate() {
    setSelected(null);
    form.open();
  }
  function onEdit(row) {
    setSelected(row);
    form.open();
  }
  function onDiscounts(row) {
    setSelected(row);
    discountsDialog.open();
  }
  async function onDelete(row) {
    const ok = await confirm({ title: txt.deleteConfirm, intent: "danger" });
    if (!ok) return;
    await mut.deleteRequest(String(row.id));
  }

  function submit(values) {
    const payload = {
      titleAr: values.titleAr,
      titleEn: values.titleEn,
      descriptionAr: values.descriptionAr || undefined,
      descriptionEn: values.descriptionEn || undefined,
      hours: Number(values.hours),
      sortOrder: Number(values.sortOrder || 0),
      isFeatured: Boolean(values.isFeatured),
      isActive: values.isActive === undefined ? true : Boolean(values.isActive),
    };
    savePlan(isEdit ? String(selected.id) : null, payload);
  }

  const columns = useMemo(
    () => [
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
                onClick: () => onEdit(row),
                hidden: !canEdit,
              },
              {
                label: (row._count?.coupons ?? 0)
                  ? `${txt.discounts} (${row._count.coupons})`
                  : txt.discounts,
                icon: <MdLocalOffer />,
                color: "secondary",
                onClick: () => onDiscounts(row),
                hidden: !canEdit,
              },
              {
                label: txt.delete,
                icon: <MdDelete />,
                color: "error",
                onClick: () => onDelete(row),
                hidden: !canDelete,
              },
            ]}
          />
        ),
      },
    ],
    [txt, lng, canEdit, canDelete, hourlyRate, currency],
  );

  const filterConfig = useMemo(
    () => [{ type: "search", key: "search", label: txt.title }],
    [txt],
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

      <FormDialog
        open={form.isOpen}
        onClose={form.close}
        title={selected ? txt.editTitle : txt.createTitle}
        maxWidth="md"
        loading={isSaving}
        submitText={txt.save}
        cancelText={txt.cancel}
        onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
      >
        <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField
                name="titleAr"
                control={control}
                label={txt.titleAr}
                rules={{ required: txt.required }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField
                name="titleEn"
                control={control}
                label={txt.titleEn}
                rules={{ required: txt.required }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <PlanPriceFields
                control={control}
                watch={watch}
                txt={txt}
                hourlyRate={hourlyRate}
                currency={currency}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField
                name="sortOrder"
                control={control}
                label={txt.sortOrder}
                type="number"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <RHFTextArea
                name="descriptionAr"
                control={control}
                label={txt.descriptionAr}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <RHFTextArea
                name="descriptionEn"
                control={control}
                label={txt.descriptionEn}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFSwitch
                name="isFeatured"
                control={control}
                label={txt.isFeatured}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFSwitch
                name="isActive"
                control={control}
                label={txt.isActive}
              />
            </Grid>
          </Grid>
        </form>
      </FormDialog>

      <PlanCouponsDialog
        open={discountsDialog.isOpen}
        onClose={() => {
          discountsDialog.close();
          triggerRefetch();
        }}
        plan={selected}
        txt={txt}
      />
    </Box>
  );
}
