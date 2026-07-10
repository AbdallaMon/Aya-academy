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
    subsHours: "عدد ساعات الفاتورة",
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
    more: "المزيد",
    // renew
    renew: "تجديد",
    renewTitle: "تجديد الاشتراك",
    renewSubmit: "تجديد",
    awaitingActivationHint: "في انتظار الدفع والتفعيل",
    stillActiveConfirm: "ما زال هناك اشتراك فعّال لم ينتهِ بعد. هل تريد التجديد على أي حال؟",
    // change plan
    changePlan: "تعديل الخطة",
    changePlanTitle: "تعديل خطة الاشتراك",
    changePlanSubmit: "حفظ التغيير",
    changePlanHint:
      "بيعيد ربط الخطة بالاشتراك. الساعات والسعر متتغيّرش إلا لو الاشتراك لسه مفيهوش حصص متسجّلة؛ لو فيه حصص، الحصص هي اللي بتحدّد الساعات. عشان تزوّد الساعات ضيف حصة بتاريخ الاشتراك.",
    // coupon (add / change / remove on an existing subscription)
    couponTitle: "إضافة أو تغيير الكوبون",
    couponSubmit: "حفظ الكوبون",
    couponHint: "أضف كود خصم أو غيّره أو أزله. لن يُطبّق إلا قبل دفع الفاتورة.",
    removeCoupon: "إزالة الكوبون",
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
    // cancel subscription
    cancelSub: "إلغاء الاشتراك",
    cancelSubTitle: "إلغاء الاشتراك",
    cancelSubConfirm: "متأكد إنك عايز تلغي الاشتراك ده؟",
    // edit hours (remaining only)
    editHours: "تعديل الساعات المتبقية",
    editHoursTitle: "تعديل ساعات الفاتورة",
    editRemainingTitle: "تعديل الساعات المتبقية",
    remainingHoursLabel: "الساعات المتبقية",
    remainingHoursHint: "عدد الساعات المتبقية للطالب في هذا الاشتراك.",
    subsHoursHint: "الفاتورة بتتحسب على عدد الساعات دي",
    remainingExceedsSubs: "الساعات المتبقية لا يمكن أن تتجاوز ساعات الاشتراك.",
    reasonEditHours: "لا يمكن تعديل ساعات اشتراك منتهٍ أو ملغى.",
    reasonEditHoursUsage:
      "ساعات الفاتورة الجارية بتتحسب تلقائياً من الحصص، ولا يمكن تعديلها الآن.",
    // disabled-action tooltips (why an action isn't available now)
    reasonRenew: "التجديد متاح فقط بعد انتهاء الاشتراك أو إلغائه",
    reasonChangePlan: "لا يمكن تغيير الخطة بعد تفعيل الاشتراك أو دفع الفاتورة",
    reasonCoupon: "لا يمكن تعديل الكوبون بعد الدفع أو التفعيل",
    reasonSend: "لا توجد فاتورة لإرسالها",
    reasonViewInvoice: "لا توجد فاتورة لعرضها",
    reasonActivate: "الاشتراك غير قابل للتفعيل في حالته الحالية",
    reasonActivateTooEarly:
      "لسه بدري — التفعيل يفتح من آخر الشهر السابق لبداية الاشتراك",
    reasonMarkPaid: "لا توجد فاتورة غير مدفوعة",
    reasonCancel: "لا يمكن إلغاء اشتراك منتهٍ أو ملغى بالفعل",
    // usage-based billing
    phase: {
      accumulating: "بتتجمّع",
      awaitingPayment: "بانتظار الدفع",
      upcoming: "قادم",
      active: "نشط",
      ended: "منتهي",
    },
    origin: "النوع",
    originUsage: "حسب الحصص",
    originManual: "يدوي",
    accumulatingTitle: "فاتورة الشهر القادم (بتتجمّع)",
    liveHint: "بيتجمّع من حصص الشهر الحالي، ويتفوتر الشهر الجاي",
    frozenHint: "اتجمّد — جاهز للفاتورة",
    usageManagedHint: "بيتحسب تلقائياً من الحصص، ويتقفل آخر الشهر",
    noCurrent: "لا يوجد اشتراك حالي",
    viewAll: "كل الاشتراكات",
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
    subsHours: "Invoice hours",
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
    more: "More",
    // renew
    renew: "Renew",
    renewTitle: "Renew subscription",
    renewSubmit: "Renew",
    awaitingActivationHint: "Awaiting payment & activation",
    stillActiveConfirm: "There is still an active subscription that hasn't expired. Renew anyway?",
    // change plan
    changePlan: "Change plan",
    changePlanTitle: "Change subscription plan",
    changePlanSubmit: "Save change",
    changePlanHint:
      "Re-links the subscription's plan. Hours and price only change if the subscription has no logged sessions yet; once sessions are logged, they drive the hours. To add hours, log a session dated within the subscription.",
    // coupon (add / change / remove on an existing subscription)
    couponTitle: "Add or change coupon",
    couponSubmit: "Save coupon",
    couponHint: "Add, replace, or remove a coupon code. Only applies while the invoice is unpaid.",
    removeCoupon: "Remove coupon",
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
    // cancel subscription
    cancelSub: "Cancel subscription",
    cancelSubTitle: "Cancel subscription",
    cancelSubConfirm: "Are you sure you want to cancel this subscription?",
    // edit hours (remaining only)
    editHours: "Edit remaining hours",
    editHoursTitle: "Edit invoice hours",
    editRemainingTitle: "Edit remaining hours",
    remainingHoursLabel: "Remaining hours",
    remainingHoursHint: "Hours the student still has left on this subscription.",
    subsHoursHint: "The invoice is calculated from these hours.",
    remainingExceedsSubs: "Remaining hours can't exceed subscription hours.",
    reasonEditHours: "The hours of an expired or cancelled subscription can't be edited.",
    reasonEditHoursUsage:
      "The accumulating bill's hours are auto-computed from sessions and can't be edited now.",
    // disabled-action tooltips (why an action isn't available now)
    reasonRenew: "Renewal is only available after the subscription has expired or been cancelled.",
    reasonChangePlan: "The plan can't be changed after the subscription is active or the invoice is paid.",
    reasonCoupon: "The coupon can't be changed after payment or activation.",
    reasonSend: "There is no invoice to send.",
    reasonViewInvoice: "There is no invoice to view.",
    reasonActivate: "The subscription can't be activated in its current state.",
    reasonActivateTooEarly:
      "Too early — activation opens from the last day of the month before the subscription starts.",
    reasonMarkPaid: "There is no unpaid invoice.",
    reasonCancel: "A subscription that's already expired or cancelled can't be cancelled.",
    // usage-based billing
    phase: {
      accumulating: "Accumulating",
      awaitingPayment: "Awaiting payment",
      upcoming: "Upcoming",
      active: "Active",
      ended: "Ended",
    },
    origin: "Type",
    originUsage: "Usage-based",
    originManual: "Manual",
    accumulatingTitle: "Next month's bill (building up)",
    liveHint: "Builds up from this month's sessions, billed next month",
    frozenHint: "Frozen — ready to invoice",
    usageManagedHint: "Auto-computed from sessions; closes at month end",
    noCurrent: "No current subscription",
    viewAll: "All subscriptions",
  },
};

export function useSubscriptionDetailText() {
  const { lng } = useTranslation();
  return subscriptionDetailText[lng === "en" ? "en" : "ar"];
}
