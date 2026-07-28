'use client';

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
} from '@mui/material';
import { MdCheckCircle } from 'react-icons/md';
import { currencySymbol } from '@ayah/shared';
import { useRequest } from '@/hooks/request/useRequest.js';
import { localePath } from '@/i18n/routing.js';
import { pricingText } from '../config/pricingText.js';

function formatPrice(amount, currency, locale) {
  const value = Number(amount || 0);
  const code = currency || 'GBP';
  const symbol = currencySymbol(code) || code;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
  return locale.startsWith('ar') ? `${number} ${symbol}` : `${symbol}${number}`;
}

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
          <Skeleton variant="rounded" height={42} sx={{ mt: 2, borderRadius: 2 }} />
        </CardContent>
      </Card>
    </Grid>
  );
}

function CheckIcon() {
  return (
    <Typography component="span" sx={{ display: 'inline-flex', color: 'primary.main', flexShrink: 0 }}>
      <MdCheckCircle color="currentColor" />
    </Typography>
  );
}

export default function PricingPlansClient({ lng = 'en' }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const text = pricingText[language];
  const isEnglish = language === 'en';
  const priceLocale = isEnglish ? 'en-GB' : 'ar-EG';

  const { data, isLoading, error, refetch } = useRequest({
    url: 'plans/public',
    method: 'get',
    isPublic: true,
    autoFetch: true,
    syncToUrl: false,
  });

  const loading = (isLoading || data == null) && !error;
  const plans = Array.isArray(data) ? data : [];

  if (!loading && error && plans.length === 0) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          {text.errorTitle}
        </Typography>
        <Button variant="outlined" onClick={() => refetch()}>
          {text.retry}
        </Button>
      </Stack>
    );
  }

  if (loading) {
    return (
      <Grid container spacing={3} alignItems="stretch" justifyContent="center">
        {[0, 1, 2].map((index) => <PlanSkeleton key={index} />)}
      </Grid>
    );
  }

  if (error) return null;

  if (plans.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" textAlign="center">
        {text.empty}
      </Typography>
    );
  }

  return (
    <Grid container spacing={3} alignItems="stretch" justifyContent="center">
      {plans.map((plan) => {
        const title = isEnglish ? plan.titleEn : plan.titleAr;
        const description = isEnglish ? plan.descriptionEn : plan.descriptionAr;
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
                boxShadow: plan.isFeatured
                  ? '0 16px 40px rgba(26, 188, 156, 0.22)'
                  : undefined,
              }}
            >
              {plan.isFeatured && (
                <Chip
                  color="primary"
                  label={text.featured}
                  sx={{
                    position: 'absolute',
                    top: 16,
                    insetInlineEnd: 16,
                    fontWeight: 700,
                  }}
                />
              )}
              <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" component="h3" fontWeight={800}>
                  {title}
                </Typography>
                {description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                    {description}
                  </Typography>
                )}

                <Stack direction="row" alignItems="baseline" gap={1} sx={{ mb: 0.5 }}>
                  <Typography variant="h3" component="p" fontWeight={800} sx={{ color: 'brandText' }}>
                    {formatPrice(hasDiscount ? effective : base, plan.currency, priceLocale)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {text.perMonth}
                  </Typography>
                </Stack>

                {hasDiscount && (
                  <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ textDecoration: 'line-through' }} color="text.disabled">
                      {formatPrice(base, plan.currency, priceLocale)}
                    </Typography>
                    <Chip
                      size="small"
                      color="error"
                      label={
                        discount.type === 'PERCENT'
                          ? `-${discount.value}%`
                          : `${text.save} ${formatPrice(discount.value, plan.currency, priceLocale)}`
                      }
                    />
                  </Stack>
                )}

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1.25} sx={{ flex: 1 }}>
                  <Stack direction="row" gap={1} alignItems="center">
                    <CheckIcon />
                    <Typography variant="body2" fontWeight={800}>
                      {plan.hours} {text.hours}
                    </Typography>
                  </Stack>
                  {text.commonFeatures.map((feature) => (
                    <Stack key={feature} direction="row" gap={1} alignItems="center">
                      <CheckIcon />
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
                  href={`${localePath(language, '/register')}?planId=${plan.id}&billingPeriod=MONTHLY`}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  {text.subscribe}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
