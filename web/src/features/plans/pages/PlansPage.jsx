"use client";

import { useMemo, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { MdAdd, MdEdit, MdDelete, MdLocalOffer } from "react-icons/md";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import {
  AppForm,
  DataTable,
  FormDialog,
  useConfirm,
} from "../../../shared/components/index.js";
import { PLANS_URL, BILLING_PERIODS, formatGBP } from "../config/constant.js";
import { usePlansText } from "../config/plansText.js";
import PlanDiscountsDialog from "../components/PlanDiscountsDialog.jsx";

export default function PlansPage() {
  const txt = usePlansText();
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.PLAN.LIST);
  const canCreate = hasPermission(PERMISSIONS.PLAN.CREATE);
  const canEdit = hasPermission(PERMISSIONS.PLAN.EDIT);
  const canDelete = hasPermission(PERMISSIONS.PLAN.DELETE);

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

  const mut = useMultiRequest({
    url: PLANS_URL,
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
  function onDiscounts(row) {
    setSelected(row);
    discountsDialog.open();
  }
  async function onDelete(row) {
    const ok = await confirm({ title: txt.deleteConfirm, intent: "danger" });
    if (!ok) return;
    await mut.deleteRequest(String(row.id));
  }

  async function submit(values) {
    const payload = {
      titleAr: values.titleAr,
      titleEn: values.titleEn,
      descriptionAr: values.descriptionAr || undefined,
      descriptionEn: values.descriptionEn || undefined,
      billingPeriod: values.billingPeriod,
      hours: Number(values.hours),
      hourlyRate: Number(values.hourlyRate),
      sortOrder: Number(values.sortOrder || 0),
      isFeatured: Boolean(values.isFeatured),
      isActive: values.isActive === undefined ? true : Boolean(values.isActive),
    };
    if (selected?.id) await mut.putRequest(String(selected.id), payload);
    else await mut.postRequest(null, payload);
    form.close();
  }

  const fields = useMemo(
    () => [
      { name: "titleAr", label: txt.titleAr, type: "text", rules: { required: txt.required } },
      { name: "titleEn", label: txt.titleEn, type: "text", rules: { required: txt.required } },
      {
        name: "billingPeriod",
        label: txt.billingPeriod,
        type: "select",
        options: { MONTHLY: txt.monthly, YEARLY: txt.yearly },
        rules: { required: txt.required },
      },
      { name: "hours", label: txt.hours, type: "number", rules: { required: txt.required } },
      { name: "hourlyRate", label: txt.hourlyRate, type: "number", rules: { required: txt.required } },
      { name: "sortOrder", label: txt.sortOrder, type: "number" },
      { name: "descriptionAr", label: txt.descriptionAr, type: "textarea", gridSize: { xs: 12 } },
      { name: "descriptionEn", label: txt.descriptionEn, type: "textarea", gridSize: { xs: 12 } },
      { name: "isFeatured", label: txt.isFeatured, type: "switch" },
      { name: "isActive", label: txt.isActive, type: "switch" },
    ],
    [txt],
  );

  const defaultValues = useMemo(() => {
    if (selected) {
      return {
        titleAr: selected.titleAr ?? "",
        titleEn: selected.titleEn ?? "",
        descriptionAr: selected.descriptionAr ?? "",
        descriptionEn: selected.descriptionEn ?? "",
        billingPeriod: selected.billingPeriod ?? "MONTHLY",
        hours: selected.hours ?? "",
        hourlyRate: selected.hourlyRate ?? "",
        sortOrder: selected.sortOrder ?? 0,
        isFeatured: Boolean(selected.isFeatured),
        isActive: selected.isActive ?? true,
      };
    }
    return { billingPeriod: "MONTHLY", isActive: true, isFeatured: false, sortOrder: 0 };
  }, [selected]);

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
      {
        field: "billingPeriod",
        headerName: txt.period,
        width: 110,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            label={row.billingPeriod === "YEARLY" ? txt.yearly : txt.monthly}
          />
        ),
      },
      { field: "hours", headerName: txt.hours, width: 90 },
      {
        field: "price",
        headerName: txt.price,
        width: 120,
        renderCell: ({ row }) => (
          <Typography fontWeight={700}>
            {formatGBP(Number(row.hourlyRate) * row.hours)}
          </Typography>
        ),
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
        width: 170,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            {canEdit && (
              <Button size="small" startIcon={<MdEdit />} onClick={() => onEdit(row)}>
                {txt.edit}
              </Button>
            )}
            {canEdit && (
              <Button
                size="small"
                color="secondary"
                startIcon={<MdLocalOffer />}
                onClick={() => onDiscounts(row)}
              >
                {(row.discounts?.length ?? 0) || ""}
              </Button>
            )}
            {canDelete && (
              <Button
                size="small"
                color="error"
                startIcon={<MdDelete />}
                onClick={() => onDelete(row)}
              />
            )}
          </Stack>
        ),
      },
    ],
    [txt, lng, canEdit, canDelete],
  );

  const filterConfig = useMemo(
    () => [
      { type: "search", key: "search", label: txt.title },
      {
        type: "enum",
        key: "billingPeriod",
        label: txt.period,
        options: { MONTHLY: txt.monthly, YEARLY: txt.yearly },
      },
    ],
    [txt],
  );

  if (!canList) return null;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 3 }}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {txt.pageTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {txt.pageDescription}
          </Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<MdAdd />} onClick={onCreate}>
            {txt.create}
          </Button>
        )}
      </Stack>

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
        loading={mut.isPostRequestLoading || mut.isPutRequestLoading}
        submitText={txt.save}
        cancelText={txt.cancel}
        onSubmit={() =>
          document.getElementById("plan-form")?.requestSubmit()
        }
      >
        <AppForm
          id="plan-form"
          fields={fields}
          defaultValues={defaultValues}
          onSubmit={submit}
        />
      </FormDialog>

      <PlanDiscountsDialog
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
