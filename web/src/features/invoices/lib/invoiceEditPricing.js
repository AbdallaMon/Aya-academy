import {
  calculateInvoicePricing,
  calculateInvoiceTotals,
  hasInvoicePricingChanges,
  invoiceMessagesCodes,
} from '@ayah/shared';

export function buildInvoicePricingInput(values) {
  return {
    minutes: values.hours === '' ? null : Math.round(Number(values.hours) * 60),
    hourlyRate: values.hourlyRate === '' ? null : Number(values.hourlyRate),
    currency: values.currency,
    discountMode: values.discountMode,
    manualDiscountAmount: values.discountMode === 'MANUAL' ? Number(values.manualDiscountAmount) : 0,
    adjustmentAmount: Number(values.adjustmentAmount),
    adjustmentReason: (values.adjustmentReason || '').trim(),
  };
}

export function buildInvoicePreview(values, invoice) {
  const pricing = buildInvoicePricingInput(values);
  const editable = invoice?.status === 'UNPAID' && !invoice?.sentAt;
  const savedDiscount = invoice?.configJson?.discount;
  const result = editable && hasInvoicePricingChanges(invoice, pricing)
    ? calculateInvoicePricing(invoice, pricing)
    : {
        base: Number(savedDiscount?.base ?? invoice?.subtotal ?? 0),
        discountAmount: Number(savedDiscount?.amount ?? 0),
        subtotal: Number(invoice?.subtotal ?? 0),
      };
  if (result.error) return result;
  const totals = calculateInvoiceTotals({
    subtotal: result.subtotal,
    fees: { transferFeePercent: values.transferFeePercent, transferFeeFixed: values.transferFeeFixed },
    previousCredit: values.previousCredit,
    previousDebt: values.previousDebt,
    adjustmentAmount: editable ? pricing.adjustmentAmount : invoice?.configJson?.invoiceAdjustment?.amount ?? 0,
  });
  if (!Number.isFinite(totals.total) || totals.total < 0 || totals.total > 99_999_999.99
    || [values.transferFeePercent, values.transferFeeFixed, values.previousCredit, values.previousDebt]
      .some(value => !Number.isFinite(Number(value)) || Number(value) < 0)) {
    return { ...result, ...totals, error: invoiceMessagesCodes.INVALID_TOTAL };
  }
  return { ...result, ...totals };
}
