"use client";

import { useRouter } from "next/navigation";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import { localePath } from "../../../i18n/routing.js";
import PlanPickerDialog from "../../children/components/PlanPickerDialog.jsx";
import { useChildrenText } from "../../children/config/childrenText.js";
import { SUBSCRIPTIONS_URL } from "../config/constant.js";

/**
 * Renew an EXPIRED/CANCELLED subscription → creates a NEW (PENDING) subscription.
 *
 * Reuses the SAME plan-picker UX as the parent's "change plan" flow on the
 * children page (card grid + billing toggle + removable coupon) — just wired to
 * POST /subscriptions/:id/renew instead of /request. The current plan + billing
 * period are preselected by default. The backend blocks renewing while an
 * ACTIVE/PENDING sub exists (SUBSCRIPTION_STILL_ACTIVE), which auto-toasts.
 *
 * Props: open, onClose, subscription, txt (for the renew title/submit wording).
 */
export default function RenewDialog({ open, onClose, subscription, txt }) {
  const { lng } = useTranslation();
  const router = useRouter();
  const childrenTxt = useChildrenText();

  // Renew posts to /subscriptions/:id/renew. Errors (e.g. SUBSCRIPTION_STILL_ACTIVE)
  // auto-toast — the message explains the active-block.
  const renewReq = useRequest({
    url: SUBSCRIPTIONS_URL,
    method: "post",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
  });

  async function submit(plan, options = {}) {
    if (!subscription || !plan) return;
    const body = {
      planId: plan.id,
      billingPeriod: options.billingPeriod || "MONTHLY",
      ...(options.couponCode ? { couponCode: options.couponCode } : {}),
      applyPlanCoupon: Boolean(options.applyPlanCoupon),
    };
    try {
      const res = await renewReq.fetchData(`${subscription.id}/renew`, body);
      const newId = res?.data?.id;
      onClose();
      if (newId) {
        router.push(localePath(lng, `/dashboard/subscriptions/${newId}`));
      }
    } catch {
      // errors (e.g. SUBSCRIPTION_STILL_ACTIVE) already auto-toasted by useRequest
    }
  }

  return (
    <PlanPickerDialog
      open={open}
      onClose={onClose}
      child={{
        id: subscription?.studentId ?? subscription?.student?.id,
        name: subscription?.student?.name || "",
      }}
      onRequest={submit}
      requesting={renewReq.isLoading}
      txt={childrenTxt}
      defaultPlanId={subscription?.planId ?? subscription?.plan?.id ?? null}
      title={txt?.renewTitle}
      confirmLabel={txt?.renewSubmit}
      confirmingLabel={childrenTxt.requesting}
    />
  );
}
