"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { FormDialog, CouponControl } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { useAppSettings } from "../../settings/hooks/useAppSettings.js";
import { initialCoupon, resolveCoupon } from "../../../shared/lib/couponPricing.js";
import { USERS_URL, PLANS_URL } from "../config/constant.js";

const FORM_ID = "subscription-create-form";
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

function makeDefaults(today, studentId = "") {
  return {
    studentId,
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
 * Admin-only: create an ACTIVE subscription for a student directly.
 * When `lockedStudent` ({ id, name }) is provided (embedded in a user's detail
 * tab) the student is preset + shown read-only instead of the picker.
 */
export default function SubscriptionCreateDialog({
  open,
  onClose,
  onCreate,
  txt,
  loading,
  lockedStudent = null,
}) {
  const { lng } = useTranslation();
  const { hourlyRate } = useAppSettings({ enabled: open });
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const lockedStudentId = lockedStudent?.id ?? "";

  const { control, handleSubmit, reset, getValues, setValue } = useForm({
    defaultValues: makeDefaults(today, lockedStudentId),
  });

  // The coupon is a complex async sub-state object ({ status, code, quote, reason })
  // owned by CouponControl, not a posted form field — only the derived `codeToSend`
  // ever reaches the payload. Kept as local state (mirrors CouponFormDialog keeping
  // non-field concerns out of RHF).
  const [coupon, setCoupon] = useState(EMPTY_COUPON);

  const studentsReq = useRequest({
    url: USERS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: { limit: 100, role: "STUDENT" },
  });
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

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (open) {
      // No need to load the student picker when the student is locked.
      if (!lockedStudent) studentsReq.fetchData();
      plansReq.fetchData();
      publicPlansReq.fetchData();
      reset(makeDefaults(today, lockedStudentId));
      setCoupon(EMPTY_COUPON);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const students = (studentsReq.data || []).filter((u) => u.role === "STUDENT");
  const plans = plansReq.data || [];
  const publicPlans = publicPlansReq.data || [];

  // useWatch on planId/billingPeriod drives the cascading "selected public plan"
  // lookup that gates the CouponControl and the coupon→price resolution below.
  const planId = useWatch({ control, name: "planId" });
  const billingPeriod = useWatch({ control, name: "billingPeriod" });
  const selectedPublicPlan =
    publicPlans.find((p) => String(p.id) === String(planId)) || null;

  // Derive price + hours. Active plans use the public pricing (so the plan's
  // removable default discount is reflected); plans missing from the public list
  // (e.g. inactive) fall back to hours × global hourly rate.
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
    applyPlanSuggestions({
      id,
      period: billingPeriod,
      start: getValues("startDate"),
      couponState: c,
    });
  }

  function onPeriodChange(period) {
    setValue("billingPeriod", period);
    const publicPlan = publicPlans.find((p) => String(p.id) === String(planId)) || null;
    const c = initialCoupon(publicPlan, period);
    setCoupon(c);
    applyPlanSuggestions({
      id: planId,
      period,
      start: getValues("startDate"),
      couponState: c,
    });
  }

  function onStartChange(v) {
    setValue("startDate", v);
    setValue("endDate", addPeriod(v, getValues("billingPeriod")));
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
    if (!values.studentId || !values.startDate || !values.endDate) return;
    onCreate({
      studentId: Number(values.studentId),
      planId: values.planId ? Number(values.planId) : undefined,
      billingPeriod: values.billingPeriod,
      startDate: values.startDate,
      endDate: values.endDate,
      status: "ACTIVE",
      ...(codeToSend ? { couponCode: codeToSend } : {}),
      ...(values.priceCharged !== "" ? { priceCharged: Number(values.priceCharged) } : {}),
      ...(values.totalHours !== "" ? { totalHours: Number(values.totalHours) } : {}),
      ...(values.remainingHours !== ""
        ? { remainingHours: Number(values.remainingHours) }
        : {}),
    });
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.createTitle}
      maxWidth="sm"
      loading={loading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {lockedStudent ? (
            <TextField
              label={txt.selectStudent}
              value={lockedStudent.name || `#${lockedStudent.id}`}
              fullWidth
              InputProps={{ readOnly: true }}
              disabled
            />
          ) : (
            <Controller
              name="studentId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label={txt.selectStudent}
                  fullWidth
                  required
                >
                  {students.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} {s.nickname ? `(${s.nickname})` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}

          <Controller
            name="planId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label={txt.selectPlan}
                onChange={(e) => onPlanChange(e.target.value)}
                fullWidth
              >
                {plans.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {lng === "en" ? p.titleEn : p.titleAr}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="billingPeriod"
            control={control}
            render={({ field }) => (
              <ToggleButtonGroup
                value={field.value}
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
            )}
          />

          <Stack direction="row" spacing={2}>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label={txt.startDate}
                  onChange={(e) => onStartChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              )}
            />
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label={txt.endDate}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              )}
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

          <Controller
            name="priceCharged"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label={txt.priceCharged}
                fullWidth
                helperText={codeToSend ? txt.priceCouponNote : undefined}
              />
            )}
          />

          <Stack direction="row" spacing={2}>
            <Controller
              name="totalHours"
              control={control}
              render={({ field }) => (
                <TextField {...field} type="number" label={txt.totalHours} fullWidth />
              )}
            />
            <Controller
              name="remainingHours"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label={txt.remainingHours}
                  fullWidth
                />
              )}
            />
          </Stack>
        </Stack>
      </form>
    </FormDialog>
  );
}
