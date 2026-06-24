"use client";

import { useTranslation } from "../../../i18n/client.js";

export const pricingText = {
  ar: {
    eyebrow: "الأسعار",
    title: "باقات مرنة تناسب كل أسرة",
    subtitle: "اختر الباقة المناسبة لطفلك وابدأ رحلة تعلّم القرآن اليوم.",
    perMonth: "/ شهرياً",
    perYear: "/ سنوياً",
    hours: "ساعة",
    featured: "الأكثر اختياراً",
    subscribe: "اشترك الآن",
    free: "جرّب ألعابنا التفاعلية 🎮",
    empty: "لا توجد باقات متاحة حالياً.",
    save: "وفّر",
  },
  en: {
    eyebrow: "Pricing",
    title: "Flexible plans for every family",
    subtitle: "Pick the right plan for your child and start the Quran journey today.",
    perMonth: "/ month",
    perYear: "/ year",
    hours: "hours",
    featured: "Most popular",
    subscribe: "Subscribe now",
    free: "Try our interactive games 🎮",
    empty: "No plans available right now.",
    save: "Save",
  },
};

export function usePricingText() {
  const { lng } = useTranslation();
  return pricingText[lng === "en" ? "en" : "ar"];
}
