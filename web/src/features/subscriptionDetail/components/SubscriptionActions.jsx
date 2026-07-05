"use client";

import { Button, Chip, Stack, Tooltip } from "@mui/material";
import {
  MdAutorenew,
  MdSwapHoriz,
  MdSend,
  MdPlayCircle,
  MdPaid,
  MdLocalOffer,
  MdCancel,
} from "react-icons/md";
import { PERMISSIONS, USER_ROLES } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { ConfirmDialog } from "../../../shared/components/index.js";
import { SUBSCRIPTIONS_URL, INVOICES_URL } from "../config/constant.js";
import RenewDialog from "./RenewDialog.jsx";
import ChangePlanDialog from "./ChangePlanDialog.jsx";
import CouponDialog from "./CouponDialog.jsx";
import ConfirmWithCheckbox from "./ConfirmWithCheckbox.jsx";

/**
 * A single action button that is ALWAYS rendered when the user's role may
 * perform the action, and DISABLED (with a tooltip explaining why) when the
 * subscription's current state forbids it. A disabled MUI Button swallows hover
 * events, so the tooltip is attached to a wrapping <span>. The reason tooltip is
 * shown only for a state-based disable — a plain `busy` disable shows no reason.
 */
function ActionButton({ enabled, reason, busy, children, ...btnProps }) {
  const disabled = !enabled || busy;
  const title = !enabled && reason ? reason : "";
  const button = (
    <Button {...btnProps} disabled={disabled}>
      {children}
    </Button>
  );
  if (!title) return button;
  return (
    <Tooltip title={title}>
      <span>{button}</span>
    </Tooltip>
  );
}

