"use client";

import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdAdd, MdDelete } from "react-icons/md";
import { Controller, useFieldArray } from "react-hook-form";

/**
 * OptionsEditor — dynamic options sub-form bound to a parent RHF form.
 *
 * Props:
 *   control, register   from the parent useForm()
 *   name                field-array path (e.g. "options" or "customs.0.options")
 *   txt                 bilingual labels
 *   error               optional string shown under the list (min-rules)
 */
export default function OptionsEditor({ control, name, txt, error }) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          {txt.optionsTitle}
        </Typography>
        <Button
          size="small"
          startIcon={<MdAdd />}
          onClick={() =>
            append({ labelAr: "", labelEn: "", isCorrect: false })
          }
        >
          {txt.addOption}
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        {txt.optionsHint}
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        {fields.map((field, idx) => (
          <Stack
            key={field.id}
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexWrap: "wrap" }}
          >
            <Controller
              name={`${name}.${idx}.labelAr`}
              control={control}
              rules={{ required: txt.required }}
              render={({ field: f, fieldState }) => (
                <TextField
                  {...f}
                  value={f.value ?? ""}
                  size="small"
                  label={txt.optionArLabel}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ flex: 1, minWidth: 180 }}
                />
              )}
            />
            <Controller
              name={`${name}.${idx}.labelEn`}
              control={control}
              rules={{ required: txt.required }}
              render={({ field: f, fieldState }) => (
                <TextField
                  {...f}
                  value={f.value ?? ""}
                  size="small"
                  label={txt.optionEnLabel}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ flex: 1, minWidth: 180 }}
                />
              )}
            />
            <Controller
              name={`${name}.${idx}.isCorrect`}
              control={control}
              render={({ field: f }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!f.value}
                      onChange={(e) => f.onChange(e.target.checked)}
                    />
                  }
                  label={txt.correct}
                />
              )}
            />
            <IconButton
              color="error"
              aria-label={txt.removeOption}
              onClick={() => remove(idx)}
            >
              <MdDelete />
            </IconButton>
          </Stack>
        ))}
      </Stack>

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
