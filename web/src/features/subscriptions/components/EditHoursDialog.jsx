"use client";

// Small dialog to adjust a subscription's hours: total and remaining. Used from
// both the subscriptions list page and the student-detail subscriptions tab.
// Controlled-only: it owns the form fields and hands a clean payload back via
// onSubmit; each caller wires its own PUT request.

import { useState } from "react";
import { Stack, TextField } from "@mui/material";
import { FormDialog } from "../../../shared/components/index.js";

function toField(value) {
  return value === null || value === undefined ? "" : String(value);
}

export default function EditHoursDialog({
  open,
  onClose,
  txt,
  initial,
  loading,
  onSubmit,
}) {
  const [totalHours, setTotalHours] = useState("");
  const [remainingHours, setRemainingHours] = useState("");
  const [seededFor, setSeededFor] = useState(null);

  // Reseed the fields when the dialog opens (or switches to a different
  // subscription) using React's "adjust state during render" pattern — an
  // effect here trips the project's set-state-in-effect rule.
  const target = open ? (initial?.id ?? "new") : null;
  if (target !== seededFor) {
    setSeededFor(target);
    if (open) {
      setTotalHours(toField(initial?.totalHours));
      setRemainingHours(toField(initial?.remainingHours));
    }
  }

  const totalNum = totalHours === "" ? null : Number(totalHours);
  const remainingNum = remainingHours === "" ? null : Number(remainingHours);
  const exceeds =
    totalNum !== null && remainingNum !== null && remainingNum > totalNum;

  async function handleSubmit() {
    if (exceeds) return;
    const payload = {};
    if (totalHours !== "") payload.totalHours = Number(totalHours);
    if (remainingHours !== "") payload.remainingHours = Number(remainingHours);
    await onSubmit(payload);
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.editHoursTitle}
      maxWidth="xs"
      loading={loading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={handleSubmit}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label={txt.totalHours}
          type="number"
          value={totalHours}
          onChange={(e) => setTotalHours(e.target.value)}
          fullWidth
          inputProps={{ min: 0 }}
        />
        <TextField
          label={txt.remainingHours}
          type="number"
          value={remainingHours}
          onChange={(e) => setRemainingHours(e.target.value)}
          fullWidth
          inputProps={{ min: 0 }}
          error={exceeds}
          helperText={exceeds ? txt.remainingExceedsTotal : undefined}
        />
      </Stack>
    </FormDialog>
  );
}
