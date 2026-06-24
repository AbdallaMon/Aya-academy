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

/** Format a money amount in the invoice's currency. */
export function formatMoney(value, currency = "GBP") {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency || ""}`.trim();
  }
}

export function formatHours(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
