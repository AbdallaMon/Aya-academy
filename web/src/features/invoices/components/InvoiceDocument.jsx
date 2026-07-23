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
  formatDurationMinutes,
  formatMoney,
} from "../config/constant.js";
import { DEFAULT_PAYMENT_TEMPLATE } from "@aya/shared";

function hideOnError(e) {
  e.currentTarget.style.display = "none";
}

// The header and bill-to rows go side-by-side only when the *document* itself is
// wide enough. The invoice renders both in a full-width dialog/print and inside a
// narrow settings-preview column, so the switch is driven by a container query on
// the root (see containerName below) instead of viewport breakpoints — otherwise
// a narrow preview on a wide screen keeps the cramped row layout and breaks.
const DOC_ROW_SX = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 2,
  "@container invoiceDoc (min-width: 520px)": {
    flexDirection: "row",
    justifyContent: "space-between",
  },
};

// Invoice meta block: aligns to the start when stacked, to the end (opposite the
// company block) once the header becomes a row. start/end are direction-aware so
// this is correct in both RTL and LTR with no isEn branching.
const DOC_META_ALIGN_SX = {
  textAlign: "start",
  "@container invoiceDoc (min-width: 520px)": { textAlign: "end" },
};

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
  const headerTextColor = theme.headerTextColor || "#FFFFFF";
  const accent = theme.accentColor || "#C9A84C";
  const textColor = theme.textColor || "#25313F";
  const notesColor = theme.notesColor || "#25313F";
  const paymentInstructionsColor = theme.paymentInstructionsColor || "#25313F";

  const sub = invoice.subscription || {};
  const student = sub.student || {};
  const parent = (student.parents || [])[0];
  const plan = sub.plan;
  const currency = invoice.currency || sub.currency || "USD";

  const companyName = (isEn ? company.nameEn : company.nameAr) || company.nameEn || company.nameAr;
  const companyAddress = isEn ? company.addressEn : company.addressAr;
  const planTitle = plan ? (isEn ? plan.titleEn : plan.titleAr) : "—";
  const footer = (isEn ? cfg.footerEn : cfg.footerAr) || "";
  const notes = Array.isArray(cfg.notes) ? cfg.notes : [];
  const paymentInstructions =
    (isEn ? cfg.paymentInstructionsEn : cfg.paymentInstructionsAr) || "";

  // Billing period is derived automatically (monthly/yearly) from the
  // subscription's plan; the stale per-invoice label is only a last-resort
  // fallback for legacy invoices with no subscription period.
  const billingPeriodLabel = sub.billingPeriod
    ? txt[sub.billingPeriod]
    : invoice.billingPeriodLabel || "";

  const showPrevCredit = cfg.showPreviousCredit !== false;
  const showPrevDebt = cfg.showPreviousDebt !== false;

  // The logo is always our own academy logo, pulled automatically from /logos.
  const logoSrc = "/logos/logo.png";

  // Render-only discount breakdown snapshot (subtotal is already the NET amount).
  const discount = cfg.discount || null;
  const hasDiscount = discount && Number(discount.amount) > 0;
  const discountCode = discount?.code;
  const discountLabel = discountCode ? `${txt.discount} (${discountCode})` : txt.discount;

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
        containerType: "inline-size",
        containerName: "invoiceDoc",
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
      {/* Header band. Fixed paddings (not viewport breakpoints): the document is
          always exported at a fixed A4 design width, so its layout must not depend
          on the device's screen size. */}
      <Box sx={{ bgcolor: headerColor, color: headerTextColor, px: 6, py: 3 }}>
        {/* Top row: logo + invoice title on the start, number + status on the end */}
        <Box sx={DOC_ROW_SX}>
          <Stack spacing={0.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
            {logoSrc ? (
              <Box
                component="img"
                src={logoSrc}
                alt=""
                onError={hideOnError}
                sx={{ height: 56, width: "auto", objectFit: "contain" }}
              />
            ) : null}
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 18,
                color: accent,
                letterSpacing: 0.5,
                lineHeight: 1.1,
                whiteSpace: "nowrap",
              }}
            >
              {txt.invoiceTitle}
            </Typography>
          </Stack>

          <Box sx={DOC_META_ALIGN_SX}>
            <Typography sx={{ fontSize: 13, opacity: 0.9, color: headerTextColor }}>
              {txt.invoiceNumber}: {invoice.invoiceNumber}
            </Typography>
            <Chip
              size="small"
              color={INVOICE_STATUS_COLOR[invoice.status] || "default"}
              label={txt[invoice.status] || invoice.status}
              sx={{ mt: 0.5, fontWeight: 700 }}
            />
          </Box>
        </Box>

        {/* Academy name — centered across the full header width. */}
        <Box sx={{ textAlign: "center", mt: 1.5 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 20, lineHeight: 1.2, color: headerTextColor }}>
            {companyName}
          </Typography>
          {companyAddress ? (
            <Typography sx={{ fontSize: 12, opacity: 0.85, color: headerTextColor }}>
              {companyAddress}
            </Typography>
          ) : null}
          {company.phone || company.email ? (
            <Typography sx={{ fontSize: 12, opacity: 0.85, color: headerTextColor }}>
              {[company.phone, company.email].filter(Boolean).join("  ·  ")}
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ px: 6, py: 3 }}>
        {/* Bill-to + meta */}
        <Box sx={{ ...DOC_ROW_SX, mb: 2 }}>
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
            {billingPeriodLabel ? (
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Typography sx={labelSx}>{txt.billingPeriod}</Typography>
                <Typography sx={valueSx}>{billingPeriodLabel}</Typography>
              </Stack>
            ) : null}
          </Box>
        </Box>

        {/* Line item table */}
        <Box sx={{ border: `1px solid ${accent}55`, borderRadius: 1, overflow: "hidden", mb: 2 }}>
          <Stack
            direction="row"
            sx={{ bgcolor: `${accent}22`, px: 1.5, py: 1, fontWeight: 800, fontSize: 12 }}
          >
            <Box sx={{ flex: 2 }}>{txt.description}</Box>
            <Box sx={{ flex: 1, textAlign: "center" }}>{txt.hours}</Box>
            <Box sx={{ flex: 1, textAlign: "center" }}>{txt.hourlyRate}</Box>
            <Box sx={{ flex: 1, textAlign: isEn ? "right" : "left" }}>{txt.amount}</Box>
          </Stack>
          <Stack direction="row" sx={{ px: 1.5, py: 1.25, fontSize: 13 }}>
            <Box sx={{ flex: 2, fontWeight: 700 }}>{planTitle}</Box>
            <Box sx={{ flex: 1, textAlign: "center" }}>
              {formatDurationMinutes(invoice.minutes, lng)}
            </Box>
            <Box sx={{ flex: 1, textAlign: "center" }}>{formatMoney(invoice.hourlyRate, currency)}</Box>
            <Box sx={{ flex: 1, textAlign: isEn ? "right" : "left", fontWeight: 700 }}>
              {formatMoney(invoice.subtotal, currency)}
            </Box>
          </Stack>
        </Box>

        {/* Totals */}
        <Stack direction="row" justifyContent={isEn ? "flex-end" : "flex-start"}>
          <Box sx={{ width: 300, maxWidth: "100%" }}>
            {hasDiscount ? (
              <>
                <TotalRow
                  label={txt.originalPrice}
                  value={formatMoney(discount.base, currency)}
                  {...totalColors}
                />
                <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: accent }}>
                    {discountLabel}
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: accent }}>
                    {`- ${formatMoney(discount.amount, currency)}`}
                  </Typography>
                </Stack>
              </>
            ) : null}
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

        {/* Notes — the per-invoice snapshot (inherited from the template at
            generation, then editable on the invoice itself). */}
        {notes.length ? (
          <Box sx={{ mt: 3 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 13, color: accent, mb: 0.5 }}>
              {txt.notesTitle}
            </Typography>
            <Stack component="ul" sx={{ m: 0, pl: 2.5, gap: 0.25 }}>
              {notes.map((n, i) => {
                const line = (isEn ? n.en : n.ar) || n.ar || n.en;
                if (!line) return null;
                return (
                  <Typography key={i} component="li" sx={{ fontSize: 12, color: notesColor }}>
                    {line}
                  </Typography>
                );
              })}
            </Stack>
          </Box>
        ) : null}

        {paymentInstructions ? (
          <Box
            sx={{
              mt: 3,
              p: 1.5,
              borderRadius: 1,
              border: `1px dashed ${accent}66`,
              bgcolor: `${accent}11`,
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: 13, color: headerColor, mb: 0.5 }}>
              {txt.paymentInstructionsTitle}
            </Typography>
            <Typography sx={{ fontSize: 12, color: paymentInstructionsColor, whiteSpace: "pre-line" }}>
              {paymentInstructions}
            </Typography>
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
