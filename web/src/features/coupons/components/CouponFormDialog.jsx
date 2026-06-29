"use client";

import { useMemo } from "react";
import { Controller } from "react-hook-form";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { MdAutorenew } from "react-icons/md";
import { AppForm, FormDialog } from "../../../shared/components/index.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import {
  COUPONS_URL,
  BILLING_SCOPES,
  COUPON_SOURCES,
  toDateInput,
} from "../config/constant.js";
import { useCouponsText } from "../config/couponsText.js";

/** Random AYA-XXXXXX coupon-code suggestion (6 hex chars). */
function generateCode() {
  const hex = Math.random().toString(16).slice(2, 8).toUpperCase().padEnd(6, "0");
  return `AYA-${hex}`;
}

/**
 * The single, shared create/edit form for a coupon — used both by the standalone
 * Coupons page and by the per-plan "discounts" dialog. A coupon code is always
 * pre-generated (with a regenerate button) and editable; leaving it blank lets
 * the server generate a unique one.
 *
 * Props:
 *   - coupon: the row being edited, or null to create
 *   - lockedPlanId: when set, the coupon is scoped to that plan (source forced to
 *     MANUAL, plan/source/active fields hidden) — this is the plan-discounts flow
 *   - onSaved: called after a successful create/update (to refetch the list)
 */
export default function CouponFormDialog({
  open,
  onClose,
  coupon = null,
  lockedPlanId = null,
  onSaved,
}) {
  const txt = useCouponsText();
  const isEdit = Boolean(coupon?.id);
  const usedCount = coupon?.redemptionsCount ?? 0;

  const mut = useMultiRequest({ url: COUPONS_URL });

  const scopeOptions = useMemo(
    () =>
      BILLING_SCOPES.reduce((acc, s) => {
        acc[s] = s === "MONTHLY" ? txt.monthly : s === "YEARLY" ? txt.yearly : txt.both;
        return acc;
      }, {}),
    [txt],
  );

  const sourceOptions = useMemo(
    () =>
      COUPON_SOURCES.reduce((acc, s) => {
        acc[s] = txt[s] || s;
        return acc;
      }, {}),
    [txt],
  );

  const fields = useMemo(() => {
    const list = [
      {
        name: "code",
        label: txt.codeLabel,
        type: "custom",
        component: ({ control, name, label, setValue }) => (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                label={label}
                fullWidth
                helperText={txt.codeHint}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setValue(name, generateCode())}
                        aria-label={txt.generate}
                        title={txt.generate}
                      >
                        <MdAutorenew />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        ),
      },
      {
        name: "type",
        label: txt.typeLabel,
        type: "select",
        options: { PERCENT: txt.percent, FIXED: txt.fixed },
        rules: { required: txt.required },
      },
      {
        name: "value",
        label: txt.valueLabel,
        type: "number",
        rules: { required: txt.required },
      },
      {
        name: "billingPeriod",
        label: txt.scopeLabel,
        type: "select",
        options: scopeOptions,
      },
      {
        // Editing keeps the usage count visible right on the field so the cap
        // can't be lowered below it (also enforced server-side).
        name: "maxRedemptions",
        label: isEdit
          ? `${txt.maxRedemptions} (${txt.used}: ${usedCount})`
          : txt.maxRedemptions,
        type: "number",
        rules: {
          validate: (v) =>
            v === "" ||
            v === null ||
            v === undefined ||
            Number(v) >= usedCount ||
            `${txt.maxBelowUsage} (${usedCount})`,
        },
      },
      {
        name: "startsAt",
        label: txt.startsAt,
        type: "date",
        InputLabelProps: { shrink: true },
      },
      {
        name: "endsAt",
        label: txt.endsAt,
        type: "date",
        InputLabelProps: { shrink: true },
      },
    ];

    // The standalone Coupons page exposes source + active; the per-plan flow
    // forces MANUAL / active, so those controls are hidden there.
    if (!lockedPlanId) {
      list.push({
        name: "source",
        label: txt.sourceLabel,
        type: "select",
        options: sourceOptions,
      });
      list.push({ name: "isActive", label: txt.isActive, type: "switch" });
    }

    return list;
  }, [txt, scopeOptions, sourceOptions, lockedPlanId, isEdit, usedCount]);

  const defaultValues = useMemo(() => {
    if (coupon) {
      return {
        code: coupon.code ?? "",
        type: coupon.type ?? "PERCENT",
        value: coupon.value ?? "",
        billingPeriod: coupon.billingPeriod ?? "ALL",
        source: coupon.source ?? "MANUAL",
        maxRedemptions: coupon.maxRedemptions ?? "",
        startsAt: toDateInput(coupon.startsAt),
        endsAt: toDateInput(coupon.endsAt),
        isActive: coupon.isActive ?? true,
      };
    }
    return {
      code: generateCode(),
      type: "PERCENT",
      billingPeriod: "ALL",
      source: "MANUAL",
      isActive: true,
      value: "",
      maxRedemptions: "",
      startsAt: "",
      endsAt: "",
    };
    // `open` re-seeds a fresh code each time the dialog is opened to create.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupon, open]);

  async function submit(values) {
    const payload = {
      code: values.code?.trim() || undefined,
      type: values.type,
      value: Number(values.value),
      // "ALL" sentinel → omit (applies to both cycles).
      billingPeriod:
        values.billingPeriod && values.billingPeriod !== "ALL"
          ? values.billingPeriod
          : undefined,
      maxRedemptions: values.maxRedemptions
        ? Number(values.maxRedemptions)
        : undefined,
      startsAt: values.startsAt || undefined,
      endsAt: values.endsAt || undefined,
    };
    if (lockedPlanId) {
      payload.source = "MANUAL";
      payload.planIds = [lockedPlanId];
      payload.isActive = true;
    } else {
      payload.source = values.source || undefined;
      payload.isActive =
        values.isActive === undefined ? true : Boolean(values.isActive);
    }

    try {
      if (isEdit) await mut.putRequest(String(coupon.id), payload);
      else await mut.postRequest(null, payload);
      onSaved?.();
      onClose?.();
    } catch {
      // The mutation auto-toasts the error; keep the dialog open to retry.
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? txt.editTitle : txt.createTitle}
      maxWidth="md"
      loading={mut.isPostRequestLoading || mut.isPutRequestLoading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={() => document.getElementById("coupon-form")?.requestSubmit()}
    >
      <AppForm
        id="coupon-form"
        fields={fields}
        defaultValues={defaultValues}
        onSubmit={submit}
      />
    </FormDialog>
  );
}
