"use client";

import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { useTranslation } from "../../../../i18n/client.js";

/**
 * RHF-bound MUI Select.
 *
 * Props:
 *   options       array of string values (e.g. ["MONTHLY", "YEARLY"]), or an
 *                 object MAP of value → label (e.g. { MONTHLY: "شهري" }). For an
 *                 enum-constant object (keys === values) both forms behave the
 *                 same. The submitted field value is always the value (the
 *                 object KEY), never the display label.
 *   translatePath optional i18n section to localize each option's display text.
 */
export default function RHFSelect({
  name,
  control,
  label,
  rules,
  options = [],
  translatePath,
  ...props
}) {
  const { t } = useTranslation();
  const optionTranslator = translatePath ? t(translatePath, { returnObjects: true }) || {} : {};

  // Normalise to [value, label] pairs. Array → value is also the fallback label;
  // object → key is the value and the object's value is the label. An explicit
  // translator (when provided) always wins for the label.
  const entries = Array.isArray(options)
    ? options.map((value) => [value, optionTranslator[value] || value])
    : Object.entries(options).map(([value, label]) => [
        value,
        optionTranslator[value] || label,
      ]);

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <FormControl fullWidth required={!!rules?.required} error={!!fieldState.error}>
          {label && <InputLabel>{label}</InputLabel>}
          <Select {...field} value={field.value ?? ""} label={label} {...props}>
            {entries.map(([value, optLabel]) => (
              <MenuItem key={value} value={value}>
                {optLabel}
              </MenuItem>
            ))}
          </Select>
          {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
}
