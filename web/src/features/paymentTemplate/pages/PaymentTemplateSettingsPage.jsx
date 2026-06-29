"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { PERMISSIONS, DEFAULT_PAYMENT_TEMPLATE } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useToast } from "../../../providers/ToastProvider.jsx";
import { useTranslation } from "../../../i18n/client.js";
import { useAppSettings } from "../../settings/hooks/useAppSettings.js";
import {
  PageHeader,
  RHFTextField,
  RHFTextArea,
  RHFSwitch,
  RHFPhoneField,
  ColorPicker,
  applyApiErrorsToForm,
} from "../../../shared/components/index.js";
import useDebounce from "../../../hooks/useDebounce.js";
import InvoiceDocument from "../../invoices/components/InvoiceDocument.jsx";
import { PAYMENT_TEMPLATE_URL } from "../config/constant.js";
import { usePaymentTemplateText } from "../config/paymentTemplateText.js";

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

function buildDefaults(cfg) {
  const c = cfg || DEFAULT_PAYMENT_TEMPLATE;
  const company = c.company || {};
  const theme = c.theme || {};
  const fees = c.fees || {};
  return {
    companyNameAr: company.nameAr ?? "",
    companyNameEn: company.nameEn ?? "",
    addressAr: company.addressAr ?? "",
    addressEn: company.addressEn ?? "",
    phone: company.phone ?? "",
    email: company.email ?? "",
    headerColor: theme.headerColor ?? "#3D1F08",
    headerTextColor: theme.headerTextColor ?? "#FFFFFF",
    accentColor: theme.accentColor ?? "#C9A84C",
    textColor: theme.textColor ?? "#25313F",
    notesColor: theme.notesColor ?? "#25313F",
    paymentInstructionsColor: theme.paymentInstructionsColor ?? "#25313F",
    transferFeePercent: fees.transferFeePercent ?? 0,
    transferFeeFixed: fees.transferFeeFixed ?? 0,
    dueDays: c.dueDays ?? 7,
    footerAr: c.footerAr ?? "",
    footerEn: c.footerEn ?? "",
    paymentInstructionsAr: c.paymentInstructionsAr ?? "",
    paymentInstructionsEn: c.paymentInstructionsEn ?? "",
    notesAr: notesToLines(c.notes, "ar"),
    notesEn: notesToLines(c.notes, "en"),
    showPreviousCredit: c.showPreviousCredit !== false,
    showPreviousDebt: c.showPreviousDebt !== false,
  };
}

function valuesToConfig(values) {
  return {
    company: {
      nameAr: values.companyNameAr,
      nameEn: values.companyNameEn,
      addressAr: values.addressAr,
      addressEn: values.addressEn,
      phone: values.phone,
      email: values.email,
    },
    theme: {
      headerColor: values.headerColor,
      headerTextColor: values.headerTextColor,
      accentColor: values.accentColor,
      textColor: values.textColor,
      notesColor: values.notesColor,
      paymentInstructionsColor: values.paymentInstructionsColor,
    },
    fees: {
      transferFeePercent: Number(values.transferFeePercent) || 0,
      transferFeeFixed: Number(values.transferFeeFixed) || 0,
    },
    dueDays: Number(values.dueDays) || 0,
    footerAr: values.footerAr,
    footerEn: values.footerEn,
    paymentInstructionsAr: values.paymentInstructionsAr,
    paymentInstructionsEn: values.paymentInstructionsEn,
    notes: linesToNotes(values.notesAr, values.notesEn),
    showPreviousCredit: Boolean(values.showPreviousCredit),
    showPreviousDebt: Boolean(values.showPreviousDebt),
  };
}

function samplePreviewInvoice(cfg, txt, currency) {
  const subtotal = 80;
  const fees = cfg.fees || {};
  const transferFee =
    Math.round(
      (subtotal * (Number(fees.transferFeePercent) || 0)) / 100 +
        (Number(fees.transferFeeFixed) || 0),
    ) * 1;
  // Sample figures so the preview actually renders the previous-credit/debt rows
  // whenever their toggles are on (the rows are hidden when the amount is zero).
  const previousCredit = 20;
  const previousDebt = 30;
  return {
    invoiceNumber: "INV-000001",
    status: "UNPAID",
    currency,
    hours: 8,
    hourlyRate: 8,
    subtotal,
    transferFee,
    total: subtotal + transferFee + previousDebt - previousCredit,
    previousCredit,
    previousDebt,
    configJson: cfg,
    issueDate: new Date().toISOString(),
    dueDate: null,
    billingPeriodLabel: null,
    subscription: {
      currency,
      priceCharged: subtotal,
      billingPeriod: "MONTHLY",
      student: {
        name: txt.sampleStudent,
        email: "sample@example.com",
        parents: [{ id: 1, name: txt.sampleGuardian, phone: "+20 100 000 0000" }],
      },
      plan: { titleAr: txt.samplePlan, titleEn: txt.samplePlan },
    },
  };
}

