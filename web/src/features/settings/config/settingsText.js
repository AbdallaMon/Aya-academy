"use client";

import { useTranslation } from "../../../i18n/client.js";

export const settingsText = {
  ar: {
    pageTitle: "الإعدادات العامة",
    pageDescription:
      "سعر الساعة والعملة المستخدمة في كل النظام. الباقات تُحسب تلقائيًا من عدد الساعات × سعر الساعة.",
    hourlyRate: "سعر الساعة",
    hourlyRateHint: "السعر بيتطبق على كل الباقات والفواتير.",
    currency: "العملة",
    currencyHint: "عملة واحدة تظهر في كل مكان (الباقات، الفواتير، العرض).",
    save: "حفظ",
    required: "هذا الحقل مطلوب",
    // currency labels
    USD: "دولار أمريكي ($)",
    GBP: "جنيه إسترليني (£)",
    EUR: "يورو (€)",
    EGP: "جنيه مصري (ج.م)",
  },
  en: {
    pageTitle: "General settings",
    pageDescription:
      "The hourly rate and currency used across the whole system. Plans are computed automatically from hours × hourly rate.",
    hourlyRate: "Hourly rate",
    hourlyRateHint: "Applied to every plan and invoice.",
    currency: "Currency",
    currencyHint: "A single currency shown everywhere (plans, invoices, preview).",
    save: "Save",
    required: "This field is required",
    USD: "US Dollar ($)",
    GBP: "British Pound (£)",
    EUR: "Euro (€)",
    EGP: "Egyptian Pound (ج.م)",
  },
};

export function useSettingsText() {
  const { lng } = useTranslation();
  return settingsText[lng === "en" ? "en" : "ar"];
}
