"use client";

import {
  Box,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { SESSION_SUBJECT_GROUPS } from "@ayah/shared";

/**
 * RHF-bound, grouped multi-select of session subjects. The field VALUE is an
 * array of subject enum KEYS (strings) — exactly what the API's `subjects[]`
 * wants. Options are grouped by SESSION_SUBJECT_GROUPS, each group rendered under
 * a non-selectable ListSubheader.
 *
 *   labels   the useSessionLogText() map (subject/group keys → localized labels)
 */
export default function SubjectsMultiSelect({
  control,
  name,
  label,
  rules,
  labels = {},
  placeholder,
}) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const value = Array.isArray(field.value) ? field.value : [];
        return (
          <FormControl fullWidth required={!!rules?.required} error={!!fieldState.error}>
            {label && <InputLabel shrink>{label}</InputLabel>}
            <Select
              multiple
              displayEmpty
              notched
              label={label}
              value={value}
              onChange={(e) => {
                const v = e.target.value;
                field.onChange(Array.isArray(v) ? v : [v]);
              }}
              onBlur={field.onBlur}
              renderValue={(selected) => {
                if (!selected || selected.length === 0) return placeholder;
                return (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((key) => (
                      <Chip key={key} size="small" label={labels[key] || key} />
                    ))}
                  </Box>
                );
              }}
            >
              {SESSION_SUBJECT_GROUPS.flatMap((group) => [
                <ListSubheader key={`group-${group.key}`} disableSticky>
                  {labels[group.key] || group.key}
                </ListSubheader>,
                ...group.subjects.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {labels[subject] || subject}
                  </MenuItem>
                )),
              ])}
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
