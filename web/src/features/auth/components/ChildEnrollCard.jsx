"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import PlanRadioCards from "./PlanRadioCards.jsx";
import CouponField from "./CouponField.jsx";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { PLAN_QUOTE_URL } from "../config/constant.js";
import { formatMoney } from "../../../shared/lib/money.js";

export default function ChildEnrollCard({
  index,
  child,
  plans,
  onChange,
  onRemove,
  canRemove,
  errors = {},
  txt,
  lng,
}) {
  const quoteReq = useRequest({
    url: PLAN_QUOTE_URL,
    method: "post",
    isPublic: true,
    syncToUrl: false,
  });

  const coupon = child.coupon || {
    code: "",
    status: "idle",
    reason: null,
    quote: null,
  };

  // The plan may carry its own (auto-applied) coupon for the chosen cycle. When
  // it does we surface it as a LOCKED chip — it follows plan/cycle changes and
  // the parent can't remove it. The server applies it automatically, so we never
  // send it as a typed couponCode.
  const selectedPlan = plans.find((p) => p.id === child.planId) || null;
  const cycle = selectedPlan
    ? child.billingPeriod === "YEARLY"
      ? selectedPlan.yearly
      : selectedPlan.monthly
    : null;
  const planCoupon = cycle?.discount?.code ? cycle.discount : null;
  const planCouponLabel =
    planCoupon &&
    (planCoupon.type === "PERCENT"
      ? `-${planCoupon.value}%`
      : `-${formatMoney(planCoupon.value, selectedPlan.currency)}`);

  const setField = (key) => (e) => onChange({ [key]: e.target.value });

  const handleBilling = (_e, value) => {
    if (!value) return;
    // Changing the cycle invalidates any applied coupon.
    onChange({
      billingPeriod: value,
      coupon: { ...coupon, status: "idle", reason: null, quote: null },
    });
  };

  const handleSelectPlan = (planId) => {
    // Changing the plan invalidates any applied coupon.
    onChange({
      planId,
      coupon: { ...coupon, status: "idle", reason: null, quote: null },
    });
  };

  const verifyCoupon = async () => {
    if (!child.planId) return;
    try {
      const res = await quoteReq.fetchData(null, {
        planId: child.planId,
        billingPeriod: child.billingPeriod,
        couponCode: coupon.code.trim(),
      });
      const data = res?.data;
      if (data?.couponValid) {
        onChange({
          coupon: { ...coupon, status: "valid", reason: null, quote: data },
        });
      } else {
        onChange({
          coupon: {
            ...coupon,
            status: "invalid",
            reason: data?.reason || null,
            quote: null,
          },
        });
      }
    } catch {
      onChange({
        coupon: { ...coupon, status: "invalid", reason: null, quote: null },
      });
    }
  };

  const removeCoupon = () =>
    onChange({ coupon: { code: "", status: "idle", reason: null, quote: null } });

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" fontWeight={800}>
            {txt.childTitle} — {txt.childNumber} {index + 1}
          </Typography>
          {canRemove && (
            <Button color="error" size="small" onClick={onRemove}>
              {txt.removeChild}
            </Button>
          )}
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.childName}
              value={child.name}
              onChange={setField("name")}
              error={Boolean(errors.name)}
              helperText={errors.name}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.nickname}
              value={child.nickname}
              onChange={setField("nickname")}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.email}
              type="email"
              value={child.email}
              onChange={setField("email")}
              error={Boolean(errors.email)}
              helperText={errors.email}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.password}
              type="password"
              value={child.password}
              onChange={setField("password")}
              error={Boolean(errors.password)}
              helperText={errors.password}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={txt.birthDate}
              type="date"
              value={child.birthDate}
              onChange={setField("birthDate")}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Alert severity="success" icon={false} sx={{ mb: 1 }}>
          {txt.giftBanner}
        </Alert>
        <Alert severity="info" icon={false} sx={{ mb: 2 }}>
          {txt.paymentNotice}
        </Alert>

        <Stack direction="row" justifyContent="center" mb={2}>
          <ToggleButtonGroup
            value={child.billingPeriod}
            exclusive
            color="primary"
            size="small"
            onChange={handleBilling}
          >
            <ToggleButton value="MONTHLY">{txt.monthly}</ToggleButton>
            <ToggleButton value="YEARLY">{txt.yearly}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <PlanRadioCards
          plans={plans}
          billingPeriod={child.billingPeriod}
          selectedPlanId={child.planId}
          onSelect={handleSelectPlan}
          lng={lng}
          txt={txt}
        />
        {errors.planId && (
          <Typography
            color="error"
            variant="caption"
            sx={{ mt: 1, display: "block" }}
          >
            {errors.planId}
          </Typography>
        )}

        <Box sx={{ mt: 2 }}>
          {planCoupon ? (
            <Alert severity="success" icon={false}>
              <Stack spacing={0.5}>
                <Typography fontWeight={700}>{txt.planCouponTitle}</Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Chip size="small" color="success" label={planCoupon.code} />
                  {planCouponLabel && (
                    <Chip size="small" color="error" label={planCouponLabel} />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {txt.planCouponNote}
                  </Typography>
                </Stack>
              </Stack>
            </Alert>
          ) : (
            <CouponField
              code={coupon.code}
              status={coupon.status}
              reason={coupon.reason}
              net={coupon.quote?.net ?? null}
              currency={coupon.quote?.currency}
              disabled={!child.planId}
              verifying={quoteReq.isLoading}
              onCodeChange={(value) =>
                onChange({ coupon: { ...coupon, code: value } })
              }
              onVerify={verifyCoupon}
              onRemove={removeCoupon}
              txt={txt}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
