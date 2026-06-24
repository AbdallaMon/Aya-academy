"use client";

import { useMemo, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
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
import {
  COUPONS_URL,
  COUPON_SOURCES,
  formatGBP,
  toDateInput,
} from "../config/constant.js";
import { useCouponsText } from "../config/couponsText.js";

export default function CouponsPage() {
  const txt = useCouponsText();
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.COUPON.LIST);
  const canCreate = hasPermission(PERMISSIONS.COUPON.CREATE);
  const canEdit = hasPermission(PERMISSIONS.COUPON.EDIT);
  const canDelete = hasPermission(PERMISSIONS.COUPON.DELETE);

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

  async function submit(values) {
    const payload = {
      code: values.code?.trim(),
      type: values.type,
      value: Number(values.value),
      source: values.source || undefined,
      maxRedemptions: values.maxRedemptions
        ? Number(values.maxRedemptions)
        : undefined,
      startsAt: values.startsAt || undefined,
      endsAt: values.endsAt || undefined,
      isActive:
        values.isActive === undefined ? true : Boolean(values.isActive),
    };
    if (selected?.id) await mut.putRequest(String(selected.id), payload);
    else await mut.postRequest(null, payload);
    form.close();
  }

  const sourceOptions = useMemo(
    () =>
      COUPON_SOURCES.reduce((acc, s) => {
        acc[s] = txt[s] || s;
        return acc;
      }, {}),
    [txt],
  );

  const fields = useMemo(
    () => [
      {
        name: "code",
        label: txt.codeLabel,
        type: "text",
        rules: { required: txt.required },
      },
      {
        name: "type",
        label: txt.typeLabel,
        type: "select",
        options: { PERCENT: txt.percent, FIXED: txt.fixed },
        rules: { required: txt.required },
      },
      {
        name: "value",
        label: txt.valueLabel,
        type: "number",
        rules: { required: txt.required },
      },
      {
        name: "source",
        label: txt.sourceLabel,
        type: "select",
        options: sourceOptions,
      },
      { name: "maxRedemptions", label: txt.maxRedemptions, type: "number" },
      {
        name: "startsAt",
        label: txt.startsAt,
        type: "date",
        InputLabelProps: { shrink: true },
      },
      {
        name: "endsAt",
        label: txt.endsAt,
        type: "date",
        InputLabelProps: { shrink: true },
      },
      { name: "isActive", label: txt.isActive, type: "switch" },
    ],
    [txt, sourceOptions],
  );

  const defaultValues = useMemo(() => {
    if (selected) {
      return {
        code: selected.code ?? "",
        type: selected.type ?? "PERCENT",
        value: selected.value ?? "",
        source: selected.source ?? "MANUAL",
        maxRedemptions: selected.maxRedemptions ?? "",
        startsAt: toDateInput(selected.startsAt),
        endsAt: toDateInput(selected.endsAt),
        isActive: selected.isActive ?? true,
      };
    }
    return {
      type: "PERCENT",
      source: "MANUAL",
      isActive: true,
      value: "",
      maxRedemptions: "",
      startsAt: "",
      endsAt: "",
    };
  }, [selected]);

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
              ? formatGBP(Number(row.value))
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
        width: 130,
        renderCell: ({ row }) => {
          const count = row.plans?.length ?? 0;
          return count
            ? `${count}`
            : txt.allPlans;
        },
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
        width: 150,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            {canEdit && (
              <Button size="small" startIcon={<MdEdit />} onClick={() => onEdit(row)}>
                {txt.edit}
              </Button>
            )}
            {canDelete && row.isActive && (
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
      { type: "search", key: "search", label: txt.code },
      {
        type: "enum",
        key: "source",
        label: txt.source,
        options: { ALL: txt.all, ...sourceOptions },
      },
      {
        type: "enum",
        key: "isActive",
        label: txt.active,
        options: { ALL: txt.all, true: txt.yes, false: txt.no },
      },
    ],
    [txt, sourceOptions],
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
        onSubmit={() => document.getElementById("coupon-form")?.requestSubmit()}
      >
        <AppForm
          id="coupon-form"
          fields={fields}
          defaultValues={defaultValues}
          onSubmit={submit}
        />
      </FormDialog>
    </Box>
  );
}
