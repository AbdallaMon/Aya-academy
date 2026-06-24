"use client";

// Printable demand-invoice document. Reads an invoice (with its embedded
// subscription/student/plan) plus the per-invoice configJson (company, theme
// colors, customer notes, footer). RTL/LTR aware. When `printable` is set the
// root carries id="invoice-print" so the page's print stylesheet isolates it.

import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { useTranslation } from "../../../i18n/client.js";
import { useInvoicesText } from "../config/invoicesText.js";
import {
  INVOICE_STATUS_COLOR,
  formatHours,
  formatMoney,
} from "../config/constant.js";
import { DEFAULT_PAYMENT_TEMPLATE } from "@aya/shared";

function hideOnError(e) {
  e.currentTarget.style.display = "none";
}

function TotalRow({ label, value, strong, headerColor, accent, textColor }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
      <Typography
        sx={{
          fontSize: strong ? 15 : 13,
          fontWeight: strong ? 900 : 600,
          color: strong ? headerColor : "text.secondary",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: strong ? 16 : 13,
          fontWeight: strong ? 900 : 700,
          color: strong ? accent : textColor,
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function fmtDate(value, lng) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(lng === "en" ? "en-GB" : "ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function InvoiceDocument({ invoice, printable = false }) {
  const { lng } = useTranslation();
  const txt = useInvoicesText();
  if (!invoice) return null;

  const isEn = lng === "en";
  const cfg = invoice.configJson || DEFAULT_PAYMENT_TEMPLATE;
  const company = cfg.company || {};
  const theme = cfg.theme || {};
  const headerColor = theme.headerColor || "#3D1F08";
  const accent = theme.accentColor || "#C9A84C";
  const textColor = theme.textColor || "#25313F";

  const sub = invoice.subscription || {};
  const student = sub.student || {};
  const parent = (student.parents || [])[0];
  const plan = sub.plan;
  const currency = invoice.currency || sub.currency || "GBP";

  const companyName = (isEn ? company.nameEn : company.nameAr) || company.nameEn || company.nameAr;
  const companyAddress = isEn ? company.addressEn : company.addressAr;
  const planTitle = plan ? (isEn ? plan.titleEn : plan.titleAr) : "—";
  const footer = (isEn ? cfg.footerEn : cfg.footerAr) || "";
  const notes = Array.isArray(cfg.notes) ? cfg.notes : [];

  const showFreeHours = cfg.showFreeHours !== false;
  const showPrevCredit = cfg.showPreviousCredit !== false;
  const showPrevDebt = cfg.showPreviousDebt !== false;

  const labelSx = { color: "text.secondary", fontSize: 12, fontWeight: 600 };
  const valueSx = { fontSize: 13, fontWeight: 700 };
  const totalColors = { headerColor, accent, textColor };

  return (
    <Box
      id={printable ? "invoice-print" : undefined}
      dir={isEn ? "ltr" : "rtl"}
      sx={{
        width: "100%",
        maxWidth: 820,
        mx: "auto",
        bgcolor: "#fff",
        color: textColor,
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: 3,
        border: `1px solid ${accent}55`,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Header band */}
      <Box sx={{ bgcolor: headerColor, color: "#fff", px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
          <Stack direction="row" spacing={1.5} alignItems="center">
            {company.logoUrl ? (
              <Box
                component="img"
                src={company.logoUrl}
                alt=""
                onError={hideOnError}
                sx={{ height: 56, width: "auto", objectFit: "contain" }}
              />
            ) : null}
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 20, lineHeight: 1.15 }}>
                {companyName}
              </Typography>
              {companyAddress ? (
                <Typography sx={{ fontSize: 12, opacity: 0.85 }}>{companyAddress}</Typography>
              ) : null}
              <Typography sx={{ fontSize: 12, opacity: 0.85 }}>
                {[company.phone, company.email].filter(Boolean).join("  ·  ")}
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ textAlign: isEn ? "right" : "left" }}>
            <Typography sx={{ fontWeight: 900, fontSize: 22, color: accent, letterSpacing: 1 }}>
              {txt.invoiceTitle}
            </Typography>
            <Typography sx={{ fontSize: 13, opacity: 0.9 }}>
              {txt.invoiceNumber}: {invoice.invoiceNumber}
            </Typography>
            <Chip
              size="small"
              color={INVOICE_STATUS_COLOR[invoice.status] || "default"}
              label={txt[invoice.status] || invoice.status}
              sx={{ mt: 0.5, fontWeight: 700 }}
            />
          </Box>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 } }}>
        {/* Bill-to + meta */}
        <Stack direction="row" justifyContent="space-between" gap={2} flexWrap="wrap" sx={{ mb: 2 }}>
          <Box sx={{ minWidth: 220 }}>
            <Typography sx={{ ...labelSx, textTransform: "uppercase" }}>{txt.billTo}</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{student.name || "—"}</Typography>
            {parent ? (
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                {txt.guardian}: {parent.name} {parent.phone ? `· ${parent.phone}` : ""}
              </Typography>
            ) : null}
            {student.email ? (
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                {txt.email}: {student.email}
              </Typography>
            ) : null}
          </Box>

          <Box sx={{ minWidth: 200 }}>
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography sx={labelSx}>{txt.issueDate}</Typography>
              <Typography sx={valueSx}>{fmtDate(invoice.issueDate, lng)}</Typography>
            </Stack>
            {invoice.dueDate ? (
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Typography sx={labelSx}>{txt.dueDate}</Typography>
                <Typography sx={valueSx}>{fmtDate(invoice.dueDate, lng)}</Typography>
              </Stack>
            ) : null}
            {invoice.billingPeriodLabel ? (
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Typography sx={labelSx}>{txt.billingPeriod}</Typography>
                <Typography sx={valueSx}>{invoice.billingPeriodLabel}</Typography>
              </Stack>
            ) : null}
          </Box>
        </Stack>

        {/* Line item table */}
        <Box sx={{ border: `1px solid ${accent}55`, borderRadius: 1, overflow: "hidden", mb: 2 }}>
          <Stack
            direction="row"
            sx={{ bgcolor: `${accent}22`, px: 1.5, py: 1, fontWeight: 800, fontSize: 12 }}
          >
            <Box sx={{ flex: 2 }}>{txt.description}</Box>
            <Box sx={{ flex: 1, textAlign: "center" }}>{txt.hours}</Box>
            {showFreeHours ? <Box sx={{ flex: 1, textAlign: "center" }}>{txt.freeHours}</Box> : null}
            <Box sx={{ flex: 1, textAlign: "center" }}>{txt.hourlyRate}</Box>
            <Box sx={{ flex: 1, textAlign: isEn ? "right" : "left" }}>{txt.amount}</Box>
          </Stack>
          <Stack direction="row" sx={{ px: 1.5, py: 1.25, fontSize: 13 }}>
            <Box sx={{ flex: 2, fontWeight: 700 }}>{planTitle}</Box>
            <Box sx={{ flex: 1, textAlign: "center" }}>{formatHours(invoice.hours)}</Box>
            {showFreeHours ? (
              <Box sx={{ flex: 1, textAlign: "center" }}>{formatHours(invoice.freeHours)}</Box>
            ) : null}
            <Box sx={{ flex: 1, textAlign: "center" }}>{formatMoney(invoice.hourlyRate, currency)}</Box>
            <Box sx={{ flex: 1, textAlign: isEn ? "right" : "left", fontWeight: 700 }}>
              {formatMoney(invoice.subtotal, currency)}
            </Box>
          </Stack>
        </Box>

        {/* Totals */}
        <Stack direction="row" justifyContent={isEn ? "flex-end" : "flex-start"}>
          <Box sx={{ width: 300, maxWidth: "100%" }}>
            <TotalRow label={txt.subtotal} value={formatMoney(invoice.subtotal, currency)} {...totalColors} />
            <TotalRow label={txt.transferFee} value={formatMoney(invoice.transferFee, currency)} {...totalColors} />
            {showPrevCredit && Number(invoice.previousCredit) ? (
              <TotalRow label={txt.previousCredit} value={`- ${formatMoney(invoice.previousCredit, currency)}`} {...totalColors} />
            ) : null}
            {showPrevDebt && Number(invoice.previousDebt) ? (
              <TotalRow label={txt.previousDebt} value={formatMoney(invoice.previousDebt, currency)} {...totalColors} />
            ) : null}
            <Divider sx={{ my: 0.5 }} />
            <TotalRow label={txt.total} value={formatMoney(invoice.total, currency)} strong {...totalColors} />
          </Box>
        </Stack>

        {/* Notes */}
        {notes.length || invoice.notes ? (
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 13, color: headerColor, mb: 0.5 }}>
              {txt.notesTitle}
            </Typography>
            <Stack component="ul" sx={{ m: 0, pl: 2.5, gap: 0.25 }}>
              {notes.map((n, i) => {
                const line = (isEn ? n.en : n.ar) || n.ar || n.en;
                if (!line) return null;
                return (
                  <Typography key={i} component="li" sx={{ fontSize: 12, color: "text.secondary" }}>
                    {line}
                  </Typography>
                );
              })}
              {invoice.notes ? (
                <Typography component="li" sx={{ fontSize: 12, color: "text.secondary" }}>
                  {invoice.notes}
                </Typography>
              ) : null}
            </Stack>
          </Box>
        ) : null}

        {footer ? (
          <Typography sx={{ mt: 3, textAlign: "center", fontSize: 12, color: "text.secondary" }}>
            {footer}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
