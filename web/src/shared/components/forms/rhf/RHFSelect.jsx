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
 *   options       array of strings, or an object whose VALUES are the options
 *                 (e.g. an enum constant like SUBSCRIPTION_STATUSES).
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

  const items = Array.isArray(options) ? options : Object.values(options);

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <FormControl fullWidth required={!!rules?.required} error={!!fieldState.error}>
          {label && <InputLabel>{label}</InputLabel>}
          <Select {...field} value={field.value ?? ""} label={label} {...props}>
            {items.map((item) => (
              <MenuItem key={item} value={item}>
                {optionTranslator[item] || item}
              </MenuItem>
            ))}
          </Select>
          {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
        </FormControl>
      )}
    />
  );
}
