"use client";

import { useMemo, useRef, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { MdAdd, MdEdit, MdDelete, MdVideocam } from "react-icons/md";
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
  SESSIONS_URL,
  USERS_URL,
  SESSION_STATUSES,
  SESSION_STATUS_COLOR,
  toLocalInput,
  formatDateTime,
} from "../config/constant.js";
import { useSessionsText } from "../config/sessionsText.js";
import LessonPlanFields from "../components/LessonPlanFields.jsx";

export default function SessionsPage() {
  const txt = useSessionsText();
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.SESSION.LIST);
  const canCreate = hasPermission(PERMISSIONS.SESSION.CREATE);
  const canEdit = hasPermission(PERMISSIONS.SESSION.EDIT);
  const canDelete = hasPermission(PERMISSIONS.SESSION.DELETE);

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
    url: SESSIONS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canList,
  });

  // Students for the picker — loaded lazily the first time the form opens.
  const studentsReq = useRequest({
    url: USERS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: { limit: 100, role: "STUDENT" },
  });
  const students = studentsReq.data || [];

  const form = useOpen();
  const [selected, setSelected] = useState(null);

  const mut = useMultiRequest({
    url: SESSIONS_URL,
    onSuccess: () => triggerRefetch(),
  });

  // Separate request for saving the lesson plan (PUT /sessions/:id/plan).
  // shouldAutoToast is true so server errors (INVALID_AYAH_RANGE etc.) surface as toasts.
  const planReq = useRequest({
    url: SESSIONS_URL,
    method: "put",
    shouldAutoToast: true,
    syncToUrl: false,
    autoFetch: false,
  });

  // Load students once, the first time a form is opened.
  const studentsLoadedRef = useRef(false);
  function ensureStudents() {
    if (studentsLoadedRef.current) return;
    studentsLoadedRef.current = true;
    studentsReq.fetchData();
  }

  function onCreate() {
    setSelected(null);
    ensureStudents();
    form.open();
  }
  function onEdit(row) {
    setSelected(row);
    ensureStudents();
    form.open();
  }
  async function onDelete(row) {
    const ok = await confirm({ title: txt.deleteConfirm, intent: "danger" });
    if (!ok) return;
    await mut.deleteRequest(String(row.id));
  }

  async function submit(values) {
    // Step 1 — session create / update (plan fields are NOT sent here).
    const payload = {
      studentId: Number(values.studentId),
      title: values.title || undefined,
      startsAt: values.startsAt,
      endsAt: values.endsAt,
      status: values.status || undefined,
      meetingLink: values.meetingLink || undefined,
      notes: values.notes || undefined,
    };
    if (values.subscriptionId) {
      payload.subscriptionId = Number(values.subscriptionId);
    }

    let sessionId;
    if (selected?.id) {
      await mut.putRequest(String(selected.id), payload);
      sessionId = selected.id;
    } else {
      const res = await mut.postRequest(null, payload);
      sessionId = res?.data?.id;
    }

    // Step 2 — lesson plan (optional).
    // Build the assignments list from plan.memorize + plan.review rows.
    const memorizeRows = values.plan?.memorize || [];
    const reviewRows = values.plan?.review || [];

    const assignments = [];
    let order = 0;

    for (const row of memorizeRows) {
      if (!row.surahId) continue; // skip incomplete rows
      order += 1;
      assignments.push({
        kind: "MEMORIZE",
        surahId: Number(row.surahId),
        fromAyah: row.wholeSurah !== false ? null : (row.fromAyah ? Number(row.fromAyah) : null),
        toAyah: row.wholeSurah !== false ? null : (row.toAyah ? Number(row.toAyah) : null),
        order,
      });
    }

    for (const row of reviewRows) {
      if (!row.surahId) continue; // skip incomplete rows
      order += 1;
      assignments.push({
        kind: "REVIEW",
        surahId: Number(row.surahId),
        fromAyah: row.wholeSurah !== false ? null : (row.fromAyah ? Number(row.fromAyah) : null),
        toAyah: row.wholeSurah !== false ? null : (row.toAyah ? Number(row.toAyah) : null),
        order,
      });
    }

    const homework = (values.plan?.homework || "").trim();

    // Only call the plan endpoint if there is something to save.
    if (sessionId && (assignments.length > 0 || homework)) {
      const planBody = {};
      if (assignments.length > 0) planBody.assignments = assignments;
      if (homework) planBody.homework = homework;
      await planReq.fetchData(`${sessionId}/plan`, planBody);
    }

    form.close();
  }

  const studentOptions = useMemo(() => {
    const opts = {};
    for (const s of students) {
      opts[String(s.id)] = s.nickname ? `${s.name} (${s.nickname})` : s.name;
    }
    return opts;
  }, [students]);

  const statusOptions = useMemo(() => {
    const opts = {};
    for (const s of SESSION_STATUSES) opts[s] = txt[s] || s;
    return opts;
  }, [txt]);

  const fields = useMemo(
    () => [
      {
        name: "studentId",
        label: studentsReq.isLoading ? txt.loadingStudents : txt.studentField,
        type: "select",
        options: studentOptions,
        rules: { required: txt.required },
        gridSize: { xs: 12 },
      },
      { name: "title", label: txt.titleField, type: "text", gridSize: { xs: 12 } },
      {
        name: "startsAt",
        label: txt.startsAtField,
        type: "datetime-local",
        rules: { required: txt.required },
        InputLabelProps: { shrink: true },
      },
      {
        name: "endsAt",
        label: txt.endsAtField,
        type: "datetime-local",
        rules: { required: txt.required },
        InputLabelProps: { shrink: true },
      },
      {
        name: "status",
        label: txt.statusField,
        type: "select",
        options: statusOptions,
      },
      {
        name: "subscriptionId",
        label: txt.subscriptionIdField,
        type: "number",
      },
      {
        name: "meetingLink",
        label: txt.meetingLinkField,
        type: "text",
        gridSize: { xs: 12 },
      },
      { name: "notes", label: txt.notesField, type: "textarea", gridSize: { xs: 12 } },
      {
        name: "plan",
        label: txt.planTitle,
        type: "custom",
        gridSize: { xs: 12 },
        // Pass txt so LessonPlanFields can render localized labels without
        // re-importing useSessionsText (it has no lng context otherwise).
        txt,
        component: ({ control, watch, setValue, txt: fieldTxt }) => (
          <LessonPlanFields
            control={control}
            watch={watch}
            setValue={setValue}
            txt={fieldTxt}
          />
        ),
      },
    ],
    [txt, studentOptions, statusOptions, studentsReq.isLoading],
  );

  const defaultValues = useMemo(() => {
    // Build prefilled plan rows from selected.assignments
    function buildPlanDefaults(session) {
      if (!session?.assignments?.length && !session?.homework) {
        return { memorize: [], review: [], homework: "" };
      }
      const memorize = [];
      const review = [];
      for (const a of session.assignments || []) {
        const row = {
          surahId: a.surahId,
          wholeSurah: a.fromAyah == null && a.toAyah == null,
          fromAyah: a.fromAyah ?? "",
          toAyah: a.toAyah ?? "",
          ayahCount: a.surah?.ayahCount ?? 0,
        };
        if (a.kind === "MEMORIZE") memorize.push(row);
        else review.push(row);
      }
      return { memorize, review, homework: session.homework ?? "" };
    }

    if (selected) {
      return {
        studentId: selected.studentId ? String(selected.studentId) : "",
        title: selected.title ?? "",
        startsAt: toLocalInput(selected.startsAt),
        endsAt: toLocalInput(selected.endsAt),
        status: selected.status ?? "",
        subscriptionId: selected.subscriptionId ?? "",
        meetingLink: selected.meetingLink ?? "",
        notes: selected.notes ?? "",
        plan: buildPlanDefaults(selected),
      };
    }
    return { status: "SCHEDULED", studentId: "", plan: { memorize: [], review: [], homework: "" } };
  }, [selected]);

  const columns = useMemo(
    () => [
      {
        field: "student",
        headerName: txt.student,
        width: 200,
        renderCell: ({ row }) => (
          <Stack>
            <Typography fontWeight={700}>
              {row.student?.name ?? `#${row.studentId}`}
            </Typography>
            {row.student?.nickname && (
              <Typography variant="caption" color="text.secondary">
                {row.student.nickname}
              </Typography>
            )}
          </Stack>
        ),
      },
      {
        field: "title",
        headerName: txt.title,
        width: 200,
        renderCell: ({ row }) => row.title || txt.noTitle,
      },
      {
        field: "startsAt",
        headerName: txt.startsAt,
        width: 180,
        renderCell: ({ row }) => formatDateTime(row.startsAt, lng),
      },
      {
        field: "endsAt",
        headerName: txt.endsAt,
        width: 180,
        renderCell: ({ row }) => formatDateTime(row.endsAt, lng),
      },
      {
        field: "status",
        headerName: txt.status,
        width: 130,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            color={SESSION_STATUS_COLOR[row.status] || "default"}
            label={txt[row.status] || row.status}
          />
        ),
      },
      {
        field: "meetingLink",
        headerName: txt.meetingLink,
        width: 110,
        renderCell: ({ row }) =>
          row.meetingLink ? (
            <Button
              size="small"
              component="a"
              href={row.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<MdVideocam />}
            >
              {txt.join}
            </Button>
          ) : (
            "—"
          ),
      },
      {
        field: "actions",
        type: "actions",
        headerName: txt.actions,
        width: 140,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            {canEdit && (
              <Button size="small" startIcon={<MdEdit />} onClick={() => onEdit(row)}>
                {txt.edit}
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
      {
        type: "enum",
        key: "status",
        label: txt.status,
        options: { ALL: "ALL", ...statusOptions },
      },
    ],
    [txt, statusOptions],
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
        loading={mut.isPostRequestLoading || mut.isPutRequestLoading || planReq.isLoading}
        submitText={txt.save}
        cancelText={txt.cancel}
        onSubmit={() => document.getElementById("session-form")?.requestSubmit()}
      >
        <AppForm
          id="session-form"
          fields={fields}
          defaultValues={defaultValues}
          onSubmit={submit}
        />
      </FormDialog>
    </Box>
  );
}
