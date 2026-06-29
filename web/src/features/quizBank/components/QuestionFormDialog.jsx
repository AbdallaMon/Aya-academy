"use client";

import { useEffect, useMemo } from "react";
import { Grid } from "@mui/material";
import { useForm } from "react-hook-form";
import {
  FormDialog,
  RHFTextField,
  RHFSelect,
  RHFSwitch,
  applyApiErrorsToForm,
} from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
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

function makeDefaults(question) {
  if (question?.id) {
    return {
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
    };
  }
  return emptyDefaults();
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
  const { showToast } = useToast();
  const isEditing = Boolean(question?.id);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({ defaultValues: makeDefaults(question) });

  useEffect(() => {
    if (!open) return;
    reset(makeDefaults(question));
  }, [open, question, reset]);

  // Category options as a value→label map: a "No category" empty sentinel first,
  // then each category labelled the way the old select rendered it.
  const categoryOptions = useMemo(() => {
    const map = { "": txt.noCategory };
    (categories || []).forEach((c) => {
      map[String(c.id)] = c.nameAr || c.nameEn || `#${c.id}`;
    });
    return map;
  }, [categories, txt.noCategory]);

  const { fetchData, isLoading } = useRequest({
    url: BANK_URL,
    method: isEditing ? "put" : "post",
    shouldAutoToast: true,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
    onError: (err) =>
      applyApiErrorsToForm(err, setError, {
        labelMap: {
          textAr: txt.textArLabel,
          textEn: txt.textEnLabel,
          categoryId: txt.categoryLabel,
        },
        showToast,
        suppressFallbackToast: true,
      }),
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

    fetchData(isEditing ? String(question.id) : null, payload);
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEditing ? txt.editTitle : txt.createTitle}
      maxWidth="md"
      loading={isLoading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <RHFTextField
              name="textAr"
              control={control}
              label={txt.textArLabel}
              rules={{ required: txt.required }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <RHFTextField
              name="textEn"
              control={control}
              label={txt.textEnLabel}
              rules={{ required: txt.required }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFSelect
              name="categoryId"
              control={control}
              label={txt.categoryLabel}
              options={categoryOptions}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFSwitch
              name="isActive"
              control={control}
              label={txt.isActiveLabel}
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
