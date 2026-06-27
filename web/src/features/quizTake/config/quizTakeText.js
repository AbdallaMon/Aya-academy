"use client";

import { useTranslation } from "../../../i18n/client.js";

// All bilingual copy for the take-quiz flow, the result screen, and the
// admin/parent read-only details view. Arabic is primary (RTL); tone is warm,
// encouraging and playful ("دلع") with NO sense of failure — kids "no-failure"
// philosophy.
export const quizTakeText = {
  ar: {
    // ── shared ──
    back: "رجوع للاختبارات",
    loading: "لحظة من فضلك…",
    notFound: "لم نجد هذا الاختبار.",
    noAccess: "هذه الصفحة ليست لك يا بطل 😊",
    questions: "الأسئلة",
    passThreshold: "درجة النجاح",
    gift: "الهدية",
    noGift: "—",

    // ── intro ──
    introHi: "يلّا نبدأ! 🌟",
    introHint: "اختر الإجابة الصح لكل سؤال، وخُد وقتك… مفيش رسوب هنا، بس متعة وتعلُّم!",
    start: "ابدأ الاختبار",

    // ── player ──
    questionLabel: "سؤال",
    of: "من",
    next: "التالي",
    prev: "السابق",
    submit: "سلِّم إجابتي",
    answerAllHint: "جاوب على كل الأسئلة عشان تقدر تسلّم 💪",
    submitting: "بنصحّح إجاباتك…",

    // ── result (passed) ──
    bravo: "أحسنت يا بطل! 🎉",
    youPassed: "نجحت بتفوّق وكسبت شهادتك!",
    yourScore: "نتيجتك",
    correctOf: "إجابة صحيحة من",
    percent: "نسبتك",
    giftReveal: "ومعاها هدية ليك 🎁",
    downloadPdf: "تحميل PDF",
    downloadPng: "تحميل صورة",
    retake: "إعادة المحاولة",

    // ── result (not passed) ──
    tryAgainTitle: "حاول تاني يا بطل 💛",
    tryAgainHint: "قربت خالص! راجع وجرّب تاني — كل محاولة بتقرّبك أكتر.",
    retakeNow: "أعد المحاولة",

    // ── admin / parent details ──
    detailsTitle: "تفاصيل الاختبار",
    detailsHint: "متابعة نتائج الأطفال في هذا الاختبار.",
    childrenResults: "نتائج الأطفال",
    completedSummary: "أكمل",
    outOf: "من",
    childrenCount: "طفل",
    child: "الطفل",
    statusCol: "الحالة",
    scoreCol: "النتيجة",
    certificateCol: "الشهادة",
    done: "خلّص",
    notYet: "لسه",
    passedChip: "ناجح",
    noParticipants: "لا يوجد أطفال مشاركون في هذا الاختبار بعد.",
    dash: "—",
  },
  en: {
    back: "Back to quizzes",
    loading: "One moment…",
    notFound: "We couldn't find this quiz.",
    noAccess: "This page isn't for you, champ 😊",
    questions: "Questions",
    passThreshold: "Pass score",
    gift: "Gift",
    noGift: "—",

    introHi: "Let's go! 🌟",
    introHint: "Pick the right answer for each question and take your time — no failing here, just fun and learning!",
    start: "Start quiz",

    questionLabel: "Question",
    of: "of",
    next: "Next",
    prev: "Back",
    submit: "Submit my answers",
    answerAllHint: "Answer every question to submit 💪",
    submitting: "Checking your answers…",

    bravo: "Well done, champ! 🎉",
    youPassed: "You passed brilliantly and earned your certificate!",
    yourScore: "Your score",
    correctOf: "correct out of",
    percent: "Your percentage",
    giftReveal: "And there's a gift for you 🎁",
    downloadPdf: "Download PDF",
    downloadPng: "Download image",
    retake: "Try again",

    tryAgainTitle: "Try again, champ 💛",
    tryAgainHint: "So close! Review and give it another go — every try gets you closer.",
    retakeNow: "Try again",

    detailsTitle: "Quiz details",
    detailsHint: "Track the children's results on this quiz.",
    childrenResults: "Children results",
    completedSummary: "Completed",
    outOf: "of",
    childrenCount: "children",
    child: "Child",
    statusCol: "Status",
    scoreCol: "Score",
    certificateCol: "Certificate",
    done: "Done",
    notYet: "Not yet",
    passedChip: "Passed",
    noParticipants: "No children have taken this quiz yet.",
    dash: "—",
  },
};

export function useQuizTakeText() {
  const { lng } = useTranslation();
  return quizTakeText[lng === "en" ? "en" : "ar"];
}
