"use client";

import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdAdd, MdDelete } from "react-icons/md";
import { Controller, useFieldArray } from "react-hook-form";
import OptionsEditor from "../../quizBank/components/OptionsEditor.jsx";
import { emptyCustomQuestion } from "../config/constant.js";

/**
 * Parent-authored custom questions. Bound to the page's RHF form under
 * `customs` (array of { textAr, textEn, options[] }). Reuses OptionsEditor.
 */
export default function CustomQuestionsSection({ control, txt }) {
  const { fields, append, remove } = useFieldArray({ control, name: "customs" });

  // Localized labels reused by OptionsEditor (it reads txt.optionsTitle etc.).
  const optionTxt = {
    optionsTitle: txt.optionsTitle,
    optionsHint: txt.optionsHint,
    optionArLabel: txt.optionArLabel,
    optionEnLabel: txt.optionEnLabel,
    correct: txt.correct,
    addOption: txt.addOption,
    removeOption: txt.removeOption,
    required: txt.required,
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {txt.customTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {txt.customHint}
          </Typography>
        </Box>
        <Button
          startIcon={<MdAdd />}
          onClick={() => append(emptyCustomQuestion())}
        >
          {txt.addCustom}
        </Button>
      </Stack>

      <Stack spacing={2} sx={{ mt: 1 }}>
        {fields.map((field, idx) => (
          <Box
            key={field.id}
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1.5 }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                #{idx + 1}
              </Typography>
              <IconButton
                color="error"
                aria-label={txt.removeCustom}
                onClick={() => remove(idx)}
              >
                <MdDelete />
              </IconButton>
            </Stack>

            <Stack spacing={1.5}>
              <Controller
                name={`customs.${idx}.textAr`}
                control={control}
                rules={{ required: txt.required }}
                render={({ field: f, fieldState }) => (
                  <TextField
                    {...f}
                    value={f.value ?? ""}
                    fullWidth
                    label={txt.customTextAr}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name={`customs.${idx}.textEn`}
                control={control}
                rules={{ required: txt.required }}
                render={({ field: f, fieldState }) => (
                  <TextField
                    {...f}
                    value={f.value ?? ""}
                    fullWidth
                    label={txt.customTextEn}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Divider />
              <OptionsEditor
                control={control}
                name={`customs.${idx}.options`}
                txt={optionTxt}
              />
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
