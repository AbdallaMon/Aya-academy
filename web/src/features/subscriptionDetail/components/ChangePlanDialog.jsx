"use client";

import { useEffect, useState } from "react";
import { MenuItem, Stack, TextField } from "@mui/material";
import { FormDialog, CouponControl } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { initialCoupon, resolveCoupon } from "../../../shared/lib/couponPricing.js";
import { SUBSCRIPTIONS_URL, PLANS_PUBLIC_URL } from "../config/constant.js";

const EMPTY_COUPON = { status: "idle", code: "", quote: null, reason: null };

/**
 * Change the plan of an existing subscription (in place — no new subscription).
 * planId is required; billing period + coupon (CouponControl, reused) are
 * editable. POSTs /subscriptions/:id/change-plan. A 409 CANNOT_CHANGE_PLAN_PAID
 * (invoice already paid) is left to the auto-toast. On success → refetch.
 *
 * Props: open, onClose, subscription, txt, onChanged.
 */
export default function ChangePlanDialog({ open, onClose, subscription, txt, onChanged }) {
  const { lng } = useTranslation();

  const [planId, setPlanId] = useState("");
  // MONTHLY-only in the UI for now — the yearly toggle is hidden.
  const billingPeriod = "MONTHLY";
  const [coupon, setCoupon] = useState(EMPTY_COUPON);

  const publicPlansReq = useRequest({
    url: PLANS_PUBLIC_URL,
    method: "get",
    isPublic: true,
    autoFetch: false,
    syncToUrl: false,
  });

  const changeReq = useRequest({
    url: SUBSCRIPTIONS_URL,
    method: "post",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
  });

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!open) return;
    publicPlansReq.fetchData();
    const id = subscription?.planId ?? subscription?.plan?.id ?? "";
    setPlanId(id ? String(id) : "");
    setCoupon(EMPTY_COUPON);
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const publicPlans = publicPlansReq.data || [];
  const selectedPlan =
    publicPlans.find((p) => String(p.id) === String(planId)) || null;

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!open || !selectedPlan) return;
    setCoupon(initialCoupon(selectedPlan, billingPeriod));
  }, [open, selectedPlan?.id]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  function onPlanChange(id) {
    setPlanId(id);
    const plan = publicPlans.find((p) => String(p.id) === String(id)) || null;
    setCoupon(initialCoupon(plan, billingPeriod));
  }

  const { codeToSend } = resolveCoupon(selectedPlan, billingPeriod, coupon);

  async function submit() {
    if (!planId) return;
    try {
      await changeReq.fetchData(`${subscription.id}/change-plan`, {
        planId: Number(planId),
        billingPeriod,
        ...(codeToSend ? { couponCode: codeToSend } : {}),
      });
      onClose();
      onChanged?.();
    } catch {
      // CANNOT_CHANGE_PLAN_PAID (and any other error) auto-toasts via useRequest
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.changePlanTitle}
      maxWidth="sm"
      loading={changeReq.isLoading}
      submitText={txt.changePlanSubmit}
      cancelText={txt.cancel}
      onSubmit={submit}
    >
      <Stack spacing={2.5} sx={{ pt: 1 }}>
        <TextField
          select
          label={txt.selectPlan}
          value={planId}
          onChange={(e) => onPlanChange(e.target.value)}
          fullWidth
          required
        >
          {publicPlans.map((p) => (
            <MenuItem key={p.id} value={String(p.id)}>
              {lng === "en" ? p.titleEn : p.titleAr}
            </MenuItem>
          ))}
        </TextField>

        {selectedPlan && (
          <CouponControl
            plan={selectedPlan}
            billingPeriod={billingPeriod}
            coupon={coupon}
            onCoupon={setCoupon}
          />
        )}
      </Stack>
    </FormDialog>
  );
}
