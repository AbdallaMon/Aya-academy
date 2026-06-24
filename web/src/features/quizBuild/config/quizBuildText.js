"use client";

import { useTranslation } from "../../../i18n/client.js";

export const quizBuildText = {
  ar: {
    pageTitle: "بناء الاختبار",
    pageHint: "اختر الأسئلة، أضف أسئلتك الخاصة، واختر أبناءك المشاركين.",
    // states
    loading: "جارٍ التحميل...",
    notFoundTitle: "الدعوة غير موجودة",
    notFoundHint: "تأكد من صحة الرابط أو اطلب دعوة جديدة.",
    builtTitle: "تم بناء هذا الاختبار",
    builtHint: "لقد بنيت اختبارًا من هذه الدعوة بالفعل.",
    expiredTitle: "انتهت صلاحية الدعوة",
    expiredHint: "لم يعد بالإمكان بناء اختبار من هذه الدعوة.",
    goToQuizzes: "الذهاب إلى الاختبارات",
    // bank questions
    bankTitle: "الأسئلة المقترحة",
    bankHint: "حدِّد الأسئلة التي تريد تضمينها من البنك.",
    noBankQuestions: "لا توجد أسئلة في هذه الدعوة.",
    // custom
    customTitle: "أسئلتك الخاصة",
    customHint: "أضف أسئلة من تأليفك (خياران على الأقل وإجابة صحيحة واحدة).",
    addCustom: "إضافة سؤال",
    removeCustom: "حذف السؤال",
    customTextAr: "نص السؤال (عربي)",
    customTextEn: "نص السؤال (إنجليزي)",
    // options editor
    optionsTitle: "الخيارات",
    optionsHint: "خياران على الأقل، وإجابة صحيحة واحدة على الأقل.",
    optionArLabel: "الخيار (عربي)",
    optionEnLabel: "الخيار (إنجليزي)",
    correct: "صحيحة",
    addOption: "إضافة خيار",
    removeOption: "حذف",
    // settings
    settingsTitle: "إعدادات الاختبار",
    titleLabel: "عنوان الاختبار",
    passThresholdLabel: "درجة النجاح (%)",
    giftNameLabel: "اسم الهدية (اختياري)",
    // students
    studentsTitle: "المشاركون",
    studentsHint: "اختر أبناءك الذين سيخوضون هذا الاختبار.",
    noStudents: "لا يوجد أبناء مرتبطون بحسابك.",
    // submit
    submit: "بناء الاختبار",
    cancel: "إلغاء",
    // validation
    required: "هذا الحقل مطلوب",
    needTitle: "أدخل عنوان الاختبار.",
    needQuestions: "اختر أو أضف سؤالًا واحدًا على الأقل.",
    needStudents: "اختر مشاركًا واحدًا على الأقل.",
    customNeedsOptions: "كل سؤال يحتاج خيارين على الأقل وإجابة صحيحة.",
    selectedCount: "محدد",
  },
  en: {
    pageTitle: "Build quiz",
    pageHint: "Pick questions, add your own, and choose participating children.",
    loading: "Loading...",
    notFoundTitle: "Invitation not found",
    notFoundHint: "Check the link is correct or request a new invitation.",
    builtTitle: "This quiz is already built",
    builtHint: "You have already built a quiz from this invitation.",
    expiredTitle: "Invitation expired",
    expiredHint: "You can no longer build a quiz from this invitation.",
    goToQuizzes: "Go to quizzes",
    bankTitle: "Suggested questions",
    bankHint: "Select the questions you want to include from the bank.",
    noBankQuestions: "No questions in this invitation.",
    customTitle: "Your own questions",
    customHint: "Add questions you author (min 2 options, 1 correct).",
    addCustom: "Add question",
    removeCustom: "Remove question",
    customTextAr: "Question text (Arabic)",
    customTextEn: "Question text (English)",
    optionsTitle: "Options",
    optionsHint: "At least 2 options, and at least 1 correct.",
    optionArLabel: "Option (Arabic)",
    optionEnLabel: "Option (English)",
    correct: "Correct",
    addOption: "Add option",
    removeOption: "Remove",
    settingsTitle: "Quiz settings",
    titleLabel: "Quiz title",
    passThresholdLabel: "Pass threshold (%)",
    giftNameLabel: "Gift name (optional)",
    studentsTitle: "Participants",
    studentsHint: "Choose the children who will take this quiz.",
    noStudents: "No children linked to your account.",
    submit: "Build quiz",
    cancel: "Cancel",
    required: "This field is required",
    needTitle: "Enter a quiz title.",
    needQuestions: "Select or add at least one question.",
    needStudents: "Select at least one participant.",
    customNeedsOptions: "Each question needs at least 2 options and 1 correct.",
    selectedCount: "selected",
  },
};

export function useQuizBuildText() {
  const { lng } = useTranslation();
  return quizBuildText[lng === "en" ? "en" : "ar"];
}
