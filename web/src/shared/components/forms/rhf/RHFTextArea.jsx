"use client";

import { TextField } from "@mui/material";
import { Controller } from "react-hook-form";

// RHF-bound multiline TextField.
export default function RHFTextArea({ name, control, label, rules, minRows = 3, ...props }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value ?? ""}
          label={label}
          fullWidth
          multiline
          minRows={minRows}
          required={!!rules?.required}
          error={!!fieldState.error}
          sx={{ maxHeight: 300, overflowY: "auto" }}
          {...props}
          helperText={props.helperText || fieldState.error?.message}
        />
      )}
    />
  );
}
