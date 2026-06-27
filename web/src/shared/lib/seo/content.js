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
        "تحفيظ القرآن",
        "أكاديمية قرآن أونلاين",
        "تعليم الأخلاق للأطفال",
        "حصص قرآن تفاعلية",
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
        "Quran memorization",
        "online Quran academy",
        "kids Islamic manners",
        "interactive Quran classes",
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
    },
    en: {
      title: "Aya Academy — Fun & Safe Quran and Manners Learning for Kids",
      titleAbsolute: true,
      description:
        "A joyful, safe journey for kids to learn the Quran and beautiful manners through interactive sessions and educational games. Book a free trial session today.",
    },
  },

  login: {
    ar: {
      title: "تسجيل الدخول",
      description: "سجّل الدخول إلى حسابك في أكاديمية آية لمتابعة تقدّم طفلك وحصصه.",
    },
    en: {
      title: "Login",
      description: "Sign in to your Aya Academy account to follow your child's progress and sessions.",
    },
  },

  register: {
    ar: {
      title: "إنشاء حساب",
      description: "أنشئ حسابًا في أكاديمية آية وابدأ رحلة طفلك مع القرآن بحصة تجريبية مجانية.",
    },
    en: {
      title: "Create an account",
      description: "Create an Aya Academy account and start your child's Quran journey with a free trial.",
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
    },
    en: {
      title: "Try a free game",
      description:
        "Play a free interactive manners game from Aya Academy, and sign up for a free trial session for your child.",
    },
  },
};

export function getSeo(page, lng) {
  const entry = seoContent[page] || seoContent.site;
  return entry[lng] || entry.ar;
}
