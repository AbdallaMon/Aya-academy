"use client";

import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { PERMISSIONS } from "@ayah/shared";
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
import { BADGES_URL } from "../config/constant.js";
import { useBadgesAdminText } from "../config/badgesAdminText.js";
import { buildBadgesAdminColumns } from "../config/badgesAdminColumns.js";
import { buildBadgesAdminFilters } from "../config/badgesAdminFilters.js";
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

  const columns = useMemo(
    () =>
      buildBadgesAdminColumns({
        txt,
        lng,
        can: { edit: canEdit, delete: canDelete },
        actions: { onEdit, onDelete },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [txt, lng, canEdit, canDelete],
  );

  const filterConfig = useMemo(
    () => buildBadgesAdminFilters({ txt }),
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

      <BadgeFormDialog
        open={form.isOpen}
        onClose={form.close}
        badge={selected}
        txt={txt}
        onSaved={triggerRefetch}
      />
    </Box>
  );
}
