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
    statusCol: "الحالة",
    actionsCol: "إجراءات",
    noTitle: "اختبار بدون عنوان",
    noGift: "—",
    empty: "لا توجد اختبارات بعد.",
    // filters
    statusFilterLabel: "الحالة",
    statusAll: "الكل",
    statusDone: "تم",
    statusPending: "لم يتم",
    childFilterLabel: "الطفل",
    childAll: "كل الأطفال",
    // status chips — student
    statusPassedStudent: "ناجح",
    statusAttemptedStudent: "حاول تاني",
    statusPendingStudent: "لم يبدأ",
    // status chips — admin/parent
    statusDoneManager: "اكتمل",
    statusPendingManager: "لم يبدأ",
    // actions
    actStart: "ابدأ الاختبار",
    actRetry: "إعادة",
    actViewCertificate: "عرض الشهادة",
    actViewDetails: "عرض التفاصيل",
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
    statusCol: "Status",
    actionsCol: "Actions",
    noTitle: "Untitled quiz",
    noGift: "—",
    empty: "No quizzes yet.",
    statusFilterLabel: "Status",
    statusAll: "All",
    statusDone: "Done",
    statusPending: "Not done",
    childFilterLabel: "Child",
    childAll: "All children",
    statusPassedStudent: "Passed",
    statusAttemptedStudent: "Try again",
    statusPendingStudent: "Not started",
    statusDoneManager: "Completed",
    statusPendingManager: "Not started",
    actStart: "Start quiz",
    actRetry: "Retry",
    actViewCertificate: "View certificate",
    actViewDetails: "View details",
  },
};

export function useQuizzesText() {
  const { lng } = useTranslation();
  return quizzesText[lng === "en" ? "en" : "ar"];
}