export default function PaymentTemplateSettingsPage() {
  const txt = usePaymentTemplateText();
  const { t } = useTranslation();
  const labels = t("dialogs", { returnObjects: true }) || {};
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const { currency } = useAppSettings();
  const canView = hasPermission(PERMISSIONS.PAYMENT_TEMPLATE.VIEW);
  const canManage = hasPermission(PERMISSIONS.PAYMENT_TEMPLATE.MANAGE);

  const { data, fetchData } = useRequest({
    url: PAYMENT_TEMPLATE_URL,
    method: "get",
    autoFetch: canView,
    syncToUrl: false,
  });

  // Preview reflects the saved template, with a live override applied as the
  // admin edits (debounced) and on save (optimistic, confirmed by the refetch).
  const [override, setOverride] = useState(null);
  const previewCfg = override ?? data?.configJson ?? DEFAULT_PAYMENT_TEMPLATE;

  const defaultValues = useMemo(() => buildDefaults(data?.configJson), [data]);

  const { control, handleSubmit, reset, watch, setError } = useForm({
    defaultValues,
    mode: "onTouched",
  });

  // Re-seed the form whenever the fetched template arrives/changes (the GET
  // resolves after mount, so defaults must flow into RHF then).
  useEffect(() => {
    reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, JSON.stringify(defaultValues)]);

  // Live preview: subscribe to every value and push a debounced copy into the
  // override so the invoice re-renders as the admin types/picks (350ms).
  const watched = watch();
  const debounced = useDebounce(JSON.stringify(watched), 350);
  useEffect(() => {
    try {
      setOverride(valuesToConfig(JSON.parse(debounced)));
    } catch {
      /* ignore */
    }
  }, [debounced]);

  const { fetchData: putRequest, isLoading: isSaving } = useRequest({
    url: PAYMENT_TEMPLATE_URL,
    method: "put",
    shouldAutoToast: true,
    syncToUrl: false,
    onSuccess: () => fetchData(),
    onError: (err) =>
      applyApiErrorsToForm(err, setError, {
        labelMap: {
          companyNameAr: txt.companyNameAr,
          companyNameEn: txt.companyNameEn,
          addressAr: txt.addressAr,
          addressEn: txt.addressEn,
          phone: txt.phone,
          email: txt.email,
          headerColor: txt.headerColor,
          headerTextColor: txt.headerTextColor,
          accentColor: txt.accentColor,
          textColor: txt.textColor,
          notesColor: txt.notesColor,
          paymentInstructionsColor: txt.paymentInstructionsColor,
          transferFeePercent: txt.transferFeePercent,
          transferFeeFixed: txt.transferFeeFixed,
          dueDays: txt.dueDays,
          footerAr: txt.footerAr,
          footerEn: txt.footerEn,
          paymentInstructionsAr: txt.paymentInstructionsArLabel,
          paymentInstructionsEn: txt.paymentInstructionsEnLabel,
          notesAr: txt.notesArLabel,
          notesEn: txt.notesEnLabel,
          showPreviousCredit: txt.showPreviousCredit,
          showPreviousDebt: txt.showPreviousDebt,
        },
        showToast,
        suppressFallbackToast: true,
      }),
  });

  async function submit(values) {
    const configJson = valuesToConfig(values);
    setOverride(configJson);
    await putRequest(null, { configJson });
  }

  if (!canView) return null;

  const previewInvoice = samplePreviewInvoice(previewCfg, txt, currency);

  return (
    <Box>
      <PageHeader title={txt.pageTitle} description={txt.pageDescription} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined">
            <CardContent>
              <Box component="form" onSubmit={handleSubmit(submit)} noValidate>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <RHFTextField
                      name="companyNameAr"
                      control={control}
                      label={txt.companyNameAr}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <RHFTextField
                      name="companyNameEn"
                      control={control}
                      label={txt.companyNameEn}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <RHFTextField name="addressAr" control={control} label={txt.addressAr} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <RHFTextField name="addressEn" control={control} label={txt.addressEn} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <RHFPhoneField name="phone" control={control} label={txt.phone} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <RHFTextField name="email" control={control} label={txt.email} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Controller
                      name="headerColor"
                      control={control}
                      render={({ field }) => (
                        <ColorPicker
                          label={txt.headerColor}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Controller
                      name="headerTextColor"
                      control={control}
                      render={({ field }) => (
                        <ColorPicker
                          label={txt.headerTextColor}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Controller
                      name="accentColor"
                      control={control}
                      render={({ field }) => (
                        <ColorPicker
                          label={txt.accentColor}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Controller
                      name="textColor"
                      control={control}
                      render={({ field }) => (
                        <ColorPicker
                          label={txt.textColor}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Controller
                      name="notesColor"
                      control={control}
                      render={({ field }) => (
                        <ColorPicker
                          label={txt.notesColor}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Controller
                      name="paymentInstructionsColor"
                      control={control}
                      render={({ field }) => (
                        <ColorPicker
                          label={txt.paymentInstructionsColor}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
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
                      name="dueDays"
                      control={control}
                      label={txt.dueDays}
                      type="number"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <RHFTextField name="footerAr" control={control} label={txt.footerAr} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <RHFTextField name="footerEn" control={control} label={txt.footerEn} />
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
                    <RHFTextArea name="notesAr" control={control} label={txt.notesArLabel} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <RHFTextArea name="notesEn" control={control} label={txt.notesEnLabel} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <RHFSwitch
                      name="showPreviousCredit"
                      control={control}
                      label={txt.showPreviousCredit}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <RHFSwitch
                      name="showPreviousDebt"
                      control={control}
                      label={txt.showPreviousDebt}
                    />
                  </Grid>
                </Grid>

                {canManage && (
                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    sx={{ mt: 2 }}
                    spacing={1}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => reset(defaultValues)}
                      disabled={isSaving}
                    >
                      {labels.cancel}
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSaving}
                      startIcon={isSaving ? <CircularProgress size={16} /> : null}
                    >
                      {txt.save}
                    </Button>
                  </Stack>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={1} sx={{ position: "sticky", top: 16 }}>
            <Typography variant="subtitle1" fontWeight={800}>
              {txt.previewTitle}
            </Typography>
            <InvoiceDocument invoice={previewInvoice} />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
