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
    // shared dialog labels
    save: "حفظ",
    cancel: "إلغاء",
    selectPlan: "اختر الخطة",
    // actions section
    actions: "إجراءات",
    // renew
    renew: "تجديد",
    renewTitle: "تجديد الاشتراك",
    renewSubmit: "تجديد",
    stillActiveConfirm: "ما زال هناك اشتراك فعّال لم ينتهِ بعد. هل تريد التجديد على أي حال؟",
    // change plan
    changePlan: "تعديل الخطة",
    changePlanTitle: "تعديل خطة الاشتراك",
    changePlanSubmit: "حفظ التغيير",
    // send to parent
    sendToParent: "إرسال لولي الأمر",
    resend: "إعادة الإرسال",
    sendSuccess: "تم إرسال الفاتورة لولي الأمر",
    // activate subscription
    activate: "تفعيل الاشتراك",
    activateTitle: "تفعيل الاشتراك",
    activateMarkPaid: "اعتمد الفاتورة كمدفوعة كمان؟",
    // mark invoice paid
    markPaid: "اعتماد الفاتورة كمدفوعة",
    markPaidTitle: "اعتماد الفاتورة كمدفوعة",
    markPaidActivate: "فعّل الاشتراك كمان؟",
    confirm: "تأكيد",
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
    // shared dialog labels
    save: "Save",
    cancel: "Cancel",
    selectPlan: "Select plan",
    // actions section
    actions: "Actions",
    // renew
    renew: "Renew",
    renewTitle: "Renew subscription",
    renewSubmit: "Renew",
    stillActiveConfirm: "There is still an active subscription that hasn't expired. Renew anyway?",
    // change plan
    changePlan: "Change plan",
    changePlanTitle: "Change subscription plan",
    changePlanSubmit: "Save change",
    // send to parent
    sendToParent: "Send to parent",
    resend: "Resend",
    sendSuccess: "Invoice sent to the parent",
    // activate subscription
    activate: "Activate",
    activateTitle: "Activate subscription",
    activateMarkPaid: "Also mark the invoice as paid?",
    // mark invoice paid
    markPaid: "Mark invoice paid",
    markPaidTitle: "Mark invoice as paid",
    markPaidActivate: "Also activate the subscription?",
    confirm: "Confirm",
  },
};

export function useSubscriptionDetailText() {
  const { lng } = useTranslation();
  return subscriptionDetailText[lng === "en" ? "en" : "ar"];
}
