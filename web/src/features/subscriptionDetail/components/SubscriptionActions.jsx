"use client";

import { Button, Chip, Stack } from "@mui/material";
import {
  MdAutorenew,
  MdSwapHoriz,
  MdSend,
  MdPlayCircle,
  MdPaid,
  MdLocalOffer,
} from "react-icons/md";
import { PERMISSIONS, USER_ROLES } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { SUBSCRIPTIONS_URL, INVOICES_URL } from "../config/constant.js";
import RenewDialog from "./RenewDialog.jsx";
import ChangePlanDialog from "./ChangePlanDialog.jsx";
import CouponDialog from "./CouponDialog.jsx";
import ConfirmWithCheckbox from "./ConfirmWithCheckbox.jsx";

/**
 * Action bar for the subscription detail page.
 *
 * - Renew (RENEW || REQUEST || admin)        → RenewDialog (POST /:id/renew)
 * - Change plan (EDIT, disabled if invoice PAID) → ChangePlanDialog (POST /:id/change-plan)
 * - Send to parent (INVOICE.SEND, admin-only) → POST /invoices/:id/send
 * - Activate (SUBSCRIPTION.ACTIVATE, admin-only; PENDING/UPCOMING only)
 *      → ConfirmWithCheckbox(markInvoicePaid) → POST /:id/activate
 * - Mark invoice paid (INVOICE.EDIT, admin-only; invoice UNPAID only)
 *      → ConfirmWithCheckbox(activateSubscription) → PATCH /invoices/:id {status:"PAID"}
 *
 * Coupon entry lives inside the renew/change dialogs (CouponControl) so BOTH
 * admin and parent can use it — only the BUTTONS are permission-gated.
 *
 * Props: subscription, invoice (or null), txt, onChanged.
 */
