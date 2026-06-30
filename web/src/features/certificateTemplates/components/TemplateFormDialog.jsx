"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Divider,
  Grid,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { MdInfoOutline } from "react-icons/md";
import { CERTIFICATE_TEMPLATE_TYPES } from "@aya/shared";
import {
  FormDialog,
  RHFTextField,
  RHFSwitch,
} from "../../../shared/components/index.js";
import useDebounce from "../../../hooks/useDebounce.js";
import CertificateCard from "../../certificates/components/CertificateCard.jsx";
import {
  TEMPLATE_TYPES,
  TEMPLATE_ORIENTATIONS,
  TEMPLATE_BORDER_STYLES,
  TEMPLATE_DECORATIONS,
  TEMPLATE_FONT_STYLES,
  TEMPLATE_LOGO_SIZES,
  NAME_SCALE_MIN,
  NAME_SCALE_MAX,
  HEADING_SCALE_MIN,
  HEADING_SCALE_MAX,
  WATERMARK_OPACITY_MIN,
  WATERMARK_OPACITY_MAX,
  CONTENT_SPACING_MIN,
  CONTENT_SPACING_MAX,
  DEFAULT_TEMPLATE_THEME,
} from "../config/constant.js";

const FORM_ID = "certificate-template-form";

const ORIENTATION_LABEL_KEY = {
  portrait: "orientationPortrait",
  landscape: "orientationLandscape",
};
const BORDER_LABEL_KEY = {
  ornate: "borderOrnate",
  foil: "borderFoil",
  double: "borderDouble",
  simple: "borderSimple",
  rounded: "borderRounded",
  dashed: "borderDashed",
  inset: "borderInset",
  groove: "borderGroove",
  ribbon: "borderRibbon",
  none: "borderNone",
};
const TYPE_LABEL_KEY = {
  GENERAL: "typeGeneral",
  GAME: "typeGame",
  EXAM: "typeExam",
};
const DECORATION_LABEL_KEY = {
  elegant: "decoElegant",
  geometric: "decoGeometric",
  classic: "decoClassic",
  stars: "decoStars",
  rainbow: "decoRainbow",
  crescent: "decoCrescent",
  balloons: "decoBalloons",
  badges: "decoBadges",
  confetti: "decoConfetti",
  hearts: "decoHearts",
  lanterns: "decoLanterns",
  florals: "decoFlorals",
  sparkles: "decoSparkles",
  none: "decoNone",
};
const FONT_LABEL_KEY = {
  elegant: "fontElegant",
  classic: "fontClassic",
  modern: "fontModern",
  kufi: "fontKufi",
  ruqaa: "fontRuqaa",
  naskh: "fontNaskh",
};
const LOGO_SIZE_LABEL_KEY = {
  sm: "logoSizeSm",
  md: "logoSizeMd",
  lg: "logoSizeLg",
};

// Brand-new template: theme defaults + the fixed texts PRE-FILLED with the same
// copy the card would otherwise fall back to, so the inputs always match the
// live preview (no "empty input but preview shows شهادة تقدير" surprise).
function emptyValues(txt = {}) {
  return {
    key: "",
    type: CERTIFICATE_TEMPLATE_TYPES.GENERAL,
    nameAr: "",
    nameEn: "",
    headingAr: txt.defaultHeadingAr ?? "",
    headingEn: txt.defaultHeadingEn ?? "",
    introAr: txt.defaultIntroAr ?? "",
    introEn: txt.defaultIntroEn ?? "",
    bodyAr: txt.defaultBodyAr ?? "",
    bodyEn: txt.defaultBodyEn ?? "",
    congratsAr: txt.defaultCongratsAr ?? "",
    congratsEn: txt.defaultCongratsEn ?? "",
    thanksAr: txt.defaultThanksAr ?? "",
    thanksEn: txt.defaultThanksEn ?? "",
    signatureName: txt.defaultSignatureName ?? "",
    signatureTitleAr: txt.defaultSignatureTitleAr ?? "",
    signatureTitleEn: txt.defaultSignatureTitleEn ?? "",
    // theme
    orientation: DEFAULT_TEMPLATE_THEME.orientation,
    borderStyle: DEFAULT_TEMPLATE_THEME.borderStyle,
    decoration: DEFAULT_TEMPLATE_THEME.decoration,
    fontStyle: DEFAULT_TEMPLATE_THEME.fontStyle,
    accent: DEFAULT_TEMPLATE_THEME.accent,
    secondary: DEFAULT_TEMPLATE_THEME.secondary,
    background: DEFAULT_TEMPLATE_THEME.background,
    nameColor: DEFAULT_TEMPLATE_THEME.nameColor,
    logoSize: DEFAULT_TEMPLATE_THEME.logoSize,
    sealText: DEFAULT_TEMPLATE_THEME.sealText,
    nameScale: DEFAULT_TEMPLATE_THEME.nameScale,
    headingScale: DEFAULT_TEMPLATE_THEME.headingScale,
    contentSpacing: DEFAULT_TEMPLATE_THEME.contentSpacing,
    watermarkOpacity: DEFAULT_TEMPLATE_THEME.watermarkOpacity,
    showPhoto: DEFAULT_TEMPLATE_THEME.showPhoto,
    showBismillah: DEFAULT_TEMPLATE_THEME.showBismillah,
    showSeal: DEFAULT_TEMPLATE_THEME.showSeal,
    showWatermark: DEFAULT_TEMPLATE_THEME.showWatermark,
    showTagline: DEFAULT_TEMPLATE_THEME.showTagline,
    showDate: DEFAULT_TEMPLATE_THEME.showDate,
    isActive: true,
    isDefault: false,
  };
}

