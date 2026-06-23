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
import { DataTable, useConfirm } from "../../../shared/components/index.js";
import { CERTIFICATE_TEMPLATES_URL } from "../config/constant.js";
import { useCertificateTemplatesText } from "../config/certificateTemplatesText.js";
import TemplateFormDialog from "../components/TemplateFormDialog.jsx";

/** Admin management surface for certificate templates. */
export default function CertificateTemplatesPage() {
  const txt = useCertificateTemplatesText();
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const { hasPermission } = usePermission();

  // A single permission governs the whole templates surface.
  const canManage = hasPermission(PERMISSIONS.CERTIFICATE.MANAGE_TEMPLATES);

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
    url: CERTIFICATE_TEMPLATES_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canManage,
  });

  const form = useOpen();
  const [selected, setSelected] = useState(null);

  const mut = useMultiRequest({
    url: CERTIFICATE_TEMPLATES_URL,
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

  async function submit(payload, isEditing) {
    if (isEditing) await mut.patchRequest(String(selected.id), payload);
    else await mut.postRequest(null, payload);
    form.close();
  }

  const columns = useMemo(
    () => [
      {
        field: "name",
        headerName: txt.name,
        width: 240,
        renderCell: ({ row }) =>
          (lng === "en" ? row.nameEn || row.nameAr : row.nameAr || row.nameEn) || row.key,
      },
      {
        field: "key",
        headerName: txt.key,
        width: 180,
        renderCell: ({ row }) => <Typography variant="body2">{row.key}</Typography>,
      },
      {
        field: "isDefault",
        headerName: txt.isDefault,
        width: 120,
        renderCell: ({ row }) =>
          row.isDefault ? (
            <Chip size="small" color="primary" label={txt.yes} />
          ) : (
            <Chip size="small" variant="outlined" label={txt.no} />
          ),
      },
      {
        field: "isActive",
        headerName: txt.isActive,
        width: 120,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            color={row.isActive ? "success" : "default"}
            variant={row.isActive ? "filled" : "outlined"}
            label={row.isActive ? txt.active : txt.inactive}
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
            <Button size="small" startIcon={<MdEdit />} onClick={() => onEdit(row)}>
              {txt.edit}
            </Button>
            <Button
              size="small"
              color="error"
              startIcon={<MdDelete />}
              onClick={() => onDelete(row)}
            />
          </Stack>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [txt, lng],
  );

  const filterConfig = useMemo(
    () => [{ type: "search", key: "search", label: txt.name }],
    [txt],
  );

  if (!canManage) return null;

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
        <Button variant="contained" startIcon={<MdAdd />} onClick={onCreate}>
          {txt.create}
        </Button>
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

      <TemplateFormDialog
        open={form.isOpen}
        onClose={form.close}
        template={selected}
        txt={txt}
        loading={mut.isPostRequestLoading || mut.isPatchRequestLoading}
        onSubmit={submit}
      />
    </Box>
  );
}