export default function SubscriptionActions({ subscription, invoice, txt, onChanged }) {
  const { hasPermission } = usePermission();
  const { user } = useAuth();
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  const renewDialog = useOpen();
  const changeDialog = useOpen();
  const couponDialog = useOpen();
  const activateConfirm = useOpen();
  const markPaidConfirm = useOpen();

  const subMut = useRequest({
    url: SUBSCRIPTIONS_URL,
    method: "post",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
  });
  const invSend = useRequest({
    url: INVOICES_URL,
    method: "post",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
  });
  const invPatch = useRequest({
    url: INVOICES_URL,
    method: "patch",
    autoFetch: false,
    syncToUrl: false,
    shouldAutoToast: true,
  });

  const canRenew =
    hasPermission(PERMISSIONS.SUBSCRIPTION.RENEW) ||
    hasPermission(PERMISSIONS.SUBSCRIPTION.REQUEST) ||
    isAdmin;
  const canChangePlan = hasPermission(PERMISSIONS.SUBSCRIPTION.EDIT);
  // Admin (EDIT) or parent (REQUEST, scoped to own child by the backend) can
  // add/change/remove the coupon — same gate the backend enforces.
  const canCoupon =
    hasPermission(PERMISSIONS.SUBSCRIPTION.EDIT) ||
    hasPermission(PERMISSIONS.SUBSCRIPTION.REQUEST) ||
    isAdmin;
  const canSend = hasPermission(PERMISSIONS.INVOICE.SEND);
  const canActivate = hasPermission(PERMISSIONS.SUBSCRIPTION.ACTIVATE);
  const canMarkPaid = hasPermission(PERMISSIONS.INVOICE.EDIT);

  const invoicePaid = invoice?.status === "PAID";
  const subPendingOrUpcoming =
    subscription.status === "PENDING" || subscription.status === "UPCOMING";

  // Renew only applies to an ended subscription (EXPIRED/CANCELLED). The backend
  // blocks renewing an ACTIVE/PENDING sub (SUBSCRIPTION_STILL_ACTIVE) — even for
  // admins — so we never offer the action there. While PENDING/UPCOMING (awaiting
  // payment & activation) a parent sees an info hint instead.
  const showRenew =
    canRenew &&
    (subscription.status === "EXPIRED" ||
      subscription.status === "CANCELLED");
  const showAwaitingHint = !isAdmin && subPendingOrUpcoming;

  async function sendToParent() {
    if (!invoice) return;
    try {
      await invSend.fetchData(`${invoice.id}/send`, {});
      onChanged?.();
    } catch {
      /* auto-toasted */
    }
  }

  async function activate(markInvoicePaid) {
    activateConfirm.close();
    try {
      await subMut.fetchData(`${subscription.id}/activate`, { markInvoicePaid });
      onChanged?.();
    } catch {
      /* auto-toasted */
    }
  }

  async function markPaid(activateSubscription) {
    markPaidConfirm.close();
    if (!invoice) return;
    try {
      await invPatch.fetchData(String(invoice.id), {
        status: "PAID",
        activateSubscription,
      });
      onChanged?.();
    } catch {
      /* auto-toasted */
    }
  }

  const busy = subMut.isLoading || invSend.isLoading || invPatch.isLoading;

  const showAny =
    showRenew ||
    showAwaitingHint ||
    canChangePlan ||
    canCoupon ||
    (isAdmin && (canSend || canActivate || canMarkPaid));
  if (!showAny) return null;

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        {showRenew && (
          <Button
            variant="contained"
            startIcon={<MdAutorenew />}
            onClick={renewDialog.open}
            disabled={busy}
          >
            {txt.renew}
          </Button>
        )}

        {showAwaitingHint && (
          <Chip color="info" variant="outlined" label={txt.awaitingActivationHint} />
        )}

        {canChangePlan && (
          <Button
            variant="outlined"
            startIcon={<MdSwapHoriz />}
            onClick={changeDialog.open}
            disabled={busy || invoicePaid}
          >
            {txt.changePlan}
          </Button>
        )}

        {canCoupon && (
          <Button
            variant="outlined"
            startIcon={<MdLocalOffer />}
            onClick={couponDialog.open}
            disabled={busy || invoicePaid}
          >
            {txt.coupon}
          </Button>
        )}

        {canSend && invoice && (
          <Button
            variant="outlined"
            startIcon={<MdSend />}
            onClick={sendToParent}
            disabled={busy}
          >
            {invoice.sentAt ? txt.resend : txt.sendToParent}
          </Button>
        )}

        {canActivate && subPendingOrUpcoming && (
          <Button
            variant="contained"
            color="success"
            startIcon={<MdPlayCircle />}
            onClick={activateConfirm.open}
            disabled={busy}
          >
            {txt.activate}
          </Button>
        )}

        {canMarkPaid && invoice && invoice.status === "UNPAID" && (
          <Button
            variant="contained"
            color="success"
            startIcon={<MdPaid />}
            onClick={markPaidConfirm.open}
            disabled={busy}
          >
            {txt.markPaid}
          </Button>
        )}
      </Stack>

      <RenewDialog
        open={renewDialog.isOpen}
        onClose={renewDialog.close}
        subscription={subscription}
        txt={txt}
      />

      <ChangePlanDialog
        open={changeDialog.isOpen}
        onClose={changeDialog.close}
        subscription={subscription}
        txt={txt}
        onChanged={onChanged}
      />

      <CouponDialog
        open={couponDialog.isOpen}
        onClose={couponDialog.close}
        subscription={subscription}
        txt={txt}
        onChanged={onChanged}
      />

      <ConfirmWithCheckbox
        open={activateConfirm.isOpen}
        title={txt.activateTitle}
        checkboxLabel={txt.activateMarkPaid}
        confirmText={txt.activate}
        cancelText={txt.cancel}
        intent="success"
        loading={subMut.isLoading}
        onCancel={activateConfirm.close}
        onConfirm={activate}
      />

      <ConfirmWithCheckbox
        open={markPaidConfirm.isOpen}
        title={txt.markPaidTitle}
        checkboxLabel={txt.markPaidActivate}
        confirmText={txt.confirm}
        cancelText={txt.cancel}
        intent="success"
        loading={invPatch.isLoading}
        onCancel={markPaidConfirm.close}
        onConfirm={markPaid}
      />
    </>
  );
}
