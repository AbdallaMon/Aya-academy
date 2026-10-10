"use client";

// Per-invoice edit form. Optional pricing edits change this invoice snapshot
// before its first send; the subscription and logged sessions stay untouched.
//
// Notes + payment instructions live on the invoice's own configJson snapshot:
// they are inherited from the template at generation, then fully editable here.
// Editing REPLACES (it never appends), and clearing them saves an empty list.

import { useEffect, useMemo } from "react";
import { Alert, Box, Grid, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  FormDialog,
  RHFTextField,
  RHFTextArea,
  RHFSelect,
  ColorPicker,
  applyApiErrorsToForm,
} from "../../../shared/components/index.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { CURRENCY_OPTIONS, getInvoiceDiscountState, hasInvoicePricingChanges } from "@ayah/shared";
import { INVOICES_URL, INVOICE_STATUSES, formatMoney } from "../config/constant.js";
import { buildInvoicePricingInput, buildInvoicePreview } from "../lib/invoiceEditPricing.js";
import InvoicePricingSummary from "./InvoicePricingSummary.jsx";

const FORM_ID = "invoice-edit-form";

// One note per line ⇄ array of { ar, en }. Blank lines are dropped, so clearing
// the textareas yields an empty list (i.e. "no notes").
function linesToNotes(ar, en) {
  const arr = (ar || "").split("\n").map((s) => s.trim());
  const enr = (en || "").split("\n").map((s) => s.trim());
  const len = Math.max(arr.length, enr.length);
  const out = [];
  for (let i = 0; i < len; i += 1) {
    const a = arr[i] || "";
    const e = enr[i] || "";
    if (a || e) out.push({ ar: a, en: e });
  }
  return out;
}

function notesToLines(notes, key) {
  return (Array.isArray(notes) ? notes : []).map((n) => n[key] || "").join("\n");
}

// ISO/Date → YYYY-MM-DD (local) for the native date input; "" when absent.
function toDateInputValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function buildInvoiceDefaults(invoice) {
  const cfg = invoice?.configJson || {};
  const company = cfg.company || {};
  const theme = cfg.theme || {};
  const fees = cfg.fees || {};
  const discount = getInvoiceDiscountState(invoice);
  return {
    companyNameAr: company.nameAr ?? "",
    companyNameEn: company.nameEn ?? "",
    companyPhone: company.phone ?? "",
    companyEmail: company.email ?? "",
    headerColor: theme.headerColor ?? "#3D1F08",
    headerTextColor: theme.headerTextColor ?? "#FFFFFF",
    accentColor: theme.accentColor ?? "#C9A84C",
    textColor: theme.textColor ?? "#25313F",
    notesColor: theme.notesColor ?? "#25313F",
    paymentInstructionsColor: theme.paymentInstructionsColor ?? "#25313F",
    transferFeePercent: fees.transferFeePercent ?? 0,
    transferFeeFixed: fees.transferFeeFixed ?? 0,
    previousCredit: invoice?.previousCredit ?? 0,
    previousDebt: invoice?.previousDebt ?? 0,
    hours: invoice?.minutes != null
      ? Number((invoice.minutes / 60).toFixed(4))
      : invoice?.hours ?? "",
    hourlyRate: invoice?.hourlyRate ?? "",
    currency: invoice?.currency ?? "USD",
    discountMode: discount.mode,
    manualDiscountAmount: discount.manualAmount,
    adjustmentAmount: invoice?.configJson?.invoiceAdjustment?.amount ?? 0,
    adjustmentReason: invoice?.configJson?.invoiceAdjustment?.reason ?? "",
    dueDate: toDateInputValue(invoice?.dueDate),
    paymentInstructionsAr: cfg.paymentInstructionsAr ?? "",
    paymentInstructionsEn: cfg.paymentInstructionsEn ?? "",
    notesAr: notesToLines(cfg.notes, "ar"),
    notesEn: notesToLines(cfg.notes, "en"),
    status: invoice?.status ?? "UNPAID",
  };
}

