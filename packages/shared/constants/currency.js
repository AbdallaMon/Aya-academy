// Site currency is GBP (£). Plans are priced per hour.
export const DEFAULT_CURRENCY = "GBP";

export const CURRENCY_SYMBOLS = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  EGP: "ج.م",
};

export function currencySymbol(code = DEFAULT_CURRENCY) {
  return CURRENCY_SYMBOLS[code] ?? code;
}
