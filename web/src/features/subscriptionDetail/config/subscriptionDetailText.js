"use client";

import { useTranslation } from "../../../i18n/client.js";

export const subscriptionDetailText = {
  ar: {
    // header
    pageTitle: "تفاصيل الاشتراك",
    back: "رجوع",
    subscriptionId: "رقم الاشتراك",
    notFound: "الاشتراك غير موجود",
    notFoundBody: "تعذّر العثور على هذا الاشتراك أو ليست لديك صلاحية عرضه.",
    // statuses (subscription)
    PENDING: "بانتظار الموافقة",
    UPCOMING: "قادم",
    ACTIVE: "نشط",
    EXPIRED: "منتهٍ",
    CANCELLED: "ملغى",
    // subscription card
    subscriptionCardTitle: "بيانات الاشتراك",
    plan: "الخطة",
    billingPeriod: "دورة الفوترة",
    MONTHLY: "شهري",
    YEARLY: "سنوي",
    monthly: "شهري",
    yearly: "سنوي",
    startDate: "تاريخ البداية",
    endDate: "تاريخ النهاية",
    totalHours: "إجمالي الساعات",
    remainingHours: "الساعات المتبقية",
    priceBreakdown: "تفاصيل السعر",
    basePrice: "السعر قبل الخصم",
    discount: "الخصم",
    netPrice: "السعر المحصّل",
    coupon: "كوبون",
    // invoice card
    invoiceCardTitle: "الفاتورة",
    invoiceStatus: "حالة الفاتورة",
    invoiceTotal: "إجمالي الفاتورة",
    sent: "تم الإرسال",
    notSent: "لم تُرسل بعد",
    viewInvoice: "عرض الفاتورة",
    noInvoice: "لا توجد فاتورة لهذا الاشتراك بعد.",
    // invoice statuses
    UNPAID: "غير مدفوعة",
    PAID: "مدفوعة",
    VOID: "ملغاة",
    none: "—",
  },
  en: {
    pageTitle: "Subscription details",
    back: "Back",
    subscriptionId: "Subscription #",
    notFound: "Subscription not found",
    notFoundBody: "We couldn't find this subscription or you don't have access to it.",
    PENDING: "Pending approval",
    UPCOMING: "Upcoming",
    ACTIVE: "Active",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
    subscriptionCardTitle: "Subscription details",
    plan: "Plan",
    billingPeriod: "Billing period",
    MONTHLY: "Monthly",
    YEARLY: "Yearly",
    monthly: "Monthly",
    yearly: "Yearly",
    startDate: "Start date",
    endDate: "End date",
    totalHours: "Total hours",
    remainingHours: "Remaining hours",
    priceBreakdown: "Price breakdown",
    basePrice: "Base price",
    discount: "Discount",
    netPrice: "Price charged",
    coupon: "Coupon",
    invoiceCardTitle: "Invoice",
    invoiceStatus: "Invoice status",
    invoiceTotal: "Invoice total",
    sent: "Sent",
    notSent: "Not sent yet",
    viewInvoice: "View invoice",
    noInvoice: "No invoice has been created for this subscription yet.",
    UNPAID: "Unpaid",
    PAID: "Paid",
    VOID: "Void",
    none: "—",
  },
};

export function useSubscriptionDetailText() {
  const { lng } = useTranslation();
  return subscriptionDetailText[lng === "en" ? "en" : "ar"];
}
