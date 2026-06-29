"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { useController, useWatch } from "react-hook-form";
import { PERMISSIONS, DEFAULT_PAYMENT_TEMPLATE } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { useAppSettings } from "../../settings/hooks/useAppSettings.js";
import { AppForm, ColorPicker } from "../../../shared/components/index.js";
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

// ── RHF-bound custom fields (rendered via AppForm's `custom` field type) ─────

// Color picker bound to an RHF field through the AppForm `control`.
function ColorField({ control, name, label }) {
  const { field } = useController({ control, name });
  return <ColorPicker label={label} value={field.value} onChange={field.onChange} />;
}

// Invisible field that subscribes to all form values and pushes a debounced copy
// up to the parent so the live preview re-renders as the admin types/picks.
function FormWatcher({ control, onChange }) {
  const values = useWatch({ control });
  const debounced = useDebounce(JSON.stringify(values), 350);
  useEffect(() => {
    try {
      onChange(JSON.parse(debounced));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  return null;
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

  const mut = useMultiRequest({
    url: PAYMENT_TEMPLATE_URL,
    onSuccess: () => fetchData(),
  });

  // Preview reflects the saved template, with a live override applied as the
  // admin edits (debounced) and on save (optimistic, confirmed by the refetch).
  const [override, setOverride] = useState(null);
  const previewCfg = override ?? data?.configJson ?? DEFAULT_PAYMENT_TEMPLATE;

  const defaultValues = useMemo(() => buildDefaults(data?.configJson), [data]);

  const fields = useMemo(
    () => [
      { name: "companyNameAr", label: txt.companyNameAr, type: "text" },
      { name: "companyNameEn", label: txt.companyNameEn, type: "text" },
      { name: "addressAr", label: txt.addressAr, type: "text" },
      { name: "addressEn", label: txt.addressEn, type: "text" },
      { name: "phone", label: txt.phone, type: "phone" },
      { name: "email", label: txt.email, type: "text" },
      {
        name: "headerColor",
        label: txt.headerColor,
        type: "custom",
        gridSize: { xs: 12, sm: 3 },
        component: (p) => <ColorField {...p} />,
      },
      {
        name: "headerTextColor",
        label: txt.headerTextColor,
        type: "custom",
        gridSize: { xs: 12, sm: 3 },
        component: (p) => <ColorField {...p} />,
      },
      {
        name: "accentColor",
        label: txt.accentColor,
        type: "custom",
        gridSize: { xs: 12, sm: 3 },
        component: (p) => <ColorField {...p} />,
      },
      {
        name: "textColor",
        label: txt.textColor,
        type: "custom",
        gridSize: { xs: 12, sm: 3 },
        component: (p) => <ColorField {...p} />,
      },
      {
        name: "notesColor",
        label: txt.notesColor,
        type: "custom",
        gridSize: { xs: 12, sm: 3 },
        component: (p) => <ColorField {...p} />,
      },
      {
        name: "paymentInstructionsColor",
        label: txt.paymentInstructionsColor,
        type: "custom",
        gridSize: { xs: 12, sm: 3 },
        component: (p) => <ColorField {...p} />,
      },
      { name: "transferFeePercent", label: txt.transferFeePercent, type: "number" },
      { name: "transferFeeFixed", label: txt.transferFeeFixed, type: "number" },
      { name: "dueDays", label: txt.dueDays, type: "number" },
      { name: "footerAr", label: txt.footerAr, type: "text" },
      { name: "footerEn", label: txt.footerEn, type: "text" },
      {
        name: "paymentInstructionsAr",
        label: txt.paymentInstructionsArLabel,
        type: "textarea",
        gridSize: { xs: 12 },
      },
      {
        name: "paymentInstructionsEn",
        label: txt.paymentInstructionsEnLabel,
        type: "textarea",
        gridSize: { xs: 12 },
      },
      { name: "notesAr", label: txt.notesArLabel, type: "textarea", gridSize: { xs: 12 } },
      { name: "notesEn", label: txt.notesEnLabel, type: "textarea", gridSize: { xs: 12 } },
      { name: "showPreviousCredit", label: txt.showPreviousCredit, type: "switch" },
      { name: "showPreviousDebt", label: txt.showPreviousDebt, type: "switch" },
      {
        name: "__watcher",
        label: "",
        type: "custom",
        gridSize: { xs: 12 },
        component: ({ control }) => (
          <FormWatcher control={control} onChange={(v) => setOverride(valuesToConfig(v))} />
        ),
      },
    ],
    [txt],
  );

  async function submit(values) {
    const configJson = valuesToConfig(values);
    setOverride(configJson);
    await mut.putRequest(null, { configJson });
  }

  if (!canView) return null;

  const previewInvoice = samplePreviewInvoice(previewCfg, txt, currency);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          {txt.pageTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {txt.pageDescription}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined">
            <CardContent>
              <AppForm
                fields={fields}
                defaultValues={defaultValues}
                onSubmit={submit}
                submitLabel={txt.save}
                loading={mut.isPutRequestLoading}
                hideActions={!canManage}
              />
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
