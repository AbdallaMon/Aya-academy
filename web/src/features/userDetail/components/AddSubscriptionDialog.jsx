"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { FormDialog, CouponControl } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { useAppSettings } from "../../settings/hooks/useAppSettings.js";
import { initialCoupon, resolveCoupon } from "../../../shared/lib/couponPricing.js";
import { SUBSCRIPTIONS_URL, PLANS_URL } from "../config/constant.js";

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

/**
 * Create an ACTIVE subscription for a preselected student.
 *   POST subscriptions { studentId, planId?, billingPeriod, startDate, endDate, status:"ACTIVE", priceCharged?, totalHours?, remainingHours?, couponCode? }
 */
export default function AddSubscriptionDialog({ open, onClose, studentId, studentName, txt, onSuccess }) {
  const { lng } = useTranslation();
  const { hourlyRate } = useAppSettings({ enabled: open });
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [planId, setPlanId] = useState("");
  const [billingPeriod, setBillingPeriod] = useState("MONTHLY");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addPeriod(today, "MONTHLY"));
  const [priceCharged, setPriceCharged] = useState("");
  const [totalHours, setTotalHours] = useState("");
  const [remainingHours, setRemainingHours] = useState("");
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
  });

  useEffect(() => {
    if (open) {
      setPlanId("");
      setBillingPeriod("MONTHLY");
      setStartDate(today);
      setEndDate(addPeriod(today, "MONTHLY"));
      setPriceCharged("");
      setTotalHours("");
      setRemainingHours("");
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
    setEndDate(addPeriod(start, period));
    const publicPlan = publicPlans.find((p) => String(p.id) === String(id)) || null;
    if (publicPlan) {
      const { net } = resolveCoupon(publicPlan, period, couponState);
      const hrs =
        period === "YEARLY" ? Number(publicPlan.hours) * 12 : Number(publicPlan.hours);
      setPriceCharged(String(net));
      setTotalHours(String(hrs));
      setRemainingHours(String(hrs));
      return;
    }
    const adminPlan = plans.find((p) => String(p.id) === String(id)) || null;
    const { price, hours } = deriveFromPlan(adminPlan, period, hourlyRate);
    setPriceCharged(price);
    setTotalHours(hours);
    setRemainingHours(hours);
  }

  function onPlanChange(id) {
    setPlanId(id);
    const publicPlan = publicPlans.find((p) => String(p.id) === String(id)) || null;
    const c = initialCoupon(publicPlan, billingPeriod);
    setCoupon(c);
    applyPlanSuggestions({ id, period: billingPeriod, start: startDate, couponState: c });
  }

  function onPeriodChange(period) {
    setBillingPeriod(period);
    const publicPlan = publicPlans.find((p) => String(p.id) === String(planId)) || null;
    const c = initialCoupon(publicPlan, period);
    setCoupon(c);
    applyPlanSuggestions({ id: planId, period, start: startDate, couponState: c });
  }

  function onStartChange(v) {
    setStartDate(v);
    setEndDate(addPeriod(v, billingPeriod));
  }

  function onCouponChange(c) {
    setCoupon(c);
    if (selectedPublicPlan) {
      const { net } = resolveCoupon(selectedPublicPlan, billingPeriod, c);
      setPriceCharged(String(net));
    }
  }

  const { codeToSend } = resolveCoupon(selectedPublicPlan, billingPeriod, coupon);

  function submit() {
    if (!studentId || !startDate || !endDate) return;
    createReq.fetchData(null, {
      studentId: Number(studentId),
      planId: planId ? Number(planId) : undefined,
      billingPeriod,
      startDate,
      endDate,
      status: "ACTIVE",
      ...(codeToSend ? { couponCode: codeToSend } : {}),
      ...(priceCharged !== "" ? { priceCharged: Number(priceCharged) } : {}),
      ...(totalHours !== "" ? { totalHours: Number(totalHours) } : {}),
      ...(remainingHours !== "" ? { remainingHours: Number(remainingHours) } : {}),
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
      onSubmit={submit}
    >
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
          <TextField
            type="date"
            label={txt.endDate}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
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

        <TextField
          type="number"
          label={txt.priceCharged}
          value={priceCharged}
          onChange={(e) => setPriceCharged(e.target.value)}
          fullWidth
          helperText={codeToSend ? txt.priceCouponNote : undefined}
        />

        <Stack direction="row" spacing={2}>
          <TextField
            type="number"
            label={txt.totalHours}
            value={totalHours}
            onChange={(e) => setTotalHours(e.target.value)}
            fullWidth
          />
          <TextField
            type="number"
            label={txt.remainingHours}
            value={remainingHours}
            onChange={(e) => setRemainingHours(e.target.value)}
            fullWidth
          />
        </Stack>
      </Stack>
    </FormDialog>
  );
}
