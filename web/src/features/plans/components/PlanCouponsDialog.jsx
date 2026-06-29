"use client";

import { useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { MdDelete, MdAdd } from "react-icons/md";
import { FormDialog, useConfirm } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useOpen } from "../../../hooks/useOpen.js";
import { useTranslation } from "../../../i18n/client.js";
import { COUPONS_URL } from "../config/constant.js";
import { formatMoney } from "../../../shared/lib/money.js";
import { useAppSettings } from "../../settings/hooks/useAppSettings.js";
import CouponFormDialog from "../../coupons/components/CouponFormDialog.jsx";

/** YYYY-MM-DD from an ISO string for display. */
function fmtDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/**
 * Manage the COUPONS linked to a single plan (the plan's "discounts").
 * Lists the plan's active coupons and creates new ones — scoped to the plan —
 * through the SAME shared CouponFormDialog used on the Coupons page, so both
 * creation flows behave identically (auto-generated code, same fields).
 */
export default function PlanCouponsDialog({ open, onClose, plan, txt }) {
  const { lng } = useTranslation();
  const { currency } = useAppSettings({ enabled: open });
  const confirm = useConfirm();
  const addForm = useOpen();
  const planId = plan?.id;

  // Only the plan's ACTIVE discounts are shown here; disabled ones live on the
  // Coupons page (under the "Disabled" filter).
  const listReq = useRequest({
    url: COUPONS_URL,
    method: "get",
    isPaginated: true,
    autoFetch: false,
    syncToUrl: false,
    initialParams: planId ? { planId, isActive: true } : undefined,
  });

  const coupons = (listReq.data || []).filter((c) => c.isActive);

  // (Re)load the plan's coupons whenever the dialog opens for a plan.
  useEffect(() => {
    if (open && planId) listReq.fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, planId]);

  const mut = useMultiRequest({
    url: COUPONS_URL,
    onSuccess: () => listReq.fetchData(),
  });

  function scopeLabel(billingPeriod) {
    if (billingPeriod === "MONTHLY") return txt.monthly;
    if (billingPeriod === "YEARLY") return txt.yearly;
    return txt.both;
  }

  async function remove(id) {
    const ok = await confirm({ title: txt.deleteCouponConfirm, intent: "danger" });
    if (!ok) return;
    await mut.deleteRequest(String(id));
  }

  const planTitle = plan ? (lng === "en" ? plan.titleEn : plan.titleAr) : "";

  return (
    <>
      <FormDialog
        open={open}
        onClose={onClose}
        title={`${txt.discountsFor} — ${planTitle || ""}`}
        maxWidth="md"
        actions={null}
        showCloseIcon
      >
        <Stack spacing={2}>
          {coupons.length === 0 && (
            <Typography color="text.secondary" variant="body2">
              {txt.noDiscounts}
            </Typography>
          )}

          {coupons.map((c) => {
            const validity = [fmtDate(c.startsAt), fmtDate(c.endsAt)]
              .filter(Boolean)
              .join(" → ");
            return (
              <Stack
                key={c.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={1}
                flexWrap="wrap"
                sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.2 }}
              >
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip size="small" variant="outlined" label={c.code} />
                  <Chip
                    size="small"
                    color="secondary"
                    label={c.type === "PERCENT" ? txt.percent : txt.fixed}
                  />
                  <Typography fontWeight={700}>
                    {c.type === "PERCENT"
                      ? `${Number(c.value)}%`
                      : formatMoney(Number(c.value), currency)}
                  </Typography>
                  <Chip size="small" label={scopeLabel(c.billingPeriod)} />
                  {validity && (
                    <Typography variant="caption" color="text.secondary">
                      {validity}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {txt.redemptions}: {c.redemptionsCount ?? 0} /{" "}
                    {c.maxRedemptions ?? "∞"}
                  </Typography>
                </Stack>
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => remove(c.id)}
                  disabled={mut.isDeleteRequestLoading}
                  aria-label={txt.disable}
                  title={txt.disable}
                >
                  <MdDelete />
                </IconButton>
              </Stack>
            );
          })}

          <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              onClick={addForm.open}
            >
              {txt.addDiscount}
            </Button>
          </Box>
        </Stack>
      </FormDialog>

      <CouponFormDialog
        open={addForm.isOpen}
        onClose={addForm.close}
        lockedPlanId={planId}
        onSaved={() => listReq.fetchData()}
      />
    </>
  );
}
