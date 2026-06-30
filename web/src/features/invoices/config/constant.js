export const INVOICES_URL = "invoices";

export const INVOICE_STATUSES = ["UNPAID", "PAID", "VOID"];

/** MUI Chip color per invoice status. */
export const INVOICE_STATUS_COLOR = {
  UNPAID: "warning",
  PAID: "success",
  VOID: "default",
};

export function invoiceSubscriptionPath(subscriptionId) {
  return `subscription/${subscriptionId}`;
}

export function invoiceGeneratePath(subscriptionId) {
  return `subscription/${subscriptionId}/generate`;
}

export function invoiceSendPath(invoiceId) {
  return `${invoiceId}/send`;
}

// Money/hours formatting lives in the shared money lib so the single global
// currency renders consistently everywhere. Re-exported here for existing imports.
export { formatMoney, formatHours } from "../../../shared/lib/money.js";
