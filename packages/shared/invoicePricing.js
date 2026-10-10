// Pure invoice calculations shared by the editor preview and the API.
import { invoiceMessagesCodes } from './messages-codes/invoice.js';

export const INVOICE_DISCOUNT_MODES = { APPLIED: 'APPLIED', MANUAL: 'MANUAL' };
const money = (value) => Math.round(Number(value) * 100) / 100;

function discountDefinition(value, currency) {
  if (!value || !['PERCENT', 'FIXED'].includes(value.type)) return null;
  const amount = Number(value.value);
  if (!Number.isFinite(amount) || amount <= 0 || (value.type === 'PERCENT' && amount > 100)) return null;
  return {
    code: value.code ?? null,
    type: value.type,
    value: amount,
    currency: value.currency ?? currency,
    billingPeriod: value.billingPeriod ?? null,
  };
}

export function getInvoiceDiscountState(invoice) {
  const config = invoice?.configJson ?? {};
  const saved = config.invoiceDiscount;
  const snapshot = config.discount;
  // Keep the applied coupon separately so switching to manual never loses it.
  const applied = discountDefinition(saved?.applied, invoice?.currency)
    ?? (snapshot?.source !== 'MANUAL' ? discountDefinition(snapshot, invoice?.currency) : null)
    ?? discountDefinition(invoice?.subscription?.coupon, invoice?.subscription?.currency ?? invoice?.currency);
  const mode = saved?.mode === 'MANUAL' || saved?.mode === 'APPLIED'
    ? saved.mode
    : applied ? 'APPLIED' : 'MANUAL';
  return {
    mode,
    applied,
    manualAmount: Number(saved?.manualAmount ?? (mode === 'MANUAL' ? snapshot?.amount : 0) ?? 0),
  };
}

export function hasInvoicePricingChanges(invoice, pricing) {
  const state = getInvoiceDiscountState(invoice);
  const mode = pricing.discountMode ?? state.mode;
  const manualAmount = Number(pricing.manualDiscountAmount ?? state.manualAmount);
  return pricing.minutes !== (invoice?.minutes ?? null)
    || pricing.hourlyRate !== (invoice?.hourlyRate == null ? null : Number(invoice.hourlyRate))
    || pricing.currency !== invoice?.currency
    || mode !== state.mode
    || (mode === 'MANUAL' && manualAmount !== state.manualAmount);
}

export function calculateInvoicePricing(invoice, pricing) {
  const state = getInvoiceDiscountState(invoice);
  const mode = pricing.discountMode ?? state.mode;
  const manualAmount = Number(pricing.manualDiscountAmount ?? state.manualAmount);
  const minutes = Number(pricing.minutes);
  const rate = Number(pricing.hourlyRate);
  if (!Number.isInteger(minutes) || minutes <= 0 || !Number.isFinite(rate) || rate <= 0) {
    return { error: invoiceMessagesCodes.INVALID_TOTAL };
  }
  const base = money(minutes * rate / 60);
  let definition;
  let amount;
  if (mode === 'APPLIED') {
    if (!state.applied) return { error: invoiceMessagesCodes.DISCOUNT_UNAVAILABLE };
    if (state.applied.type === 'FIXED' && state.applied.currency !== pricing.currency) {
      return { error: invoiceMessagesCodes.DISCOUNT_CURRENCY_MISMATCH };
    }
    definition = state.applied;
    const net = definition.type === 'PERCENT'
      ? Math.max(0, base * (1 - definition.value / 100))
      : Math.max(0, base - definition.value);
    amount = money(base - net);
  } else if (mode === 'MANUAL') {
    if (!Number.isFinite(manualAmount) || manualAmount < 0 || manualAmount > base
      || Math.abs(manualAmount * 100 - Math.round(manualAmount * 100)) > 1e-7) {
      return { error: invoiceMessagesCodes.INVALID_DISCOUNT };
    }
    amount = money(manualAmount);
    definition = { code: null, type: 'FIXED', value: amount, currency: pricing.currency };
  } else {
    return { error: invoiceMessagesCodes.INVALID_DISCOUNT };
  }
  return {
    base,
    discountAmount: amount,
    subtotal: money(base - amount),
    discount: { ...definition, source: mode, base, amount },
    invoiceDiscount: { mode, manualAmount: mode === 'MANUAL' ? amount : 0, applied: state.applied },
  };
}

export function calculateInvoiceTotals({ subtotal, fees = {}, previousCredit = 0, previousDebt = 0, adjustmentAmount = 0 }) {
  const net = money(subtotal);
  const transferFee = money(net * Number(fees.transferFeePercent ?? 0) / 100 + Number(fees.transferFeeFixed ?? 0));
  const credit = money(previousCredit);
  const debt = money(previousDebt);
  const adjustment = money(adjustmentAmount);
  return {
    transferFee,
    previousCredit: credit,
    previousDebt: debt,
    adjustment,
    total: money(net + transferFee + debt - credit + adjustment),
  };
}
