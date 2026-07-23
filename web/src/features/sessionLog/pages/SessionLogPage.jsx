"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import {
  DataTable,
  EmptyState,
  PageHeader,
  useConfirm,
} from "../../../shared/components/index.js";
import {
  SESSION_LOGS_URL,
  MY_STUDENTS_URL,
  USERS_URL,
  currentMonth,
  studentLabel,
} from "../config/constant.js";
import { useSessionLogText } from "../config/sessionLogText.js";
import { buildSessionLogColumns } from "../config/sessionLogColumns.js";
import SessionLogFormDialog from "../components/SessionLogFormDialog.jsx";
import SessionCard from "../components/SessionCard.jsx";

export default function SessionLogPage() {
  const txt = useSessionLogText();
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.SESSION_LOG.LIST);
  const canCreate = hasPermission(PERMISSIONS.SESSION_LOG.CREATE);
  const canEdit = hasPermission(PERMISSIONS.SESSION_LOG.EDIT);
  const canDelete = hasPermission(PERMISSIONS.SESSION_LOG.DELETE);
  // Management = anyone who can author/manage sessions. Parents hold only
  // LIST/VIEW, so they get the read-only card grid + child filter instead.
  const isManagement = canCreate || canEdit || canDelete;

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
    url: SESSION_LOGS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canList,
  });

  // Default the list to the CURRENT month. Seed once so the user can still
  // switch months (or deep-link one).
  const didSeedMonth = useRef(false);
  useEffect(() => {
    if (didSeedMonth.current) return;
    didSeedMonth.current = true;
    if (filters.month === undefined) {
      setFilters((prev) => ({ ...prev, month: currentMonth() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parent-only: their own children. Management gets full student + parent
  // pickers so either filter can be cleared independently.
  const myStudentsReq = useRequest({
    url: MY_STUDENTS_URL,
    method: "get",
    autoFetch: canList && !isManagement,
    syncToUrl: false,
  });
  const myStudents = myStudentsReq.data || [];
  const allStudentsReq = useRequest({
    url: USERS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canList && isManagement,
    syncToUrl: false,
    initialParams: { limit: 100, role: "STUDENT" },
  });
  const parentsReq = useRequest({
    url: USERS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canList && isManagement,
    syncToUrl: false,
    initialParams: { limit: 100, role: "PARENT" },
  });
  const filterStudents = isManagement
    ? allStudentsReq.data || []
    : myStudents;
  const filterParents = parentsReq.data || [];

  const form = useOpen();
  const [selected, setSelected] = useState(null);

  const mut = useMultiRequest({
    url: SESSION_LOGS_URL,
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
      buildSessionLogColumns({
        txt,
        lng,
        can: { edit: canEdit, delete: canDelete },
        actions: { onEdit, onDelete },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [txt, lng, canEdit, canDelete],
  );

  if (!canList) return null;

  const monthValue = filters.month || "";
  const studentValue = filters.studentId != null ? String(filters.studentId) : "";
  const parentValue = filters.parentId != null ? String(filters.parentId) : "";

  const toolbar = (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{ mb: 3 }}
      alignItems={{ xs: "stretch", sm: "flex-end" }}
    >
      <TextField
        type="month"
        label={txt.monthLabel}
        value={monthValue}
        onChange={(e) =>
          setFilters((prev) => ({ ...prev, month: e.target.value || undefined }))
        }
        InputLabelProps={{ shrink: true }}
        size="small"
        sx={{ minWidth: 180 }}
      />
      <TextField
        select
        label={txt.studentFilterLabel}
        value={studentValue}
        onChange={(e) =>
          setFilters((prev) => ({
            ...prev,
            studentId: e.target.value || undefined,
          }))
        }
        size="small"
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">{txt.allStudents}</MenuItem>
        {filterStudents.map((s) => (
          <MenuItem key={s.id} value={String(s.id)}>
            {studentLabel(s)}
          </MenuItem>
        ))}
      </TextField>
      {isManagement && (
        <TextField
          select
          label={txt.parentFilterLabel}
          value={parentValue}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              parentId: e.target.value || undefined,
            }))
          }
          size="small"
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">{txt.allParents}</MenuItem>
          {filterParents.map((parent) => (
            <MenuItem key={parent.id} value={String(parent.id)}>
              {parent.name}
            </MenuItem>
          ))}
        </TextField>
      )}
    </Stack>
  );

  return (
    <Box>
      <PageHeader
        title={txt.pageTitle}
        description={txt.pageDescription}
        createLabel={txt.create}
        onCreate={canCreate ? onCreate : undefined}
      />

      {toolbar}

      {isManagement ? (
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
          noContainer
        />
      ) : (
        <ParentSessionsGrid sessions={data || []} isLoading={isLoading} txt={txt} />
      )}

      <SessionLogFormDialog
        open={form.isOpen}
        onClose={form.close}
        session={selected}
        onSaved={triggerRefetch}
      />
    </Box>
  );
}

// Parent (read-only) view: a responsive card grid of sessions.
function ParentSessionsGrid({ sessions, isLoading, txt }) {
  if (isLoading && !sessions.length) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!sessions.length) {
    return (
      <EmptyState
        title={txt.emptyTitle}
        body={txt.emptyBody}
        icon={<Box sx={{ fontSize: 48 }}>📘</Box>}
      />
    );
  }

  return (
    <Grid container spacing={2.5}>
      {sessions.map((session) => (
        <Grid key={session.id} size={{ xs: 12, sm: 6, lg: 4 }}>
          <SessionCard session={session} txt={txt} />
        </Grid>
      ))}
    </Grid>
  );
}
