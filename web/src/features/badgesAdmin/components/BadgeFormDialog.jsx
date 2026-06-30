"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  Box,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  FormDialog,
  RHFTextField,
  RHFTextArea,
  RHFSwitch,
  applyApiErrorsToForm,
} from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { useTranslation } from "../../../i18n/client.js";
import BadgeChip from "../../userDetail/components/BadgeChip.jsx";
import { BADGES_URL } from "../config/constant.js";

const FORM_ID = "badge-form";

const EMPTY = {
  code: "",
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  emoji: "",
  bgColor: "#EEF2FF",
  textColor: "#1E293B",
  score: 0,
  isActive: true,
};

function makeDefaults(badge) {
  if (badge) {
    return {
      code: badge.code ?? "",
      nameAr: badge.nameAr ?? "",
      nameEn: badge.nameEn ?? "",
      descriptionAr: badge.descriptionAr ?? "",
      descriptionEn: badge.descriptionEn ?? "",
      emoji: badge.emoji ?? "",
      bgColor: badge.bgColor ?? EMPTY.bgColor,
      textColor: badge.textColor ?? EMPTY.textColor,
      score: badge.score ?? 0,
      isActive: badge.isActive ?? true,
    };
  }
  return EMPTY;
}

function ColorInput({ label, value, onChange }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          component="input"
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          sx={{
            width: 48,
            height: 40,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            p: 0,
            cursor: "pointer",
            background: "none",
          }}
        />
        <TextField
          size="small"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          sx={{ width: 120 }}
        />
      </Stack>
    </Stack>
  );
}

/**
 * Create / edit a badge definition.
 *   POST badges  /  PATCH badges/:id
 */
export default function BadgeFormDialog({ open, onClose, badge, txt, onSaved }) {
  const { lng } = useTranslation();
  const { showToast } = useToast();
  const isEditing = Boolean(badge?.id);

  const { control, handleSubmit, reset, setError } = useForm({
    defaultValues: makeDefaults(badge),
  });

  useEffect(() => {
    if (!open) return;
    reset(makeDefaults(badge));
  }, [open, badge, reset]);

  // Live preview values for the BadgeChip.
  const preview = useWatch({ control });

  const { fetchData, isLoading } = useRequest({
    url: BADGES_URL,
    method: isEditing ? "patch" : "post",
    shouldAutoToast: true,
    onSuccess: () => {
      onSaved?.();
      onClose?.();
    },
    onError: (err) =>
      applyApiErrorsToForm(err, setError, {
        labelMap: {
          code: txt.codeLabel,
          nameAr: txt.nameArLabel,
          nameEn: txt.nameEnLabel,
          descriptionAr: txt.descriptionArLabel,
          descriptionEn: txt.descriptionEnLabel,
          emoji: txt.emojiLabel,
          bgColor: txt.bgColorLabel,
          textColor: txt.textColorLabel,
          score: txt.scoreLabel,
          isActive: txt.isActiveLabel,
        },
        showToast,
        suppressFallbackToast: true,
      }),
  });

  function submit(values) {
    const payload = {
      code: values.code.trim(),
      nameAr: values.nameAr.trim(),
      nameEn: values.nameEn.trim(),
      descriptionAr: values.descriptionAr.trim() || undefined,
      descriptionEn: values.descriptionEn.trim() || undefined,
      emoji: values.emoji.trim() || undefined,
      bgColor: values.bgColor || undefined,
      textColor: values.textColor || undefined,
      score: Number(values.score) || 0,
      isActive: Boolean(values.isActive),
    };
    fetchData(isEditing ? String(badge.id) : null, payload);
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
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {txt.preview}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <BadgeChip badge={preview} lng={lng} />
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField
                name="code"
                control={control}
                label={txt.codeLabel}
                rules={{ required: txt.required }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField name="emoji" control={control} label={txt.emojiLabel} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField
                name="nameAr"
                control={control}
                label={txt.nameArLabel}
                rules={{ required: txt.required }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField
                name="nameEn"
                control={control}
                label={txt.nameEnLabel}
                rules={{ required: txt.required }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextArea
                name="descriptionAr"
                control={control}
                label={txt.descriptionArLabel}
                minRows={2}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextArea
                name="descriptionEn"
                control={control}
                label={txt.descriptionEnLabel}
                minRows={2}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Controller
                name="bgColor"
                control={control}
                render={({ field }) => (
                  <ColorInput
                    label={txt.bgColorLabel}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Controller
                name="textColor"
                control={control}
                render={({ field }) => (
                  <ColorInput
                    label={txt.textColorLabel}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFTextField
                name="score"
                control={control}
                label={txt.scoreLabel}
                type="number"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <RHFSwitch name="isActive" control={control} label={txt.isActiveLabel} />
            </Grid>
          </Grid>
        </Stack>
      </form>
    </FormDialog>
  );
}
