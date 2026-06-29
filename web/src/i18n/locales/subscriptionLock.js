// subscriptionLock — copy shown when a feature is blocked by subscription status.
// student variant: gentle, kid-appropriate, no billing CTA.
// parent variant: clear + actionable, with a renew CTA.

export const subscriptionLock = {
  ar: {
    studentTitle: "القسم ده مقفول دلوقتي 🔒",
    studentBody: "كلّم بابا أو ماما عشان تكمل اللعب والمغامرات 😊",
    parentTitle: "اشتراك {name} منتهي",
    parentBody: "جدّد الاشتراك عشان يرجع يشوف نقاطه وأوسمته ويلعب الألعاب.",
    renewCta: "تجديد الاشتراك",
  },
  en: {
    studentTitle: "This section is locked right now 🔒",
    studentBody: "Ask your mom or dad so you can keep playing 😊",
    parentTitle: "{name}'s subscription has expired",
    parentBody: "Renew the subscription so they can see their points and badges and play games again.",
    renewCta: "Renew subscription",
  },
};
