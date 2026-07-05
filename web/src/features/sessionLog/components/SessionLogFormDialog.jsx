"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Grid } from "@mui/material";
import {
  SESSION_ATTENDANCE,
  SESSION_RATING_ORDER,
} from "@aya/shared";
import {
  FormDialog,
  RHFTextField,
  RHFTextArea,
  RHFSelect,
  applyApiErrorsToForm,
} from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import {
  SESSION_LOGS_URL,
  USERS_URL,
  toDateInput,
  studentLabel,
} from "../config/constant.js";
import { useSessionLogText } from "../config/sessionLogText.js";
import SubjectsMultiSelect from "./SubjectsMultiSelect.jsx";

const FORM_ID = "session-log-form";

function makeDefaults(session) {
  if (session) {
    return {
      studentId: session.student?.id != null ? String(session.student.id) : "",
      subjects: Array.isArray(session.subjectsJson) ? session.subjectsJson : [],
      durationHours: session.durationHours ?? "",
      rating: session.rating ?? "",
      report: session.report ?? "",
      teacherId: session.teacher?.id != null ? String(session.teacher.id) : "",
      sessionDate: toDateInput(session.sessionDate),
      attendance: session.attendance ?? SESSION_ATTENDANCE.PRESENT,
    };
  }
  return {
    studentId: "",
    subjects: [],
    durationHours: "",
    rating: "",
    report: "",
    teacherId: "",
    sessionDate: toDateInput(new Date()),
    attendance: SESSION_ATTENDANCE.PRESENT,
  };
}

/**
 * Create/edit dialog for a session log (admin only). Students + teachers are
 * loaded lazily when the dialog opens (users?role=STUDENT / users?role=ADMIN).
 */
export default function SessionLogFormDialog({ open, onClose, session = null, onSaved }) {
  const txt = useSessionLogText();
  const { showToast } = useToast();
  const isEdit = Boolean(session?.id);

  const { control, handleSubmit, reset, setError } = useForm({
    defaultValues: makeDefaults(session),
  });

  const studentsReq = useRequest({
    url: USERS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: { limit: 100, role: "STUDENT" },
  });
  const teachersReq = useRequest({
    url: USERS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: { limit: 100, role: "ADMIN" },
  });

  useEffect(() => {
    if (!open) return;
    reset(makeDefaults(session));
    studentsReq.fetchData();
    teachersReq.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session, reset]);

  const studentOptions = useMemo(() => {
    const map = {};
    (studentsReq.data || []).forEach((u) => {
      map[String(u.id)] = studentLabel(u);
    });
    return map;
  }, [studentsReq.data]);

  const teacherOptions = useMemo(() => {
    const map = { "": txt.selectTeacher };
    (teachersReq.data || []).forEach((u) => {
      map[String(u.id)] = studentLabel(u);
    });
    return map;
  }, [teachersReq.data, txt]);

  const ratingOptions = useMemo(() => {
    const map = { "": txt.noRating };
    SESSION_RATING_ORDER.forEach((r) => {
      map[r] = txt[r] || r;
    });
    return map;
  }, [txt]);

  const attendanceOptions = useMemo(
    () => ({
      [SESSION_ATTENDANCE.PRESENT]: txt.PRESENT,
      [SESSION_ATTENDANCE.ABSENT]: txt.ABSENT,
    }),
    [txt],
  );

  const { fetchData, isLoading } = useRequest({
    url: SESSION_LOGS_URL,
    method: isEdit ? "put" : "post",
    shouldAutoToast: true,
    onSuccess: () => {
      onSaved?.();
      onClose?.();
    },
    onError: (err) =>
      applyApiErrorsToForm(err, setError, {
        labelMap: {
          studentId: txt.studentLabel,
          subjects: txt.subjectsLabel,
          durationHours: txt.durationLabel,
          rating: txt.ratingLabel,
          report: txt.reportLabel,
          teacherId: txt.teacherLabel,
          sessionDate: txt.sessionDateLabel,
          attendance: txt.attendanceLabel,
        },
        showToast,
        suppressFallbackToast: true,
      }),
  });

  function submit(values) {
    const payload = {
      studentId: Number(values.studentId),
      subjects: values.subjects || [],
      durationHours: Number(values.durationHours),
      rating: values.rating || undefined,
      report: values.report?.trim() || undefined,
      attendance: values.attendance,
      teacherId: values.teacherId ? Number(values.teacherId) : undefined,
      sessionDate: values.sessionDate || undefined,
    };
    fetchData(isEdit ? String(session.id) : null, payload);
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? txt.editTitle : txt.createTitle}
      maxWidth="md"
      loading={isLoading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFSelect
              name="studentId"
              control={control}
              label={txt.studentLabel}
              options={studentOptions}
              rules={{ required: txt.required }}
              disabled={studentsReq.isLoading}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField
              name="sessionDate"
              control={control}
              label={txt.sessionDateLabel}
              type="date"
              InputLabelProps={{ shrink: true }}
              rules={{ required: txt.required }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <SubjectsMultiSelect
              name="subjects"
              control={control}
              label={txt.subjectsLabel}
              labels={txt}
              placeholder={txt.selectSubjects}
              rules={{
                validate: (v) =>
                  (Array.isArray(v) && v.length > 0) || txt.subjectsRequired,
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField
              name="durationHours"
              control={control}
              label={txt.durationLabel}
              type="number"
              inputProps={{ step: "0.5", min: "0" }}
              rules={{
                required: txt.required,
                validate: (v) => Number(v) > 0 || txt.durationInvalid,
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFSelect
              name="attendance"
              control={control}
              label={txt.attendanceLabel}
              options={attendanceOptions}
              rules={{ required: txt.required }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFSelect
              name="rating"
              control={control}
              label={txt.ratingLabel}
              options={ratingOptions}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFSelect
              name="teacherId"
              control={control}
              label={txt.teacherLabel}
              options={teacherOptions}
              disabled={teachersReq.isLoading}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <RHFTextArea
              name="report"
              control={control}
              label={txt.reportLabel}
              minRows={3}
            />
          </Grid>
        </Grid>
      </form>
    </FormDialog>
  );
}
