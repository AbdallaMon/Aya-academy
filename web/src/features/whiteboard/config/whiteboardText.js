import { useTranslation } from "../../../i18n/client.js";

// Centralized localized strings for the whiteboard feature.
export function useWhiteboardText() {
  const { lng } = useTranslation();
  const ar = lng === "ar";
  return {
    pageTitle: ar ? "السبورة التفاعلية" : "Interactive Whiteboard",
    createBtn: ar ? "جلسة جديدة" : "New session",
    cancel: ar ? "إلغاء" : "Cancel",
    titleLabel: ar ? "عنوان الجلسة" : "Session title",
    status: ar ? "الحالة" : "Status",
    visibility: ar ? "الظهور" : "Visibility",
    studentsCount: ar ? "الطلاب" : "Students",
    openBoard: ar ? "افتح السبورة (ملء الشاشة)" : "Open board (full screen)",
    activate: ar ? "فتح الجلسة" : "Open session",
    end: ar ? "إنهاء الجلسة" : "End session",
    delete: ar ? "حذف" : "Delete",
    confirmDelete: ar ? "حذف هذه الجلسة نهائيًا؟" : "Delete this session permanently?",
    makePublic: ar ? "جعلها عامة" : "Make public",
    makePrivate: ar ? "جعلها خاصة" : "Make private",
    copyLink: ar ? "نسخ الرابط العام" : "Copy public link",
    linkCopied: ar ? "تم نسخ الرابط" : "Link copied",
    addStudent: ar ? "إضافة طالب" : "Add student",
    removeStudent: ar ? "إزالة" : "Remove",
    noStudents: ar ? "لا يوجد طلاب بعد" : "No students yet",
    noName: ar ? "بدون اسم" : "No name",
    unavailable: ar ? "الجلسة غير متاحة" : "Session unavailable",
    statusLabels: {
      DRAFT: ar ? "مسودة" : "Draft",
      ACTIVE: ar ? "مفتوحة" : "Open",
      ENDED: ar ? "منتهية" : "Ended",
    },
    visibilityLabels: {
      PRIVATE: ar ? "خاصة" : "Private",
      PUBLIC: ar ? "عامة" : "Public",
    },
  };
}
