"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdEdit, MdDelete } from "react-icons/md";
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
  RowActionsMenu,
  useConfirm,
} from "../../../shared/components/index.js";
import {
  SESSION_LOGS_URL,
  MY_STUDENTS_URL,
  currentMonth,
  formatSessionDate,
  studentLabel,
} from "../config/constant.js";
import { useSessionLogText } from "../config/sessionLogText.js";
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

  // Parent-only: the list of their children, used by the child (studentId) filter.
  const myStudentsReq = useRequest({
    url: MY_STUDENTS_URL,
    method: "get",
    autoFetch: canList && !isManagement,
    syncToUrl: false,
  });
  const myStudents = myStudentsReq.data || [];

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
    () => [
      {
        field: "student",
        headerName: txt.student,
        width: 200,
        renderCell: ({ row }) => (
          <Typography fontWeight={700}>{studentLabel(row.student)}</Typography>
        ),
      },
      {
        field: "subjects",
        headerName: txt.subjects,
        width: 260,
        renderCell: ({ row }) => {
          const list = Array.isArray(row.subjectsJson) ? row.subjectsJson : [];
          if (!list.length) return txt.dash;
          const shown = list.slice(0, 2);
          const rest = list.length - shown.length;
          return (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {shown.map((s) => (
                <Chip key={s} size="small" label={txt[s] || s} />
              ))}
              {rest > 0 && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={txt.moreItems.replace("{count}", rest)}
                />
              )}
            </Stack>
          );
        },
      },
      {
        field: "durationHours",
        headerName: txt.hours,
        width: 100,
        renderCell: ({ row }) => Number(row.durationHours),
      },
      {
        field: "rating",
        headerName: txt.rating,
        width: 120,
        renderCell: ({ row }) => (row.rating ? txt[row.rating] || row.rating : txt.dash),
      },
      {
        field: "attendance",
        headerName: txt.attendance,
        width: 120,
        renderCell: ({ row }) => {
          const present = row.attendance === "PRESENT";
          return (
            <Chip
              size="small"
              color={present ? "success" : "error"}
              label={present ? txt.PRESENT : txt.ABSENT}
            />
          );
        },
      },
      {
        field: "sessionDate",
        headerName: txt.date,
        width: 150,
        renderCell: ({ row }) => formatSessionDate(row.sessionDate, lng),
      },
      {
        field: "teacher",
        headerName: txt.teacher,
        width: 160,
        renderCell: ({ row }) => row.teacher?.name || txt.dash,
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

  if (!canList) return null;

  const monthValue = filters.month || "";
  const studentValue = filters.studentId != null ? String(filters.studentId) : "";

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
      {!isManagement && (
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
          {myStudents.map((s) => (
            <MenuItem key={s.id} value={String(s.id)}>
              {studentLabel(s)}
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
