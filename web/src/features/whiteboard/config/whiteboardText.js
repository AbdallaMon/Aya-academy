import { useTranslation } from "../../../i18n/client.js";

// Centralized localized strings for the whiteboard feature.
export function useWhiteboardText() {
  const { lng } = useTranslation();
  const ar = lng === "ar";
  return {
    pageTitle: ar ? "السبورة التفاعلية" : "Interactive Whiteboard",
    createBtn: ar ? "جلسة جديدة" : "New session",
    createTitle: ar ? "جلسة سبورة جديدة" : "New whiteboard session",
    createSubtitle: ar
      ? "الجلسة هتفتح على طول بعد الإنشاء وتقدر تبدأ الشرح فورًا."
      : "The session opens right away so you can start teaching immediately.",
    cancel: ar ? "إلغاء" : "Cancel",
    titleLabel: ar ? "عنوان الجلسة" : "Session title",
    studentsLabel: ar ? "الطلاب الحاضرون" : "Attending students",
    studentsHint: ar
      ? "اختياري — تقدر تضيف أو تحذف طلاب بعدين برضه."
      : "Optional — you can add or remove students later too.",
    publicLabel: ar ? "جلسة عامة (برابط للمشاركة)" : "Public session (shareable link)",
    publicOnHint: ar
      ? "هيتولّد رابط عام أي حد معاه يقدر يفتح السبورة."
      : "A public link will be generated — anyone with it can open the board.",
    publicOffHint: ar
      ? "خاصة — تفتحها أنت بس من داخل لوحة التحكم."
      : "Private — only you can open it from the dashboard.",
    openHint: ar
      ? "افتح السبورة في تبويب جديد بملء الشاشة وابدأ الشرح."
      : "Open the board full-screen in a new tab and start teaching.",
    shareTitle: ar ? "المشاركة" : "Sharing",
    manageTitle: ar ? "إدارة الجلسة" : "Manage session",
    retentionNote: (days) =>
      ar
        ? `أي صور بترفعيها على السبورة بتتحذف تلقائيًا بعد ${days} يوم لتوفير المساحة (تقدري تعدّلي المدة من الإعدادات).`
        : `Any images you add to the board are auto-deleted after ${days} days to save space (configurable in Settings).`,
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
