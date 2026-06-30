"use client";

import { useTranslation } from "../../../i18n/client.js";

export const reportsText = {
  ar: {
    pageTitle: "تقارير الطلاب",
    pageDescription: "أنشئ وأرسل تقارير متابعة الطلاب لأولياء الأمور.",
    create: "تقرير جديد",
    edit: "تعديل",
    delete: "حذف",
    // table
    title: "العنوان",
    students: "الطلاب",
    reportDate: "تاريخ التقرير",
    createdAt: "أنشئ في",
    actions: "إجراءات",
    noStudents: "—",
    moreStudents: "+{count}",
    // form
    titleLabel: "عنوان التقرير",
    bodyLabel: "نص التقرير",
    reportDateLabel: "تاريخ التقرير",
    studentsLabel: "الطلاب",
    studentsHelper: "اختر طالبًا واحدًا على الأقل",
    selectStudents: "اختر الطلاب",
    loadingStudents: "جارٍ تحميل الطلاب…",
    required: "هذا الحقل مطلوب",
    studentsRequired: "اختر طالبًا واحدًا على الأقل",
    save: "حفظ",
    cancel: "إلغاء",
    createTitle: "إنشاء تقرير",
    editTitle: "تعديل التقرير",
    deleteConfirm: "هل تريد حذف هذا التقرير؟",
    // list — parent view
    view: "عرض",
    open: "فتح التقرير",
    emptyTitle: "لا توجد تقارير بعد",
    emptyBody: "ستظهر هنا تقارير متابعة أبنائك فور إرسالها من الأكاديمية.",
    // detail page
    back: "رجوع",
    notFoundTitle: "التقرير غير متاح",
    notFoundBody: "قد يكون التقرير محذوفًا أو ليس لديك صلاحية الوصول إليه.",
    body: "نص التقرير",
    aboutStudents: "بخصوص الطلاب",
    attachments: "المرفقات",
    attachment: "مرفق",
    download: "تحميل",
    noAttachments: "لا توجد مرفقات.",
  },
  en: {
    pageTitle: "Student reports",
    pageDescription: "Create and send student progress reports to parents.",
    create: "New report",
    edit: "Edit",
    delete: "Delete",
    title: "Title",
    students: "Students",
    reportDate: "Report date",
    createdAt: "Created",
    actions: "Actions",
    noStudents: "—",
    moreStudents: "+{count}",
    titleLabel: "Report title",
    bodyLabel: "Report body",
    reportDateLabel: "Report date",
    studentsLabel: "Students",
    studentsHelper: "Select at least one student",
    selectStudents: "Select students",
    loadingStudents: "Loading students…",
    required: "This field is required",
    studentsRequired: "Select at least one student",
    save: "Save",
    cancel: "Cancel",
    createTitle: "Create a report",
    editTitle: "Edit report",
    deleteConfirm: "Delete this report?",
    // list — parent view
    view: "View",
    open: "Open report",
    emptyTitle: "No reports yet",
    emptyBody: "Your children's progress reports will appear here once the academy sends them.",
    // detail page
    back: "Back",
    notFoundTitle: "Report unavailable",
    notFoundBody: "It may have been removed, or you don't have access to it.",
    body: "Report",
    aboutStudents: "About the students",
    attachments: "Attachments",
    attachment: "Attachment",
    download: "Download",
    noAttachments: "No attachments.",
  },
};

export function useReportsText() {
  const { lng } = useTranslation();
  return reportsText[lng === "en" ? "en" : "ar"];
}
