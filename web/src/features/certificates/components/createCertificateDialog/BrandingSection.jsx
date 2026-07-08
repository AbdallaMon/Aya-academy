"use client";

// Branding section of the create-certificate form: header logo size, tagline +
// watermark toggles, and the watermark-opacity slider. The academy logo itself
// is always painted (see the info alert).

import {
  Alert,
  Box,
  FormControlLabel,
  Grid,
  MenuItem,
  Slider,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { MdInfoOutline } from "react-icons/md";
import {
  LOGO_SIZES,
  WATERMARK_OPACITY_MIN,
  WATERMARK_OPACITY_MAX,
} from "../../config/constant.js";
import { LOGO_SIZE_LABEL_KEY } from "./constants.js";

export default function BrandingSection({ control, values, txt }) {
  return (
    <>
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
    </>
  );
}
