"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Grid } from "@mui/material";
import {
  SESSION_ATTENDANCE,
  SESSION_RATING_ORDER,
} from "@aya/shared";
import {
  FormDialog,
  AsyncUserAutocomplete,
  RHFTextField,
  RHFTextArea,
  RHFSelect,
  applyApiErrorsToForm,
} from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import {
  SESSION_LOGS_URL,
  toDateInput,
} from "../config/constant.js";
import { useSessionLogText } from "../config/sessionLogText.js";
import SubjectsMultiSelect from "./SubjectsMultiSelect.jsx";

const FORM_ID = "session-log-form";

function makeDefaults(session) {
  if (session) {
    return {
      studentId: session.student?.id != null ? String(session.student.id) : "",
      subjects: Array.isArray(session.subjectsJson) ? session.subjectsJson : [],
      durationMinutes: session.durationMinutes ?? "",
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
    durationMinutes: "",
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
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [previousDialog, setPreviousDialog] = useState({
    open,
    sessionId: session?.id ?? null,
  });

  // Reset picker values exactly when this dialog is opened for a different
  // session. Keeping this in render avoids a cascading state update effect.
  if (
    open !== previousDialog.open ||
    (open && (session?.id ?? null) !== previousDialog.sessionId)
  ) {
    setPreviousDialog({ open, sessionId: session?.id ?? null });
    if (open) {
      setSelectedStudent(session?.student || null);
      setSelectedTeacher(session?.teacher || null);
    }
  }

  useEffect(() => {
    if (!open) return;
    reset(makeDefaults(session));
  }, [open, session, reset]);

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
          durationMinutes: txt.durationLabel,
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
      durationMinutes: Number(values.durationMinutes),
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
            <Controller
              name="studentId"
              control={control}
              rules={{ required: txt.required }}
              render={({ field, fieldState }) => (
                <AsyncUserAutocomplete
                  role="STUDENT"
                  label={txt.studentLabel}
                  value={selectedStudent}
                  onChange={(student) => {
                    field.onChange(student ? String(student.id) : "");
                    setSelectedStudent(student);
                  }}
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
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
              name="durationMinutes"
              control={control}
              label={txt.durationLabel}
              type="number"
              inputProps={{ step: "1", min: "1", max: "1440" }}
              helperText={txt.durationHint}
              rules={{
                required: txt.required,
                validate: (v) =>
                  (Number.isInteger(Number(v)) &&
                    Number(v) > 0 &&
                    Number(v) <= 1440) ||
                  txt.durationInvalid,
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
            <Controller
              name="teacherId"
              control={control}
              render={({ field }) => (
                <AsyncUserAutocomplete
                  role="ADMIN"
                  label={txt.teacherLabel}
                  value={selectedTeacher}
                  onChange={(teacher) => {
                    field.onChange(teacher ? String(teacher.id) : "");
                    setSelectedTeacher(teacher);
                  }}
                  placeholder={txt.selectTeacher}
                />
              )}
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
