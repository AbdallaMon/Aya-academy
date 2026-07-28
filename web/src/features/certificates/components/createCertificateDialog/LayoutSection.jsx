"use client";

// Layout section of the create-certificate form: orientation, border style,
// secondary color, and the student-name scale slider.

import {
  Box,
  Grid,
  MenuItem,
  Slider,
  TextField,
  Typography,
} from "@mui/material";
import { Controller } from "react-hook-form";
import {
  ORIENTATIONS,
  BORDER_STYLES,
  NAME_SCALE_MIN,
  NAME_SCALE_MAX,
} from "../../config/constant.js";
import { ORIENTATION_LABEL_KEY, BORDER_LABEL_KEY } from "./constants.js";

export default function LayoutSection({ control, txt }) {
  return (
    <>
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
    </>
  );
}
