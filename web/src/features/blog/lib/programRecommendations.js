// Maps editorial topics to the most relevant academy landing pages. The result
// is deterministic and deduplicated so every article can expose useful,
// contextual internal links without hand-maintaining URLs inside article copy.

const CATEGORY_PROGRAM_SLUGS = {
  adults: ["quran-classes-for-adults", "quran-memorization"],
  memorization: ["quran-memorization", "tajweed-courses"],
  parenting: ["quran-classes-for-kids", "islamic-studies"],
  virtue: ["quran-memorization", "quran-classes-for-adults"],
  manners: ["islamic-studies", "quran-classes-for-kids"],
  dua: ["islamic-studies", "quran-classes-for-kids"],
  tips: ["quran-classes-for-kids", "quran-classes-for-adults"],
};

export const PROGRAM_RECOMMENDATIONS_COPY = {
  ar: {
    eyebrow: "واصل التعلّم",
    title: "برامج مرتبطة بموضوع المقال",
    description: "اختر البرنامج الأقرب لهدفك وابدأ بحصة تجريبية مجانية.",
    linkLabel: "اعرف تفاصيل البرنامج",
  },
  en: {
    eyebrow: "Continue learning",
    title: "Programs related to this article",
    description: "Choose the program that matches your goal and start with a free trial session.",
    linkLabel: "Explore the program",
  },
};

export function getRecommendedProgramSlugs(categories = [], limit = 2) {
  const slugs = [];
  for (const category of categories) {
    for (const slug of CATEGORY_PROGRAM_SLUGS[category] || []) {
      if (!slugs.includes(slug)) slugs.push(slug);
      if (slugs.length === limit) return slugs;
    }
  }
  return slugs;
}

export function getProgramRecommendationsCopy(lng) {
  return PROGRAM_RECOMMENDATIONS_COPY[lng === "en" ? "en" : "ar"];
}
