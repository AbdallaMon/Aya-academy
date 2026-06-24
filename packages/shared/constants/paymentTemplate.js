// Shape + defaults for the payment-template config (PaymentTemplate.configJson
// and the per-invoice Invoice.configJson copy). Shared so the backend seed and
// the frontend form/preview agree on the same structure.
//
// configJson = {
//   company:  { nameAr, nameEn, addressAr, addressEn, phone, email, logoUrl },
//   theme:    { headerColor, accentColor, textColor },
//   fees:     { transferFeePercent, transferFeeFixed },
//   notes:    [ { ar, en } ],                 // customer-facing notices
//   footerAr, footerEn,
//   paymentInstructionsAr, paymentInstructionsEn,
//   dueDays,                                   // due-date offset in days from issue
//   showFreeHours, showPreviousCredit, showPreviousDebt
// }

export const DEFAULT_PAYMENT_TEMPLATE = {
  company: {
    nameAr: "أكاديمية آية لتعليم القرآن",
    nameEn: "Aya Academy",
    addressAr: "",
    addressEn: "",
    phone: "",
    email: "",
    logoUrl: "",
  },
  theme: {
    headerColor: "#3D1F08",
    accentColor: "#C9A84C",
    textColor: "#25313F",
  },
  fees: {
    transferFeePercent: 0,
    transferFeeFixed: 0,
  },
  notes: [
    {
      ar: "يرجى سداد قيمة الفاتورة قبل تاريخ الاستحقاق لتجنب توقف الحصص.",
      en: "Please settle the invoice before the due date to avoid pausing the lessons.",
    },
    {
      ar: "في حالة التحويل البنكي، يرجى إرسال إيصال التحويل لتأكيد الدفع.",
      en: "For bank transfers, please send the transfer receipt to confirm payment.",
    },
  ],
  footerAr: "شكراً لثقتكم بأكاديمية آية.",
  footerEn: "Thank you for trusting Aya Academy.",
  paymentInstructionsAr: "",
  paymentInstructionsEn: "",
  dueDays: 7,
  showFreeHours: true,
  showPreviousCredit: true,
  showPreviousDebt: true,
};

// The subset of template fields an admin may override per-invoice. Hours, rate
// and the charged amount always come from the subscription and are never here.
export const INVOICE_EDITABLE_CONFIG_KEYS = [
  "company",
  "theme",
  "fees",
  "notes",
  "footerAr",
  "footerEn",
  "paymentInstructionsAr",
  "paymentInstructionsEn",
  "showFreeHours",
  "showPreviousCredit",
  "showPreviousDebt",
];
