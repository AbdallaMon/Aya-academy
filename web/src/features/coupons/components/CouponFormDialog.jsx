"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Grid, IconButton, InputAdornment, TextField } from "@mui/material";
import { MdAutorenew } from "react-icons/md";
import {
  FormDialog,
  RHFTextField,
  RHFSelect,
  RHFSwitch,
  applyApiErrorsToForm,
} from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { COUPONS_URL, COUPON_SOURCES, toDateInput } from "../config/constant.js";
import { useCouponsText } from "../config/couponsText.js";

const FORM_ID = "coupon-form";

/** Random AYA-XXXXXX coupon-code suggestion (6 hex chars). */
function generateCode() {
  const hex = Math.random().toString(16).slice(2, 8).toUpperCase().padEnd(6, "0");
  return `AYA-${hex}`;
}

function makeDefaults(coupon) {
  if (coupon) {
    return {
      code: coupon.code ?? "",
      type: coupon.type ?? "PERCENT",
      value: coupon.value ?? "",
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
    source: "MANUAL",
    isActive: true,
    value: "",
    maxRedemptions: "",
    startsAt: "",
    endsAt: "",
  };
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
  const { showToast } = useToast();
  const isEdit = Boolean(coupon?.id);
  const usedCount = coupon?.redemptionsCount ?? 0;

  const { control, handleSubmit, reset, setValue, setError } = useForm({
    defaultValues: makeDefaults(coupon),
  });

  useEffect(() => {
    if (!open) return;
    // `open` re-seeds a fresh code each time the create dialog is opened.
    reset(makeDefaults(coupon));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, coupon, reset]);

  const sourceOptions = COUPON_SOURCES.reduce((acc, s) => {
    acc[s] = txt[s] || s;
    return acc;
  }, {});

  const { fetchData, isLoading } = useRequest({
    url: COUPONS_URL,
    method: isEdit ? "put" : "post",
    shouldAutoToast: true,
    onSuccess: () => {
      onSaved?.();
      onClose?.();
    },
    onError: (err) =>
      applyApiErrorsToForm(err, setError, {
        labelMap: {
          code: txt.codeLabel,
          type: txt.typeLabel,
          value: txt.valueLabel,
          maxRedemptions: txt.maxRedemptions,
          startsAt: txt.startsAt,
          endsAt: txt.endsAt,
          source: txt.sourceLabel,
        },
        showToast,
        suppressFallbackToast: true,
      }),
  });

  function submit(values) {
    // Coupons are global now — they apply to any plan/cycle, so we no longer send
    // planIds or a billingPeriod scope.
    const payload = {
      code: values.code?.trim() || undefined,
      type: values.type,
      value: Number(values.value),
      maxRedemptions: values.maxRedemptions
        ? Number(values.maxRedemptions)
        : undefined,
      startsAt: values.startsAt || undefined,
      endsAt: values.endsAt || undefined,
    };
    if (lockedPlanId) {
      payload.source = "MANUAL";
      payload.isActive = true;
    } else {
      payload.source = values.source || undefined;
      payload.isActive =
        values.isActive === undefined ? true : Boolean(values.isActive);
    }
    fetchData(isEdit ? String(coupon.id) : null, payload);
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? txt.editTitle : txt.createTitle}
      maxWidth="md"
      loading={isLoading}
      submitText={txt.save}
      cancelText={txt.cancel}
      onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  label={txt.codeLabel}
                  fullWidth
                  helperText={txt.codeHint}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setValue("code", generateCode())}
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
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFSelect
              name="type"
              control={control}
              label={txt.typeLabel}
              options={{ PERCENT: txt.percent, FIXED: txt.fixed }}
              rules={{ required: txt.required }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField
              name="value"
              control={control}
              label={txt.valueLabel}
              type="number"
              rules={{ required: txt.required }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField
              name="maxRedemptions"
              control={control}
              label={
                isEdit
                  ? `${txt.maxRedemptions} (${txt.used}: ${usedCount})`
                  : txt.maxRedemptions
              }
              type="number"
              rules={{
                validate: (v) =>
                  v === "" ||
                  v === null ||
                  v === undefined ||
                  Number(v) >= usedCount ||
                  `${txt.maxBelowUsage} (${usedCount})`,
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField
              name="startsAt"
              control={control}
              label={txt.startsAt}
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField
              name="endsAt"
              control={control}
              label={txt.endsAt}
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {!lockedPlanId && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFSelect
                name="source"
                control={control}
                label={txt.sourceLabel}
                options={sourceOptions}
              />
            </Grid>
          )}

          {!lockedPlanId && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <RHFSwitch name="isActive" control={control} label={txt.isActive} />
            </Grid>
          )}
        </Grid>
      </form>
    </FormDialog>
  );
}
