"use client";

import { I18nProviderClient } from "../i18n/client.js";

// Thin wrapper so AppProviders can pass the server-detected `lng` down to the
// client i18n context.
export default function I18nProvider({ children, lng }) {
  return <I18nProviderClient lng={lng}>{children}</I18nProviderClient>;
}
