"use client";

import { useEffect, useState } from "react";
import {
  Box,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { FormDialog } from "../../../shared/components/index.js";
import { useTranslation } from "../../../i18n/client.js";
import BadgeChip from "../../userDetail/components/BadgeChip.jsx";

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
export default function BadgeFormDialog({ open, onClose, badge, txt, loading, onSubmit }) {
  const { lng } = useTranslation();
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState("");

  const isEditing = Boolean(badge?.id);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (badge) {
      setValues({
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
      });
    } else {
      setValues(EMPTY);
    }
  }, [open, badge]);

  function set(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    setError("");
    if (!values.code.trim() || !values.nameAr.trim() || !values.nameEn.trim()) {
      setError(txt.required);
      return;
    }
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
    onSubmit(payload, isEditing);
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEditing ? txt.editTitle : txt.createTitle}
      maxWidth="md"
      loading={loading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={submit}
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        {error && (
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
        )}

        <Box>
          <Typography variant="caption" color="text.secondary">
            {txt.preview}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <BadgeChip badge={values} lng={lng} />
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.codeLabel}
              value={values.code}
              onChange={(e) => set("code", e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.emojiLabel}
              value={values.emoji}
              onChange={(e) => set("emoji", e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.nameArLabel}
              value={values.nameAr}
              onChange={(e) => set("nameAr", e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.nameEnLabel}
              value={values.nameEn}
              onChange={(e) => set("nameEn", e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.descriptionArLabel}
              value={values.descriptionAr}
              onChange={(e) => set("descriptionAr", e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.descriptionEnLabel}
              value={values.descriptionEn}
              onChange={(e) => set("descriptionEn", e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <ColorInput
              label={txt.bgColorLabel}
              value={values.bgColor}
              onChange={(v) => set("bgColor", v)}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <ColorInput
              label={txt.textColorLabel}
              value={values.textColor}
              onChange={(v) => set("textColor", v)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              type="number"
              label={txt.scoreLabel}
              value={values.score}
              onChange={(e) => set("score", e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(values.isActive)}
                  onChange={(e) => set("isActive", e.target.checked)}
                />
              }
              label={txt.isActiveLabel}
            />
          </Grid>
        </Grid>
      </Stack>
    </FormDialog>
  );
}
