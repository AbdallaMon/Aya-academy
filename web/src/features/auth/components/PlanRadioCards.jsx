"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { formatMoney } from "../../../shared/lib/money.js";

/** Plans as single-select (radio) cards for one billing cycle. */
export default function PlanRadioCards({
  plans,
  billingPeriod,
  selectedPlanId,
  onSelect,
  lng,
  txt,
}) {
  if (!plans || plans.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
        {txt.noPlans}
      </Typography>
    );
  }

  const isYearly = billingPeriod === "YEARLY";

  return (
    <Grid container spacing={2}>
      {plans.map((p) => {
        const cycle = isYearly ? p.yearly : p.monthly;
        const base = cycle?.base;
        const effective = cycle?.effective;
        const discount = cycle?.discount || null;
        const hasDiscount =
          discount != null && effective != null && effective < base;
        const discountLabel =
          discount &&
          (discount.type === "PERCENT"
            ? `-${discount.value}%`
            : `-${formatMoney(discount.value, p.currency)}`);
        const selected = selectedPlanId === p.id;

        return (
          <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              variant="outlined"
              onClick={() => onSelect(p.id)}
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(p.id);
                }
              }}
              sx={{
                height: "100%",
                cursor: "pointer",
                borderColor: selected ? "primary.main" : "divider",
                borderWidth: selected ? 2 : 1,
                boxShadow: selected ? 4 : 0,
                transition: "all .15s ease",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent sx={{ flex: 1 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="h6" fontWeight={800}>
                    {lng === "en" ? p.titleEn : p.titleAr}
                  </Typography>
                  {selected && <Chip size="small" color="primary" label="✓" />}
                </Stack>

                <Stack direction="row" alignItems="baseline" spacing={1}>
                  <Typography variant="h4" fontWeight={900} color="primary">
                    {formatMoney(hasDiscount ? effective : base, p.currency)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isYearly ? txt.perYear : txt.perMonth}
                  </Typography>
                </Stack>

                {hasDiscount && (
                  <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textDecoration: "line-through" }}
                    >
                      {txt.was} {formatMoney(base, p.currency)}
                    </Typography>
                    {discountLabel && (
                      <Chip size="small" color="error" label={discountLabel} />
                    )}
                  </Stack>
                )}

                <Typography variant="body2" color="text.secondary" mt={1}>
                  {p.hours} {txt.hours}
                </Typography>
                {(lng === "en" ? p.descriptionEn : p.descriptionAr) && (
                  <Typography variant="body2" mt={1}>
                    {lng === "en" ? p.descriptionEn : p.descriptionAr}
                  </Typography>
                )}
              </CardContent>
              <Box sx={{ px: 2, pb: 2 }}>
                <Chip
                  size="small"
                  variant={selected ? "filled" : "outlined"}
                  color={selected ? "primary" : "default"}
                  label={selected ? `${txt.choosePlan} ✓` : txt.choosePlan}
                  sx={{ width: "100%" }}
                />
              </Box>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
