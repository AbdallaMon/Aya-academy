"use client";

// Footer & seal section of the create-certificate form: show-date + show-seal
// toggles, the seal-text override, and the signature title.

import {
  FormControlLabel,
  Grid,
  Switch,
  Typography,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { RHFTextField } from "../../../../shared/components/index.js";

export default function FooterSection({ control, values, txt }) {
  return (
    <>
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
          <RHFTextField
            name="sealText"
            control={control}
            label={txt.sealTextLabel}
            placeholder={txt.sealText}
            disabled={!values.showSeal}
            slotProps={{ htmlInput: { maxLength: 16 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <RHFTextField
            name="signatureTitle"
            control={control}
            label={txt.signatureTitleLabel}
            placeholder={txt.signatureLabel}
          />
        </Grid>
      </Grid>
    </>
  );
}