function fromTemplate(tpl, txt = {}) {
  const theme = (() => {
    if (!tpl?.themeJson) return {};
    if (typeof tpl.themeJson === "object") return tpl.themeJson;
    try {
      return JSON.parse(tpl.themeJson) || {};
    } catch {
      return {};
    }
  })();
  const base = emptyValues(txt);
  // Editing keeps the stored copy verbatim (empty stays empty); only theme
  // values fall back to the defaults.
  return {
    ...base,
    key: tpl.key ?? "",
    type: tpl.type ?? base.type,
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
    decoration: theme.decoration ?? base.decoration,
    fontStyle: theme.fontStyle ?? base.fontStyle,
    accent: theme.accent ?? base.accent,
    secondary: theme.secondary ?? base.secondary,
    background: theme.background ?? base.background,
    nameColor: theme.nameColor ?? base.nameColor,
    logoSize: theme.logoSize ?? base.logoSize,
    sealText: theme.sealText ?? base.sealText,
    nameScale: theme.nameScale ?? base.nameScale,
    headingScale: theme.headingScale ?? base.headingScale,
    contentSpacing: theme.contentSpacing ?? base.contentSpacing,
    watermarkOpacity: theme.watermarkOpacity ?? base.watermarkOpacity,
    showPhoto: theme.showPhoto ?? base.showPhoto,
    showBismillah: theme.showBismillah ?? base.showBismillah,
    showSeal: theme.showSeal ?? base.showSeal,
    showWatermark: theme.showWatermark ?? base.showWatermark,
    showTagline: theme.showTagline ?? base.showTagline,
    showDate: theme.showDate ?? base.showDate,
    isActive: tpl.isActive ?? true,
    isDefault: tpl.isDefault ?? false,
  };
}

function buildThemeJson(v) {
  return {
    orientation: v.orientation,
    borderStyle: v.borderStyle,
    decoration: v.decoration,
    fontStyle: v.fontStyle,
    accent: v.accent,
    secondary: v.secondary,
    background: v.background,
    nameColor: v.nameColor,
    logoSize: v.logoSize,
    sealText: v.sealText?.trim() || undefined,
    nameScale: Number(v.nameScale),
    headingScale: Number(v.headingScale),
    contentSpacing: Number(v.contentSpacing),
    watermarkOpacity: Number(v.watermarkOpacity),
    showPhoto: Boolean(v.showPhoto),
    showBismillah: Boolean(v.showBismillah),
    showSeal: Boolean(v.showSeal),
    showWatermark: Boolean(v.showWatermark),
    showTagline: Boolean(v.showTagline),
    showDate: Boolean(v.showDate),
  };
}

/**
 * Create / edit a certificate template (all fixed texts + style), with a live
 * CertificateCard preview fed a synthetic template-driven certificate.
 *   POST certificate-templates  /  PATCH certificate-templates/:id
 */
