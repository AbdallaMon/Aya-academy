"use client";

// Per-invoice edit form. Edits the inherited template overrides (company,
// colors, fees), the admin figures (free hours, previous credit/debt), the
// billing label, free-text notes and the payment status. Hours/rate/subtotal
// are NOT here — they always come from the subscription.

import { useMemo } from "react";
import { Alert } from "@mui/material";
import { AppForm } from "../../../shared/components/index.js";
import { INVOICE_STATUSES } from "../config/constant.js";

export function buildInvoiceDefaults(invoice) {
  const cfg = invoice?.configJson || {};
  const company = cfg.company || {};
  const theme = cfg.theme || {};
  const fees = cfg.fees || {};
  return {
    companyNameAr: company.nameAr ?? "",
    companyNameEn: company.nameEn ?? "",
    companyPhone: company.phone ?? "",
    companyEmail: company.email ?? "",
    headerColor: theme.headerColor ?? "#3D1F08",
    accentColor: theme.accentColor ?? "#C9A84C",
    transferFeePercent: fees.transferFeePercent ?? 0,
    transferFeeFixed: fees.transferFeeFixed ?? 0,
    freeHours: invoice?.freeHours ?? 0,
    previousCredit: invoice?.previousCredit ?? 0,
    previousDebt: invoice?.previousDebt ?? 0,
    billingPeriodLabel: invoice?.billingPeriodLabel ?? "",
    notes: invoice?.notes ?? "",
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
      accentColor: values.accentColor,
    },
    fees: {
      ...(base.fees || {}),
      transferFeePercent: Number(values.transferFeePercent) || 0,
      transferFeeFixed: Number(values.transferFeeFixed) || 0,
    },
  };
  return {
    configJson,
    freeHours: Number(values.freeHours) || 0,
    previousCredit: Number(values.previousCredit) || 0,
    previousDebt: Number(values.previousDebt) || 0,
    billingPeriodLabel: values.billingPeriodLabel || undefined,
    notes: values.notes || undefined,
    status: values.status,
  };
}

export default function InvoiceEditForm({ id, invoice, txt, onSubmit }) {
  const defaultValues = useMemo(() => buildInvoiceDefaults(invoice), [invoice]);

  const fields = useMemo(
    () => [
      { name: "companyNameAr", label: `${txt.companyName} (ع)`, type: "text" },
      { name: "companyNameEn", label: `${txt.companyName} (EN)`, type: "text" },
      { name: "companyPhone", label: txt.companyPhone, type: "text" },
      { name: "companyEmail", label: txt.companyEmail, type: "text" },
      { name: "headerColor", label: txt.headerColor, type: "text" },
      { name: "accentColor", label: txt.accentColor, type: "text" },
      { name: "transferFeePercent", label: txt.transferFeePercent, type: "number" },
      { name: "transferFeeFixed", label: txt.transferFeeFixed, type: "number" },
      { name: "freeHours", label: txt.freeHours, type: "number" },
      { name: "previousCredit", label: txt.previousCredit, type: "number" },
      { name: "previousDebt", label: txt.previousDebt, type: "number" },
      { name: "billingPeriodLabel", label: txt.billingPeriod, type: "text" },
      {
        name: "status",
        label: txt.status,
        type: "select",
        options: INVOICE_STATUSES.reduce((acc, s) => ({ ...acc, [s]: txt[s] }), {}),
      },
      { name: "notes", label: txt.notes, type: "textarea", gridSize: { xs: 12 } },
    ],
    [txt],
  );

  return (
    <>
      <Alert severity="info" sx={{ mb: 2 }}>
        {txt.hoursLocked}
      </Alert>
      <AppForm
        id={id}
        fields={fields}
        defaultValues={defaultValues}
        onSubmit={(values) => onSubmit(buildInvoicePayload(values, invoice))}
      />
    </>
  );
}
