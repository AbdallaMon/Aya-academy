"use client";

import { FormControlLabel, FormHelperText, Switch } from "@mui/material";
import { Controller } from "react-hook-form";

// RHF-bound MUI Switch (boolean field).
export default function RHFSwitch({ name, control, label, rules, ...props }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <>
          <FormControlLabel
            label={label}
            control={
              <Switch
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                onBlur={field.onBlur}
                {...props}
              />
            }
          />
          {fieldState.error && (
            <FormHelperText error>{fieldState.error.message}</FormHelperText>
          )}
        </>
      )}
    />
  );
}
