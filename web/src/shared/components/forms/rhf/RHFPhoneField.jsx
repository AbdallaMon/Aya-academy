"use client";

import { MuiTelInput } from "mui-tel-input";
import { Controller } from "react-hook-form";
import { useBrowserCountry } from "../../../lib/browserCountry.js";

/**
 * RHF-bound international phone input (mui-tel-input) with country-code picker.
 * The stored value is the full international number (e.g. "+20 100 123 4567").
 *
 * No hardcoded default country: the initial country is guessed from the
 * browser (locale → region) and the user can change it via the flag dropdown.
 * When editing an existing value the country is derived from the number itself.
 */
export default function RHFPhoneField({ name, control, label, rules, ...props }) {
  const country = useBrowserCountry();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <MuiTelInput
          // Remount once the browser resolves a country so the empty-state flag
          // reflects it (mui-tel-input only reads defaultCountry on mount).
          key={country ?? "pending"}
          {...field}
          value={field.value ?? ""}
          onChange={(value) => field.onChange(value)}
          label={label}
          defaultCountry={country}
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
