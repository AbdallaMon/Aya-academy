// ──────────────────────────────────────────────────────────────────────────
// Testimonials data — EDIT THIS FILE to add real parent reviews.
//
// To add a testimonial, copy one object in `testimonials` and fill it in:
//   id      : any unique string
//   name    : { ar, en }  → the parent's display name in each language
//   role    : { ar, en }  → relation/role, e.g. "والدة طفلين" / "Mother of two"
//   country : an emoji flag (e.g. '🇬🇧') — leave '' to hide
//   rating  : 1–5 (number of filled stars)
//   quote   : { ar, en }  → the review text in each language
//   avatar  : OPTIONAL image path under /public (e.g. '/avatars/sara.png').
//             If omitted, the first letter of the name is shown in a circle.
// ──────────────────────────────────────────────────────────────────────────

export const testimonialsHeading = {
  ar: {
    eyebrow: 'آراء أولياء الأمور',
    title: 'ماذا يقول الأهل عن أكاديمية آية؟',
    subtitle: 'قصص حقيقية من أسر بدأت رحلة أبنائها مع القرآن والأخلاق معنا.',
  },
  en: {
    eyebrow: 'Parent reviews',
    title: 'What parents say about Aya Academy',
    subtitle: 'Real stories from families who started their kids’ Quran journey with us.',
  },
};

export const testimonials = [
  {
    id: 'sara-uk',
    name: { ar: 'سارة أحمد', en: 'Sara Ahmed' },
    role: { ar: 'والدة طفلين', en: 'Mother of two' },
    country: '🇬🇧',
    rating: 5,
    quote: {
      ar: 'ابني بقى يستنى حصة القرآن بفارغ الصبر! الألعاب خلّته يحب التلاوة ويحفظ بسهولة، والمعلمة صبورة جدًا.',
      en: 'My son now waits for his Quran lesson with excitement! The games made him love recitation, and his teacher is so patient.',
    },
  },
  {
    id: 'mohamed-us',
    name: { ar: 'محمد خالد', en: 'Mohamed Khaled' },
    role: { ar: 'والد طفلة', en: 'Father of one' },
    country: '🇺🇸',
    rating: 5,
    quote: {
      ar: 'الشرح بالعربي والإنجليزي ساعد بنتي تفهم المعاني مش بس تحفظ. متابعة ولي الأمر ممتازة وبتطمّني.',
      en: 'Explaining in both Arabic and English helped my daughter understand the meanings, not just memorize. The parent tracking is excellent.',
    },
  },
  {
    id: 'amina-ca',
    name: { ar: 'أمينة يوسف', en: 'Amina Youssef' },
    role: { ar: 'أم لثلاثة أطفال', en: 'Mother of three' },
    country: '🇨🇦',
    rating: 5,
    quote: {
      ar: 'جرّبنا الحصة المجانية وقررنا نكمل في نفس اليوم. منصة آمنة وممتعة، والأطفال بيجمعوا النجوم والأوسمة بحماس.',
      en: 'We tried the free session and signed up the same day. A safe, fun platform — the kids collect stars and badges with real enthusiasm.',
    },
  },
  {
    id: 'fatima-ae',
    name: { ar: 'فاطمة العلي', en: 'Fatima Al-Ali' },
    role: { ar: 'والدة طفل', en: 'Mother of one' },
    country: '🇦🇪',
    rating: 5,
    quote: {
      ar: 'المستويات مناسبة لعمر ابني تمامًا، بيتعلّم خطوة بخطوة من غير ضغط. لاحظت تحسّن في أخلاقه فعلاً.',
      en: 'The levels fit my son’s age perfectly — he learns step by step without pressure. I’ve genuinely seen his manners improve.',
    },
  },
  {
    id: 'omar-au',
    name: { ar: 'عمر حسن', en: 'Omar Hassan' },
    role: { ar: 'والد طفلين', en: 'Father of two' },
    country: '🇦🇺',
    rating: 5,
    quote: {
      ar: 'أفضل قرار اشتركنا فيه. الحصص مرنة في المواعيد والمعلمون محترفون مع الأطفال.',
      en: 'Best decision we made. Flexible lesson times and teachers who are wonderful with kids.',
    },
  },
  {
    id: 'layla-uk',
    name: { ar: 'ليلى منصور', en: 'Layla Mansour' },
    role: { ar: 'أم لطفلة', en: 'Mother of one' },
    country: '🇬🇧',
    rating: 5,
    quote: {
      ar: 'بنتي كانت خجولة، دلوقتي بتقرأ بثقة وبتفتخر بأوسمتها. شكرًا أكاديمية آية ❤️',
      en: 'My daughter was shy; now she reads with confidence and is proud of her badges. Thank you, Aya Academy ❤️',
    },
  },
];
