"use client";

import { useEffect, useMemo, useState } from "react";
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
  RowActionsMenu,
  useConfirm,
} from "../../../shared/components/index.js";
import {
  REPORTS_URL,
  USERS_URL,
  toDateInput,
  studentLabel,
} from "../config/constant.js";
import { useReportsText } from "../config/reportsText.js";
import StudentsMultiSelect from "../components/StudentsMultiSelect.jsx";

export default function ReportsPage() {
  const txt = useReportsText();
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.REPORT.LIST);
  const canCreate = hasPermission(PERMISSIONS.REPORT.CREATE);
  const canEdit = hasPermission(PERMISSIONS.REPORT.EDIT);
  const canDelete = hasPermission(PERMISSIONS.REPORT.DELETE);

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
    url: REPORTS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: canList,
  });

  // Students for the create/edit picker — loaded lazily when the dialog opens.
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
    url: REPORTS_URL,
    onSuccess: () => triggerRefetch(),
  });

  useEffect(() => {
    if (form.isOpen && canCreate) studentsReq.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.isOpen]);

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
      title: values.title?.trim(),
      body: values.body,
      reportDate: values.reportDate || undefined,
      studentIds: (values.studentIds || []).map((id) => Number(id)),
    };
    if (selected?.id) await mut.putRequest(String(selected.id), payload);
    else await mut.postRequest(null, payload);
    form.close();
  }

  const fields = useMemo(
    () => [
      {
        name: "title",
        label: txt.titleLabel,
        type: "text",
        rules: { required: txt.required },
        gridSize: { xs: 12 },
      },
      {
        name: "studentIds",
        label: txt.studentsLabel,
        type: "custom",
        rules: {
          validate: (v) =>
            (Array.isArray(v) && v.length > 0) || txt.studentsRequired,
        },
        gridSize: { xs: 12 },
        component: (props) => (
          <StudentsMultiSelect
            {...props}
            options={students}
            loading={studentsReq.isLoading}
            placeholder={txt.selectStudents}
            loadingText={txt.loadingStudents}
          />
        ),
      },
      {
        name: "reportDate",
        label: txt.reportDateLabel,
        type: "date",
        InputLabelProps: { shrink: true },
        gridSize: { xs: 12, sm: 6 },
      },
      {
        name: "body",
        label: txt.bodyLabel,
        type: "textarea",
        rules: { required: txt.required },
        gridSize: { xs: 12 },
        minRows: 4,
      },
    ],
    [txt, students, studentsReq.isLoading],
  );

  const defaultValues = useMemo(() => {
    if (selected) {
      return {
        title: selected.title ?? "",
        body: selected.body ?? "",
        reportDate: toDateInput(selected.reportDate),
        studentIds: (selected.students || []).map((s) => s.studentId),
      };
    }
    return {
      title: "",
      body: "",
      reportDate: toDateInput(new Date()),
      studentIds: [],
    };
  }, [selected]);

  const columns = useMemo(
    () => [
      {
        field: "title",
        headerName: txt.title,
        width: 260,
        renderCell: ({ row }) => (
          <Typography fontWeight={700}>{row.title}</Typography>
        ),
      },
      {
        field: "students",
        headerName: txt.students,
        width: 280,
        renderCell: ({ row }) => {
          const list = row.students || [];
          if (!list.length) return txt.noStudents;
          const shown = list.slice(0, 2);
          const rest = list.length - shown.length;
          return (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {shown.map((s) => (
                <Chip
                  key={s.id}
                  size="small"
                  label={studentLabel(s.student)}
                />
              ))}
              {rest > 0 && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={txt.moreStudents.replace("{count}", rest)}
                />
              )}
            </Stack>
          );
        },
      },
      {
        field: "reportDate",
        headerName: txt.reportDate,
        width: 140,
        renderCell: ({ row }) =>
          row.reportDate
            ? new Date(row.reportDate).toLocaleDateString(
                lng === "en" ? "en-GB" : "ar-EG",
              )
            : "—",
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
    [txt, lng, canEdit, canDelete],
  );

  const filterConfig = useMemo(
    () => [{ type: "search", key: "search", label: txt.title }],
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

      <FormDialog
        open={form.isOpen}
        onClose={form.close}
        title={selected ? txt.editTitle : txt.createTitle}
        maxWidth="md"
        loading={mut.isPostRequestLoading || mut.isPutRequestLoading}
        submitText={txt.save}
        cancelText={txt.cancel}
        onSubmit={() => document.getElementById("report-form")?.requestSubmit()}
      >
        <AppForm
          id="report-form"
          fields={fields}
          defaultValues={defaultValues}
          onSubmit={submit}
        />
      </FormDialog>
    </Box>
  );
}
