"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  FormDialog,
  CouponControl,
  RHFTextField,
  applyApiErrorsToForm,
} from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { useTranslation } from "../../../i18n/client.js";
import { useAppSettings } from "../../settings/hooks/useAppSettings.js";
import { initialCoupon, resolveCoupon } from "../../../shared/lib/couponPricing.js";
import { SUBSCRIPTIONS_URL, PLANS_URL } from "../config/constant.js";

const FORM_ID = "add-subscription-form";
const EMPTY_COUPON = { status: "idle", code: "", quote: null, reason: null };

function addPeriod(dateStr, billingPeriod) {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (billingPeriod === "YEARLY") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

/** Effective monthly price = plan hours × the global hourly rate. */
function monthlyPriceOf(plan, hourlyRate) {
  if (!plan || plan.hours == null) return null;
  return Number(plan.hours) * Number(hourlyRate || 0);
}

/** Effective price + hours for the selected billing period (yearly = ×12). */
function deriveFromPlan(plan, billingPeriod, hourlyRate) {
  if (!plan) return { price: "", hours: "" };
  const monthly = monthlyPriceOf(plan, hourlyRate);
  if (billingPeriod === "YEARLY") {
    return {
      price: monthly != null ? String(monthly * 12) : "",
      hours: plan.hours != null ? String(Number(plan.hours) * 12) : "",
    };
  }
  return {
    price: monthly != null ? String(monthly) : "",
    hours: plan.hours != null ? String(plan.hours) : "",
  };
}

function makeDefaults(today) {
  return {
    planId: "",
    billingPeriod: "MONTHLY",
    startDate: today,
    endDate: addPeriod(today, "MONTHLY"),
    priceCharged: "",
    totalHours: "",
    remainingHours: "",
  };
}

/**
 * Create an ACTIVE subscription for a preselected student.
 *   POST subscriptions { studentId, planId?, billingPeriod, startDate, endDate, status:"ACTIVE", priceCharged?, totalHours?, remainingHours?, couponCode? }
 */
export default function AddSubscriptionDialog({ open, onClose, studentId, studentName, txt, onSuccess }) {
  const { lng } = useTranslation();
  const { showToast } = useToast();
  const { hourlyRate } = useAppSettings({ enabled: open });
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { control, handleSubmit, reset, setValue, setError } = useForm({
    defaultValues: makeDefaults(today),
  });

  const planId = useWatch({ control, name: "planId" });
  const billingPeriod = useWatch({ control, name: "billingPeriod" });
  const startDate = useWatch({ control, name: "startDate" });

  // The coupon is a composite control-state object (not a plain form field).
  const [coupon, setCoupon] = useState(EMPTY_COUPON);

  const plansReq = useRequest({
    url: PLANS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: { limit: 100 },
  });
  // Public pricing (base/effective + the plan's own coupon) for active plans.
  const publicPlansReq = useRequest({
    url: "plans/public",
    method: "get",
    isPublic: true,
    autoFetch: false,
    syncToUrl: false,
  });

  const createReq = useRequest({
    url: SUBSCRIPTIONS_URL,
    method: "post",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
    onSuccess: () => {
      onSuccess?.();
      onClose?.();
    },
    onError: (err) =>
      applyApiErrorsToForm(err, setError, {
        labelMap: {
          planId: txt.plan,
          billingPeriod: txt.billingPeriod,
          startDate: txt.startDate,
          endDate: txt.endDate,
          priceCharged: txt.priceCharged,
          totalHours: txt.totalHours,
          remainingHours: txt.remainingHours,
        },
        showToast,
        suppressFallbackToast: true,
      }),
  });

  useEffect(() => {
    if (open) {
      reset(makeDefaults(today));
      setCoupon(EMPTY_COUPON);
      plansReq.fetchData();
      publicPlansReq.fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const plans = plansReq.data || [];
  const publicPlans = publicPlansReq.data || [];
  const selectedPublicPlan =
    publicPlans.find((p) => String(p.id) === String(planId)) || null;

  // Active plans use the public pricing (so the plan's removable default discount
  // is reflected); plans missing from the public list (e.g. inactive) fall back
  // to hours × global hourly rate.
  function applyPlanSuggestions({ id, period, start, couponState }) {
    setValue("endDate", addPeriod(start, period));
    const publicPlan = publicPlans.find((p) => String(p.id) === String(id)) || null;
    if (publicPlan) {
      const { net } = resolveCoupon(publicPlan, period, couponState);
      const hrs =
        period === "YEARLY" ? Number(publicPlan.hours) * 12 : Number(publicPlan.hours);
      setValue("priceCharged", String(net));
      setValue("totalHours", String(hrs));
      setValue("remainingHours", String(hrs));
      return;
    }
    const adminPlan = plans.find((p) => String(p.id) === String(id)) || null;
    const { price, hours } = deriveFromPlan(adminPlan, period, hourlyRate);
    setValue("priceCharged", price);
    setValue("totalHours", hours);
    setValue("remainingHours", hours);
  }

  function onPlanChange(id) {
    setValue("planId", id);
    const publicPlan = publicPlans.find((p) => String(p.id) === String(id)) || null;
    const c = initialCoupon(publicPlan, billingPeriod);
    setCoupon(c);
    applyPlanSuggestions({ id, period: billingPeriod, start: startDate, couponState: c });
  }

  function onPeriodChange(period) {
    setValue("billingPeriod", period);
    const publicPlan = publicPlans.find((p) => String(p.id) === String(planId)) || null;
    const c = initialCoupon(publicPlan, period);
    setCoupon(c);
    applyPlanSuggestions({ id: planId, period, start: startDate, couponState: c });
  }

  function onStartChange(v) {
    setValue("startDate", v);
    setValue("endDate", addPeriod(v, billingPeriod));
  }

  function onCouponChange(c) {
    setCoupon(c);
    if (selectedPublicPlan) {
      const { net } = resolveCoupon(selectedPublicPlan, billingPeriod, c);
      setValue("priceCharged", String(net));
    }
  }

  const { codeToSend } = resolveCoupon(selectedPublicPlan, billingPeriod, coupon);

  function submit(values) {
    if (!studentId || !values.startDate || !values.endDate) return;
    createReq.fetchData(null, {
      studentId: Number(studentId),
      planId: values.planId ? Number(values.planId) : undefined,
      billingPeriod: values.billingPeriod,
      startDate: values.startDate,
      endDate: values.endDate,
      status: "ACTIVE",
      ...(codeToSend ? { couponCode: codeToSend } : {}),
      ...(values.priceCharged !== "" ? { priceCharged: Number(values.priceCharged) } : {}),
      ...(values.totalHours !== "" ? { totalHours: Number(values.totalHours) } : {}),
      ...(values.remainingHours !== "" ? { remainingHours: Number(values.remainingHours) } : {}),
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.addSubscription}
      subtitle={studentName}
      maxWidth="sm"
      loading={createReq.isLoading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {studentName}
          </Typography>
          <TextField
            select
            label={txt.plan}
            value={planId}
            onChange={(e) => onPlanChange(e.target.value)}
            fullWidth
          >
            {plans.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {lng === "en" ? p.titleEn : p.titleAr}
              </MenuItem>
            ))}
          </TextField>

          <ToggleButtonGroup
            value={billingPeriod}
            exclusive
            color="primary"
            size="small"
            fullWidth
            onChange={(_e, v) => v && onPeriodChange(v)}
            aria-label={txt.billingPeriod}
          >
            <ToggleButton value="MONTHLY">{txt.monthly}</ToggleButton>
            <ToggleButton value="YEARLY">{txt.yearly}</ToggleButton>
          </ToggleButtonGroup>

          <Stack direction="row" spacing={2}>
            <TextField
              type="date"
              label={txt.startDate}
              value={startDate}
              onChange={(e) => onStartChange(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <RHFTextField
              name="endDate"
              control={control}
              type="date"
              label={txt.endDate}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {selectedPublicPlan && (
            <CouponControl
              plan={selectedPublicPlan}
              billingPeriod={billingPeriod}
              coupon={coupon}
              onCoupon={onCouponChange}
            />
          )}

          <RHFTextField
            name="priceCharged"
            control={control}
            type="number"
            label={txt.priceCharged}
            helperText={codeToSend ? txt.priceCouponNote : undefined}
          />

          <Stack direction="row" spacing={2}>
            <RHFTextField
              name="totalHours"
              control={control}
              type="number"
              label={txt.totalHours}
            />
            <RHFTextField
              name="remainingHours"
              control={control}
              type="number"
              label={txt.remainingHours}
            />
          </Stack>
        </Stack>
      </form>
    </FormDialog>
  );
}
