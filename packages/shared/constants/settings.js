// Global app settings defaults. The settings row is a singleton; these values
// seed it the first time it is read. Hourly rate prices every plan (plan stores
// hours only), and currency is the single currency used across the whole app.
export const DEFAULT_APP_SETTINGS = {
  hourlyRate: 8,
  currency: "USD",
  // Days a whiteboard image is kept before it is auto-deleted to free storage.
  whiteboardRetentionDays: 30,
};

// Currencies the admin can pick from in the settings screen.
export const CURRENCY_OPTIONS = ["USD", "GBP", "EUR", "EGP"];

// Bounds for the whiteboard image retention (days). Capped at ~6 months so
// stored images can't accumulate indefinitely.
export const WHITEBOARD_RETENTION_MIN_DAYS = 1;
export const WHITEBOARD_RETENTION_MAX_DAYS = 180;
