"use client";

import { useState } from "react";
import { Controller } from "react-hook-form";
import { AsyncUserAutocomplete } from "../../../shared/components/index.js";

/**
 * RHF-bound multi-select of students. Mounted directly in a manual react-hook-form
 * with { control, name, label, rules }. The field VALUE is an array of numeric
 * student ids (exactly what createReportSchema.studentIds wants).
 *
 *   options  Array<{ id, name, nickname }>
 *   loading  shows a disabled "loading…" placeholder
 */
export default function StudentsMultiSelect({
  control,
  name,
  label,
  rules,
  initialOptions = [],
  placeholder,
}) {
  const [selectedStudents, setSelectedStudents] = useState(initialOptions);

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        return (
          <AsyncUserAutocomplete
            multiple
            role="STUDENT"
            label={label}
            placeholder={placeholder}
            value={selectedStudents}
            onChange={(students) => {
              setSelectedStudents(students);
              field.onChange((students || []).map((student) => Number(student.id)));
            }}
            required={!!rules?.required}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        );
      }}
    />
  );
}
