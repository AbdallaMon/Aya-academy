"use client";

import { useEffect, useState } from "react";
import {
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { FormDialog, CouponControl, useConfirm } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import { initialCoupon, resolveCoupon } from "../../../shared/lib/couponPricing.js";
import { SUBSCRIPTIONS_URL, PLANS_PUBLIC_URL } from "../config/constant.js";

const EMPTY_COUPON = { status: "idle", code: "", quote: null, reason: null };

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Renew an ACTIVE/EXPIRED subscription → creates a NEW subscription.
 * Prefilled from the current subscription (same plan + billing period); plan,
 * billing period and coupon are editable (CouponControl, reused). On the 409
 * SUBSCRIPTION_STILL_ACTIVE response we confirm and retry with
 * allowWhileActive:true. On success we navigate to the new subscription.
 *
 * Props: open, onClose, subscription, txt.
 */
export default function RenewDialog({ open, onClose, subscription, txt }) {
  const { lng } = useTranslation();
  const router = useRouter();
  const confirm = useConfirm();

  const [planId, setPlanId] = useState("");
  const [billingPeriod, setBillingPeriod] = useState("MONTHLY");
  const [startDate, setStartDate] = useState(today());
  const [coupon, setCoupon] = useState(EMPTY_COUPON);

  const publicPlansReq = useRequest({
    url: PLANS_PUBLIC_URL,
    method: "get",
    isPublic: true,
    autoFetch: false,
    syncToUrl: false,
  });

  // Renew posts to /subscriptions/:id/renew. We control the toast manually so a
  // 409 SUBSCRIPTION_STILL_ACTIVE can be intercepted as a confirm→retry.
  const renewReq = useRequest({
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
    const period = subscription?.billingPeriod || "MONTHLY";
    const id = subscription?.planId ?? subscription?.plan?.id ?? "";
    setPlanId(id ? String(id) : "");
    setBillingPeriod(period);
    setStartDate(today());
    setCoupon(EMPTY_COUPON);
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const publicPlans = publicPlansReq.data || [];
  const selectedPlan =
    publicPlans.find((p) => String(p.id) === String(planId)) || null;

  // Seed the coupon from the selected plan's default once plans + planId resolve.
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

  function onPeriodChange(period) {
    setBillingPeriod(period);
    setCoupon(initialCoupon(selectedPlan, period));
  }

  const { codeToSend } = resolveCoupon(selectedPlan, billingPeriod, coupon);

  async function doRenew(allowWhileActive) {
    const body = {
      ...(planId ? { planId: Number(planId) } : {}),
      billingPeriod,
      ...(startDate ? { startDate } : {}),
      ...(codeToSend ? { couponCode: codeToSend } : {}),
      ...(allowWhileActive ? { allowWhileActive: true } : {}),
    };
    const res = await renewReq.fetchData(`${subscription.id}/renew`, body);
    const newId = res?.data?.id;
    onClose();
    if (newId) {
      router.push(localePath(lng, `/dashboard/subscriptions/${newId}`));
    }
  }

  async function submit() {
    try {
      await doRenew(false);
    } catch (e) {
      if (e?.status === 409 && e?.data?.message === "SUBSCRIPTION_STILL_ACTIVE") {
        const sure = await confirm({
          title: txt.stillActiveConfirm,
          intent: "warning",
          confirmText: txt.renewSubmit,
        });
        if (!sure) return;
        try {
          await doRenew(true);
        } catch {
          /* the retry auto-toasts its own error */
        }
      }
      // other errors already auto-toasted by useRequest
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.renewTitle}
      maxWidth="sm"
      loading={renewReq.isLoading}
      submitText={txt.renewSubmit}
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
        >
          {publicPlans.map((p) => (
            <MenuItem key={p.id} value={String(p.id)}>
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

        <TextField
          type="date"
          label={txt.startDate}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />

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
