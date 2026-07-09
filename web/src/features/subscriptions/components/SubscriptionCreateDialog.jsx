"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { USERS_URL } from "../config/constant.js";

const FORM_ID = "subscription-create-form";

/** Current month as `YYYY-MM` (what a native month input expects/emits). */
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Admin-only: create a USAGE subscription for a student for ONE month. The form
 * asks ONLY for a month — the backend derives startDate (1st), endDate (last
 * day), origin (USAGE), and the hours/price from that month's logged sessions.
 *
 * When `lockedStudent` ({ id, name }) is provided (embedded in a user's detail
 * tab) the student is preset + shown read-only instead of the picker.
 */
export default function SubscriptionCreateDialog({
  open,
  onClose,
  onCreate,
  txt,
  loading,
  lockedStudent = null,
}) {
  const lockedStudentId = lockedStudent?.id ?? "";
  const defaultMonth = useMemo(() => currentMonth(), []);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: { studentId: lockedStudentId, month: defaultMonth },
  });

  const studentsReq = useRequest({
    url: USERS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: { limit: 100, role: "STUDENT" },
  });

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (open) {
      // No need to load the student picker when the student is locked.
      if (!lockedStudent) studentsReq.fetchData();
      reset({ studentId: lockedStudentId, month: defaultMonth });
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const students = (studentsReq.data || []).filter((u) => u.role === "STUDENT");

  function submit(values) {
    if (!values.studentId || !values.month) return;
    onCreate({
      studentId: Number(values.studentId),
      month: values.month, // "YYYY-MM"
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.createTitle}
      maxWidth="sm"
      loading={loading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {lockedStudent ? (
            <TextField
              label={txt.selectStudent}
              value={lockedStudent.name || `#${lockedStudent.id}`}
              fullWidth
              InputProps={{ readOnly: true }}
              disabled
            />
          ) : (
            <Controller
              name="studentId"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField {...field} select label={txt.selectStudent} fullWidth required>
                  {students.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} {s.nickname ? `(${s.nickname})` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}

          <Controller
            name="month"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <TextField
                {...field}
                type="month"
                label={txt.month}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            )}
          />

          <Typography variant="caption" color="text.secondary">
            {txt.monthHint}
          </Typography>
        </Stack>
      </form>
    </FormDialog>
  );
}
