"use client";

import { useTranslation } from "../../../i18n/client.js";

export const badgesAdminText = {
  ar: {
    pageTitle: "إدارة الأوسمة",
    pageDescription: "أنشئ وعدّل تعريفات الأوسمة التي تُمنح للطلاب.",
    create: "وسام جديد",
    createTitle: "إنشاء وسام",
    editTitle: "تعديل وسام",
    // columns
    preview: "المعاينة",
    code: "الكود",
    name: "الاسم",
    score: "النقاط",
    active: "مفعّل",
    actions: "إجراءات",
    edit: "تعديل",
    delete: "حذف",
    activeYes: "مفعّل",
    activeNo: "متوقف",
    deleteConfirm: "هل تريد حذف هذا الوسام؟",
    // form
    codeLabel: "الكود",
    nameArLabel: "الاسم (عربي)",
    nameEnLabel: "الاسم (إنجليزي)",
    descriptionArLabel: "الوصف (عربي)",
    descriptionEnLabel: "الوصف (إنجليزي)",
    emojiLabel: "الرمز التعبيري",
    bgColorLabel: "لون الخلفية",
    textColorLabel: "لون النص",
    scoreLabel: "النقاط",
    isActiveLabel: "مفعّل",
    save: "حفظ",
    cancel: "إلغاء",
    required: "هذا الحقل مطلوب",
    // empty
    empty: "لا توجد أوسمة بعد",
    emptyBody: "ابدأ بإنشاء أول وسام لمنحه للطلاب.",
  },
  en: {
    pageTitle: "Badge management",
    pageDescription: "Create and edit the badge definitions awarded to students.",
    create: "New badge",
    createTitle: "Create badge",
    editTitle: "Edit badge",
    preview: "Preview",
    code: "Code",
    name: "Name",
    score: "Score",
    active: "Active",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    activeYes: "Active",
    activeNo: "Inactive",
    deleteConfirm: "Delete this badge?",
    codeLabel: "Code",
    nameArLabel: "Name (Arabic)",
    nameEnLabel: "Name (English)",
    descriptionArLabel: "Description (Arabic)",
    descriptionEnLabel: "Description (English)",
    emojiLabel: "Emoji",
    bgColorLabel: "Background color",
    textColorLabel: "Text color",
    scoreLabel: "Score",
    isActiveLabel: "Active",
    save: "Save",
    cancel: "Cancel",
    required: "This field is required",
    empty: "No badges yet",
    emptyBody: "Start by creating your first badge to award to students.",
  },
};

export function useBadgesAdminText() {
  const { lng } = useTranslation();
  return badgesAdminText[lng === "en" ? "en" : "ar"];
}
