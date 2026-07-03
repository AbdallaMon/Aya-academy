// Per-page SEO copy, bilingual (ar default / en). Same `{ ar, en }` shape as the
// i18n locale sections, but kept OUT of the runtime translation bundle because
// this text is only ever read on the server inside generateMetadata().
//
// Each page provides: title, description, and optional keywords[].
// `titleAbsolute: true` means "use this title verbatim" (no "… | Brand" suffix)
// — used for the homepage, whose title already carries the brand.

export const seoContent = {
  // Site-wide defaults (homepage + fallback for anything unspecified).
  site: {
    ar: {
      title: "أكاديمية آية — تعليم القرآن والأخلاق للأطفال بمتعة وأمان",
      titleAbsolute: true,
      description:
        "رحلة مرحة وآمنة لتعليم الأطفال القرآن الكريم والأخلاق الجميلة عبر حصص تفاعلية وألعاب تعليمية ومتابعة لوليّ الأمر. ابدأ بحصة تجريبية مجانية.",
      keywords: [
        "تعليم القرآن للأطفال",
        "تحفيظ القرآن للأطفال",
        "تحفيظ قرآن أونلاين",
        "أكاديمية قرآن أونلاين",
        "معلم قرآن للأطفال",
        "تعليم التجويد للأطفال",
        "حلقات تحفيظ القرآن اون لاين",
        "تعليم الأخلاق للأطفال",
        "حصص قرآن تفاعلية للأطفال",
        "دورة تحفيظ قرآن للأطفال",
        "تعليم الأطفال القرآن أونلاين",
        "أكاديمية آية",
      ],
    },
    en: {
      title: "Aya Academy — Fun & Safe Quran and Manners Learning for Kids",
      titleAbsolute: true,
      description:
        "A joyful, safe journey for kids to learn the Quran and beautiful manners through interactive sessions, educational games and parent tracking. Start with a free trial session.",
      keywords: [
        "Quran for kids",
        "Quran memorization for kids",
        "online Quran classes for kids",
        "online Quran academy",
        "Quran teacher for kids",
        "learn Quran online for children",
        "kids Tajweed classes",
        "Islamic manners for kids",
        "interactive Quran classes",
        "Quran course for children",
        "kids Islamic education online",
        "Aya Academy",
      ],
    },
  },

  home: {
    ar: {
      title: "أكاديمية آية — تعليم القرآن والأخلاق للأطفال بمتعة وأمان",
      titleAbsolute: true,
      description:
        "رحلة مرحة وآمنة لتعليم الأطفال القرآن الكريم والأخلاق الجميلة عبر حصص تفاعلية وألعاب تعليمية. احجز حصة تجريبية مجانية لطفلك الآن.",
      keywords: [
        "تعليم القرآن للأطفال",
        "تحفيظ القرآن للأطفال أونلاين",
        "أكاديمية قرآن أونلاين",
        "حصة قرآن تجريبية مجانية للأطفال",
        "معلم قرآن للأطفال",
        "تعليم التجويد والأخلاق للأطفال",
        "أكاديمية آية",
      ],
    },
    en: {
      title: "Aya Academy — Fun & Safe Quran and Manners Learning for Kids",
      titleAbsolute: true,
      description:
        "A joyful, safe journey for kids to learn the Quran and beautiful manners through interactive sessions and educational games. Book a free trial session today.",
      keywords: [
        "Quran for kids",
        "online Quran memorization for kids",
        "online Quran academy",
        "free Quran trial class for kids",
        "Quran teacher for kids",
        "Tajweed and manners for children",
        "Aya Academy",
      ],
    },
  },

  login: {
    ar: {
      title: "تسجيل الدخول",
      description: "سجّل الدخول إلى حسابك في أكاديمية آية لمتابعة تقدّم طفلك وحصصه.",
      keywords: [
        "تسجيل الدخول أكاديمية آية",
        "حساب ولي الأمر",
        "متابعة تقدّم الطفل في القرآن",
      ],
    },
    en: {
      title: "Login",
      description: "Sign in to your Aya Academy account to follow your child's progress and sessions.",
      keywords: [
        "Aya Academy login",
        "parent account",
        "track child Quran progress",
      ],
    },
  },

  "forgot-password": {
    ar: {
      title: "نسيت كلمة المرور",
      description: "استعد الوصول إلى حسابك في أكاديمية آية عبر رابط إعادة تعيين كلمة المرور المرسل إلى بريدك.",
    },
    en: {
      title: "Forgot password",
      description: "Recover access to your Aya Academy account with a password reset link sent to your email.",
    },
  },

  "reset-password": {
    ar: {
      title: "إعادة تعيين كلمة المرور",
      description: "اختر كلمة مرور جديدة لحسابك في أكاديمية آية.",
    },
    en: {
      title: "Reset password",
      description: "Choose a new password for your Aya Academy account.",
    },
  },

  register: {
    ar: {
      title: "إنشاء حساب",
      description: "أنشئ حسابًا في أكاديمية آية وابدأ رحلة طفلك مع القرآن بحصة تجريبية مجانية.",
      keywords: [
        "التسجيل في أكاديمية قرآن أونلاين",
        "حصة قرآن تجريبية مجانية",
        "تسجيل طفل لتحفيظ القرآن أونلاين",
      ],
    },
    en: {
      title: "Create an account",
      description: "Create an Aya Academy account and start your child's Quran journey with a free trial.",
      keywords: [
        "sign up online Quran academy",
        "free Quran trial session",
        "register child for online Quran classes",
      ],
    },
  },

  blog: {
    ar: {
      title: "المدوّنة",
      description:
        "مقالات أكاديمية آية للأهل: نصائح عملية عن تحفيظ القرآن للأطفال، تعليم الأخلاق، والتعلّم الممتع — بكلمات بسيطة وقلبٍ دافئ.",
      keywords: [
        "مدونة تربية إسلامية",
        "تحفيظ القرآن للأطفال",
        "تعليم الأخلاق للأطفال",
        "نصائح للأهل",
        "أكاديمية آية",
      ],
    },
    en: {
      title: "Blog",
      description:
        "Aya Academy articles for parents: practical tips on helping kids memorize the Quran, teaching manners, and joyful learning — in plain words and a warm heart.",
      keywords: [
        "Islamic parenting blog",
        "Quran memorization for kids",
        "teaching kids manners",
        "parenting tips",
        "Aya Academy",
      ],
    },
  },

  freeGame: {
    ar: {
      title: "جرّب لعبة مجانية",
      description:
        "العب لعبة آداب تفاعلية مجانية من أكاديمية آية، وسجّل لتحصل على حصة تجريبية مجانية لطفلك.",
      keywords: [
        "ألعاب تعليمية إسلامية للأطفال",
        "لعبة آداب وأخلاق للأطفال",
        "ألعاب قرآن مجانية للأطفال",
        "تعليم الأطفال بالألعاب",
      ],
    },
    en: {
      title: "Try a free game",
      description:
        "Play a free interactive manners game from Aya Academy, and sign up for a free trial session for your child.",
      keywords: [
        "Islamic educational games for kids",
        "kids manners game",
        "free Quran games for children",
        "learning through games for kids",
      ],
    },
  },
};

export function getSeo(page, lng) {
  const entry = seoContent[page] || seoContent.site;
  return entry[lng] || entry.ar;
}
