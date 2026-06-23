"use client";

import { useTranslation } from "../../../i18n/client.js";

export const leaderboardText = {
  ar: {
    pageTitle: "لوحة الصدارة",
    pageDescription: "أفضل الطلاب حسب النقاط.",
    week: "هذا الأسبوع",
    all: "الإجمالي",
    rank: "الترتيب",
    name: "الاسم",
    weeklyPoints: "نقاط الأسبوع",
    totalPoints: "إجمالي النقاط",
    badges: "الأوسمة",
    empty: "لا توجد بيانات بعد",
    emptyBody: "أكمل الطلاب الاختبارات والألعاب لتظهر النتائج هنا.",
  },
  en: {
    pageTitle: "Leaderboard",
    pageDescription: "Top students by points.",
    week: "This week",
    all: "All time",
    rank: "Rank",
    name: "Name",
    weeklyPoints: "Weekly points",
    totalPoints: "Total points",
    badges: "Badges",
    empty: "No data yet",
    emptyBody: "Once students complete quizzes and games, results will appear here.",
  },
};

export function useLeaderboardText() {
  const { lng } = useTranslation();
  return leaderboardText[lng === "en" ? "en" : "ar"];
}
