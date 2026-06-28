"use client";

import { Button, Stack } from "@mui/material";
import { MdAutorenew, MdSwapHoriz } from "react-icons/md";
import { PERMISSIONS, USER_ROLES } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useAuth } from "../../../hooks/useAuth.js";
import { useOpen } from "../../../hooks/useOpen.js";
import RenewDialog from "./RenewDialog.jsx";
import ChangePlanDialog from "./ChangePlanDialog.jsx";

/**
 * Action bar for the subscription detail page.
 *
 * - Renew (RENEW || REQUEST || admin)            → RenewDialog (POST /:id/renew)
 * - Change plan (EDIT, disabled if invoice PAID) → ChangePlanDialog (POST /:id/change-plan)
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

  const canRenew =
    hasPermission(PERMISSIONS.SUBSCRIPTION.RENEW) ||
    hasPermission(PERMISSIONS.SUBSCRIPTION.REQUEST) ||
    isAdmin;
  const canChangePlan = hasPermission(PERMISSIONS.SUBSCRIPTION.EDIT);

  const invoicePaid = invoice?.status === "PAID";

  if (!canRenew && !canChangePlan) return null;

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        {canRenew && (
          <Button
            variant="contained"
            startIcon={<MdAutorenew />}
            onClick={renewDialog.open}
          >
            {txt.renew}
          </Button>
        )}

        {canChangePlan && (
          <Button
            variant="outlined"
            startIcon={<MdSwapHoriz />}
            onClick={changeDialog.open}
            disabled={invoicePaid}
          >
            {txt.changePlan}
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
    </>
  );
}
