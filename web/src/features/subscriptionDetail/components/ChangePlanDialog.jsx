"use client";

import { useEffect, useState } from "react";
import { Alert, MenuItem, Stack, TextField } from "@mui/material";
import { FormDialog, CouponControl } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { initialCoupon, resolveCoupon } from "../../../shared/lib/couponPricing.js";
import {
  SUBSCRIPTIONS_URL,
  SUBSCRIPTION_PLAN_QUOTE_URL,
  subscriptionPlanOptionsPath,
} from "../../subscriptions/config/constant.js";

const EMPTY_COUPON = { status: "idle", code: "", quote: null, reason: null };

/**
 * Change the plan of an existing subscription (in place — no new subscription).
 * RE-LINKS THE PLAN: the backend swaps the linked plan and only recomputes
 * hours/price from the new plan when the subscription has no logged sessions yet;
 * once sessions exist, they drive the hours and the plan link is all that changes.
 * planId is required; the optional coupon (CouponControl, reused) stays its own
 * concern. POSTs /subscriptions/:id/change-plan with only `{ planId, couponCode? }`.
 * A 409 CANNOT_CHANGE_PLAN_PAID (invoice already paid) is left to the auto-toast.
 * On success → refetch.
 *
 * Props: open, onClose, subscription, txt, onChanged.
 */
export default function ChangePlanDialog({ open, onClose, subscription, txt, onChanged }) {
  const { lng } = useTranslation();

  const [planId, setPlanId] = useState("");
  // MONTHLY-only in the UI for now — the yearly toggle is hidden.
  const billingPeriod = "MONTHLY";
  const [coupon, setCoupon] = useState(EMPTY_COUPON);
  const studentId = subscription?.studentId ?? subscription?.student?.id;

  const publicPlansReq = useRequest({
    url: subscriptionPlanOptionsPath(studentId),
    method: "get",
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

  const resolvedCoupon = resolveCoupon(
    selectedPlan,
    billingPeriod,
    coupon,
  );

  async function submit() {
    if (!planId) return;
    try {
      await changeReq.fetchData(`${subscription.id}/change-plan`, {
        planId: Number(planId),
        ...(resolvedCoupon.codeToSend
          ? { couponCode: resolvedCoupon.codeToSend }
          : {}),
        applyPlanCoupon: resolvedCoupon.applyPlanCoupon,
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
        <Alert severity="info" sx={{ py: 0 }}>
          {txt.changePlanHint}
        </Alert>

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
            quoteUrl={SUBSCRIPTION_PLAN_QUOTE_URL}
            quoteBody={{
              studentId,
              currentSubscriptionId: subscription.id,
            }}
          />
        )}
      </Stack>
    </FormDialog>
  );
}
