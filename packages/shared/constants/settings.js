// Global app settings defaults. The settings row is a singleton; these values
// seed it the first time it is read. Hourly rate prices every plan (plan stores
// hours only), and currency is the single currency used across the whole app.
export const DEFAULT_APP_SETTINGS = {
  hourlyRate: 8,
  currency: "USD",
};

// Currencies the admin can pick from in the settings screen.
export const CURRENCY_OPTIONS = ["USD", "GBP", "EUR", "EGP"];