/** Assemble the PATCH payload from form values, merging config onto the invoice's. */
export function buildInvoicePayload(values, invoice) {
  const base = invoice?.configJson || {};
  const configJson = {
    ...base,
    company: {
      ...(base.company || {}),
      nameAr: values.companyNameAr,
      nameEn: values.companyNameEn,
      phone: values.companyPhone,
      email: values.companyEmail,
    },
    theme: {
      ...(base.theme || {}),
      headerColor: values.headerColor,
      headerTextColor: values.headerTextColor,
      accentColor: values.accentColor,
      textColor: values.textColor,
      notesColor: values.notesColor,
      paymentInstructionsColor: values.paymentInstructionsColor,
    },
    fees: {
      ...(base.fees || {}),
      transferFeePercent: Number(values.transferFeePercent) || 0,
      transferFeeFixed: Number(values.transferFeeFixed) || 0,
    },
    // Edits replace the snapshot wholesale; an empty box clears them.
    paymentInstructionsAr: values.paymentInstructionsAr || "",
    paymentInstructionsEn: values.paymentInstructionsEn || "",
    notes: linesToNotes(values.notesAr, values.notesEn),
  };
  const payload = {
    configJson,
    previousCredit: Number(values.previousCredit) || 0,
    previousDebt: Number(values.previousDebt) || 0,
    // Only send a due date when one is set (omitting it keeps the current one).
    dueDate: values.dueDate || undefined,
    status: values.status,
  };
  if (!invoice?.sentAt && invoice?.status === "UNPAID") {
    const pricing = buildInvoicePricingInput(values);
    const priorAdjustment = invoice?.configJson?.invoiceAdjustment;
    if (
      hasInvoicePricingChanges(invoice, pricing) ||
      pricing.adjustmentAmount !== Number(priorAdjustment?.amount ?? 0) ||
      pricing.adjustmentReason !== (priorAdjustment?.reason ?? "")
    ) {
      payload.pricing = pricing;
    }
  }
  return payload;
}

/**
 * The per-invoice edit form, hosted in its own FormDialog. Owns the PATCH
 * mutation against the invoice; on success it refreshes the parent (onSaved)
 * and closes. Field-level validation errors from the server are bound back onto
 * the matching inputs via applyApiErrorsToForm.
 *
 * Props:
 *   - open / onClose: dialog visibility (owned by the parent)
 *   - invoice: the invoice being edited
 *   - txt: the localized strings table (useInvoicesText)
 *   - onSaved: called after a successful save (parent refetches the invoice)
 */
