"use client";

import { Alert, Button, Chip, Stack, Tooltip } from "@mui/material";
import {
  MdAutorenew,
  MdSwapHoriz,
  MdSend,
  MdPlayCircle,
  MdPaid,
  MdLocalOffer,
  MdCancel,
  MdSchedule,
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
import EditHoursDialog from "../../subscriptions/components/EditHoursDialog.jsx";

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
  const editHoursDialog = useOpen();
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
  const subPut = useRequest({
    url: SUBSCRIPTIONS_URL,
    method: "put",
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
  const canEditHours = hasPermission(PERMISSIONS.SUBSCRIPTION.EDIT);

  // ── current state → whether each action is enabled ──
  const status = subscription.status;
  // USAGE subs are billed from logged sessions, not renewed/plan-changed. While
  // UPCOMING they are the live accumulating next-month bill.
  const isUsage = subscription.origin === "USAGE";
  const isAccumulating = isUsage && status === "UPCOMING";
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
  // Hours are editable on the CURRENT (pending/active) sub, but NOT while a USAGE
  // sub is still accumulating (its hours are auto-recomputed from sessions), nor
  // after it has ended (EXPIRED/CANCELLED).
  const enableEditHours = !isAccumulating && !subEnded;
  const reasonEditHours = isAccumulating
    ? txt.reasonEditHoursUsage
    : txt.reasonEditHours;

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

  async function saveHours(payload) {
    try {
      await subPut.fetchData(String(subscription.id), payload);
      editHoursDialog.close();
      onChanged?.();
    } catch {
      /* auto-toasted */
    }
  }

  const busy =
    subMut.isLoading ||
    invSend.isLoading ||
    invPatch.isLoading ||
    subPut.isLoading;

  const anyVisible =
    canRenew ||
    canChangePlan ||
    canCoupon ||
    canSend ||
    canActivate ||
    canMarkPaid ||
    canCancel ||
    canEditHours;
  if (!anyVisible && !showAwaitingHint && !isAccumulating) return null;

  return (
    <>
      {/* USAGE accumulating: explain the bill is auto-computed from sessions and
          closes at month end — no manual renew/plan actions apply. */}
      {isAccumulating && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {txt.usageManagedHint}
        </Alert>
      )}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        {canRenew && !isUsage && (
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

        {canChangePlan && !isUsage && (
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

        {canEditHours && (
          <ActionButton
            variant="outlined"
            startIcon={<MdSchedule />}
            onClick={editHoursDialog.open}
            enabled={enableEditHours}
            reason={reasonEditHours}
            busy={busy}
          >
            {txt.editHours}
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

      <EditHoursDialog
        open={editHoursDialog.isOpen}
        onClose={editHoursDialog.close}
        txt={txt}
        initial={subscription}
        loading={subPut.isLoading}
        onSubmit={saveHours}
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
