"use client";

// Small dialog to adjust a subscription's REMAINING hours only. The paid
// subscription hours (subsHours) are no longer editable here — they're derived
// from the plan / logged sessions on the server. This dialog only lets you
// correct the remaining balance. Controlled-only: it owns the field and hands a
// clean `{ remainingHours }` payload back via onSubmit; each caller wires its own
// PUT request.

import { useState } from "react";
import { Stack, TextField, Typography } from "@mui/material";
import { FormDialog } from "../../../shared/components/index.js";
import { formatDurationMinutes } from "../../../shared/lib/money.js";
import { useTranslation } from "../../../i18n/client.js";

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
  const { lng } = useTranslation();
  const [remainingMinutes, setRemainingMinutes] = useState("");
  const [seededFor, setSeededFor] = useState(null);

  // Reseed the field when the dialog opens (or switches to a different
  // subscription) using React's "adjust state during render" pattern — an
  // effect here trips the project's set-state-in-effect rule.
  const target = open ? (initial?.id ?? "new") : null;
  if (target !== seededFor) {
    setSeededFor(target);
    if (open) setRemainingMinutes(toField(initial?.remainingMinutes));
  }

  // subsHours stays the read-only ceiling: remaining can't exceed the
  // subscription's total invoice hours. We read it, but never edit it.
  const subsNum =
    initial?.subsMinutes === null || initial?.subsMinutes === undefined
      ? null
      : Number(initial.subsMinutes);
  const remainingNum =
    remainingMinutes === "" ? null : Number(remainingMinutes);
  const exceeds =
    subsNum !== null && remainingNum !== null && remainingNum > subsNum;
  const invalid =
    remainingNum !== null &&
    (!Number.isInteger(remainingNum) || remainingNum < 0);

  async function handleSubmit() {
    if (exceeds || invalid || remainingMinutes === "") return;
    await onSubmit({ remainingMinutes: Number(remainingMinutes) });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.editRemainingTitle || txt.editHoursTitle}
      maxWidth="xs"
      loading={loading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={handleSubmit}
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label={txt.remainingHoursLabel || txt.remainingHours}
          type="number"
          value={remainingMinutes}
          onChange={(e) => setRemainingMinutes(e.target.value)}
          fullWidth
          inputProps={{ min: 0, max: subsNum ?? undefined, step: 1 }}
          error={exceeds || invalid}
          helperText={
            exceeds
              ? txt.remainingExceedsSubs
              : invalid
                ? txt.remainingMinutesInvalid
                : txt.remainingHoursHint
          }
        />
        {subsNum !== null && (
          <Typography variant="caption" color="text.secondary">
            {txt.subsHours}: {formatDurationMinutes(subsNum, lng)}
          </Typography>
        )}
      </Stack>
    </FormDialog>
  );
}
