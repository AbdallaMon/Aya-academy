// Per-page SEO copy, bilingual (ar default / en). Same `{ ar, en }` shape as the
// i18n locale sections, but kept OUT of the runtime translation bundle because
// this text is only ever read on the server inside generateMetadata().
//
// Each page provides title and description. The optional keywords arrays are
// editorial query maps only; buildMetadata deliberately does not emit the
// ignored `<meta name="keywords">` tag.
// `titleAbsolute: true` means "use this title verbatim" (no "… | Brand" suffix)
// — used for the homepage, whose title already carries the brand.

export const seoContent = {
  // Site-wide defaults (homepage + fallback for anything unspecified).
  site: {
    ar: {
      title: "أكاديمية آية — تحفيظ القرآن والعلوم الشرعية أونلاين للكبار والأطفال",
      titleAbsolute: true,
      description:
        "تعلّم القرآن الكريم وتحفيظه، والتجويد، واللغة العربية، والعلوم الشرعية أونلاين مع معلّمين مؤهّلين — للكبار والأطفال من ٥ سنوات فأكثر. حصص مباشرة تفاعلية ومتابعة مستمرة، وحصة تجريبية مجانية.",
      keywords: [
        "تحفيظ القرآن أونلاين",
        "تعليم القرآن الكريم",
        "تحفيظ القرآن للكبار",
        "تحفيظ القرآن للأطفال",
        "دورات تجويد أونلاين",
        "تعليم العلوم الشرعية",
        "دراسة العلوم الشرعية أونلاين",
        "تعلم اللغة العربية أونلاين",
        "أكاديمية قرآن أونلاين",
        "معلم قرآن خصوصي أونلاين",
        "حلقات تحفيظ القرآن اون لاين",
        "أكاديمية آية",
      ],
    },
    en: {
      title: "Online Quran Classes for Kids & Adults | Aya Academy",
      titleAbsolute: true,
      description:
        "Learn Quran online with qualified teachers. Live Quran, Tajweed, Arabic and Islamic studies classes for kids and adults, with progress tracking and a free trial.",
      keywords: [
        "online Quran memorization",
        "learn Quran online",
        "Quran classes for adults",
        "Quran classes for kids",
        "online Tajweed course",
        "Islamic studies online",
        "learn Arabic online",
        "online Quran academy",
        "Quran teacher online",
        "Hifz online",
        "memorize Quran online",
        "Aya Academy",
      ],
    },
  },

  home: {
    ar: {
      title: "أكاديمية آية — تحفيظ القرآن والعلوم الشرعية أونلاين للكبار والأطفال",
      titleAbsolute: true,
      description:
        "احجز حصة تجريبية مجانية في أكاديمية آية: تحفيظ القرآن والتجويد واللغة العربية والعلوم الشرعية أونلاين للكبار والأطفال، مع معلّمين مؤهّلين وحصص مباشرة تفاعلية.",
      keywords: [
        "تحفيظ القرآن أونلاين",
        "تعليم القرآن للكبار والأطفال",
        "دورات تجويد أونلاين",
        "تعليم العلوم الشرعية أونلاين",
        "حصة قرآن تجريبية مجانية",
        "أكاديمية قرآن أونلاين",
        "معلم قرآن خصوصي أونلاين",
        "أكاديمية آية",
      ],
    },
    en: {
      title: "Online Quran Classes for Kids & Adults | Aya Academy",
      titleAbsolute: true,
      description:
        "Learn Quran online with qualified teachers. Live Quran, Tajweed, Arabic and Islamic studies classes for kids and adults, with progress tracking and a free trial.",
      keywords: [
        "online Quran memorization",
        "Quran classes for adults and kids",
        "online Tajweed course",
        "Islamic studies online",
        "free Quran trial class",
        "online Quran academy",
        "Quran teacher online",
        "Aya Academy",
      ],
    },
  },

  login: {
    ar: {
      title: "تسجيل الدخول",
      description: "سجّل الدخول إلى حسابك في أكاديمية آية لمتابعة تقدّمك أو تقدّم طفلك وحصصك.",
      keywords: [
        "تسجيل الدخول أكاديمية آية",
        "حساب الطالب وولي الأمر",
        "متابعة التقدّم في تحفيظ القرآن",
      ],
    },
    en: {
      title: "Login",
      description: "Sign in to your Aya Academy account to follow your — or your child's — progress and sessions.",
      keywords: [
        "Aya Academy login",
        "student and parent account",
        "track Quran progress",
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
      description: "أنشئ حسابًا في أكاديمية آية وابدأ رحلتك أو رحلة طفلك مع تحفيظ القرآن والعلوم الشرعية بحصة تجريبية مجانية.",
      keywords: [
        "التسجيل في أكاديمية قرآن أونلاين",
        "حصة قرآن تجريبية مجانية",
        "تعلم القرآن أونلاين للكبار والأطفال",
      ],
    },
    en: {
      title: "Create an account",
      description: "Create an Aya Academy account and start your — or your child's — Quran and Islamic studies journey with a free trial.",
      keywords: [
        "sign up online Quran academy",
        "free Quran trial session",
        "learn Quran online for adults and kids",
      ],
    },
  },

  blog: {
    ar: {
      title: "مدونة القرآن والتربية الإسلامية",
      description:
        "مدونة أكاديمية آية: مقالات موثوقة ونصائح عملية عن تحفيظ القرآن والتجويد واللغة العربية والتربية الإسلامية للكبار والأهل.",
      keywords: [
        "مدونة تحفيظ القرآن",
        "نصائح تعلم القرآن",
        "تعلم التجويد",
        "العلوم الشرعية",
        "تربية إسلامية",
        "أكاديمية آية",
      ],
    },
    en: {
      title: "Blog",
      description:
        "Aya Academy articles: practical tips on Quran memorization, Tajweed, Arabic and Islamic studies — for adult learners and parents, in plain, useful words.",
      keywords: [
        "Quran memorization tips",
        "learn Tajweed",
        "Islamic studies",
        "learn Arabic",
        "Islamic parenting",
        "Aya Academy",
      ],
    },
  },

  freeGame: {
    ar: {
      title: "لعبة تعليمية إسلامية مجانية للأطفال",
      description:
        "جرّب لعبة آداب وأخلاق تفاعلية مجانية للأطفال من أكاديمية آية، ثم احجز حصة تجريبية مجانية لطفلك.",
      keywords: [
        "ألعاب تعليمية إسلامية للأطفال",
        "لعبة آداب وأخلاق للأطفال",
        "ألعاب قرآن مجانية للأطفال",
        "تعليم الأطفال بالألعاب",
        "لعبة اكاديمية ايه المجانية",
      ],
    },
    en: {
      title: "Free Islamic Educational Game for Kids",
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
