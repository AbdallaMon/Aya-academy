"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { MdInfoOutline } from "react-icons/md";
import { CERTIFICATE_TEMPLATE_TYPES } from "@aya/shared";
import { FormDialog } from "../../../shared/components/index.js";
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

// Debounce a value so the heavy CertificateCard preview re-renders at most once
// per `delay` ms — keeps typing and color-picker dragging snappy.
function useDebouncedValue(value, delay = 220) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Create / edit a certificate template (all fixed texts + style), with a live
 * CertificateCard preview fed a synthetic template-driven certificate.
 *   POST certificate-templates  /  PATCH certificate-templates/:id
 */
export default function TemplateFormDialog({ open, onClose, template, txt, loading, onSubmit }) {
  const [values, setValues] = useState(() => emptyValues(txt));
  const [error, setError] = useState("");

  const isEditing = Boolean(template?.id);

  // Reset the form whenever the dialog (re)opens or targets a new template.
  // Done during render (React's "adjust state on prop change" pattern) rather
  // than in an effect so it never triggers a cascading-render warning.
  const openKey = open ? String(template?.id ?? "new") : "__closed__";
  const [syncedKey, setSyncedKey] = useState("__closed__");
  if (openKey !== syncedKey) {
    setSyncedKey(openKey);
    if (open) {
      setValues(template ? fromTemplate(template, txt) : emptyValues(txt));
      setError("");
    }
  }

  // Inputs stay instant; the (heavy) live preview follows a debounced copy so
  // dragging the color pickers / typing never janks.
  const debouncedValues = useDebouncedValue(values, 220);

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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label={txt.typeLabel}
                value={values.type}
                onChange={(e) => set("type", e.target.value)}
              >
                {TEMPLATE_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {txt[TYPE_LABEL_KEY[t]] || t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {values.type === CERTIFICATE_TEMPLATE_TYPES.GAME && (
              <Grid size={{ xs: 12 }}>
                <Alert icon={<MdInfoOutline />} severity="warning" sx={{ py: 0.25 }}>
                  {txt.typeGameHint}
                </Alert>
              </Grid>
            )}
            {values.type === CERTIFICATE_TEMPLATE_TYPES.EXAM && (
              <Grid size={{ xs: 12 }}>
                <Alert icon={<MdInfoOutline />} severity="warning" sx={{ py: 0.25 }}>
                  {txt.typeExamHint}
                </Alert>
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
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
            <Grid size={{ xs: 12, sm: 6 }}>
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
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                type="color"
                fullWidth
                label={txt.nameColorLabel}
                value={values.nameColor}
                onChange={(e) => set("nameColor", e.target.value)}
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

          <Divider sx={{ my: 2.5 }} />
          <Typography variant="overline" color="text.secondary">
            {txt.sectionMore}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label={txt.decorationLabel}
                value={values.decoration}
                onChange={(e) => set("decoration", e.target.value)}
              >
                {TEMPLATE_DECORATIONS.map((d) => (
                  <MenuItem key={d} value={d}>
                    {txt[DECORATION_LABEL_KEY[d]] || d}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label={txt.fontStyleLabel}
                value={values.fontStyle}
                onChange={(e) => set("fontStyle", e.target.value)}
              >
                {TEMPLATE_FONT_STYLES.map((f) => (
                  <MenuItem key={f} value={f}>
                    {txt[FONT_LABEL_KEY[f]] || f}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label={txt.logoSizeLabel}
                value={values.logoSize}
                onChange={(e) => set("logoSize", e.target.value)}
              >
                {TEMPLATE_LOGO_SIZES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {txt[LOGO_SIZE_LABEL_KEY[s]] || s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              {field("sealText", txt.sealTextLabel, {
                slotProps: { htmlInput: { maxLength: 16 } },
                disabled: !values.showSeal,
              })}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ px: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {txt.nameScaleLabel} ({Number(values.nameScale).toFixed(2)}×)
                </Typography>
                <Slider
                  size="small"
                  value={Number(values.nameScale)}
                  min={NAME_SCALE_MIN}
                  max={NAME_SCALE_MAX}
                  step={0.05}
                  onChange={(_e, v) => set("nameScale", v)}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ px: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {txt.headingScaleLabel} ({Number(values.headingScale).toFixed(2)}×)
                </Typography>
                <Slider
                  size="small"
                  value={Number(values.headingScale)}
                  min={HEADING_SCALE_MIN}
                  max={HEADING_SCALE_MAX}
                  step={0.05}
                  onChange={(_e, v) => set("headingScale", v)}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ px: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {txt.contentSpacingLabel} ({Number(values.contentSpacing).toFixed(2)}×)
                </Typography>
                <Slider
                  size="small"
                  value={Number(values.contentSpacing)}
                  min={CONTENT_SPACING_MIN}
                  max={CONTENT_SPACING_MAX}
                  step={0.05}
                  onChange={(_e, v) => set("contentSpacing", v)}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ px: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {txt.watermarkOpacityLabel} ({Number(values.watermarkOpacity).toFixed(2)})
                </Typography>
                <Slider
                  size="small"
                  value={Number(values.watermarkOpacity)}
                  min={WATERMARK_OPACITY_MIN}
                  max={WATERMARK_OPACITY_MAX}
                  step={0.01}
                  disabled={!values.showWatermark}
                  onChange={(_e, v) => set("watermarkOpacity", v)}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(values.showSeal)}
                    onChange={(e) => set("showSeal", e.target.checked)}
                  />
                }
                label={txt.showSealLabel}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(values.showWatermark)}
                    onChange={(e) => set("showWatermark", e.target.checked)}
                  />
                }
                label={txt.showWatermarkLabel}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(values.showTagline)}
                    onChange={(e) => set("showTagline", e.target.checked)}
                  />
                }
                label={txt.showTaglineLabel}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(values.showDate)}
                    onChange={(e) => set("showDate", e.target.checked)}
                  />
                }
                label={txt.showDateLabel}
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
