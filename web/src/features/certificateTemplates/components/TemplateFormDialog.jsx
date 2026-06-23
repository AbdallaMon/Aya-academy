"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { MdInfoOutline } from "react-icons/md";
import { FormDialog } from "../../../shared/components/index.js";
import CertificateCard from "../../certificates/components/CertificateCard.jsx";
import {
  TEMPLATE_ORIENTATIONS,
  TEMPLATE_BORDER_STYLES,
  DEFAULT_TEMPLATE_THEME,
} from "../config/constant.js";

const ORIENTATION_LABEL_KEY = {
  portrait: "orientationPortrait",
  landscape: "orientationLandscape",
};
const BORDER_LABEL_KEY = {
  ornate: "borderOrnate",
  foil: "borderFoil",
  double: "borderDouble",
  simple: "borderSimple",
};

function emptyValues() {
  return {
    key: "",
    nameAr: "",
    nameEn: "",
    headingAr: "",
    headingEn: "",
    introAr: "",
    introEn: "",
    bodyAr: "",
    bodyEn: "",
    congratsAr: "",
    congratsEn: "",
    thanksAr: "",
    thanksEn: "",
    signatureName: "",
    signatureTitleAr: "",
    signatureTitleEn: "",
    // theme
    orientation: DEFAULT_TEMPLATE_THEME.orientation,
    borderStyle: DEFAULT_TEMPLATE_THEME.borderStyle,
    accent: DEFAULT_TEMPLATE_THEME.accent,
    secondary: DEFAULT_TEMPLATE_THEME.secondary,
    background: DEFAULT_TEMPLATE_THEME.background,
    showPhoto: DEFAULT_TEMPLATE_THEME.showPhoto,
    showBismillah: DEFAULT_TEMPLATE_THEME.showBismillah,
    isActive: true,
    isDefault: false,
  };
}

function fromTemplate(tpl) {
  const theme = (() => {
    if (!tpl?.themeJson) return {};
    if (typeof tpl.themeJson === "object") return tpl.themeJson;
    try {
      return JSON.parse(tpl.themeJson) || {};
    } catch {
      return {};
    }
  })();
  const base = emptyValues();
  return {
    ...base,
    key: tpl.key ?? "",
    nameAr: tpl.nameAr ?? "",
    nameEn: tpl.nameEn ?? "",
    headingAr: tpl.headingAr ?? "",
    headingEn: tpl.headingEn ?? "",
    introAr: tpl.introAr ?? "",
    introEn: tpl.introEn ?? "",
    bodyAr: tpl.bodyAr ?? "",
    bodyEn: tpl.bodyEn ?? "",
    congratsAr: tpl.congratsAr ?? "",
    congratsEn: tpl.congratsEn ?? "",
    thanksAr: tpl.thanksAr ?? "",
    thanksEn: tpl.thanksEn ?? "",
    signatureName: tpl.signatureName ?? "",
    signatureTitleAr: tpl.signatureTitleAr ?? "",
    signatureTitleEn: tpl.signatureTitleEn ?? "",
    orientation: theme.orientation ?? base.orientation,
    borderStyle: theme.borderStyle ?? base.borderStyle,
    accent: theme.accent ?? base.accent,
    secondary: theme.secondary ?? base.secondary,
    background: theme.background ?? base.background,
    showPhoto: theme.showPhoto ?? base.showPhoto,
    showBismillah: theme.showBismillah ?? base.showBismillah,
    isActive: tpl.isActive ?? true,
    isDefault: tpl.isDefault ?? false,
  };
}

function buildThemeJson(v) {
  return {
    orientation: v.orientation,
    borderStyle: v.borderStyle,
    accent: v.accent,
    secondary: v.secondary,
    background: v.background,
    showPhoto: Boolean(v.showPhoto),
    showBismillah: Boolean(v.showBismillah),
  };
}

/**
 * Create / edit a certificate template (all fixed texts + style), with a live
 * CertificateCard preview fed a synthetic template-driven certificate.
 *   POST certificate-templates  /  PATCH certificate-templates/:id
 */
