"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  MdSwapHoriz,
  MdSend,
  MdPlayCircle,
  MdPaid,
  MdLocalOffer,
  MdCancel,
  MdSchedule,
  MdReceiptLong,
  MdMoreVert,
} from "react-icons/md";
import { PERMISSIONS, USER_ROLES } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { ConfirmDialog } from "../../../shared/components/index.js";
import { SUBSCRIPTIONS_URL, INVOICES_URL } from "../config/constant.js";
import ChangePlanDialog from "./ChangePlanDialog.jsx";
import CouponDialog from "./CouponDialog.jsx";
import ConfirmWithCheckbox from "./ConfirmWithCheckbox.jsx";
import EditHoursDialog from "../../subscriptions/components/EditHoursDialog.jsx";
import InvoiceDialog from "../../invoices/components/InvoiceDialog.jsx";

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
 *  Change plan   | EDIT (admin)                    | status≠ACTIVE & invoice UNPAID/none
 *  Coupon        | EDIT || REQUEST || admin        | status≠ACTIVE & invoice UNPAID/none
 *  View invoice  | INVOICE.VIEW                    | an invoice exists
 *  Send to parent| INVOICE.SEND (admin)            | an invoice exists
 *  Activate      | SUBSCRIPTION.ACTIVATE (admin)   | status PENDING/UPCOMING
 *  Mark paid     | INVOICE.EDIT (admin)            | invoice status UNPAID
 *  Cancel        | SUBSCRIPTION.CANCEL (admin)     | status PENDING/UPCOMING/ACTIVE
 *
 * Coupon entry also lives inside the change-plan dialog (CouponControl).
 *
 * Two render shapes share the SAME gating/handlers/dialogs (`variant` prop):
 *   - "bar"  (default) — a wrapping row of buttons, used on the DETAIL page.
 *   - "menu" — a single ⋮ IconButton opening a compact Menu, used inside the
 *     combined subscription card so the card body stays clean.
 *
 * Props: subscription, invoice (or null), txt, onChanged, variant.
 */
