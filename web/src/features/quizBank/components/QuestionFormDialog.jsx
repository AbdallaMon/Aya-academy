"use client";

import { useEffect } from "react";
import {
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { FormDialog } from "../../../shared/components/index.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { BANK_URL } from "../config/constant.js";
import OptionsEditor from "./OptionsEditor.jsx";

const FORM_ID = "quiz-question-form";

function emptyDefaults() {
  return {
    textAr: "",
    textEn: "",
    categoryId: "",
    isActive: true,
    options: [
      { labelAr: "", labelEn: "", isCorrect: true },
      { labelAr: "", labelEn: "", isCorrect: false },
    ],
  };
}

/**
 * Create / edit a bank question.
 *   POST quizzes/bank        (create)
 *   PUT  quizzes/bank/:id     (edit)
 */
export default function QuestionFormDialog({
  open,
  onClose,
  question,
  categories,
  txt,
  onSuccess,
}) {
  const isEditing = Boolean(question?.id);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({ defaultValues: emptyDefaults() });

  useEffect(() => {
    if (!open) return;
    if (question?.id) {
      reset({
        textAr: question.textAr ?? "",
        textEn: question.textEn ?? "",
        categoryId: question.categoryId ? String(question.categoryId) : "",
        isActive: question.isActive ?? true,
        options:
          (question.options || []).map((o) => ({
            labelAr: o.labelAr ?? "",
            labelEn: o.labelEn ?? "",
            isCorrect: !!o.isCorrect,
          })) || [],
      });
    } else {
      reset(emptyDefaults());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, question]);

  const mut = useMultiRequest({
    url: BANK_URL,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  function submit(values) {
    clearErrors("options");
    const options = values.options || [];
    if (options.length < 2) {
      setError("options", { message: txt.minOptions });
      return;
    }
    if (!options.some((o) => o.isCorrect)) {
      setError("options", { message: txt.minCorrect });
      return;
    }

    const payload = {
      textAr: values.textAr,
      textEn: values.textEn,
      categoryId: values.categoryId ? Number(values.categoryId) : undefined,
      isActive: Boolean(values.isActive),
      options: options.map((o, i) => ({
        labelAr: o.labelAr,
        labelEn: o.labelEn,
        isCorrect: Boolean(o.isCorrect),
        order: i,
      })),
    };

    if (isEditing) mut.putRequest(String(question.id), payload);
    else mut.postRequest(null, payload);
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEditing ? txt.editTitle : txt.createTitle}
      maxWidth="md"
      loading={mut.isPostRequestLoading || mut.isPutRequestLoading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="textAr"
              control={control}
              rules={{ required: txt.required }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  label={txt.textArLabel}
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="textEn"
              control={control}
              rules={{ required: txt.required }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  fullWidth
                  label={txt.textEnLabel}
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  select
                  fullWidth
                  label={txt.categoryLabel}
                >
                  <MenuItem value="">{txt.noCategory}</MenuItem>
                  {(categories || []).map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      {c.nameAr || c.nameEn || `#${c.id}`}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label={txt.isActiveLabel}
                  value={field.value ? "true" : "false"}
                  onChange={(e) => field.onChange(e.target.value === "true")}
                >
                  <MenuItem value="true">{txt.active}</MenuItem>
                  <MenuItem value="false">{txt.inactive}</MenuItem>
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <OptionsEditor
              control={control}
              name="options"
              txt={txt}
              error={errors.options?.message}
            />
          </Grid>
        </Grid>
      </form>
    </FormDialog>
  );
}
