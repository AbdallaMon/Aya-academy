"use client";

// Per-invoice edit form. Edits the inherited template overrides (company,
// colors, fees, notes, payment instructions), the admin figures (previous
// credit/debt), the due date and the payment status. Hours/rate/subtotal are
// NOT here — they always come from the subscription, and the billing period is
// derived automatically from the subscription's plan.
//
// Notes + payment instructions live on the invoice's own configJson snapshot:
// they are inherited from the template at generation, then fully editable here.
// Editing REPLACES (it never appends), and clearing them saves an empty list.

import { useMemo } from "react";
import { Alert } from "@mui/material";
import { useController } from "react-hook-form";
import { AppForm, ColorPicker } from "../../../shared/components/index.js";
import { INVOICE_STATUSES } from "../config/constant.js";

// Color picker bound to an RHF field through the AppForm `control`.
function ColorField({ control, name, label }) {
  const { field } = useController({ control, name });
  return <ColorPicker label={label} value={field.value} onChange={field.onChange} />;
}

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
  return {
    companyNameAr: company.nameAr ?? "",
    companyNameEn: company.nameEn ?? "",
    companyPhone: company.phone ?? "",
    companyEmail: company.email ?? "",
    headerColor: theme.headerColor ?? "#3D1F08",
    headerTextColor: theme.headerTextColor ?? "#FFFFFF",
    accentColor: theme.accentColor ?? "#C9A84C",
    textColor: theme.textColor ?? "#25313F",
    transferFeePercent: fees.transferFeePercent ?? 0,
    transferFeeFixed: fees.transferFeeFixed ?? 0,
    previousCredit: invoice?.previousCredit ?? 0,
    previousDebt: invoice?.previousDebt ?? 0,
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
  return {
    configJson,
    previousCredit: Number(values.previousCredit) || 0,
    previousDebt: Number(values.previousDebt) || 0,
    // Only send a due date when one is set (omitting it keeps the current one).
    dueDate: values.dueDate || undefined,
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
      { name: "transferFeePercent", label: txt.transferFeePercent, type: "number" },
      { name: "transferFeeFixed", label: txt.transferFeeFixed, type: "number" },
      { name: "previousCredit", label: txt.previousCredit, type: "number" },
      { name: "previousDebt", label: txt.previousDebt, type: "number" },
      {
        name: "dueDate",
        label: txt.dueDate,
        type: "date",
        slotProps: { inputLabel: { shrink: true } },
      },
      {
        name: "status",
        label: txt.status,
        type: "select",
        options: INVOICE_STATUSES.reduce((acc, s) => ({ ...acc, [s]: txt[s] }), {}),
      },
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
      {
        name: "notesAr",
        label: txt.notesArLabel,
        type: "textarea",
        gridSize: { xs: 12 },
        helperText: txt.notesHint,
      },
      {
        name: "notesEn",
        label: txt.notesEnLabel,
        type: "textarea",
        gridSize: { xs: 12 },
        helperText: txt.notesHint,
      },
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
