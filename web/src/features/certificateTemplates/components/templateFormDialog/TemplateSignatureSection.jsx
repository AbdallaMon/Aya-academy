"use client";

import { Divider, Grid, Typography } from "@mui/material";
import { RHFTextField } from "@/shared/components/index.js";

// Signature block: signer name + localized signer titles.
export default function TemplateSignatureSection({ control, txt }) {
  return (
    <>
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
    </>
  );
}
