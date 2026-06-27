"use client";

import { MuiTelInput } from "mui-tel-input";
import { Controller } from "react-hook-form";

/**
 * RHF-bound international phone input (mui-tel-input) with country-code picker.
 * The stored value is the full international number (e.g. "+20 100 123 4567").
 *
 * Props:
 *   defaultCountry  ISO country shown first / used when no code is typed (default "EG").
 */
export default function RHFPhoneField({
  name,
  control,
  label,
  rules,
  defaultCountry = "EG",
  ...props
}) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <MuiTelInput
          {...field}
          value={field.value ?? ""}
          onChange={(value) => field.onChange(value)}
          label={label}
          defaultCountry={defaultCountry}
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
