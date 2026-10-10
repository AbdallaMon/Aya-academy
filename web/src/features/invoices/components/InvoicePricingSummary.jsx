"use client";

import { Alert, Box, Typography } from '@mui/material';
import { invoiceMessagesCodes } from '@ayah/shared';
import { formatMoney } from '../config/constant.js';

export default function InvoicePricingSummary({ preview, currency, txt }) {
  const errorText = {
    [invoiceMessagesCodes.INVALID_DISCOUNT]: txt.invalidManualDiscount,
    [invoiceMessagesCodes.DISCOUNT_UNAVAILABLE]: txt.appliedDiscountUnavailable,
    [invoiceMessagesCodes.DISCOUNT_CURRENCY_MISMATCH]: txt.discountCurrencyMismatch,
  }[preview.error] || txt.invalidPreview;
  const rows = [
    [txt.originalPrice, preview.base],
    [txt.discount, preview.discountAmount],
    [txt.afterDiscount, preview.subtotal],
    [txt.total, preview.total],
  ];
  const extras = [
    [txt.transferFee, preview.transferFee],
    [txt.previousDebt, preview.previousDebt],
    [txt.previousCredit, -preview.previousCredit],
    [txt.adjustment, preview.adjustment],
  ].filter(([, amount]) => Number.isFinite(amount) && amount !== 0);

  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: 'background.paper', py: 2, mb: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{txt.liveSummary}</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
        {rows.map(([label, amount], index) => (
          <Box key={label}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: index === 3 ? 'brandText' : 'text.primary', overflowWrap: 'anywhere' }}>
              {preview.error ? '—' : formatMoney(amount, currency)}
            </Typography>
          </Box>
        ))}
      </Box>
      {preview.error ? <Alert severity="error" sx={{ mt: 1 }}>{errorText}</Alert> : extras.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
          {extras.map(([label, amount]) => (
            <Typography key={label} variant="caption" color="text.secondary">
              {label}: {formatMoney(amount, currency)}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}
