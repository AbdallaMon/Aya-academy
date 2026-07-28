"use client";

import { useEffect, useState } from "react";
import { Stack, TextField, Typography } from "@mui/material";
import { FormDialog, CouponControl } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { initialCoupon, resolveCoupon } from "../../../shared/lib/couponPricing.js";
import { SUBSCRIPTIONS_URL, PLANS_PUBLIC_URL, round2 } from "../config/constant.js";

const EMPTY_COUPON = { status: "idle", code: "", quote: null, reason: null };

/**
 * Seed the coupon state from the subscription's CURRENT coupon so the dialog
 * opens showing what's already applied (a removable "custom" chip). We use the
 * already-charged price as the displayed net; the actual re-redeem happens
 * server-side from the code we send. With no coupon we fall back to the plan's
 * default removable coupon (initialCoupon).
 */
function seedCoupon(subscription, plan, billingPeriod) {
  const code = subscription?.coupon?.code;
  if (code) {
    return {
      status: "custom",
      code,
      quote: { couponValid: true, net: round2(subscription?.priceCharged) },
      reason: null,
    };
  }
  return plan ? initialCoupon(plan, billingPeriod) : EMPTY_COUPON;
}

/**
 * Add / replace / remove the coupon on an EXISTING subscription — no plan or
 * billing-period change (both are fixed to the subscription's current values).
 * Mirrors ChangePlanDialog but for the coupon only: it fetches /plans/public to
 * feed CouponControl pricing, seeds the dialog with the subscription's current
 * coupon (if any), and POSTs /subscriptions/:id/apply-coupon { couponCode }.
 *
 *   - Keep the seeded code              → re-send it (server re-redeems).
 *   - Verify a different custom code     → resolveCoupon gives the new code.
 *   - Remove the coupon (CouponControl)  → couponCode "" (= remove).
 *
 * Only allowed while the invoice is NOT PAID; a 409 CANNOT_CHANGE_PLAN_PAID and
 * any invalid-code error are left to the auto-toast. On success → onChanged + close.
 *
 * Props: open, onClose, subscription, txt, onChanged.
 */
export default function CouponDialog({ open, onClose, subscription, txt, onChanged }) {
  const billingPeriod = subscription?.billingPeriod || "MONTHLY";

  const [coupon, setCoupon] = useState(EMPTY_COUPON);

  const publicPlansReq = useRequest({
    url: PLANS_PUBLIC_URL,
    method: "get",
    isPublic: true,
    autoFetch: false,
    syncToUrl: false,
  });

  const applyReq = useRequest({
    url: SUBSCRIPTIONS_URL,
    method: "post",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
  });

  const publicPlans = publicPlansReq.data || [];
  const planId = subscription?.planId ?? subscription?.plan?.id ?? null;
  const selectedPlan =
    publicPlans.find((p) => String(p.id) === String(planId)) || null;

  // On open: fetch the plans and seed from the current coupon (no plan yet).
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!open) return;
    publicPlansReq.fetchData();
    setCoupon(seedCoupon(subscription, null, billingPeriod));
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  // Once the plans arrive, re-seed with the plan so a no-coupon subscription can
  // offer the plan's own default coupon. A seeded custom coupon is kept as-is.
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!open || !selectedPlan) return;
    if (subscription?.coupon?.code) return; // already seeded as custom
    setCoupon(initialCoupon(selectedPlan, billingPeriod));
  }, [open, selectedPlan?.id]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const { codeToSend } = resolveCoupon(selectedPlan, billingPeriod, coupon);
  // USAGE subs have no linked plan → CouponControl can't render (it prices
  // against a plan). Fall back to the raw entered code so a plan-agnostic coupon
  // can still be applied; the backend validates it (planId: null).
  const effectiveCode = selectedPlan ? codeToSend : (coupon.code || "").trim();

  async function submit() {
    try {
      await applyReq.fetchData(`${subscription.id}/apply-coupon`, {
        couponCode: effectiveCode || "",
      });
      onChanged?.();
      onClose();
    } catch {
      // CANNOT_CHANGE_PLAN_PAID / invalid-code (and any other error) auto-toasts.
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.couponTitle}
      maxWidth="sm"
      loading={applyReq.isLoading}
      submitText={txt.couponSubmit}
      cancelText={txt.cancel}
      onSubmit={submit}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {txt.couponHint}
        </Typography>
        {selectedPlan ? (
          <CouponControl
            plan={selectedPlan}
            billingPeriod={billingPeriod}
            coupon={coupon}
            onCoupon={setCoupon}
          />
        ) : (
          // No linked plan (USAGE sub): plain code entry — the server validates.
          <TextField
            label={txt.coupon}
            value={coupon.code || ""}
            onChange={(e) =>
              setCoupon({ status: "custom", code: e.target.value, quote: null, reason: null })
            }
            fullWidth
            autoComplete="off"
          />
        )}
      </Stack>
    </FormDialog>
  );
}