export default function InvoiceEditForm({ open, onClose, invoice, txt, onSaved }) {
  const { showToast } = useToast();
  const defaultValues = useMemo(() => buildInvoiceDefaults(invoice), [invoice]);

  const { control, handleSubmit, reset, setError, clearErrors } = useForm({
    defaultValues,
    mode: "onTouched",
  });
  const values = useWatch({ control });
  const preview = buildInvoicePreview(values, invoice);
  const { applied: appliedDiscount } = getInvoiceDiscountState(invoice);

  useEffect(() => {
    reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, JSON.stringify(defaultValues)]);

  const statusOptions = useMemo(
    () => INVOICE_STATUSES.reduce((acc, s) => ({ ...acc, [s]: txt[s] }), {}),
    [txt],
  );
  const currencyOptions = useMemo(
    () => Object.fromEntries(CURRENCY_OPTIONS.map((code) => [code, code])),
    [],
  );
  const canEditPricing = invoice?.status === "UNPAID" && !invoice?.sentAt;

  const { fetchData, isLoading } = useRequest({
    url: INVOICES_URL,
    method: "patch",
    shouldAutoToast: true,
    onSuccess: () => {
      onSaved?.();
      onClose?.();
    },
    onError: (err) =>
      applyApiErrorsToForm(err, setError, {
        labelMap: {
          companyNameAr: `${txt.companyName} (ع)`,
          companyNameEn: `${txt.companyName} (EN)`,
          companyPhone: txt.companyPhone,
          companyEmail: txt.companyEmail,
          headerColor: txt.headerColor,
          headerTextColor: txt.headerTextColor,
          accentColor: txt.accentColor,
          textColor: txt.textColor,
          notesColor: txt.notesColor,
          paymentInstructionsColor: txt.paymentInstructionsColor,
          transferFeePercent: txt.transferFeePercent,
          transferFeeFixed: txt.transferFeeFixed,
          previousCredit: txt.previousCredit,
          previousDebt: txt.previousDebt,
          hours: txt.billedHours,
          hourlyRate: txt.hourlyRate,
          currency: txt.currency,
          discountMode: txt.discountMode,
          manualDiscountAmount: txt.manualDiscount,
          adjustmentAmount: txt.adjustmentAmount,
          adjustmentReason: txt.adjustmentReason,
          dueDate: txt.dueDate,
          status: txt.status,
          paymentInstructionsAr: txt.paymentInstructionsArLabel,
          paymentInstructionsEn: txt.paymentInstructionsEnLabel,
          notesAr: txt.notesArLabel,
          notesEn: txt.notesEnLabel,
        },
        showToast,
        suppressFallbackToast: true,
      }),
  });

  function submit(values) {
    if (buildInvoicePreview(values, invoice).error) return;
    fetchData(String(invoice.id), buildInvoicePayload(values, invoice));
  }

  // A color picker bound to an RHF field. Inlined as a Controller so the
  // OS color-wheel behaviour (and the hex label) is preserved exactly.
  const colorField = (name, label) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <ColorPicker label={label} value={field.value} onChange={field.onChange} />
      )}
    />
  );

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={txt.editTitle}
      maxWidth="md"
      loading={isLoading}
      submitText={txt.save}
      cancelText={txt.cancel}
      contentSx={{ pt: 0 }}
      onSubmit={() => document.getElementById(FORM_ID)?.requestSubmit()}
    >
      <InvoicePricingSummary preview={preview} currency={values.currency} txt={txt} />
      <Alert severity="info" sx={{ mb: 2 }}>
        {canEditPricing ? txt.invoiceOnlyPricingHint : txt.pricingLocked}
      </Alert>

      <form id={FORM_ID} onSubmit={handleSubmit(submit)} noValidate>
        <Grid container spacing={2}>
          {canEditPricing && (
            <>
              <Grid size={{ xs: 12, sm: 4 }}>
                <RHFTextField
                  name="hours"
                  control={control}
                  label={txt.billedHours}
                  type="number"
                  rules={{
                    required: invoice?.minutes != null ? txt.required : false,
                    validate: (v) => v === "" && invoice?.minutes == null ||
                      Number(v) > 0 && Math.abs(Number(v) * 60 - Math.round(Number(v) * 60)) < 0.01 ||
                      txt.invalidHours,
                  }}
                  slotProps={{ htmlInput: { min: 1 / 60, step: "any" } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <RHFTextField
                  name="hourlyRate"
                  control={control}
                  label={txt.hourlyRate}
                  type="number"
                  rules={{
                    required: invoice?.hourlyRate != null ? txt.required : false,
                    validate: (v) => v === "" && invoice?.hourlyRate == null || Number(v) > 0 || txt.invalidRate,
                  }}
                  slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <RHFSelect name="currency" control={control} label={txt.currency} options={currencyOptions} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {appliedDiscount && (
                    <>
                      <Typography variant="subtitle2" id="invoice-discount-mode-label">{txt.discountMode}</Typography>
                      <Controller
                        name="discountMode"
                        control={control}
                        render={({ field }) => (
                          <ToggleButtonGroup
                            exclusive
                            value={field.value}
                            onChange={(_, value) => {
                              if (value) {
                                field.onChange(value);
                                clearErrors('manualDiscountAmount');
                              }
                            }}
                            aria-labelledby="invoice-discount-mode-label"
                            color="primary"
                            size="small"
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            <ToggleButton value="APPLIED">{txt.appliedDiscount}</ToggleButton>
                            <ToggleButton value="MANUAL">{txt.manualDiscount}</ToggleButton>
                          </ToggleButtonGroup>
                        )}
                      />
                    </>
                  )}
                  {values.discountMode === 'APPLIED' && appliedDiscount ? (
                    <Alert severity="info">
                      {txt.appliedDiscount}: {appliedDiscount.code ? `${appliedDiscount.code} · ` : ''}
                      {appliedDiscount.type === 'PERCENT'
                        ? `${appliedDiscount.value}%`
                        : formatMoney(appliedDiscount.value, appliedDiscount.currency)}
                      {' — '}{txt.appliedDiscountHint}
                    </Alert>
                  ) : (
                    <RHFTextField
                      name="manualDiscountAmount"
                      control={control}
                      label={`${txt.manualDiscount} (${values.currency})`}
                      type="number"
                      helperText={txt.manualDiscountHint}
                      rules={{ validate: (value) => {
                        const amount = Number(value);
                        const base = Math.round(Number(values.hours) * 60) * Number(values.hourlyRate) / 60;
                        return Number.isFinite(amount) && amount >= 0 && amount <= Math.round(base * 100) / 100
                          && Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-7 || txt.invalidManualDiscount;
                      } }}
                      slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                    />
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField
                  name="adjustmentAmount"
                  control={control}
                  label={txt.adjustmentAmount}
                  type="number"
                  slotProps={{ htmlInput: { step: 0.01 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <RHFTextField
                  name="adjustmentReason"
                  control={control}
                  label={txt.adjustmentReason}
                  rules={{
                    validate: (v, values) => Number(values.adjustmentAmount) === 0 || !!v?.trim() || txt.adjustmentReasonRequired,
                  }}
                />
              </Grid>
            </>
          )}
          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField name="companyNameAr" control={control} label={`${txt.companyName} (ع)`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField name="companyNameEn" control={control} label={`${txt.companyName} (EN)`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField name="companyPhone" control={control} label={txt.companyPhone} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField name="companyEmail" control={control} label={txt.companyEmail} />
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }}>{colorField("headerColor", txt.headerColor)}</Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            {colorField("headerTextColor", txt.headerTextColor)}
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>{colorField("accentColor", txt.accentColor)}</Grid>
          <Grid size={{ xs: 12, sm: 3 }}>{colorField("textColor", txt.textColor)}</Grid>
          <Grid size={{ xs: 12, sm: 3 }}>{colorField("notesColor", txt.notesColor)}</Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            {colorField("paymentInstructionsColor", txt.paymentInstructionsColor)}
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField
              name="transferFeePercent"
              control={control}
              label={txt.transferFeePercent}
              type="number"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField
              name="transferFeeFixed"
              control={control}
              label={txt.transferFeeFixed}
              type="number"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField
              name="previousCredit"
              control={control}
              label={txt.previousCredit}
              type="number"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField
              name="previousDebt"
              control={control}
              label={txt.previousDebt}
              type="number"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFTextField
              name="dueDate"
              control={control}
              label={txt.dueDate}
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <RHFSelect
              name="status"
              control={control}
              label={txt.status}
              options={statusOptions}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <RHFTextArea
              name="paymentInstructionsAr"
              control={control}
              label={txt.paymentInstructionsArLabel}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <RHFTextArea
              name="paymentInstructionsEn"
              control={control}
              label={txt.paymentInstructionsEnLabel}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <RHFTextArea
              name="notesAr"
              control={control}
              label={txt.notesArLabel}
              helperText={txt.notesHint}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <RHFTextArea
              name="notesEn"
              control={control}
              label={txt.notesEnLabel}
              helperText={txt.notesHint}
            />
          </Grid>
        </Grid>
      </form>
    </FormDialog>
  );
}
