"use client";

// Small dialog to adjust a subscription's hours: paid subscription hours and
// remaining. Used from the subscriptions list page. Controlled-only: it owns the
// form fields and hands a clean payload back via onSubmit; each caller wires its
// own PUT request. The server recomputes priceCharged from subsHours on save
// (price = subsHours × hourlyRate), so we don't compute the price here.

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
  const [subsHours, setSubsHours] = useState("");
  const [remainingHours, setRemainingHours] = useState("");
  const [seededFor, setSeededFor] = useState(null);

  // Reseed the fields when the dialog opens (or switches to a different
  // subscription) using React's "adjust state during render" pattern — an
  // effect here trips the project's set-state-in-effect rule.
  const target = open ? (initial?.id ?? "new") : null;
  if (target !== seededFor) {
    setSeededFor(target);
    if (open) {
      const subsVal = toField(initial?.subsHours);
      setSubsHours(subsVal);
      // Remaining inherits from subs hours: with no existing remaining value,
      // default it to the subs hours so a fresh edit starts "full".
      const hasRemaining =
        initial?.remainingHours !== null &&
        initial?.remainingHours !== undefined;
      setRemainingHours(hasRemaining ? toField(initial.remainingHours) : subsVal);
    }
  }

  const subsNum = subsHours === "" ? null : Number(subsHours);
  // A blank remaining inherits the subs hours value.
  const effectiveRemaining = remainingHours === "" ? subsHours : remainingHours;
  const remainingNum =
    effectiveRemaining === "" ? null : Number(effectiveRemaining);
  const exceeds =
    subsNum !== null && remainingNum !== null && remainingNum > subsNum;

  async function handleSubmit() {
    if (exceeds) return;
    const payload = {};
    if (subsHours !== "") payload.subsHours = Number(subsHours);
    if (effectiveRemaining !== "")
      payload.remainingHours = Number(effectiveRemaining);
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
          label={txt.subsHours}
          type="number"
          value={subsHours}
          onChange={(e) => setSubsHours(e.target.value)}
          fullWidth
          inputProps={{ min: 0 }}
          helperText={txt.subsHoursHint}
        />
        <TextField
          label={txt.remainingHours}
          type="number"
          value={remainingHours}
          onChange={(e) => setRemainingHours(e.target.value)}
          fullWidth
          inputProps={{ min: 0 }}
          error={exceeds}
          helperText={exceeds ? txt.remainingExceedsSubs : undefined}
        />
      </Stack>
    </FormDialog>
  );
}
