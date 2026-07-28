"use client";

import { useTranslation } from "../../../i18n/client.js";

export const leaderboardText = {
  ar: {
    pageTitle: "أبطال أكاديمية آية",
    pageDescription: "شوف نجوم الأكاديمية وترتيبهم وإنجازاتهم 🌟",
    week: "هذا الأسبوع",
    all: "الإجمالي",
    championsTitle: "🏆 أبطال المقدمة",
    rank: "الترتيب",
    name: "الاسم",
    weeklyPoints: "نقاط الأسبوع",
    totalPoints: "إجمالي النقاط",
    points: "نقطة",
    badges: "الأوسمة",
    badgesShort: "وسام",
    level: "المستوى",
    noLevel: "لسه مفيش مستوى",
    editLevel: "تعديل المستوى",
    empty: "لسه مفيش أبطال!",
    emptyBody: "بمجرد ما الأطفال يكمّلوا الاختبارات والألعاب هتظهر نجومهم هنا ✨",
  },
  en: {
    pageTitle: "Ayah Academy Champions",
    pageDescription: "Meet our stars, their ranks and achievements 🌟",
    week: "This week",
    all: "All time",
    championsTitle: "🏆 Top champions",
    rank: "Rank",
    name: "Name",
    weeklyPoints: "Weekly points",
    totalPoints: "Total points",
    points: "pts",
    badges: "Badges",
    badgesShort: "badges",
    level: "Level",
    noLevel: "No level yet",
    editLevel: "Edit level",
    empty: "No champions yet!",
    emptyBody: "Once kids finish quizzes and games, their stars will shine here ✨",
  },
};

export function useLeaderboardText() {
  const { lng } = useTranslation();
  return leaderboardText[lng === "en" ? "en" : "ar"];
}
