"use client";

import { useTranslation } from "../../../i18n/client.js";

export const notificationsText = {
  ar: {
    title: "الإشعارات",
    markAll: "تعليم الكل كمقروء",
    markRead: "تعليم كمقروء",
    empty: "لا توجد إشعارات",
    viewAll: "عرض كل الإشعارات",
    unread: "غير مقروء",
    loading: "جارٍ التحميل...",
    pageDescription: "كل التنبيهات والتحديثات الخاصة بحسابك",
  },
  en: {
    title: "Notifications",
    markAll: "Mark all as read",
    markRead: "Mark as read",
    empty: "No notifications",
    viewAll: "View all notifications",
    unread: "Unread",
    loading: "Loading...",
    pageDescription: "All alerts and updates for your account",
  },
};

export function useNotificationsText() {
  const { lng } = useTranslation();
  return notificationsText[lng === "en" ? "en" : "ar"];
}

// Pick the localized field (titleAr/titleEn, bodyAr/bodyEn) off a record.
export function localizedField(record, base, lng) {
  if (!record) return "";
  const key = lng === "en" ? `${base}En` : `${base}Ar`;
  return record[key] ?? record[`${base}Ar`] ?? record[`${base}En`] ?? "";
}
