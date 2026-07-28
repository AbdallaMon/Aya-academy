"use client";

import { Box, Divider, Grid, MenuItem, Slider, TextField, Typography } from "@mui/material";
import { Controller } from "react-hook-form";
import { RHFTextField, RHFSwitch } from "@/shared/components/index.js";
import {
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
} from "../../config/constant.js";
import { DECORATION_LABEL_KEY, FONT_LABEL_KEY, LOGO_SIZE_LABEL_KEY } from "./constants.js";

// "More" style block: decoration/font/logo selects, seal text, the four scale
// sliders, and the remaining visibility toggles. `showSeal` / `showWatermark`
// (watched form values) gate the seal-text input + watermark slider.
export default function TemplateMoreSection({ control, txt, showSeal, showWatermark }) {
  return (
    <>
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
    </>
  );
}