export default function TemplateFormDialog({ open, onClose, template, txt, loading, onSubmit }) {
  const isEditing = Boolean(template?.id);

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: emptyValues(txt),
  });
  const [error, setError] = useState("");

  // Reset the form whenever the dialog (re)opens or targets a new template, so
  // the inputs are seeded from the edited template (or fresh defaults).
  const openKey = open ? String(template?.id ?? "new") : "__closed__";
  useEffect(() => {
    if (!open) return;
    reset(template ? fromTemplate(template, txt) : emptyValues(txt));
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey, reset]);

  // Inputs stay instant; the (heavy) live preview follows a debounced copy so
  // dragging the color pickers / typing never janks. Watch every value and feed
  // a debounced snapshot into the preview (220ms — at most ~4 re-renders/sec).
  const watched = watch();
  const debounced = useDebounce(JSON.stringify(watched), 220);
  const debouncedValues = useMemo(() => {
    try {
      return JSON.parse(debounced);
    } catch {
      return watched;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // `showSeal` / `showWatermark` gate the seal-text input + watermark slider —
  // watch them so the disabled state reacts as the toggles change.
  const showSeal = watch("showSeal");
  const showWatermark = watch("showWatermark");

  function submit(values) {
    setError("");
    if (!values.key.trim() || !values.nameAr.trim() || !values.nameEn.trim()) {
      setError(txt.required);
      return;
    }
    const payload = {
      key: values.key.trim(),
      type: values.type,
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

  // Synthetic certificate for the live preview (template-driven path). Built
  // from the DEBOUNCED values so the heavy card re-renders at most ~4×/sec.
  const previewCertificate = useMemo(
    () => ({
      studentName: txt.previewStudent,
      issuedAt: new Date().toISOString(),
      reasonAr: txt.previewReason,
      reasonEn: txt.previewReason,
      template: {
        headingAr: debouncedValues.headingAr,
        headingEn: debouncedValues.headingEn,
        introAr: debouncedValues.introAr,
        introEn: debouncedValues.introEn,
        bodyAr: debouncedValues.bodyAr,
        bodyEn: debouncedValues.bodyEn,
        congratsAr: debouncedValues.congratsAr,
        congratsEn: debouncedValues.congratsEn,
        thanksAr: debouncedValues.thanksAr,
        thanksEn: debouncedValues.thanksEn,
        signatureName: debouncedValues.signatureName,
        signatureTitleAr: debouncedValues.signatureTitleAr,
        signatureTitleEn: debouncedValues.signatureTitleEn,
        themeJson: buildThemeJson(debouncedValues),
      },
    }),
    [debouncedValues, txt.previewStudent, txt.previewReason],
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
      onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField name="key" control={control} label={txt.keyLabel} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <TextField select fullWidth label={txt.typeLabel} {...field}>
                      {TEMPLATE_TYPES.map((t) => (
                        <MenuItem key={t} value={t}>
                          {txt[TYPE_LABEL_KEY[t]] || t}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              {watch("type") === CERTIFICATE_TEMPLATE_TYPES.GAME && (
                <Grid size={{ xs: 12 }}>
                  <Alert icon={<MdInfoOutline />} severity="warning" sx={{ py: 0.25 }}>
                    {txt.typeGameHint}
                  </Alert>
                </Grid>
              )}
              {watch("type") === CERTIFICATE_TEMPLATE_TYPES.EXAM && (
                <Grid size={{ xs: 12 }}>
                  <Alert icon={<MdInfoOutline />} severity="warning" sx={{ py: 0.25 }}>
                    {txt.typeExamHint}
                  </Alert>
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFSwitch name="isActive" control={control} label={txt.isActiveLabel} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFSwitch name="isDefault" control={control} label={txt.isDefaultLabel} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField name="nameAr" control={control} label={txt.nameArLabel} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField name="nameEn" control={control} label={txt.nameEnLabel} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField name="headingAr" control={control} label={txt.headingArLabel} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField name="headingEn" control={control} label={txt.headingEnLabel} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField name="introAr" control={control} label={txt.introArLabel} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField name="introEn" control={control} label={txt.introEnLabel} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Alert icon={<MdInfoOutline />} severity="info" sx={{ py: 0.25 }}>
                  {txt.bodyHint}
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField
                  name="bodyAr"
                  control={control}
                  label={txt.bodyArLabel}
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField
                  name="bodyEn"
                  control={control}
                  label={txt.bodyEnLabel}
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField name="congratsAr" control={control} label={txt.congratsArLabel} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField name="congratsEn" control={control} label={txt.congratsEnLabel} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField name="thanksAr" control={control} label={txt.thanksArLabel} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField name="thanksEn" control={control} label={txt.thanksEnLabel} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5 }} />
            <Typography variant="overline" color="text.secondary">
              {txt.sectionSignature}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid size={{ xs: 12 }}>
                <RHFTextField name="signatureName" control={control} label={txt.signatureNameLabel} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField
                  name="signatureTitleAr"
                  control={control}
                  label={txt.signatureTitleArLabel}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField
                  name="signatureTitleEn"
                  control={control}
                  label={txt.signatureTitleEnLabel}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5 }} />
            <Typography variant="overline" color="text.secondary">
              {txt.sectionStyle}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="orientation"
                  control={control}
                  render={({ field }) => (
                    <TextField select fullWidth label={txt.orientationLabel} {...field}>
                      {TEMPLATE_ORIENTATIONS.map((o) => (
                        <MenuItem key={o} value={o}>
                          {txt[ORIENTATION_LABEL_KEY[o]] || o}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="borderStyle"
                  control={control}
                  render={({ field }) => (
                    <TextField select fullWidth label={txt.borderStyleLabel} {...field}>
                      {TEMPLATE_BORDER_STYLES.map((b) => (
                        <MenuItem key={b} value={b}>
                          {txt[BORDER_LABEL_KEY[b]] || b}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="accent"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="color"
                      fullWidth
                      label={txt.accentLabel}
                      {...field}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="secondary"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="color"
                      fullWidth
                      label={txt.secondaryLabel}
                      {...field}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="background"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="color"
                      fullWidth
                      label={txt.backgroundLabel}
                      {...field}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller
                  name="nameColor"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="color"
                      fullWidth
                      label={txt.nameColorLabel}
                      {...field}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
                <RHFSwitch name="showPhoto" control={control} label={txt.showPhotoLabel} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
                <RHFSwitch name="showBismillah" control={control} label={txt.showBismillahLabel} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5 }} />
            <Typography variant="overline" color="text.secondary">
              {txt.sectionMore}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="decoration"
                  control={control}
                  render={({ field }) => (
                    <TextField select fullWidth label={txt.decorationLabel} {...field}>
                      {TEMPLATE_DECORATIONS.map((d) => (
                        <MenuItem key={d} value={d}>
                          {txt[DECORATION_LABEL_KEY[d]] || d}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="fontStyle"
                  control={control}
                  render={({ field }) => (
                    <TextField select fullWidth label={txt.fontStyleLabel} {...field}>
                      {TEMPLATE_FONT_STYLES.map((f) => (
                        <MenuItem key={f} value={f}>
                          {txt[FONT_LABEL_KEY[f]] || f}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="logoSize"
                  control={control}
                  render={({ field }) => (
                    <TextField select fullWidth label={txt.logoSizeLabel} {...field}>
                      {TEMPLATE_LOGO_SIZES.map((s) => (
                        <MenuItem key={s} value={s}>
                          {txt[LOGO_SIZE_LABEL_KEY[s]] || s}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField
                  name="sealText"
                  control={control}
                  label={txt.sealTextLabel}
                  slotProps={{ htmlInput: { maxLength: 16 } }}
                  disabled={!showSeal}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ px: 1 }}>
                  <Controller
                    name="nameScale"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Typography variant="caption" color="text.secondary">
                          {txt.nameScaleLabel} ({Number(field.value).toFixed(2)}×)
                        </Typography>
                        <Slider
                          size="small"
                          value={Number(field.value)}
                          min={NAME_SCALE_MIN}
                          max={NAME_SCALE_MAX}
                          step={0.05}
                          onChange={(_e, v) => field.onChange(v)}
                          valueLabelDisplay="auto"
                        />
                      </>
                    )}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ px: 1 }}>
                  <Controller
                    name="headingScale"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Typography variant="caption" color="text.secondary">
                          {txt.headingScaleLabel} ({Number(field.value).toFixed(2)}×)
                        </Typography>
                        <Slider
                          size="small"
                          value={Number(field.value)}
                          min={HEADING_SCALE_MIN}
                          max={HEADING_SCALE_MAX}
                          step={0.05}
                          onChange={(_e, v) => field.onChange(v)}
                          valueLabelDisplay="auto"
                        />
                      </>
                    )}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ px: 1 }}>
                  <Controller
                    name="contentSpacing"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Typography variant="caption" color="text.secondary">
                          {txt.contentSpacingLabel} ({Number(field.value).toFixed(2)}×)
                        </Typography>
                        <Slider
                          size="small"
                          value={Number(field.value)}
                          min={CONTENT_SPACING_MIN}
                          max={CONTENT_SPACING_MAX}
                          step={0.05}
                          onChange={(_e, v) => field.onChange(v)}
                          valueLabelDisplay="auto"
                        />
                      </>
                    )}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ px: 1 }}>
                  <Controller
                    name="watermarkOpacity"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Typography variant="caption" color="text.secondary">
                          {txt.watermarkOpacityLabel} ({Number(field.value).toFixed(2)})
                        </Typography>
                        <Slider
                          size="small"
                          value={Number(field.value)}
                          min={WATERMARK_OPACITY_MIN}
                          max={WATERMARK_OPACITY_MAX}
                          step={0.01}
                          disabled={!showWatermark}
                          onChange={(_e, v) => field.onChange(v)}
                          valueLabelDisplay="auto"
                        />
                      </>
                    )}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
                <RHFSwitch name="showSeal" control={control} label={txt.showSealLabel} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
                <RHFSwitch name="showWatermark" control={control} label={txt.showWatermarkLabel} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
                <RHFSwitch name="showTagline" control={control} label={txt.showTaglineLabel} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
                <RHFSwitch name="showDate" control={control} label={txt.showDateLabel} />
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
      </form>
    </FormDialog>
  );
}
