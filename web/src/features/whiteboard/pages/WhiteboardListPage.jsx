"use client";

import { useMemo } from "react";
import { Box } from "@mui/material";
import { MdOpenInNew, MdPlayArrow, MdStop, MdDelete } from "react-icons/md";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import {
  DataTable,
  PageHeader,
  RowActionsMenu,
  useConfirm,
} from "../../../shared/components/index.js";
import { WHITEBOARD_URL, WHITEBOARD_STATUS } from "../config/constant.js";
import { buildWhiteboardColumns } from "../config/whiteboardColumns.js";
import { useWhiteboardText } from "../config/whiteboardText.js";
import CreateWhiteboardDialog from "../components/CreateWhiteboardDialog.jsx";

export default function WhiteboardListPage() {
  const txt = useWhiteboardText();
  const { lng } = useTranslation();
  const { hasPermission } = usePermission();
  const canManage = hasPermission(PERMISSIONS.WHITEBOARD.MANAGE);
  const confirm = useConfirm();
  const createDialog = useOpen();

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
    url: WHITEBOARD_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canManage,
  });

  const mut = useMultiRequest({ url: WHITEBOARD_URL, onSuccess: () => triggerRefetch() });

  const onActivate = (row) => mut.postRequest(`${row.id}/actions/activate`);
  const onEnd = (row) => mut.postRequest(`${row.id}/actions/end`);
  const onDelete = async (row) => {
    const ok = await confirm({ title: txt.confirmDelete });
    if (!ok) return;
    await mut.deleteRequest(`${row.id}`);
  };

  const baseColumns = useMemo(() => buildWhiteboardColumns(txt), [txt]);

  const columns = useMemo(
    () => [
      ...baseColumns,
      {
        field: "actions",
        type: "actions",
        headerName: txt.status,
        width: 80,
        renderCell: ({ row }) => (
          <RowActionsMenu
            actions={[
              {
                label: txt.openBoard,
                icon: <MdOpenInNew />,
                href: localePath(lng, `/dashboard/whiteboard/${row.id}`),
              },
              {
                label: txt.activate,
                icon: <MdPlayArrow />,
                onClick: () => onActivate(row),
                hidden: row.status === WHITEBOARD_STATUS.ACTIVE,
              },
              {
                label: txt.end,
                icon: <MdStop />,
                onClick: () => onEnd(row),
                hidden: row.status !== WHITEBOARD_STATUS.ACTIVE,
              },
              {
                label: txt.delete,
                icon: <MdDelete />,
                onClick: () => onDelete(row),
              },
            ]}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseColumns, txt, lng],
  );

  if (!canManage) return null;

  return (
    <Box>
      <PageHeader title={txt.pageTitle} />
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
        onCreate={createDialog.open}
        createLabel={txt.createBtn}
        noContainer
      />
      <CreateWhiteboardDialog
        open={createDialog.isOpen}
        onClose={createDialog.close}
        onCreated={() => triggerRefetch()}
      />
    </Box>
  );
}
