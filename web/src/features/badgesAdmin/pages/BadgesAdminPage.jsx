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
import { DataTable, RowActionsMenu, useConfirm } from "../../../shared/components/index.js";
import BadgeChip from "../../userDetail/components/BadgeChip.jsx";
import { BADGES_URL } from "../config/constant.js";
import { useBadgesAdminText } from "../config/badgesAdminText.js";
import BadgeFormDialog from "../components/BadgeFormDialog.jsx";

/** Admin management surface for badge definitions. */
export default function BadgesAdminPage() {
  const txt = useBadgesAdminText();
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const { hasPermission } = usePermission();

  const canList = hasPermission(PERMISSIONS.BADGE.LIST);
  const canCreate = hasPermission(PERMISSIONS.BADGE.CREATE);
  const canEdit = hasPermission(PERMISSIONS.BADGE.EDIT);
  const canDelete = hasPermission(PERMISSIONS.BADGE.DELETE);

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
    url: BADGES_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canList,
  });

  const form = useOpen();
  const [selected, setSelected] = useState(null);

  const mut = useMultiRequest({
    url: BADGES_URL,
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
        field: "preview",
        headerName: txt.preview,
        width: 200,
        sortable: false,
        renderCell: ({ row }) => <BadgeChip badge={row} lng={lng} size="sm" />,
      },
      {
        field: "code",
        headerName: txt.code,
        width: 160,
        renderCell: ({ row }) => <Typography variant="body2">{row.code}</Typography>,
      },
      {
        field: "name",
        headerName: txt.name,
        width: 200,
        renderCell: ({ row }) => (lng === "en" ? row.nameEn || row.nameAr : row.nameAr || row.nameEn),
      },
      {
        field: "score",
        headerName: txt.score,
        width: 100,
        renderCell: ({ row }) => row.score ?? 0,
      },
      {
        field: "isActive",
        headerName: txt.active,
        width: 120,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            color={row.isActive ? "success" : "default"}
            variant={row.isActive ? "filled" : "outlined"}
            label={row.isActive ? txt.activeYes : txt.activeNo}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [txt, lng, canEdit, canDelete],
  );

  const filterConfig = useMemo(
    () => [{ type: "search", key: "search", label: txt.code }],
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

      <BadgeFormDialog
        open={form.isOpen}
        onClose={form.close}
        badge={selected}
        txt={txt}
        loading={mut.isPostRequestLoading || mut.isPatchRequestLoading}
        onSubmit={submit}
      />
    </Box>
  );
}
