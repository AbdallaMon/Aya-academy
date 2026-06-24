"use client";

// Feature-local bilingual strings for the read-only QuranProgressView widget.
import { useTranslation } from "../../../i18n/client.js";

export const quranProgressText = {
  ar: {
    title: "تقدم القرآن",
    overallTitle: "التقدم الكلي",
    segments: "مقطع",
    noProgress: "لم يبدأ الطالب في حفظ القرآن بعد",
    current: "الحالية",
    ayah: "آية",
    completed: "محفوظ",
    inProgress: "قيد التحفيظ",
    notStarted: "لم يبدأ",
    upcomingPlan: "خطة الحصة القادمة",
    homework: "الواجب",
    memorize: "تحفيظ",
    review: "مراجعة",
    wholeSurah: "السورة كاملة",
    noUpcomingPlan: "",
  },
  en: {
    title: "Quran Progress",
    overallTitle: "Overall progress",
    segments: "segment(s)",
    noProgress: "No Quran progress yet",
    current: "Current",
    ayah: "ayah",
    completed: "Completed",
    inProgress: "In progress",
    notStarted: "Not started",
    upcomingPlan: "Upcoming lesson plan",
    homework: "Homework",
    memorize: "Memorize",
    review: "Review",
    wholeSurah: "Full surah",
    noUpcomingPlan: "",
  },
};

export function useQuranProgressText() {
  const { lng } = useTranslation();
  return quranProgressText[lng === "en" ? "en" : "ar"];
}
