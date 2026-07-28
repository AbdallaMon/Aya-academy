"use client";

import { Alert, Grid, MenuItem, TextField, Typography } from "@mui/material";
import { Controller } from "react-hook-form";
import { MdInfoOutline } from "react-icons/md";
import { CERTIFICATE_TEMPLATE_TYPES } from "@ayah/shared";
import { RHFTextField, RHFSwitch } from "@/shared/components/index.js";
import { TEMPLATE_TYPES } from "../../config/constant.js";
import { TYPE_LABEL_KEY } from "./constants.js";

// Fixed-text section: key/type/flags + all localized headings, intros, body,
// congrats and thanks copy. `type` is the watched form value driving the
// GAME/EXAM hint alerts.
export default function TemplateTextsSection({ control, txt, type, error }) {
  return (
    <>
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
        {type === CERTIFICATE_TEMPLATE_TYPES.GAME && (
          <Grid size={{ xs: 12 }}>
            <Alert icon={<MdInfoOutline />} severity="warning" sx={{ py: 0.25 }}>
              {txt.typeGameHint}
            </Alert>
          </Grid>
        )}
        {type === CERTIFICATE_TEMPLATE_TYPES.EXAM && (
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
    </>
  );
}
