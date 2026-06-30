"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Stack } from "@mui/material";
import {
  FormDialog,
  RHFTextField,
  RHFTextArea,
  applyApiErrorsToForm,
} from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { REPORTS_URL } from "../config/constant.js";

const FORM_ID = "send-report-form";

function makeDefaults() {
  return {
    title: "",
    body: "",
    reportDate: new Date().toISOString().slice(0, 10),
  };
}

/**
 * Send a report targeting a single, preselected student.
 *   POST reports { title, body, reportDate?, studentIds:[studentId] }
 */
export default function SendReportDialog({ open, onClose, studentId, studentName, txt, onSuccess }) {
  const { showToast } = useToast();
  const { control, handleSubmit, reset, setError } = useForm({
    defaultValues: makeDefaults(),
  });

  useEffect(() => {
    if (open) reset(makeDefaults());
  }, [open, reset]);

  const createReq = useRequest({
    url: REPORTS_URL,
    method: "post",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => {
      onSuccess?.();
      onClose?.();
    },
    onError: (err) =>
      applyApiErrorsToForm(err, setError, {
        labelMap: {
          title: txt.reportTitleLabel,
          body: txt.reportBodyLabel,
          reportDate: txt.reportDateLabel,
        },
        showToast,
        suppressFallbackToast: true,
      }),
  });

  function submit(values) {
    createReq.fetchData(null, {
      title: values.title.trim(),
      body: values.body,
      reportDate: values.reportDate || undefined,
      studentIds: [Number(studentId)],
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.reportTitle}
      subtitle={studentName}
      maxWidth="sm"
      loading={createReq.isLoading}
      submitText={txt.send}
      cancelText={txt.cancel}
      onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <RHFTextField
            name="title"
            control={control}
            label={txt.reportTitleLabel}
            rules={{ validate: (v) => v?.trim() !== "" || txt.required }}
          />
          <RHFTextField
            name="reportDate"
            control={control}
            label={txt.reportDateLabel}
            type="date"
            InputLabelProps={{ shrink: true }}
          />
          <RHFTextArea
            name="body"
            control={control}
            label={txt.reportBodyLabel}
            minRows={4}
            rules={{ validate: (v) => v?.trim() !== "" || txt.required }}
          />
        </Stack>
      </form>
    </FormDialog>
  );
}
