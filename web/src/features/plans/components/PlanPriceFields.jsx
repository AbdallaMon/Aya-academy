"use client";

import { Grid, Stack, Typography } from "@mui/material";
import { RHFTextField } from "../../../shared/components/index.js";
import { formatMoney } from "../../../shared/lib/money.js";

/**
 * Hours input + a read-only live price preview.
 *
 * A plan now stores ONLY its hours. The price is always derived from the single
 * global hourly rate (from Settings): monthly = hours × rate, yearly = ×12. We
 * show the computed figures so the admin sees the resulting price as they type.
 */
export default function PlanPriceFields({ control, watch, txt, hourlyRate, currency }) {
  const hours = Number(watch("hours")) || 0;
  const rate = Number(hourlyRate) || 0;
  const monthly = hours * rate;
  const yearly = monthly * 12;

  return (
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, sm: 6 }}>
        <RHFTextField
          name="hours"
          control={control}
          label={txt.hours}
          type="number"
          rules={{ required: txt.required }}
          helperText={txt.hoursHint}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Stack spacing={0.25}>
          <Typography variant="caption" color="text.secondary">
            {`${txt.hourlyRate}: ${formatMoney(rate, currency)}`}
          </Typography>
          <Typography fontWeight={700}>
            {`${formatMoney(monthly, currency)} ${txt.perMonth}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {`${formatMoney(yearly, currency)} ${txt.perYear}`}
          </Typography>
        </Stack>
      </Grid>
    </Grid>
  );
}
