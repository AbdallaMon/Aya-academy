"use client";

import { useEffect, useState } from "react";
import { Stack, TextField, Typography } from "@mui/material";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { REPORTS_URL } from "../config/constant.js";

/**
 * Send a report targeting a single, preselected student.
 *   POST reports { title, body, reportDate?, studentIds:[studentId] }
 */
export default function SendReportDialog({ open, onClose, studentId, studentName, txt, onSuccess }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

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
  });

  useEffect(() => {
    if (open) {
      setTitle("");
      setBody("");
      setReportDate(new Date().toISOString().slice(0, 10));
      setError("");
    }
  }, [open]);

  function submit() {
    setError("");
    if (!title.trim() || !body.trim()) {
      setError(txt.required);
      return;
    }
    createReq.fetchData(null, {
      title: title.trim(),
      body,
      reportDate: reportDate || undefined,
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
      onSubmit={submit}
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        {error && (
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
        )}
        <TextField
          label={txt.reportTitleLabel}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          required
        />
        <TextField
          type="date"
          label={txt.reportDateLabel}
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          label={txt.reportBodyLabel}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          fullWidth
          multiline
          minRows={4}
          required
        />
      </Stack>
    </FormDialog>
  );
}
