"use client";

// Marketing pricing section. Reads GET /plans/public (public, no auth) and
// renders plan cards with effectivePrice/currency. Also surfaces the prominent
// free-game CTA. Mirrors the marketing section shape (Box + Container + Grid).

import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { MdCheckCircle } from "react-icons/md";
import { sectionYPadding } from "../../shared/utlis/constants";
import { useRequest } from "../../hooks/request/useRequest.js";
import { useTranslation } from "../../i18n/client.js";
import { localePath } from "../../i18n/routing.js";
import { usePricingText } from "./config/pricingText.js";

function formatPrice(amount, currency) {
  const value = Number(amount || 0);
  const code = currency || "GBP";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} ${code}`;
  }
}

export default function PricingSection() {
  const txt = usePricingText();
  const { lng } = useTranslation();
  const isEn = lng === "en";

  const { data } = useRequest({
    url: "plans/public",
    method: "get",
    isPublic: true,
    autoFetch: true,
    syncToUrl: false,
  });

  const plans = Array.isArray(data) ? data : [];

  return (
    <Box id="pricing" sx={{ py: sectionYPadding, backgroundColor: "background.default" }}>
      <Container maxWidth="lg">
        <Stack spacing={1.5} alignItems="center" sx={{ textAlign: "center", mb: 5 }}>
          <Typography variant="h6" color="success.main" fontWeight={600}>
            {txt.eyebrow.toUpperCase()}
          </Typography>
          <Typography variant="h2">{txt.title}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, maxWidth: 640 }} color="text.secondary">
            {txt.subtitle}
          </Typography>
        </Stack>

        {plans.length === 0 ? (
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {txt.empty}
          </Typography>
        ) : (
          <Grid container spacing={3} alignItems="stretch" justifyContent="center">
            {plans.map((plan) => {
              const title = isEn ? plan.titleEn : plan.titleAr;
              const description = isEn ? plan.descriptionEn : plan.descriptionAr;
              const per = plan.billingPeriod === "YEARLY" ? txt.perYear : txt.perMonth;
              const hasDiscount =
                plan.discount && Number(plan.effectivePrice) < Number(plan.basePrice);

              return (
                <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    elevation={plan.isFeatured ? 8 : 2}
                    sx={{
                      borderRadius: 4,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      border: plan.isFeatured ? 2 : 1,
                      borderColor: plan.isFeatured ? "primary.main" : "divider",
                    }}
                  >
                    {plan.isFeatured && (
                      <Chip
                        color="primary"
                        label={txt.featured}
                        sx={{
                          position: "absolute",
                          top: 16,
                          insetInlineEnd: 16,
                          fontWeight: 700,
                        }}
                      />
                    )}
                    <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
                      <Typography variant="h5" fontWeight={800}>
                        {title}
                      </Typography>
                      {description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                          {description}
                        </Typography>
                      )}

                      <Stack direction="row" alignItems="baseline" gap={1} sx={{ mb: 0.5 }}>
                        <Typography variant="h3" fontWeight={800} color="primary.main">
                          {formatPrice(plan.effectivePrice, plan.currency)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {per}
                        </Typography>
                      </Stack>

                      {hasDiscount && (
                        <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ textDecoration: "line-through" }}
                            color="text.disabled"
                          >
                            {formatPrice(plan.basePrice, plan.currency)}
                          </Typography>
                          <Chip
                            size="small"
                            color="error"
                            label={
                              plan.discount.type === "PERCENT"
                                ? `-${plan.discount.value}%`
                                : `${txt.save} ${formatPrice(plan.discount.value, plan.currency)}`
                            }
                          />
                        </Stack>
                      )}

                      <Divider sx={{ my: 2 }} />

                      <Stack spacing={1} sx={{ flex: 1 }}>
                        <Stack direction="row" gap={1} alignItems="center">
                          <MdCheckCircle color="#1ABC9C" />
                          <Typography variant="body2">
                            {plan.hours} {txt.hours}
                          </Typography>
                        </Stack>
                      </Stack>

                      <Button
                        variant={plan.isFeatured ? "contained" : "outlined"}
                        size="large"
                        component={Link}
                        href={localePath(lng, "/register")}
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        {txt.subscribe}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
