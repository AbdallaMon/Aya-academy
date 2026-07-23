"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { FormDialog, CouponControl } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { formatMoney } from "../../../shared/lib/money.js";
import { initialCoupon, resolveCoupon } from "../../../shared/lib/couponPricing.js";
import {
  SUBSCRIPTION_PLAN_QUOTE_URL,
  USERS_URL,
  subscriptionPlanOptionsPath,
} from "../config/constant.js";

const FORM_ID = "subscription-create-form";
const EMPTY_COUPON = { status: "idle", code: "", quote: null, reason: null };

/** Current month as `YYYY-MM` (what a native month input expects/emits). */
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Admin-only: create a subscription for a student for ONE month from a PLAN.
 * The form asks for a plan + month (+ optional coupon); the backend derives
 * startDate (1st), endDate (last day), and takes hours/price FROM the plan at
 * creation. Submits `{ studentId, planId, month, couponCode? }`.
 *
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
  const lockedStudentId = lockedStudent?.id ?? "";
  const defaultMonth = useMemo(() => currentMonth(), []);

  // MONTHLY-only in the UI for now — the yearly toggle is hidden.
  const billingPeriod = "MONTHLY";
  const [planId, setPlanId] = useState("");
  const [coupon, setCoupon] = useState(EMPTY_COUPON);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: { studentId: lockedStudentId, month: defaultMonth },
  });
  const selectedStudentId = useWatch({ control, name: "studentId" });

  const studentsReq = useRequest({
    url: USERS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: { limit: 100, role: "STUDENT" },
  });

  const plansReq = useRequest({
    url: selectedStudentId
      ? subscriptionPlanOptionsPath(selectedStudentId)
      : "plans/public",
    method: "get",
    isPublic: !selectedStudentId,
    autoFetch: false,
    syncToUrl: false,
  });

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (open) {
      // No need to load the student picker when the student is locked.
      if (!lockedStudent) studentsReq.fetchData();
      if (lockedStudentId) plansReq.fetchData();
      reset({ studentId: lockedStudentId, month: defaultMonth });
      setPlanId("");
      setCoupon(EMPTY_COUPON);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !selectedStudentId) return;
    setPlanId("");
    setCoupon(EMPTY_COUPON);
    plansReq.fetchData();
  }, [open, selectedStudentId]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const students = (studentsReq.data || []).filter((u) => u.role === "STUDENT");
  const plans = plansReq.data || [];
  const selectedPlan = plans.find((p) => String(p.id) === String(planId)) || null;

  function onPlanChange(id) {
    setPlanId(id);
    const plan = plans.find((p) => String(p.id) === String(id)) || null;
    setCoupon(plan ? initialCoupon(plan, billingPeriod) : EMPTY_COUPON);
  }

  const resolvedCoupon = resolveCoupon(selectedPlan, billingPeriod, coupon);
  const { net } = resolvedCoupon;

  const planHint =
    selectedPlan &&
    (txt.planHint || "{hours} · {price}")
      .replace("{hours}", String(selectedPlan.hours ?? "—"))
      .replace("{price}", formatMoney(net, selectedPlan.currency));

  function submit(values) {
    if (!values.studentId || !values.month || !planId) return;
    onCreate({
      studentId: Number(values.studentId),
      planId: Number(planId),
      month: values.month, // "YYYY-MM"
      ...(resolvedCoupon.applied === "custom" && resolvedCoupon.codeToSend
        ? { couponCode: resolvedCoupon.codeToSend }
        : {}),
      applyPlanCoupon: resolvedCoupon.applyPlanCoupon,
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
              rules={{ required: true }}
              render={({ field }) => (
                <TextField {...field} select label={txt.selectStudent} fullWidth required>
                  {students.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} {s.nickname ? `(${s.nickname})` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}

          <TextField
            select
            label={txt.selectPlan}
            value={planId}
            onChange={(e) => onPlanChange(e.target.value)}
            fullWidth
            required
            helperText={plans.length === 0 ? txt.noPlans : undefined}
          >
            {plans.map((p) => (
              <MenuItem key={p.id} value={String(p.id)}>
                {lng === "en" ? p.titleEn : p.titleAr}
              </MenuItem>
            ))}
          </TextField>

          {planHint && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
              {planHint}
            </Typography>
          )}

          <Controller
            name="month"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <TextField
                {...field}
                type="month"
                label={txt.month}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            )}
          />

          {selectedPlan && (
            <CouponControl
              plan={selectedPlan}
              billingPeriod={billingPeriod}
              coupon={coupon}
              onCoupon={setCoupon}
              quoteUrl={SUBSCRIPTION_PLAN_QUOTE_URL}
              quoteBody={{ studentId: Number(selectedStudentId) }}
            />
          )}

          <Typography variant="caption" color="text.secondary">
            {txt.monthHint}
          </Typography>
        </Stack>
      </form>
    </FormDialog>
  );
}
