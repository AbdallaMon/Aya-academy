"use client";

import { useTranslation } from "../../../i18n/client.js";

export const quizInvitesText = {
  ar: {
    pageTitleAdmin: "دعوات الأسئلة",
    pageDescriptionAdmin:
      "ادعُ ولي أمر إلى بناء اختبار من مجموعة أسئلة تختارها من البنك.",
    pageTitleParent: "دعواتي",
    pageDescriptionParent:
      "الدعوات المُرسلة إليك — ابنِ منها اختبارًا لأبنائك.",
    create: "إنشاء دعوة",
    // columns
    parent: "ولي الأمر",
    status: "الحالة",
    questions: "الأسئلة",
    createdAt: "أُنشئت في",
    expiresAt: "تنتهي في",
    actions: "إجراءات",
    copyLink: "نسخ الرابط",
    buildQuiz: "بناء الاختبار",
    // status labels
    PENDING: "بانتظار",
    OPENED: "تم الفتح",
    BUILT: "تم البناء",
    EXPIRED: "منتهية",
    noExpiry: "بدون انتهاء",
    // create dialog
    createTitle: "إنشاء دعوة جديدة",
    selectParent: "اختر ولي الأمر",
    noParents: "لا يوجد أولياء أمور.",
    questionsLabel: "الأسئلة",
    questionsHint: "اختر الأسئلة التي سيختار منها ولي الأمر عند البناء.",
    searchQuestions: "بحث في الأسئلة",
    noQuestions: "لا توجد أسئلة مُفعّلة في البنك.",
    selectedCount: "محدد",
    // badge picker
    badge: "الوسام",
    badgeLabel: "اربط وسامًا بهذه الدعوة (اختياري)",
    badgeHint: "عند اختيار وسام، سيُمنح للطالب تلقائيًا عند اجتيازه الاختبار.",
    selectBadge: "اختر وسامًا",
    noBadge: "بدون وسام",
    noBadges: "لا توجد أوسمة مُفعّلة.",
    expiresLabel: "تاريخ الانتهاء (اختياري)",
    save: "إنشاء",
    cancel: "إلغاء",
    required: "هذا الحقل مطلوب",
    pickParent: "اختر ولي أمر.",
    pickQuestions: "اختر سؤالًا واحدًا على الأقل.",
    // success panel
    createdTitle: "تم إنشاء الدعوة",
    createdHint: "شارك هذا الرابط مع ولي الأمر ليبني الاختبار.",
    copy: "نسخ",
    copied: "تم نسخ الرابط",
    done: "تم",
    // empty
    empty: "لا توجد دعوات بعد.",
  },
  en: {
    pageTitleAdmin: "Question invites",
    pageDescriptionAdmin:
      "Invite a parent to build a quiz from a set of questions you pick from the bank.",
    pageTitleParent: "My invitations",
    pageDescriptionParent:
      "Invitations sent to you — build a quiz from them for your children.",
    create: "Create invitation",
    parent: "Parent",
    status: "Status",
    questions: "Questions",
    createdAt: "Created",
    expiresAt: "Expires",
    actions: "Actions",
    copyLink: "Copy link",
    buildQuiz: "Build quiz",
    PENDING: "Pending",
    OPENED: "Opened",
    BUILT: "Built",
    EXPIRED: "Expired",
    noExpiry: "No expiry",
    createTitle: "Create a new invitation",
    selectParent: "Select parent",
    noParents: "No parents available.",
    questionsLabel: "Questions",
    questionsHint: "Pick the questions the parent will choose from when building.",
    searchQuestions: "Search questions",
    noQuestions: "No active questions in the bank.",
    selectedCount: "selected",
    // badge picker
    badge: "Badge",
    badgeLabel: "Link a badge to this invitation (optional)",
    badgeHint: "When a badge is chosen, it is auto-awarded to the student once they pass.",
    selectBadge: "Select a badge",
    noBadge: "No badge",
    noBadges: "No active badges.",
    expiresLabel: "Expiry date (optional)",
    save: "Create",
    cancel: "Cancel",
    required: "This field is required",
    pickParent: "Select a parent.",
    pickQuestions: "Select at least one question.",
    createdTitle: "Invitation created",
    createdHint: "Share this link with the parent so they can build the quiz.",
    copy: "Copy",
    copied: "Link copied",
    done: "Done",
    empty: "No invitations yet.",
  },
};

export function useQuizInvitesText() {
  const { lng } = useTranslation();
  return quizInvitesText[lng === "en" ? "en" : "ar"];
}
