"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
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
  Tooltip,
  Typography,
} from "@mui/material";
import { MdCheck, MdInfoOutline } from "react-icons/md";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useCertificatesText } from "../config/certificatesText.js";
import {
  CERTIFICATES_URL,
  STUDENTS_PICKER_URL,
  STUDENTS_PICKER_PARAMS,
  TEMPLATE_KEYS,
  FONT_STYLES,
  ACCENT_PRESETS,
  ORIENTATIONS,
  BORDER_STYLES,
  LOGO_SIZES,
  DEFAULT_ACCENT,
  DEFAULT_BACKGROUND,
  DEFAULT_TEMPLATE_KEY,
  DEFAULT_FONT_STYLE,
  DEFAULT_ORIENTATION,
  DEFAULT_BORDER_STYLE,
  DEFAULT_LOGO_SIZE,
  DEFAULT_NAME_SCALE,
  DEFAULT_SHOW_WATERMARK,
  DEFAULT_WATERMARK_OPACITY,
  NAME_SCALE_MIN,
  NAME_SCALE_MAX,
  WATERMARK_OPACITY_MIN,
  WATERMARK_OPACITY_MAX,
} from "../config/constant.js";
import CertificateCard from "./CertificateCard.jsx";

const FORM_ID = "create-certificate-form";

const EMPTY_VALUES = {
  studentId: "",
  titleAr: "",
  titleEn: "",
  subtitleAr: "",
  subtitleEn: "",
  bodyAr: "",
  bodyEn: "",
  templateKey: DEFAULT_TEMPLATE_KEY,
  fontStyle: DEFAULT_FONT_STYLE,
  accent: DEFAULT_ACCENT,
  background: DEFAULT_BACKGROUND,
  emoji: "",
  signature: "",
  showSeal: true,
  // layout / branding / footer
  orientation: DEFAULT_ORIENTATION,
  borderStyle: DEFAULT_BORDER_STYLE,
  secondary: "",
  logoSize: DEFAULT_LOGO_SIZE,
  showWatermark: DEFAULT_SHOW_WATERMARK,
  watermarkOpacity: DEFAULT_WATERMARK_OPACITY,
  nameScale: DEFAULT_NAME_SCALE,
  showTagline: true,
  showDate: true,
  sealText: "",
  signatureTitle: "",
};

// Labels for the font-style select (keys map to txt.fontElegant / etc.).
const FONT_LABEL_KEY = {
  elegant: "fontElegant",
  classic: "fontClassic",
  modern: "fontModern",
};

// Localized labels for the enum selects (value → txt key).
const ORIENTATION_LABEL_KEY = {
  landscape: "orientationLandscape",
  portrait: "orientationPortrait",
};
const BORDER_LABEL_KEY = {
  foil: "borderFoil",
  double: "borderDouble",
  simple: "borderSimple",
  none: "borderNone",
};
const LOGO_SIZE_LABEL_KEY = {
  sm: "logoSizeSm",
  md: "logoSizeMd",
  lg: "logoSizeLg",
};

// Single source of truth for the themeJson written to BOTH the live preview and
// the submit payload — keeps them from drifting.
function buildThemeJson(v) {
  return {
    accent: v.accent,
    background: v.background,
    decoration: v.templateKey,
    fontStyle: v.fontStyle,
    emoji: v.emoji?.trim() || undefined,
    subtitleAr: v.subtitleAr?.trim() || undefined,
    subtitleEn: v.subtitleEn?.trim() || undefined,
    signature: v.signature?.trim() || undefined,
    showSeal: v.showSeal,
    // layout
    orientation: v.orientation,
    borderStyle: v.borderStyle,
    secondary: v.secondary?.trim() || undefined,
    nameScale: Number(v.nameScale),
    // branding
    logoSize: v.logoSize,
    showWatermark: v.showWatermark,
    watermarkOpacity: Number(v.watermarkOpacity),
    showTagline: v.showTagline,
    // footer
    showDate: v.showDate,
    sealText: v.sealText?.trim() || undefined,
    signatureTitle: v.signatureTitle?.trim() || undefined,
  };
}