/**
 * Action bar for the subscription detail page. Every action the current user's
 * ROLE is permitted to use is shown; the current subscription/invoice STATE only
 * ENABLES or DISABLES it (with a why-tooltip), never hides it.
 *
 *  Action        | visible if (permission)        | enabled when
 *  ------------- | ------------------------------- | ---------------------------
 *  Renew         | RENEW || REQUEST || admin       | status EXPIRED/CANCELLED
 *  Change plan   | EDIT (admin)                    | status≠ACTIVE & invoice UNPAID/none
 *  Coupon        | EDIT || REQUEST || admin        | status≠ACTIVE & invoice UNPAID/none
 *  Send to parent| INVOICE.SEND (admin)            | an invoice exists
 *  Activate      | SUBSCRIPTION.ACTIVATE (admin)   | status PENDING/UPCOMING
 *  Mark paid     | INVOICE.EDIT (admin)            | invoice status UNPAID
 *  Cancel        | SUBSCRIPTION.CANCEL (admin)     | status PENDING/UPCOMING/ACTIVE
 *
 * Coupon entry also lives inside the renew/change dialogs (CouponControl).
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
  const cancelConfirm = useOpen();

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

  // ── who may see each action (by role/permission) ──
  const canRenew =
    hasPermission(PERMISSIONS.SUBSCRIPTION.RENEW) ||
    hasPermission(PERMISSIONS.SUBSCRIPTION.REQUEST) ||
    isAdmin;
  const canChangePlan = hasPermission(PERMISSIONS.SUBSCRIPTION.EDIT);
  const canCoupon =
    hasPermission(PERMISSIONS.SUBSCRIPTION.EDIT) ||
    hasPermission(PERMISSIONS.SUBSCRIPTION.REQUEST) ||
    isAdmin;
  const canSend = hasPermission(PERMISSIONS.INVOICE.SEND);
  const canActivate = hasPermission(PERMISSIONS.SUBSCRIPTION.ACTIVATE);
  const canMarkPaid = hasPermission(PERMISSIONS.INVOICE.EDIT);
  const canCancel = hasPermission(PERMISSIONS.SUBSCRIPTION.CANCEL);

  // ── current state → whether each action is enabled ──
  const status = subscription.status;
  const invoiceUnpaidOrNone = !invoice || invoice.status === "UNPAID";
  const subPendingOrUpcoming = status === "PENDING" || status === "UPCOMING";
  const subEnded = status === "EXPIRED" || status === "CANCELLED";
  const subCancellable =
    status === "PENDING" || status === "UPCOMING" || status === "ACTIVE";

  const enableRenew = subEnded;
  const enableChangePlan = status !== "ACTIVE" && invoiceUnpaidOrNone;
  const enableCoupon = status !== "ACTIVE" && invoiceUnpaidOrNone;
  const enableSend = !!invoice;
  const enableActivate = subPendingOrUpcoming;
  const enableMarkPaid = !!invoice && invoice.status === "UNPAID";
  const enableCancel = subCancellable;

  // Parent still gets a gentle "awaiting activation" hint while PENDING/UPCOMING.
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

  async function cancelSubscription() {
    cancelConfirm.close();
    try {
      await subMut.fetchData(`${subscription.id}/cancel`, {});
      onChanged?.();
    } catch {
      /* auto-toasted */
    }
  }

  const busy = subMut.isLoading || invSend.isLoading || invPatch.isLoading;

  const anyVisible =
    canRenew ||
    canChangePlan ||
    canCoupon ||
    canSend ||
    canActivate ||
    canMarkPaid ||
    canCancel;
  if (!anyVisible && !showAwaitingHint) return null;

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        {canRenew && (
          <ActionButton
            variant="contained"
            startIcon={<MdAutorenew />}
            onClick={renewDialog.open}
            enabled={enableRenew}
            reason={txt.reasonRenew}
            busy={busy}
          >
            {txt.renew}
          </ActionButton>
        )}

        {canChangePlan && (
          <ActionButton
            variant="outlined"
            startIcon={<MdSwapHoriz />}
            onClick={changeDialog.open}
            enabled={enableChangePlan}
            reason={txt.reasonChangePlan}
            busy={busy}
          >
            {txt.changePlan}
          </ActionButton>
        )}

        {canCoupon && (
          <ActionButton
            variant="outlined"
            startIcon={<MdLocalOffer />}
            onClick={couponDialog.open}
            enabled={enableCoupon}
            reason={txt.reasonCoupon}
            busy={busy}
          >
            {txt.coupon}
          </ActionButton>
        )}

        {canSend && (
          <ActionButton
            variant="outlined"
            startIcon={<MdSend />}
            onClick={sendToParent}
            enabled={enableSend}
            reason={txt.reasonSend}
            busy={busy}
          >
            {invoice?.sentAt ? txt.resend : txt.sendToParent}
          </ActionButton>
        )}

        {canActivate && (
          <ActionButton
            variant="contained"
            color="success"
            startIcon={<MdPlayCircle />}
            onClick={activateConfirm.open}
            enabled={enableActivate}
            reason={txt.reasonActivate}
            busy={busy}
          >
            {txt.activate}
          </ActionButton>
        )}

        {canMarkPaid && (
          <ActionButton
            variant="contained"
            color="success"
            startIcon={<MdPaid />}
            onClick={markPaidConfirm.open}
            enabled={enableMarkPaid}
            reason={txt.reasonMarkPaid}
            busy={busy}
          >
            {txt.markPaid}
          </ActionButton>
        )}

        {canCancel && (
          <ActionButton
            variant="outlined"
            color="error"
            startIcon={<MdCancel />}
            onClick={cancelConfirm.open}
            enabled={enableCancel}
            reason={txt.reasonCancel}
            busy={busy}
          >
            {txt.cancelSub}
          </ActionButton>
        )}

        {showAwaitingHint && (
          <Chip color="info" variant="outlined" label={txt.awaitingActivationHint} />
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

      <ConfirmDialog
        open={cancelConfirm.isOpen}
        intent="danger"
        title={txt.cancelSubTitle}
        description={txt.cancelSubConfirm}
        confirmText={txt.cancelSub}
        cancelText={txt.cancel}
        loading={subMut.isLoading}
        onCancel={cancelConfirm.close}
        onConfirm={cancelSubscription}
      />
    </>
  );
}
