import test from 'node:test';
import assert from 'node:assert/strict';
import { getInvoiceDiscountState } from '@ayah/shared';
import { buildInvoicePricingInput, buildInvoicePreview } from './invoiceEditPricing.js';

const invoice = {
  status: 'UNPAID', sentAt: null, minutes: 120, hourlyRate: 10, currency: 'GBP', subtotal: 18,
  configJson: { discount: { type: 'PERCENT', value: 10, code: 'SAVE10', base: 20, amount: 2 } },
};
const values = {
  hours: 2, hourlyRate: 10, currency: 'GBP', discountMode: 'APPLIED', manualDiscountAmount: 0,
  transferFeePercent: 5, transferFeeFixed: 1, previousCredit: 2, previousDebt: 3,
  adjustmentAmount: 0, adjustmentReason: '',
};

test('live preview updates discount, fees and final total when hours and rate change', () => {
  const result = buildInvoicePreview({ ...values, hours: 3, hourlyRate: 12, adjustmentAmount: -1 }, invoice);
  assert.equal(result.base, 36);
  assert.equal(result.discountAmount, 3.6);
  assert.equal(result.subtotal, 32.4);
  assert.equal(result.transferFee, 2.62);
  assert.equal(result.total, 35.02);
});

test('manual mode replaces the coupon rather than stacking another discount', () => {
  const input = { ...values, discountMode: 'MANUAL', manualDiscountAmount: 5 };
  const result = buildInvoicePreview(input, invoice);
  assert.equal(result.discountAmount, 5);
  assert.equal(result.subtotal, 15);
  assert.equal(result.total, 17.75);
  assert.equal(buildInvoicePricingInput(input).manualDiscountAmount, 5);
});

test('unchanged legacy charges stay intact and fee-only edits update the total', () => {
  const result = buildInvoicePreview({ ...values, discountMode: 'MANUAL' }, {
    ...invoice, subtotal: 17, configJson: {},
  });
  assert.equal(result.subtotal, 17);
  assert.equal(result.total, 19.85);
});

test('a linked coupon without a saved discount does not reprice an untouched legacy invoice', () => {
  const legacy = {
    ...invoice,
    currency: 'USD',
    subtotal: 20,
    configJson: {},
    subscription: { currency: 'USD', coupon: { code: 'SAVE10', type: 'PERCENT', value: 10 } },
  };
  const result = buildInvoicePreview({ ...values, currency: 'USD' }, legacy);
  assert.equal(result.subtotal, 20);
  assert.equal(result.discountAmount, 0);
});

test('no coupon defaults to manual zero and an existing legacy amount is preserved', () => {
  assert.deepEqual(getInvoiceDiscountState({ ...invoice, configJson: {} }), {
    mode: 'MANUAL', applied: null, manualAmount: 0,
  });
  assert.equal(getInvoiceDiscountState({ ...invoice, configJson: { discount: { base: 20, amount: 3 } } }).manualAmount, 3);
});

test('a sent invoice previews only its allowed fee and balance changes', () => {
  const result = buildInvoicePreview({ ...values, hours: 100, hourlyRate: 100, adjustmentAmount: -100 }, {
    ...invoice, sentAt: new Date(), configJson: { ...invoice.configJson, invoiceAdjustment: { amount: -1 } },
  });
  assert.equal(result.subtotal, 18);
  assert.equal(result.discountAmount, 2);
  assert.equal(result.total, 19.9);
});

test('invalid manual discounts and incomplete price inputs do not produce plausible totals', () => {
  for (const manualDiscountAmount of [-1, 21, 1.234]) {
    assert.equal(buildInvoicePreview({ ...values, discountMode: 'MANUAL', manualDiscountAmount }, invoice).error, 'INVOICE_INVALID_DISCOUNT');
  }
  assert.equal(buildInvoicePreview({ ...values, hours: '' }, invoice).error, 'INVOICE_INVALID_TOTAL');
});
