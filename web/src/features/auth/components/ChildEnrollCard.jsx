"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import PlanRadioCards from "./PlanRadioCards.jsx";
import { PasswordField, CouponControl } from "../../../shared/components/index.js";
import { initialCoupon } from "../../../shared/lib/couponPricing.js";

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
  const selectedPlan = plans.find((p) => p.id === child.planId) || null;

  const setField = (key) => (e) => onChange({ [key]: e.target.value });

  // Selecting a plan / switching the cycle resets the coupon to that plan's
  // removable default (its own coupon, if any) for the new context.
  const handleBilling = (_e, value) => {
    if (!value) return;
    onChange({ billingPeriod: value, coupon: initialCoupon(selectedPlan, value) });
  };

  const handleSelectPlan = (planId) => {
    const plan = plans.find((p) => p.id === planId) || null;
    onChange({ planId, coupon: initialCoupon(plan, child.billingPeriod) });
  };

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
            <PasswordField
              label={txt.password}
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

        {child.planId && (
          <Box sx={{ mt: 2 }}>
            <CouponControl
              plan={selectedPlan}
              billingPeriod={child.billingPeriod}
              coupon={child.coupon}
              onCoupon={(c) => onChange({ coupon: c })}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
