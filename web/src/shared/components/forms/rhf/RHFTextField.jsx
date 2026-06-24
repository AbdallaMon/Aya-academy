"use client";

import { TextField } from "@mui/material";
import { Controller } from "react-hook-form";

// RHF-bound MUI TextField. Pass `control` from useForm and a `name`.
export default function RHFTextField({ name, control, label, rules, ...props }) {
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
          required={!!rules?.required}
          error={!!fieldState.error}
          {...props}
          helperText={props.helperText || fieldState.error?.message}
        />
      )}
    />
  );
}
