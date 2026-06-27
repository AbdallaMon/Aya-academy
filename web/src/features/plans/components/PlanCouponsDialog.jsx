"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdDelete, MdAdd, MdAutorenew } from "react-icons/md";
import { FormDialog, useConfirm } from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useTranslation } from "../../../i18n/client.js";
import {
  COUPONS_URL,
  DISCOUNT_TYPES,
  BILLING_SCOPES,
} from "../config/constant.js";
import { formatMoney } from "../../../shared/lib/money.js";
import { useAppSettings } from "../../settings/hooks/useAppSettings.js";

/** Random AYA-XXXXXX coupon-code suggestion (6 hex chars). */
function generateCode() {
  const hex = Math.random().toString(16).slice(2, 8).toUpperCase().padEnd(6, "0");
  return `AYA-${hex}`;
}

/** YYYY-MM-DD from an ISO string for display. */
function fmtDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/**
 * Manage the COUPONS linked to a single plan (the plan's "discounts").
 * Lists coupons via GET coupons?planId=<id> and creates new ones scoped to the
 * plan via POST coupons with planIds:[planId]. Deactivates via DELETE coupons/:id.
 */
export default function PlanCouponsDialog({ open, onClose, plan, txt }) {
  const { lng } = useTranslation();
  const { currency } = useAppSettings({ enabled: open });
  const confirm = useConfirm();
  const planId = plan?.id;

  const [scope, setScope] = useState("ALL");
  const [type, setType] = useState("PERCENT");
  const [value, setValue] = useState("");
  const [code, setCode] = useState(generateCode);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");

  function resetForm() {
    setScope("ALL");
    setType("PERCENT");
    setValue("");
    setCode(generateCode());
    setStartsAt("");
    setEndsAt("");
    setMaxRedemptions("");
  }

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

  async function add() {
    if (!value) return;
    const payload = {
      type,
      value: Number(value),
      source: "MANUAL",
      planIds: [planId],
    };
    if (scope !== "ALL") payload.billingPeriod = scope;
    const trimmedCode = code?.trim();
    if (trimmedCode) payload.code = trimmedCode;
    if (startsAt) payload.startsAt = startsAt;
    if (endsAt) payload.endsAt = endsAt;
    if (maxRedemptions) payload.maxRedemptions = Number(maxRedemptions);

    await mut.postRequest(null, payload);
    resetForm();
  }

  async function remove(id) {
    const ok = await confirm({ title: txt.deleteCouponConfirm, intent: "danger" });
    if (!ok) return;
    await mut.deleteRequest(String(id));
  }

  function handleClose() {
    resetForm();
    onClose?.();
  }

  const planTitle = plan ? (lng === "en" ? plan.titleEn : plan.titleAr) : "";

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
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
          <Typography variant="subtitle2" mb={1.5}>
            {txt.addDiscount}
          </Typography>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                select
                size="small"
                label={txt.scope}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                sx={{ minWidth: 130 }}
                fullWidth
              >
                {BILLING_SCOPES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s === "MONTHLY"
                      ? txt.monthly
                      : s === "YEARLY"
                        ? txt.yearly
                        : txt.both}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label={txt.type}
                value={type}
                onChange={(e) => setType(e.target.value)}
                sx={{ minWidth: 130 }}
                fullWidth
              >
                {DISCOUNT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t === "PERCENT" ? txt.percent : txt.fixed}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                type="number"
                label={txt.value}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                sx={{ minWidth: 110 }}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                size="small"
                label={txt.code}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                helperText={txt.codeHint}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <IconButton
                      size="small"
                      onClick={() => setCode(generateCode())}
                      aria-label={txt.generate}
                    >
                      <MdAutorenew />
                    </IconButton>
                  ),
                }}
              />
              <TextField
                size="small"
                type="number"
                label={txt.maxRedemptions}
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                sx={{ minWidth: 130 }}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                size="small"
                type="date"
                label={txt.startsAt}
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                size="small"
                type="date"
                label={txt.endsAt}
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>

            <Box>
              <Button
                variant="contained"
                startIcon={<MdAdd />}
                onClick={add}
                disabled={mut.isPostRequestLoading || !value}
              >
                {txt.addDiscount}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </FormDialog>
  );
}
