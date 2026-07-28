// Bilingual UI strings for the blog (kept with the feature, like the other
// marketing features' inline CONTENT objects). Read via pickBlogUi(lng).

export const blogUi = {
  ar: {
    eyebrow: 'مدوّنة آية',
    title: 'مقالات تُنير رحلة طفلك مع القرآن',
    subtitle: 'دليل عملي للأهل في الحفظ والمراجعة والأخلاق — مبنيٌّ على القرآن والسنّة الصحيحة، بكلماتٍ بسيطة وقلبٍ دافئ.',
    searchPlaceholder: 'ابحث في المقالات…',
    all: 'الكل',
    noResults: 'لا توجد مقالات مطابقة لبحثك.',
    noResultsHint: 'جرّب كلمة أخرى أو تصفّح كل المقالات.',
    related: 'مقالات ذات صلة',
    backToList: 'كل المقالات',
    share: 'شارك المقال',
    minRead: 'دقائق قراءة',
    sources: 'المصادر والمراجع',
    ctaTitle: 'ابدأ رحلة طفلك مع آية',
    ctaText: 'حصص قرآن وأخلاق ممتعة، ومتابعة هادئة للأهل. احجز حصة تجريبية مجانية الآن.',
    ctaButton: 'احجز حصة مجانية',
  },
  en: {
    eyebrow: 'Ayah Blog',
    title: 'Articles to Light Up Your Child’s Quran Journey',
    subtitle: 'A practical guide for parents on memorization, review and good character — grounded in the Quran and authentic Sunnah, in plain words and a warm heart.',
    searchPlaceholder: 'Search articles…',
    all: 'All',
    noResults: 'No articles match your search.',
    noResultsHint: 'Try another word or browse all articles.',
    related: 'Related articles',
    backToList: 'All articles',
    share: 'Share article',
    minRead: 'min read',
    sources: 'Sources & references',
    ctaTitle: 'Start your child’s journey with Ayah',
    ctaText: 'Fun Quran & manners sessions, with calm parent tracking. Book a free trial session now.',
    ctaButton: 'Book a free session',
  },
};

export function pickBlogUi(lng) {
  return blogUi[lng === 'en' ? 'en' : 'ar'];
}
