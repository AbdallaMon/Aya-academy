"use client";

import { useMemo, useState } from "react";
import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { PERMISSIONS, DEFAULT_PAYMENT_TEMPLATE } from "@aya/shared";
import { usePermission } from "../../../hooks/usePermission.js";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { useMultiRequest } from "../../../hooks/request/useMultiRequest.js";
import { AppForm } from "../../../shared/components/index.js";
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
    logoUrl: company.logoUrl ?? "",
    headerColor: theme.headerColor ?? "#3D1F08",
    accentColor: theme.accentColor ?? "#C9A84C",
    textColor: theme.textColor ?? "#25313F",
    transferFeePercent: fees.transferFeePercent ?? 0,
    transferFeeFixed: fees.transferFeeFixed ?? 0,
    dueDays: c.dueDays ?? 7,
    footerAr: c.footerAr ?? "",
    footerEn: c.footerEn ?? "",
    notesAr: notesToLines(c.notes, "ar"),
    notesEn: notesToLines(c.notes, "en"),
    showFreeHours: c.showFreeHours !== false,
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
      logoUrl: values.logoUrl,
    },
    theme: {
      headerColor: values.headerColor,
      accentColor: values.accentColor,
      textColor: values.textColor,
    },
    fees: {
      transferFeePercent: Number(values.transferFeePercent) || 0,
      transferFeeFixed: Number(values.transferFeeFixed) || 0,
    },
    dueDays: Number(values.dueDays) || 0,
    footerAr: values.footerAr,
    footerEn: values.footerEn,
    notes: linesToNotes(values.notesAr, values.notesEn),
    showFreeHours: Boolean(values.showFreeHours),
    showPreviousCredit: Boolean(values.showPreviousCredit),
    showPreviousDebt: Boolean(values.showPreviousDebt),
  };
}

function samplePreviewInvoice(cfg, txt) {
  const subtotal = 80;
  const fees = cfg.fees || {};
  const transferFee =
    Math.round(
      (subtotal * (Number(fees.transferFeePercent) || 0)) / 100 +
        (Number(fees.transferFeeFixed) || 0),
    ) * 1;
  return {
    invoiceNumber: "INV-000001",
    status: "UNPAID",
    currency: "GBP",
    hours: 8,
    hourlyRate: 10,
    subtotal,
    transferFee,
    total: subtotal + transferFee,
    freeHours: 1,
    previousCredit: 0,
    previousDebt: 0,
    configJson: cfg,
    issueDate: new Date().toISOString(),
    dueDate: null,
    billingPeriodLabel: null,
    subscription: {
      currency: "GBP",
      priceCharged: subtotal,
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

  // Preview reflects the saved template, with an optimistic override applied on
  // save (so the preview updates immediately, then the refetch confirms it).
  const [override, setOverride] = useState(null);
  const previewCfg = override ?? data?.configJson ?? DEFAULT_PAYMENT_TEMPLATE;

  const defaultValues = useMemo(
    () => buildDefaults(data?.configJson),
    [data],
  );

  const fields = useMemo(
    () => [
      { name: "companyNameAr", label: txt.companyNameAr, type: "text" },
      { name: "companyNameEn", label: txt.companyNameEn, type: "text" },
      { name: "addressAr", label: txt.addressAr, type: "text" },
      { name: "addressEn", label: txt.addressEn, type: "text" },
      { name: "phone", label: txt.phone, type: "text" },
      { name: "email", label: txt.email, type: "text" },
      { name: "logoUrl", label: txt.logoUrl, type: "text", gridSize: { xs: 12 } },
      { name: "headerColor", label: txt.headerColor, type: "text" },
      { name: "accentColor", label: txt.accentColor, type: "text" },
      { name: "textColor", label: txt.textColor, type: "text" },
      { name: "transferFeePercent", label: txt.transferFeePercent, type: "number" },
      { name: "transferFeeFixed", label: txt.transferFeeFixed, type: "number" },
      { name: "dueDays", label: txt.dueDays, type: "number" },
      { name: "footerAr", label: txt.footerAr, type: "text" },
      { name: "footerEn", label: txt.footerEn, type: "text" },
      { name: "notesAr", label: txt.notesArLabel, type: "textarea", gridSize: { xs: 12 } },
      { name: "notesEn", label: txt.notesEnLabel, type: "textarea", gridSize: { xs: 12 } },
      { name: "showFreeHours", label: txt.showFreeHours, type: "switch" },
      { name: "showPreviousCredit", label: txt.showPreviousCredit, type: "switch" },
      { name: "showPreviousDebt", label: txt.showPreviousDebt, type: "switch" },
    ],
    [txt],
  );

  async function submit(values) {
    const configJson = valuesToConfig(values);
    setOverride(configJson);
    await mut.putRequest(null, { configJson });
  }

  if (!canView) return null;

  const previewInvoice = samplePreviewInvoice(previewCfg, txt);

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
