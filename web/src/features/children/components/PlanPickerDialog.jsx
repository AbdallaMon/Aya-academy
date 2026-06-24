"use client";

import { useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { FormDialog } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { PLANS_PUBLIC_URL, formatGBP } from "../config/constant.js";

/** Shows the public plans and requests one (PENDING) for the given child. */
export default function PlanPickerDialog({
  open,
  onClose,
  child,
  onRequest,
  requesting,
  txt,
}) {
  const { lng } = useTranslation();

  const plansReq = useRequest({
    url: PLANS_PUBLIC_URL,
    method: "get",
    isPublic: true,
    autoFetch: false,
    syncToUrl: false,
  });

  useEffect(() => {
    if (open) plansReq.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const plans = plansReq.data || [];

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={`${txt.pickPlanTitle} ${child?.name || ""}`}
      maxWidth="md"
      actions={null}
      showCloseIcon
    >
      {plans.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
          {txt.noPlans}
        </Typography>
      ) : (
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {plans.map((p) => {
            const hasDiscount =
              p.effectivePrice != null && p.effectivePrice < p.basePrice;
            return (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    borderColor: p.isFeatured ? "primary.main" : "divider",
                    borderWidth: p.isFeatured ? 2 : 1,
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
                      {p.isFeatured && (
                        <Chip size="small" color="primary" label="★" />
                      )}
                    </Stack>

                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <Typography variant="h4" fontWeight={900} color="primary">
                        {formatGBP(hasDiscount ? p.effectivePrice : p.basePrice)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.billingPeriod === "YEARLY" ? txt.perYear : txt.perMonth}
                      </Typography>
                    </Stack>

                    {hasDiscount && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textDecoration: "line-through" }}
                      >
                        {txt.was} {formatGBP(p.basePrice)}
                      </Typography>
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
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={requesting}
                      onClick={() => onRequest(p)}
                    >
                      {requesting ? txt.requesting : txt.request}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </FormDialog>
  );
}