export default function TemplateFormDialog({ open, onClose, template, txt, loading, onSubmit }) {
  const [values, setValues] = useState(emptyValues);
  const [error, setError] = useState("");

  const isEditing = Boolean(template?.id);

  useEffect(() => {
    if (!open) return;
    setError("");
    setValues(template ? fromTemplate(template) : emptyValues());
  }, [open, template]);

  function set(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    setError("");
    if (!values.key.trim() || !values.nameAr.trim() || !values.nameEn.trim()) {
      setError(txt.required);
      return;
    }
    const payload = {
      key: values.key.trim(),
      nameAr: values.nameAr.trim(),
      nameEn: values.nameEn.trim(),
      headingAr: values.headingAr.trim() || undefined,
      headingEn: values.headingEn.trim() || undefined,
      introAr: values.introAr.trim() || undefined,
      introEn: values.introEn.trim() || undefined,
      bodyAr: values.bodyAr.trim() || undefined,
      bodyEn: values.bodyEn.trim() || undefined,
      congratsAr: values.congratsAr.trim() || undefined,
      congratsEn: values.congratsEn.trim() || undefined,
      thanksAr: values.thanksAr.trim() || undefined,
      thanksEn: values.thanksEn.trim() || undefined,
      signatureName: values.signatureName.trim() || undefined,
      signatureTitleAr: values.signatureTitleAr.trim() || undefined,
      signatureTitleEn: values.signatureTitleEn.trim() || undefined,
      themeJson: buildThemeJson(values),
      isActive: Boolean(values.isActive),
      isDefault: Boolean(values.isDefault),
    };
    onSubmit(payload, isEditing);
  }

  // Synthetic certificate for the live preview (template-driven path).
  const previewCertificate = useMemo(
    () => ({
      studentName: txt.previewStudent,
      issuedAt: new Date().toISOString(),
      reasonAr: txt.previewReason,
      reasonEn: txt.previewReason,
      template: {
        headingAr: values.headingAr,
        headingEn: values.headingEn,
        introAr: values.introAr,
        introEn: values.introEn,
        bodyAr: values.bodyAr,
        bodyEn: values.bodyEn,
        congratsAr: values.congratsAr,
        congratsEn: values.congratsEn,
        thanksAr: values.thanksAr,
        thanksEn: values.thanksEn,
        signatureName: values.signatureName,
        signatureTitleAr: values.signatureTitleAr,
        signatureTitleEn: values.signatureTitleEn,
        themeJson: buildThemeJson(values),
      },
    }),
    [values, txt.previewStudent, txt.previewReason],
  );

  const field = (name, label, extra = {}) => (
    <TextField
      label={label}
      value={values[name]}
      onChange={(e) => set(name, e.target.value)}
      fullWidth
      {...extra}
    />
  );

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEditing ? txt.editTitle : txt.createTitle}
      maxWidth="lg"
      loading={loading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={submit}
    >
      <Grid container spacing={3}>
        {/* ── Form ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          {error && (
            <Typography variant="body2" color="error.main" sx={{ mb: 1 }}>
              {error}
            </Typography>
          )}

          <Typography variant="overline" color="text.secondary">
            {txt.sectionTexts}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid size={{ xs: 12, sm: 6 }}>{field("key", txt.keyLabel, { required: true })}</Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
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
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(values.isDefault)}
                    onChange={(e) => set("isDefault", e.target.checked)}
                  />
                }
                label={txt.isDefaultLabel}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field("nameAr", txt.nameArLabel, { required: true })}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field("nameEn", txt.nameEnLabel, { required: true })}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field("headingAr", txt.headingArLabel)}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field("headingEn", txt.headingEnLabel)}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field("introAr", txt.introArLabel)}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field("introEn", txt.introEnLabel)}</Grid>
            <Grid size={{ xs: 12 }}>
              <Alert icon={<MdInfoOutline />} severity="info" sx={{ py: 0.25 }}>
                {txt.bodyHint}
              </Alert>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {field("bodyAr", txt.bodyArLabel, { multiline: true, minRows: 2 })}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {field("bodyEn", txt.bodyEnLabel, { multiline: true, minRows: 2 })}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field("congratsAr", txt.congratsArLabel)}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field("congratsEn", txt.congratsEnLabel)}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field("thanksAr", txt.thanksArLabel)}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field("thanksEn", txt.thanksEnLabel)}</Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />
          <Typography variant="overline" color="text.secondary">
            {txt.sectionSignature}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid size={{ xs: 12 }}>{field("signatureName", txt.signatureNameLabel)}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field("signatureTitleAr", txt.signatureTitleArLabel)}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field("signatureTitleEn", txt.signatureTitleEnLabel)}</Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />
          <Typography variant="overline" color="text.secondary">
            {txt.sectionStyle}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label={txt.orientationLabel}
                value={values.orientation}
                onChange={(e) => set("orientation", e.target.value)}
              >
                {TEMPLATE_ORIENTATIONS.map((o) => (
                  <MenuItem key={o} value={o}>
                    {txt[ORIENTATION_LABEL_KEY[o]] || o}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label={txt.borderStyleLabel}
                value={values.borderStyle}
                onChange={(e) => set("borderStyle", e.target.value)}
              >
                {TEMPLATE_BORDER_STYLES.map((b) => (
                  <MenuItem key={b} value={b}>
                    {txt[BORDER_LABEL_KEY[b]] || b}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                type="color"
                fullWidth
                label={txt.accentLabel}
                value={values.accent}
                onChange={(e) => set("accent", e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                type="color"
                fullWidth
                label={txt.secondaryLabel}
                value={values.secondary}
                onChange={(e) => set("secondary", e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                type="color"
                fullWidth
                label={txt.backgroundLabel}
                value={values.background}
                onChange={(e) => set("background", e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(values.showPhoto)}
                    onChange={(e) => set("showPhoto", e.target.checked)}
                  />
                }
                label={txt.showPhotoLabel}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(values.showBismillah)}
                    onChange={(e) => set("showBismillah", e.target.checked)}
                  />
                }
                label={txt.showBismillahLabel}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* ── Live preview ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={1} sx={{ position: { md: "sticky" }, top: { md: 8 } }}>
            <Typography variant="subtitle2" color="text.secondary">
              {txt.previewLabel}
            </Typography>
            <Box>
              <CertificateCard certificate={previewCertificate} />
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </FormDialog>
  );
}
