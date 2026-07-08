"use client";

import { Divider, Grid, MenuItem, TextField, Typography } from "@mui/material";
import { Controller } from "react-hook-form";
import { RHFSwitch } from "@/shared/components/index.js";
import { TEMPLATE_ORIENTATIONS, TEMPLATE_BORDER_STYLES } from "../../config/constant.js";
import { ORIENTATION_LABEL_KEY, BORDER_LABEL_KEY } from "./constants.js";

// Core style block: orientation + border + the four color pickers + the
// show-photo / show-bismillah toggles.
export default function TemplateStyleSection({ control, txt }) {
  return (
    <>
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
    </>
  );
}
