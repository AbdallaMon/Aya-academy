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
    subscribe: "ابدأ الآن",
    free: "جرّب ألعابنا التفاعلية 🎮",
    empty: "لا توجد باقات متاحة حالياً.",
    save: "وفّر",
    monthly: "شهري",
    yearly: "سنوي",
    billingToggleLabel: "مدة الاشتراك",
    // Real inclusions shared by every plan (plans differ only by hours).
    commonFeatures: [
      "حصص مباشرة ودروس موجّهة",
      "شرح ثنائي اللغة (عربي / إنجليزي)",
      "لوحة متابعة لولي الأمر",
      "نقاط وأوسمة ولوحة صدارة",
      "إلغاء في أي وقت",
    ],
  },
  en: {
    eyebrow: "Pricing",
    title: "Flexible plans for every family",
    subtitle: "Pick the right plan for your child and start the Quran journey today.",
    perMonth: "/ month",
    perYear: "/ year",
    hours: "hours",
    featured: "Most popular",
    subscribe: "Get started",
    free: "Try our interactive games 🎮",
    empty: "No plans available right now.",
    save: "Save",
    monthly: "Monthly",
    yearly: "Yearly",
    billingToggleLabel: "Billing period",
    // Real inclusions shared by every plan (plans differ only by hours).
    commonFeatures: [
      "Live sessions & guided lessons",
      "Bilingual explanations (Arabic / English)",
      "Parent progress dashboard",
      "Points, badges & leaderboard",
      "Cancel anytime",
    ],
  },
};

export function usePricingText() {
  const { lng } = useTranslation();
  return pricingText[lng === "en" ? "en" : "ar"];
}
