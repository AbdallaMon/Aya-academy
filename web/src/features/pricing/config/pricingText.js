"use client";

import { useTranslation } from "../../../i18n/client.js";

export const pricingText = {
  ar: {
    eyebrow: "الأسعار",
    title: "باقات مرنة تناسب كل أسرة",
    subtitle: "اختر الباقة المناسبة للطالب وابدأ رحلة تعلّم القرآن اليوم.",
    perMonth: "/ شهرياً",
    hours: "ساعة",
    featured: "الأكثر اختياراً",
    subscribe: "ابدأ الآن",
    free: "جرّب ألعابنا التفاعلية 🎮",
    empty: "لا توجد باقات متاحة حالياً.",
    errorTitle: "تعذّر تحميل الباقات.",
    retry: "إعادة المحاولة",
    save: "وفّر",
    monthly: "شهري",
    // Real inclusions shared by every plan (plans differ only by hours).
    commonFeatures: [
      "حصص مباشرة ودروس موجّهة",
      "شرح بما يناسب لغة الطالب",
      "لوحة متابعة لولي الأمر",
      "نقاط وأوسمة ولوحة صدارة",
      "إلغاء في أي وقت",
    ],
  },
  en: {
    eyebrow: "Pricing",
    title: "Flexible plans for every family",
    subtitle: "Pick the right plan for the student and start the Quran journey today.",
    perMonth: "/ month",
    hours: "hours",
    featured: "Most popular",
    subscribe: "Get started",
    free: "Try our interactive games 🎮",
    empty: "No plans available right now.",
    errorTitle: "Couldn't load the plans.",
    retry: "Try again",
    save: "Save",
    monthly: "Monthly",
    // Real inclusions shared by every plan (plans differ only by hours).
    commonFeatures: [
      "Live sessions & guided lessons",
      "Explanations in the student’s language",
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
