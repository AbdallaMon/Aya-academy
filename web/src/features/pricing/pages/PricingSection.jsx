'use client';

// Marketing pricing section. Reads GET /plans/public (public, no auth) and
// renders plan cards with a monthly/yearly toggle. Each plan exposes
// monthly/yearly { base, effective, discount }. Plans differ only by hours, so
// every card lists the shared real inclusions (txt.commonFeatures) plus its own
// hours. Uses the shared Section primitive for consistent rhythm + heading.

import Link from 'next/link';
import {
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { MdCheckCircle } from 'react-icons/md';
import { currencySymbol } from '@aya/shared';
import Section from '@/shared/ui/sections/Section.jsx';
import { brandTextColor } from '@/shared/ui/brandText.js';
import { iconColor } from '@/shared/ui/iconColor.js';
import { useRequest } from '../../../hooks/request/useRequest.js';
import { useTranslation } from '../../../i18n/client.js';
import { localePath } from '../../../i18n/routing.js';
import { usePricingText } from '../config/pricingText.js';

// Intl currency style renders GBP as the broken "UK£" in Arabic locales (even
// with currencyDisplay:'narrowSymbol'). So we format the NUMBER in-locale and
// attach a clean symbol ourselves → "£40" (en) / "٤٠ £" (ar).
function formatPrice(amount, currency, locale) {
  const value = Number(amount || 0);
  const code = currency || 'GBP';
  const sym = currencySymbol(code) || code;
  const num = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
  return locale && locale.startsWith('ar') ? `${num} ${sym}` : `${sym}${num}`;
}

// Placeholder card shown while /plans/public is in flight, so the section never
// flashes the "no plans" empty message before the data arrives.
function PlanSkeleton() {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Card
        elevation={2}
        sx={{
          borderRadius: 4,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: 3, flex: 1 }}>
          <Skeleton variant="text" width="55%" height={32} />
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="40%" height={48} sx={{ my: 1 }} />
          <Divider sx={{ my: 2 }} />
          <Skeleton variant="text" width="75%" />
          <Skeleton variant="text" width="85%" />
          <Skeleton variant="text" width="70%" />
          <Skeleton
            variant="rounded"
            height={42}
            sx={{ mt: 2, borderRadius: 2 }}
          />
        </CardContent>
      </Card>
    </Grid>
  );
}

export default function PricingSection() {
  const txt = usePricingText();
  const theme = useTheme();
  const { lng } = useTranslation();
  const isEn = lng === 'en';
  // Explicit price locale (don't depend on the runtime default): GBP in en-GB
  // → "£40", in ar-EG → "٤٠ £".
  const priceLocale = isEn ? 'en-GB' : 'ar-EG';

  const { data, isLoading, error, refetch } = useRequest({
    url: 'plans/public',
    method: 'get',
    isPublic: true,
    autoFetch: true,
    syncToUrl: false,
  });

  // data starts null and only becomes an array after the fetch resolves; treat
  // "not loaded yet" as loading so we show skeletons, never a false empty state.
  // On a failed fetch `data` stays null forever, so exclude the error case here —
  // otherwise the section would spin skeletons indefinitely instead of recovering.
  const loading = (isLoading || data == null) && !error;
  const plans = Array.isArray(data) ? data : [];
  // Plans are MONTHLY-only in the UI for now — the yearly toggle is hidden.

  return (
    <Section
      id="pricing"
      alt
      eyebrow={txt.eyebrow}
      title={txt.title}
      subtitle={txt.subtitle}
    >
      {!loading && error && plans.length === 0 && (
        <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {txt.errorTitle}
          </Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            {txt.retry}
          </Button>
        </Stack>
      )}

      {loading ? (
        <Grid
          container
          spacing={3}
          alignItems="stretch"
          justifyContent="center"
        >
          {[0, 1, 2].map((i) => (
            <PlanSkeleton key={i} />
          ))}
        </Grid>
      ) : error ? null : plans.length === 0 ? (
        <Typography variant="body1" color="text.secondary" textAlign="center">
          {txt.empty}
        </Typography>
      ) : (
        <Grid
          container
          spacing={3}
          alignItems="stretch"
          justifyContent="center"
        >
          {plans.map((plan) => {
            const title = isEn ? plan.titleEn : plan.titleAr;
            const description = isEn ? plan.descriptionEn : plan.descriptionAr;
            const per = txt.perMonth;
            const cycle = plan.monthly;
            const base = cycle?.base;
            const effective = cycle?.effective;
            const discount = cycle?.discount || null;
            const hasDiscount = discount && Number(effective) < Number(base);

            return (
              <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: plan.isFeatured ? 2 : 1,
                    borderColor: plan.isFeatured ? 'primary.main' : 'divider',
                    // Featured plan: a warm primary-tinted shadow (matches the rest
                    // of the page) instead of MUI's cold grey elevation={8}.
                    boxShadow: plan.isFeatured
                      ? (th) => `0 16px 40px ${alpha(th.palette.primary.main, 0.22)}`
                      : undefined,
                  }}
                >
                  {plan.isFeatured && (
                    <Chip
                      color="primary"
                      label={txt.featured}
                      sx={{
                        position: 'absolute',
                        top: 16,
                        insetInlineEnd: 16,
                        fontWeight: 700,
                      }}
                    />
                  )}
                  <CardContent
                    sx={{
                      p: 3,
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography variant="h5" component="h3" fontWeight={800}>
                      {title}
                    </Typography>
                    {description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5, mb: 2 }}
                      >
                        {description}
                      </Typography>
                    )}

                    <Stack
                      direction="row"
                      alignItems="baseline"
                      gap={1}
                      sx={{ mb: 0.5 }}
                    >
                      <Typography
                        variant="h3"
                        component="p"
                        fontWeight={800}
                        sx={{ color: brandTextColor }}
                      >
                        {formatPrice(
                          hasDiscount ? effective : base,
                          plan.currency,
                          priceLocale
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {per}
                      </Typography>
                    </Stack>

                    {hasDiscount && (
                      <Stack
                        direction="row"
                        gap={1}
                        alignItems="center"
                        sx={{ mb: 1 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ textDecoration: 'line-through' }}
                          color="text.disabled"
                        >
                          {formatPrice(base, plan.currency, priceLocale)}
                        </Typography>
                        <Chip
                          size="small"
                          color="error"
                          label={
                            discount.type === 'PERCENT'
                              ? `-${discount.value}%`
                              : `${txt.save} ${formatPrice(discount.value, plan.currency, priceLocale)}`
                          }
                        />
                      </Stack>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={1.25} sx={{ flex: 1 }}>
                      {/* The plan's differentiator — emphasized. */}
                      <Stack direction="row" gap={1} alignItems="center">
                        <MdCheckCircle color={iconColor(theme)} />
                        <Typography variant="body2" fontWeight={800}>
                          {plan.hours} {txt.hours}
                        </Typography>
                      </Stack>
                      {/* Real inclusions shared by every plan. */}
                      {txt.commonFeatures.map((feature) => (
                        <Stack
                          key={feature}
                          direction="row"
                          gap={1}
                          alignItems="center"
                        >
                          <MdCheckCircle color={iconColor(theme)} />
                          <Typography variant="body2" color="text.secondary">
                            {feature}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>

                    <Button
                      variant={plan.isFeatured ? 'contained' : 'outlined'}
                      size="large"
                      component={Link}
                      href={`${localePath(lng, '/register')}?planId=${plan.id}&billingPeriod=MONTHLY`}
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
    </Section>
  );
}