export default function SubscriptionActions({
  subscription,
  invoice,
  txt,
  onChanged,
  variant = "bar",
}) {
  const { hasPermission } = usePermission();
  const { user } = useAuth();
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  const changeDialog = useOpen();
  const couponDialog = useOpen();
  const editHoursDialog = useOpen();
  const invoiceDialog = useOpen();
  const activateConfirm = useOpen();
  const markPaidConfirm = useOpen();
  const cancelConfirm = useOpen();

  // ⋮ overflow menu anchor (menu variant only)
  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuOpen = Boolean(menuAnchor);
  const openMenu = (e) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

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
  // Invoice viewing — mirrors the subscriptions detail page gating so the shared
  // InvoiceDialog can be opened straight from the subscription cards/bar.
  const canViewInvoice = hasPermission(PERMISSIONS.INVOICE.VIEW);
  const canGenerateInvoice = hasPermission(PERMISSIONS.INVOICE.GENERATE);
  const canEditInvoice = hasPermission(PERMISSIONS.INVOICE.EDIT);

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

  // Activation only opens once the sub's month is essentially here — from the
  // LAST DAY of the preceding month onwards. `new Date(y, m, 0)` = last day of
  // the month BEFORE the start month. Mirrors the backend time guard so the next
  // month's accumulating bill can't be pre-activated early.
  const startDate = subscription.startDate ? new Date(subscription.startDate) : null;
  const activationOpensAt = startDate
    ? new Date(startDate.getFullYear(), startDate.getMonth(), 0, 23, 59, 59)
    : null;
  const activationWindowOpen = !activationOpensAt || new Date() >= activationOpensAt;

  const enableChangePlan = status !== "ACTIVE" && invoiceUnpaidOrNone;
  const enableCoupon = status !== "ACTIVE" && invoiceUnpaidOrNone;
  const enableSend =
    !!invoice && invoice.status === "UNPAID" && status !== "CANCELLED";
  // Activatable when not yet started (PENDING/UPCOMING) OR cancelled (re-activate
  // a cancelled sub — it stays visible with an Activate action instead of vanishing).
  const enableActivate =
    (subPendingOrUpcoming || status === "CANCELLED") && activationWindowOpen;
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

  // Single source of truth for both render shapes. Each action carries its
  // visibility (`show`), enabled state, why-disabled reason, handler and styling.
  const actions = [
    {
      // Change plan is available on EVERY subscription now (all subs carry a
      // plan). It only re-links the plan; hours change only when the sub has no
      // sessions yet (backend rule). It stays enabled while the sub isn't a
      // settled ACTIVE one with a paid invoice.
      key: "changePlan",
      show: canChangePlan,
      icon: <MdSwapHoriz />,
      label: txt.changePlan,
      onClick: changeDialog.open,
      enabled: enableChangePlan,
      reason: txt.reasonChangePlan,
      buttonVariant: "outlined",
    },
    {
      key: "coupon",
      show: canCoupon,
      icon: <MdLocalOffer />,
      label: txt.coupon,
      onClick: couponDialog.open,
      enabled: enableCoupon,
      reason: txt.reasonCoupon,
      buttonVariant: "outlined",
    },
    {
      key: "viewInvoice",
      show: canViewInvoice,
      icon: <MdReceiptLong />,
      label: txt.viewInvoice,
      onClick: invoiceDialog.open,
      enabled: !!invoice,
      reason: txt.reasonViewInvoice,
      buttonVariant: "outlined",
    },
    {
      key: "send",
      show: canSend,
      icon: <MdSend />,
      label: invoice?.sentAt ? txt.resend : txt.sendToParent,
      onClick: sendToParent,
      enabled: enableSend,
      reason: txt.reasonSend,
      buttonVariant: "outlined",
    },
    {
      key: "activate",
      show: canActivate,
      icon: <MdPlayCircle />,
      label: txt.activate,
      onClick: activateConfirm.open,
      enabled: enableActivate,
      reason:
        subPendingOrUpcoming && !activationWindowOpen
          ? txt.reasonActivateTooEarly
          : txt.reasonActivate,
      buttonVariant: "contained",
      color: "success",
    },
    {
      key: "markPaid",
      show: canMarkPaid,
      icon: <MdPaid />,
      label: txt.markPaid,
      onClick: markPaidConfirm.open,
      enabled: enableMarkPaid,
      reason: txt.reasonMarkPaid,
      buttonVariant: "contained",
      color: "success",
    },
    {
      key: "editHours",
      show: canEditHours,
      icon: <MdSchedule />,
      label: txt.editHours,
      onClick: editHoursDialog.open,
      enabled: enableEditHours,
      reason: reasonEditHours,
      buttonVariant: "outlined",
    },
    {
      key: "cancel",
      show: canCancel,
      icon: <MdCancel />,
      label: txt.cancelSub,
      onClick: cancelConfirm.open,
      enabled: enableCancel,
      reason: txt.reasonCancel,
      buttonVariant: "outlined",
      color: "error",
    },
  ].filter((a) => a.show);

  if (actions.length === 0 && !showAwaitingHint && !isAccumulating) return null;

  return (
    <>
      {variant === "menu" ? (
        <MenuActions
          actions={actions}
          busy={busy}
          menuAnchor={menuAnchor}
          menuOpen={menuOpen}
          openMenu={openMenu}
          closeMenu={closeMenu}
          moreLabel={txt.more}
          showAwaitingHint={showAwaitingHint}
          awaitingHint={txt.awaitingActivationHint}
        />
      ) : (
        <>
          {/* USAGE accumulating: explain the bill is auto-computed from sessions
              and closes at month end — no manual renew/plan actions apply. */}
          {isAccumulating && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {txt.usageManagedHint}
            </Alert>
          )}
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ mb: 3 }}
          >
            {actions.map((a) => (
              <ActionButton
                key={a.key}
                variant={a.buttonVariant}
                color={a.color}
                startIcon={a.icon}
                onClick={a.onClick}
                enabled={a.enabled}
                reason={a.reason}
                busy={busy}
              >
                {a.label}
              </ActionButton>
            ))}

            {showAwaitingHint && (
              <Chip
                color="info"
                variant="outlined"
                label={txt.awaitingActivationHint}
              />
            )}
          </Stack>
        </>
      )}

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

      {canViewInvoice && (
        <InvoiceDialog
          open={invoiceDialog.isOpen}
          onClose={invoiceDialog.close}
          subscriptionId={subscription.id}
          canGenerate={canGenerateInvoice}
          canEdit={canEditInvoice}
          onChanged={onChanged}
        />
      )}

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

/**
 * Compact ⋮ overflow menu. Renders the SAME action descriptors as the bar, but
 * as MenuItems: a disabled item keeps its icon/label and surfaces its
 * why-disabled reason as subdued secondary text. If there is no visible action
 * and no awaiting hint, renders nothing.
 */
function MenuActions({
  actions,
  busy,
  menuAnchor,
  menuOpen,
  openMenu,
  closeMenu,
  moreLabel,
  showAwaitingHint,
  awaitingHint,
}) {
  if (actions.length === 0) {
    // No actionable items — only a gentle awaiting hint (parent, pending sub).
    return showAwaitingHint ? (
      <Chip
        size="small"
        color="info"
        variant="outlined"
        label={awaitingHint}
        sx={{ height: 22, fontSize: "0.68rem" }}
      />
    ) : null;
  }

  const runAction = (fn) => {
    closeMenu();
    fn();
  };

  return (
    <>
      <Tooltip title={moreLabel || ""}>
        <IconButton
          size="small"
          aria-label={moreLabel}
          onClick={openMenu}
          disabled={busy}
        >
          <MdMoreVert />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "end" }}
        transformOrigin={{ vertical: "top", horizontal: "end" }}
      >
        {actions.map((a) => {
          const disabled = !a.enabled || busy;
          return (
            <MenuItem
              key={a.key}
              disabled={disabled}
              onClick={() => runAction(a.onClick)}
              sx={{
                color: a.color === "error" ? "error.main" : undefined,
                alignItems: "flex-start",
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 34, mt: 0.25 }}>
                {a.icon}
              </ListItemIcon>
              <ListItemText
                primary={a.label}
                secondary={
                  !a.enabled && a.reason ? (
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ display: "block", whiteSpace: "normal" }}
                    >
                      {a.reason}
                    </Typography>
                  ) : undefined
                }
                sx={{ my: 0 }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
