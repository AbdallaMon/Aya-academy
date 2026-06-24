"use client";

import { useEffect, useRef, useState } from "react";
import { Box, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { FiRotateCcw, FiTrash2 } from "react-icons/fi";
import { DataTable } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useBackupsText } from "../hooks/useBackupsText.js";
import { backupsColumns } from "../config/backupsColumns.js";
import { BACKUPS_URL, BACKUPS_DELETE_URL } from "../config/constant.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import RestoreDialog from "./RestoreDialog.jsx";

/**
 * BackupHistoryTable — backup history (GET /backups, paginated) + per-row restore.
 *
 * Screen strings come from backupsData[lng] (not a shared namespace), so we
 * inject pre-resolved column headers and build a local filter bar instead of the
 * shared FilterBar (which depends on a registered namespace).
 *
 * props:
 *   canRestore    — restore/delete permission (backup.manage).
 *   onChanged     — refresh the status card after a restore/delete.
 *   refreshSignal — a value bumped by the parent (e.g. after a manual backup) to
 *                   force a history re-fetch so the new backup appears at once.
 */
export default function BackupHistoryTable({
  canRestore,
  onChanged,
  refreshSignal,
}) {
  const { tr, trMsg } = useBackupsText();
  const [toRestore, setToRestore] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const list = useRequest({
    url: BACKUPS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: true,
  });

  // Re-fetch when the parent's signal changes (e.g. a successful manual backup).
  // Ignore the first pass so we don't duplicate the initial fetch (autoFetch
  // handles it). triggerRefetch is just a callback (flips a flag in useRequest),
  // so it doesn't violate the set-state-in-effect rule.
  const firstSignalRef = useRef(true);
  useEffect(() => {
    if (firstSignalRef.current) {
      firstSignalRef.current = false;
      return;
    }
    list.triggerRefetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  const deleteReq = useRequest({
    url: BACKUPS_DELETE_URL,
    method: "delete",
    shouldAutoToast: true,
    onSuccess: () => {
      setToDelete(null);
      list.triggerRefetch();
      onChanged?.();
    },
  });

  function setFilter(key, value) {
    list.setFilters((prev) => {
      const next = { ...prev };
      if (value === "" || value === undefined || value === null) delete next[key];
      else next[key] = value;
      return next;
    });
  }

  function buildActions(row) {
    // canRestore comes from the dto; the blocked-reason (message code) is in
    // restoreUnavailableReasonCode.
    const restorable = Boolean(row.canRestore);
    const restoreLabel = restorable
      ? tr.restore
      : trMsg(row.restoreUnavailableReasonCode) || tr.restoreUnavailable;
    return [
      {
        key: "restore",
        // Primary action (direct icon + Tooltip) — shows the blocked-reason when disabled.
        primary: true,
        label: restoreLabel,
        icon: FiRotateCcw,
        color: "error",
        hidden: !canRestore,
        disabled: !restorable,
        onClick: (r) => setToRestore(r),
      },
      {
        key: "delete",
        label: tr.deleteBackup,
        icon: FiTrash2,
        color: "error",
        hidden: !canRestore, // same management gate (backup.manage)
        onClick: (r) => setToDelete(r),
      },
    ];
  }

  // Column headers pre-resolved (we don't rely on a translator inside DataTable).
  const columns = backupsColumns({ tr, buildActions }).map((col) => ({
    ...col,
    headerName: tr[col.headerName] || col.headerName,
  }));

  return (
    <Box sx={{ mt: 1 }}>
      <RestoreDialog
        open={Boolean(toRestore)}
        backup={toRestore}
        onClose={() => setToRestore(null)}
        onDone={() => {
          list.triggerRefetch();
          onChanged?.();
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        intent="danger"
        title={tr.deleteBackupTitle}
        description={tr.deleteBackupBody}
        confirmText={tr.deleteBackupConfirm}
        loading={deleteReq.isLoading}
        onCancel={() => setToDelete(null)}
        onConfirm={() =>
          deleteReq.fetchData(String(toDelete?.id)).catch(() => {})
        }
      />

      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
        {tr.historyTitle}
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        flexWrap="wrap"
        sx={{ mb: 1 }}
      >
        <TextField
          select
          size="small"
          label={tr.statusFilter}
          value={list.filters.status ?? ""}
          onChange={(e) => setFilter("status", e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">{tr.allStatuses}</MenuItem>
          <MenuItem value="SUCCESS">{tr.SUCCESS}</MenuItem>
          <MenuItem value="FAILED">{tr.FAILED}</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label={tr.locationFilter}
          value={list.filters.location ?? ""}
          onChange={(e) => setFilter("location", e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">{tr.locationAll}</MenuItem>
          <MenuItem value="local">{tr.locationLocal}</MenuItem>
          <MenuItem value="drive">{tr.locationDrive}</MenuItem>
          <MenuItem value="deleted">{tr.locationDeleted}</MenuItem>
        </TextField>
      </Stack>

      <DataTable
        columns={columns}
        initialRows={list.data || []}
        total={list.total}
        page={list.page}
        rowsPerPage={list.pageSize}
        setPage={list.setPage}
        setRowsPerPage={list.setPageSize}
        loading={list.isLoading}
        noContainer
      />
    </Box>
  );
}
