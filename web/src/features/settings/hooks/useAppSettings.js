"use client";

// useAppSettings — reads the global app settings (hourly rate + currency).
//
// GET /settings is readable by any authenticated user (currency + hourly rate
// drive price DISPLAY across the app and are not sensitive), so this hook is safe
// on parent/student surfaces too. Only mutating the settings is admin-gated.

import { DEFAULT_APP_SETTINGS } from "@ayah/shared";
import { useRequest } from "../../../hooks/request/useRequest.js";
import { SETTINGS_URL } from "../config/constant.js";

export function useAppSettings({ enabled = true } = {}) {
  const { data, isLoading, fetchData } = useRequest({
    url: SETTINGS_URL,
    method: "get",
    autoFetch: enabled,
    syncToUrl: false,
  });

  const settings = data ?? DEFAULT_APP_SETTINGS;
  return {
    settings,
    hourlyRate: Number(settings.hourlyRate ?? DEFAULT_APP_SETTINGS.hourlyRate),
    currency: settings.currency ?? DEFAULT_APP_SETTINGS.currency,
    isLoading,
    refetch: fetchData,
  };
}