export default function CreateCertificateDialog({ open, onClose, onSuccess }) {
  const txt = useCertificatesText();

  const { control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: EMPTY_VALUES,
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  // Student picker — admin only endpoint. Fetched lazily when the dialog opens.
  const studentsReq = useRequest({
    url: STUDENTS_PICKER_URL,
    method: "get",
    isPaginated: true,
    autoFetch: open,
    syncToUrl: false,
    initialParams: STUDENTS_PICKER_PARAMS,
  });
  const students = useMemo(() => studentsReq.data || [], [studentsReq.data]);

  const createMut = useMultiRequest({
    url: CERTIFICATES_URL,
    onSuccess: () => {
      onSuccess?.();
      onClose?.();
    },
  });

  const values = watch();
  const selectedStudent = useMemo(
    () => students.find((s) => String(s.id) === String(values.studentId)),
    [students, values.studentId],
  );

  // Live preview object shaped exactly like the API certificate.
  const previewCertificate = useMemo(
    () => ({
      titleAr: values.titleAr,
      titleEn: values.titleEn,
      bodyAr: values.bodyAr,
      bodyEn: values.bodyEn,
      templateKey: values.templateKey,
      studentName: selectedStudent?.name || txt.studentPlaceholder,
      issuedAt: new Date().toISOString(),
      themeJson: buildThemeJson(values),
    }),
    [values, selectedStudent, txt.studentPlaceholder],
  );

  async function submit(v) {
    const payload = {
      studentId: Number(v.studentId),
      titleAr: v.titleAr || undefined,
      titleEn: v.titleEn || undefined,
      bodyAr: v.bodyAr || undefined,
      bodyEn: v.bodyEn || undefined,
      templateKey: v.templateKey,
      themeJson: buildThemeJson(v),
    };
    await createMut.postRequest(null, payload);
  }

  // At least one title (ar OR en) is required by the contract. RHF passes the
  // current value + the whole form values object to a validate fn.
  const requireTitle = (_value, formValues) =>
    Boolean(formValues.titleAr?.trim()) ||
    Boolean(formValues.titleEn?.trim()) ||
    txt.titleRequired;

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.createTitle}
      maxWidth="lg"
      loading={createMut.isPostRequestLoading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
    >
      <Grid container spacing={3}>
        {/* ── Form ─────────────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box component="form" id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
            {/* Content section */}
            <Typography variant="overline" color="text.secondary">
              {txt.sectionContent}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="studentId"
                  control={control}
                  rules={{ required: txt.required }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      select
                      fullWidth
                      required
                      label={txt.studentLabel}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    >
                      <MenuItem value="" disabled>
                        {txt.studentPlaceholder}
                      </MenuItem>
                      {students.map((s) => (
                        <MenuItem key={s.id} value={String(s.id)}>
                          {s.name}
                          {s.nickname ? ` (${s.nickname})` : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="titleAr"
                  control={control}
                  rules={{ validate: requireTitle }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={txt.titleArLabel}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="titleEn"
                  control={control}
                  rules={{ validate: requireTitle }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={txt.titleEnLabel}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="subtitleAr"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label={txt.subtitleArLabel} />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="subtitleEn"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label={txt.subtitleEnLabel} />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="bodyAr"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth multiline minRows={2} label={txt.bodyArLabel} />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="bodyEn"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth multiline minRows={2} label={txt.bodyEnLabel} />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="signature"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={txt.signatureFieldLabel}
                      placeholder={txt.defaultSignature}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5 }} />

            {/* Style section */}
            <Typography variant="overline" color="text.secondary">
              {txt.sectionStyle}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="templateKey"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label={txt.templateLabel}>
                      {TEMPLATE_KEYS.map((k) => (
                        <MenuItem key={k} value={k}>
                          {txt[k] || k}
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
                    <TextField {...field} select fullWidth label={txt.fontLabel}>
                      {FONT_STYLES.map((f) => (
                        <MenuItem key={f} value={f}>
                          {txt[FONT_LABEL_KEY[f]] || f}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Accent presets — quick color swatches. */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                  {txt.presetsLabel}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {ACCENT_PRESETS.map((color) => {
                    const isActive =
                      String(values.accent).toLowerCase() === color.toLowerCase();
                    return (
                      <Tooltip key={color} title={color}>
                        <Box
                          role="button"
                          tabIndex={0}
                          onClick={() => setValue("accent", color, { shouldDirty: true })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setValue("accent", color, { shouldDirty: true });
                            }
                          }}
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            bgcolor: color,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            border: "2px solid #fff",
                            outline: isActive
                              ? `2px solid ${color}`
                              : "2px solid transparent",
                            boxShadow: 1,
                          }}
                        >
                          {isActive && <MdCheck size={16} />}
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="accent"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="color"
                      fullWidth
                      label={txt.accentLabel}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="background"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="color"
                      fullWidth
                      label={txt.backgroundLabel}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="emoji"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={txt.emojiLabel}
                      placeholder="🌟 🏆 🌙 🎈"
                      slotProps={{ htmlInput: { maxLength: 4 } }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5 }} />

            {/* Layout section */}
            <Typography variant="overline" color="text.secondary">
              {txt.sectionLayout}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="orientation"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label={txt.orientationLabel}>
                      {ORIENTATIONS.map((o) => (
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
                    <TextField {...field} select fullWidth label={txt.borderStyleLabel}>
                      {BORDER_STYLES.map((b) => (
                        <MenuItem key={b} value={b}>
                          {txt[BORDER_LABEL_KEY[b]] || b}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="secondary"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="color"
                      fullWidth
                      label={txt.secondaryLabel}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="nameScale"
                  control={control}
                  render={({ field }) => (
                    <Box sx={{ px: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {txt.nameScaleLabel} ({Number(field.value).toFixed(2)}×)
                      </Typography>
                      <Slider
                        size="small"
                        value={Number(field.value)}
                        min={NAME_SCALE_MIN}
                        max={NAME_SCALE_MAX}
                        step={0.05}
                        onChange={(_e, val) => field.onChange(val)}
                        valueLabelDisplay="auto"
                      />
                    </Box>
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5 }} />

            {/* Branding section */}
            <Typography variant="overline" color="text.secondary">
              {txt.sectionBranding}
            </Typography>
            <Alert
              icon={<MdInfoOutline />}
              severity="info"
              sx={{ mt: 1, py: 0.25 }}
            >
              {txt.autoLogoNote}
            </Alert>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="logoSize"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label={txt.logoSizeLabel}>
                      {LOGO_SIZES.map((s) => (
                        <MenuItem key={s} value={s}>
                          {txt[LOGO_SIZE_LABEL_KEY[s]] || s}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid
                size={{ xs: 12, sm: 6 }}
                sx={{ display: "flex", alignItems: "center" }}
              >
                <Controller
                  name="showTagline"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label={txt.showTaglineLabel}
                    />
                  )}
                />
              </Grid>
              <Grid
                size={{ xs: 12, sm: 6 }}
                sx={{ display: "flex", alignItems: "center" }}
              >
                <Controller
                  name="showWatermark"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label={txt.showWatermarkLabel}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="watermarkOpacity"
                  control={control}
                  render={({ field }) => (
                    <Box sx={{ px: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {txt.watermarkOpacityLabel} ({Number(field.value).toFixed(2)})
                      </Typography>
                      <Slider
                        size="small"
                        value={Number(field.value)}
                        min={WATERMARK_OPACITY_MIN}
                        max={WATERMARK_OPACITY_MAX}
                        step={0.01}
                        disabled={!values.showWatermark}
                        onChange={(_e, val) => field.onChange(val)}
                        valueLabelDisplay="auto"
                      />
                    </Box>
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5 }} />

            {/* Footer & seal section */}
            <Typography variant="overline" color="text.secondary">
              {txt.sectionFooter}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid
                size={{ xs: 12, sm: 6 }}
                sx={{ display: "flex", alignItems: "center" }}
              >
                <Controller
                  name="showDate"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label={txt.showDateLabel}
                    />
                  )}
                />
              </Grid>
              <Grid
                size={{ xs: 12, sm: 6 }}
                sx={{ display: "flex", alignItems: "center" }}
              >
                <Controller
                  name="showSeal"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label={txt.sealToggleLabel}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="sealText"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={txt.sealTextLabel}
                      placeholder={txt.sealText}
                      disabled={!values.showSeal}
                      slotProps={{ htmlInput: { maxLength: 16 } }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="signatureTitle"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={txt.signatureTitleLabel}
                      placeholder={txt.signatureLabel}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* ── Live preview ─────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={1} sx={{ position: { md: "sticky" }, top: { md: 8 } }}>
            <Typography variant="subtitle2" color="text.secondary">
              {txt.previewLabel}
            </Typography>
            <CertificateCard certificate={previewCertificate} />
          </Stack>
        </Grid>
      </Grid>
    </FormDialog>
  );
}
