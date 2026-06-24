"use client";

import { useTranslation } from "../../../i18n/client.js";

export const badgesText = {
  ar: {
    pageTitle: "أوسمتي وجوائزي",
    pageDescription: "كل ما حصلت عليه من أوسمة وهدايا ومكافآت.",
    // reward type titles
    BADGE: "وسام",
    COUPON: "قسيمة خصم",
    FREE_LECTURES: "حصص مجانية",
    // reward type descriptions
    badgeDesc: "أحسنت! لقد حصلت على وسام جديد.",
    couponDesc: "قسيمة خصم لاستخدامها في اشتراكك.",
    freeLecturesDesc: "حصص مجانية أضيفت إلى رصيدك.",
    // statuses
    PENDING: "متاحة",
    CLAIMED: "تم استلامها",
    EXPIRED: "منتهية",
    // misc
    code: "الكود",
    value: "القيمة",
    lectures: "حصص",
    earnedOn: "حصلت عليها في",
    claimedOn: "استُلمت في",
    empty: "لا توجد جوائز بعد",
    emptyBody: "أكمل الاختبارات والألعاب لتربح أوسمة وجوائز!",
  },
  en: {
    pageTitle: "My Badges & Rewards",
    pageDescription: "Everything you have earned — badges, gifts and rewards.",
    BADGE: "Badge",
    COUPON: "Discount coupon",
    FREE_LECTURES: "Free lectures",
    badgeDesc: "Well done! You earned a new badge.",
    couponDesc: "A discount coupon to use on your subscription.",
    freeLecturesDesc: "Free lectures added to your balance.",
    PENDING: "Available",
    CLAIMED: "Claimed",
    EXPIRED: "Expired",
    code: "Code",
    value: "Value",
    lectures: "lectures",
    earnedOn: "Earned on",
    claimedOn: "Claimed on",
    empty: "No rewards yet",
    emptyBody: "Complete quizzes and games to win badges and rewards!",
  },
};

export function useBadgesText() {
  const { lng } = useTranslation();
  return badgesText[lng === "en" ? "en" : "ar"];
}
