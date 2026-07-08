"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Box, CircularProgress, Grid, Stack } from "@mui/material";
import { PERMISSIONS } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import {
  DataTable,
  EmptyState,
  FormDialog,
  PageHeader,
  RHFTextArea,
  RHFTextField,
  applyApiErrorsToForm,
  useConfirm,
} from "../../../shared/components/index.js";
import { REPORTS_URL, USERS_URL, toDateInput } from "../config/constant.js";
import { useReportsText } from "../config/reportsText.js";
import { buildReportsColumns } from "../config/reportsColumns.js";
import { buildReportsFilters } from "../config/reportsFilters.js";
import StudentsMultiSelect from "../components/StudentsMultiSelect.jsx";
import ReportCard from "../components/ReportCard.jsx";

const FORM_ID = "report-form";

export default function ReportsPage() {
  const txt = useReportsText();
  const { lng } = useTranslation();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const canList = hasPermission(PERMISSIONS.REPORT.LIST);
  const canCreate = hasPermission(PERMISSIONS.REPORT.CREATE);
  const canEdit = hasPermission(PERMISSIONS.REPORT.EDIT);
  const canDelete = hasPermission(PERMISSIONS.REPORT.DELETE);
  // Management = anyone who can author/manage reports (admin/manager). Parents
  // hold only LIST/VIEW, so they get the read-only card grid instead of the table.
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
  const isEdit = Boolean(selected?.id);

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

  const { control, handleSubmit, reset, setError } = useForm({
    defaultValues,
    mode: "onTouched",
  });

  useEffect(() => {
    reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, JSON.stringify(defaultValues)]);

  const mut = useMultiRequest({
    url: REPORTS_URL,
    onSuccess: () => triggerRefetch(),
  });

  const formMut = useRequest({
    url: REPORTS_URL,
    method: isEdit ? "put" : "post",
    shouldAutoToast: true,
    onSuccess: () => {
      triggerRefetch();
      form.close();
    },
    onError: (err) =>
      applyApiErrorsToForm(err, setError, {
        labelMap: {
          title: txt.titleLabel,
          body: txt.bodyLabel,
          reportDate: txt.reportDateLabel,
          studentIds: txt.studentsLabel,
        },
        showToast,
        suppressFallbackToast: true,
      }),
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

  function submit(values) {
    const payload = {
      title: values.title?.trim(),
      body: values.body,
      reportDate: values.reportDate || undefined,
      studentIds: (values.studentIds || []).map((id) => Number(id)),
    };
    formMut.fetchData(isEdit ? String(selected.id) : null, payload);
  }

  const columns = useMemo(
    () =>
      buildReportsColumns({
        txt,
        lng,
        can: { edit: canEdit, delete: canDelete },
        actions: { onEdit, onDelete },
      }),
    [txt, lng, canEdit, canDelete],
  );

  const filterConfig = useMemo(
    () => buildReportsFilters({ txt }),
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
          filterConfig={filterConfig}
          noContainer
        />
      ) : (
        <ParentReportsGrid
          reports={data || []}
          isLoading={isLoading}
          txt={txt}
        />
      )}

      <FormDialog
        open={form.isOpen}
        onClose={form.close}
        title={selected ? txt.editTitle : txt.createTitle}
        maxWidth="md"
        loading={formMut.isLoading}
        submitText={txt.save}
        cancelText={txt.cancel}
        onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
      >
        <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <RHFTextField
                name="title"
                control={control}
                label={txt.titleLabel}
                rules={{ required: txt.required }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <StudentsMultiSelect
                name="studentIds"
                control={control}
                label={txt.studentsLabel}
                rules={{
                  validate: (v) =>
                    (Array.isArray(v) && v.length > 0) || txt.studentsRequired,
                }}
                options={students}
                loading={studentsReq.isLoading}
                placeholder={txt.selectStudents}
                loadingText={txt.loadingStudents}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField
                name="reportDate"
                control={control}
                label={txt.reportDateLabel}
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <RHFTextArea
                name="body"
                control={control}
                label={txt.bodyLabel}
                rules={{ required: txt.required }}
                minRows={4}
              />
            </Grid>
          </Grid>
        </form>
      </FormDialog>
    </Box>
  );
}

// Parent (read-only) view: a responsive card grid of reports, each linking to
// the detail page. Handles the loading + empty states gracefully.
function ParentReportsGrid({ reports, isLoading, txt }) {
  if (isLoading && !reports.length) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!reports.length) {
    return (
      <EmptyState
        title={txt.emptyTitle}
        body={txt.emptyBody}
        icon={<Box sx={{ fontSize: 48 }}>📋</Box>}
      />
    );
  }

  return (
    <Grid container spacing={2.5}>
      {reports.map((report) => (
        <Grid key={report.id} size={{ xs: 12, sm: 6, lg: 4 }}>
          <ReportCard report={report} txt={txt} />
        </Grid>
      ))}
    </Grid>
  );
}
