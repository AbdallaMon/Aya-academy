"use client";

import { useTranslation } from "../../../i18n/client.js";

export const quizzesText = {
  ar: {
    pageTitle: "الاختبارات",
    // role-aware descriptions
    descAdmin: "كل الاختبارات التي أنشأها أولياء الأمور عبر دعوات الأسئلة.",
    descParent: "الاختبارات التي أنشأتها لأبنائك.",
    descStudent: "الاختبارات المخصّصة لك — ابدأ وتحدَّ نفسك.",
    descDefault: "قائمة الاختبارات.",
    // columns
    title: "العنوان",
    questions: "الأسئلة",
    participants: "المشاركون",
    passThreshold: "درجة النجاح",
    gift: "الهدية",
    createdAt: "أُنشئ في",
    noTitle: "اختبار بدون عنوان",
    noGift: "—",
    empty: "لا توجد اختبارات بعد.",
  },
  en: {
    pageTitle: "Quizzes",
    descAdmin: "All quizzes built by parents from question invites.",
    descParent: "Quizzes you created for your children.",
    descStudent: "Quizzes assigned to you — start and challenge yourself.",
    descDefault: "Quiz list.",
    title: "Title",
    questions: "Questions",
    participants: "Participants",
    passThreshold: "Pass score",
    gift: "Gift",
    createdAt: "Created",
    noTitle: "Untitled quiz",
    noGift: "—",
    empty: "No quizzes yet.",
  },
};

export function useQuizzesText() {
  const { lng } = useTranslation();
  return quizzesText[lng === "en" ? "en" : "ar"];
}
