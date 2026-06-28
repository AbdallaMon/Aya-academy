"use client";

import { useEffect, useState } from "react";
import { Checkbox, FormControlLabel } from "@mui/material";
import { ConfirmDialog } from "../../../shared/components/index.js";

/**
 * A confirm dialog with one extra checkbox option. The imperative useConfirm()
 * can't carry custom content, so we drive the shared ConfirmDialog directly and
 * use its `children` slot for the checkbox — same look/feel as every other
 * confirm, just with a single boolean toggle.
 *
 * onConfirm receives the checkbox value. Props:
 *   open, title, checkboxLabel, confirmText, cancelText, intent, loading,
 *   onCancel, onConfirm(checked).
 */
export default function ConfirmWithCheckbox({
  open,
  title,
  checkboxLabel,
  confirmText,
  cancelText,
  intent = "success",
  loading = false,
  onCancel,
  onConfirm,
}) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setChecked(false);
  }, [open]);

  return (
    <ConfirmDialog
      open={open}
      intent={intent}
      title={title}
      confirmText={confirmText}
      cancelText={cancelText}
      loading={loading}
      onCancel={onCancel}
      onConfirm={() => onConfirm(checked)}
    >
      <FormControlLabel
        sx={{ mt: 1 }}
        control={
          <Checkbox
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            disabled={loading}
          />
        }
        label={checkboxLabel}
      />
    </ConfirmDialog>
  );
}
