"use client";

import { useMemo, useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { MdEdit, MdDelete, MdCheckCircle } from "react-icons/md";
import {
  AUTO_CERTIFICATE_TEMPLATE_TYPES,
  CERTIFICATE_TEMPLATE_TYPES,
  PERMISSIONS,
} from "@aya/shared";
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
  // Make a GAME/EXAM template the active ("in-use") one (deactivates its peers).
  async function onActivate(row) {
    await mut.postRequest(`${row.id}/activate`, {});
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
        width: 160,
        renderCell: ({ row }) => <Typography variant="body2">{row.key}</Typography>,
      },
      {
        field: "type",
        headerName: txt.type,
        width: 140,
        renderCell: ({ row }) => {
          if (row.type === CERTIFICATE_TEMPLATE_TYPES.GAME)
            return <Chip size="small" color="secondary" label={txt.typeGame} />;
          if (row.type === CERTIFICATE_TEMPLATE_TYPES.EXAM)
            return <Chip size="small" color="info" label={txt.typeExam} />;
          return <Chip size="small" variant="outlined" label={txt.typeGeneral} />;
        },
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
        width: 130,
        renderCell: ({ row }) => {
          // For auto-applied types (GAME/EXAM) "active" means "in use" — and
          // exactly one of each type can be in use at a time.
          const isAuto = AUTO_CERTIFICATE_TEMPLATE_TYPES.includes(row.type);
          const onLabel = isAuto ? txt.inUse : txt.active;
          const offLabel = isAuto ? txt.notInUse : txt.inactive;
          return (
            <Chip
              size="small"
              color={row.isActive ? "success" : "default"}
              variant={row.isActive ? "filled" : "outlined"}
              label={row.isActive ? onLabel : offLabel}
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
              // "Use this template" — only for an auto-applied (GAME/EXAM)
              // template that isn't already the active one.
              ...(AUTO_CERTIFICATE_TEMPLATE_TYPES.includes(row.type) &&
              !row.isActive
                ? [
                    {
                      label: txt.useTemplate,
                      icon: <MdCheckCircle />,
                      color: "success",
                      onClick: () => onActivate(row),
                    },
                  ]
                : []),
              {
                label: txt.edit,
                icon: <MdEdit />,
                onClick: () => onEdit(row),
              },
              {
                label: txt.delete,
                icon: <MdDelete />,
                color: "error",
                onClick: () => onDelete(row),
              },
            ]}
          />
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
      <PageHeader
        title={txt.pageTitle}
        description={txt.pageDescription}
        createLabel={txt.create}
        onCreate={onCreate}
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
