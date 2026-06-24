"use client";

import {
  Box,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { studentLabel } from "../config/constant.js";

/**
 * RHF-bound multi-select of students. Mounted as an AppForm `type:"custom"`
 * field — AppForm passes { control, name, label, rules }. The field VALUE is an
 * array of numeric student ids (exactly what createReportSchema.studentIds wants).
 *
 *   options  Array<{ id, name, nickname }>
 *   loading  shows a disabled "loading…" placeholder
 */
export default function StudentsMultiSelect({
  control,
  name,
  label,
  rules,
  options = [],
  loading = false,
  placeholder,
  loadingText,
}) {
  const byId = new Map(options.map((s) => [s.id, s]));

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const value = Array.isArray(field.value) ? field.value : [];
        return (
          <FormControl
            fullWidth
            required={!!rules?.required}
            error={!!fieldState.error}
          >
            {label && <InputLabel shrink>{label}</InputLabel>}
            <Select
              multiple
              displayEmpty
              notched
              disabled={loading}
              label={label}
              value={value}
              onChange={(e) => {
                const v = e.target.value;
                field.onChange(
                  (Array.isArray(v) ? v : [v]).map((id) => Number(id)),
                );
              }}
              onBlur={field.onBlur}
              renderValue={(selected) => {
                if (loading) return loadingText;
                if (!selected || selected.length === 0) return placeholder;
                return (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((id) => (
                      <Chip
                        key={id}
                        size="small"
                        label={studentLabel(byId.get(Number(id))) || id}
                      />
                    ))}
                  </Box>
                );
              }}
            >
              {options.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {studentLabel(s)}
                </MenuItem>
              ))}
            </Select>
            {fieldState.error && (
              <FormHelperText>{fieldState.error.message}</FormHelperText>
            )}
          </FormControl>
        );
      }}
    />
  );
}
