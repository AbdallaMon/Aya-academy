// Currency-aware money formatting, used everywhere so the single global currency
// renders consistently. `narrowSymbol` makes USD show as "$" (not "US$"), GBP as
// "£", etc. Falls back to the @aya/shared symbol table if Intl can't.
import { currencySymbol, DEFAULT_CURRENCY } from "@aya/shared";

export function formatMoney(value, currency = DEFAULT_CURRENCY) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const code = currency || DEFAULT_CURRENCY;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currencySymbol(code)}${n.toFixed(2)}`;
  }
}

export function formatHours(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
