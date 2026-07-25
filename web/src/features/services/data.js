// Service catalogue shared by the homepage program cards and the SEO landing
// pages. Every statement here already appears in the public marketing copy or
// FAQ; keeping it together prevents the service pages from drifting into claims
// we cannot support.

export const services = [
  {
    slug: 'quran-memorization',
    key: 'memorization',
    ar: {
      title: 'تحفيظ القرآن أونلاين',
      description: 'حفظ متقَن بالتكرار والمراجعة على يد معلّمين مؤهّلين.',
      focus: 'التكرار والمراجعة لبناء حفظ متقَن.',
      keywords: ['تحفيظ القرآن أونلاين', 'حفظ القرآن للكبار والأطفال', 'مراجعة القرآن'],
    },
    en: {
      title: 'Online Quran Memorization',
      description: 'Solid memorization through repetition and review with qualified teachers.',
      focus: 'Repetition and review for solid memorization.',
      keywords: ['online Quran memorization', 'memorize Quran online', 'Quran review'],
    },
  },
  {
    slug: 'tajweed-courses',
    key: 'tajweed',
    ar: {
      title: 'دورات التجويد أونلاين',
      description: 'أحكام التلاوة الصحيحة من المخارج والصفات حتى إتقان الأداء.',
      focus: 'المخارج والصفات وأحكام التلاوة الصحيحة.',
      keywords: ['دورات التجويد أونلاين', 'تعلم التجويد', 'أحكام التلاوة'],
    },
    en: {
      title: 'Online Tajweed Courses',
      description: 'Correct recitation rules — from articulation points to polished delivery.',
      focus: 'Articulation points, letter qualities and correct recitation rules.',
      keywords: ['online Tajweed course', 'learn Tajweed online', 'Quran recitation rules'],
    },
  },
  {
    slug: 'arabic-reading',
    key: 'reading',
    ar: {
      title: 'تعليم العربية للقراءة أونلاين',
      description: 'من الحروف إلى قراءة النصوص بطلاقة وثقة.',
      focus: 'الحروف ثم قراءة النصوص بطلاقة وثقة.',
      keywords: ['تعليم العربية للقراءة أونلاين', 'تعلم القراءة بالعربية', 'تعليم الحروف العربية'],
    },
    en: {
      title: 'Online Arabic Reading Classes',
      description: 'From letters to reading texts fluently and confidently.',
      focus: 'Letters followed by fluent, confident text reading.',
      keywords: ['learn Arabic reading online', 'Arabic reading classes', 'Arabic letters for beginners'],
    },
  },
  {
    slug: 'arabic-speaking',
    key: 'speaking',
    ar: {
      title: 'تعليم العربية للمحادثة أونلاين',
      description: 'مهارات التحدث والاستماع للتواصل بالعربية في الحياة اليومية.',
      focus: 'التحدث والاستماع والتواصل بالعربية في الحياة اليومية.',
      keywords: ['تعليم العربية للمحادثة أونلاين', 'تعلم التحدث بالعربية', 'دروس محادثة عربية'],
    },
    en: {
      title: 'Online Arabic Speaking Classes',
      description: 'Speaking and listening skills to communicate in Arabic in everyday life.',
      focus: 'Speaking, listening and everyday Arabic communication.',
      keywords: ['learn Arabic speaking online', 'Arabic conversation classes', 'Arabic listening skills'],
    },
  },
  {
    slug: 'quranic-arabic',
    key: 'quranicArabic',
    ar: {
      title: 'تعليم عربية القرآن أونلاين',
      description: 'فهم مفردات وتراكيب القرآن للوصول إلى معانيه مباشرة.',
      focus: 'مفردات القرآن وتراكيبه للوصول إلى معانيه.',
      keywords: ['تعلم عربية القرآن أونلاين', 'فهم مفردات القرآن', 'اللغة العربية للقرآن'],
    },
    en: {
      title: 'Online Quranic Arabic Classes',
      description: 'Understand Qur’anic vocabulary and structures to reach the meanings directly.',
      focus: 'Qur’anic vocabulary and structures for direct understanding.',
      keywords: ['learn Quranic Arabic online', 'Quran vocabulary', 'Arabic for Quran'],
    },
  },
  {
    slug: 'islamic-studies',
    key: 'islamicStudies',
    ar: {
      title: 'الدراسات الإسلامية أونلاين',
      description: 'العقيدة والعبادات والأخلاق والسيرة بأسلوب مبسَّط ومحبَّب.',
      focus: 'العقيدة والعبادات والأخلاق والسيرة.',
      keywords: ['دراسات إسلامية أونلاين', 'تعليم العلوم الشرعية', 'تعلم السيرة والأخلاق'],
    },
    en: {
      title: 'Online Islamic Studies',
      description: 'Creed, worship, manners and prophetic biography in a simple, engaging way.',
      focus: 'Creed, worship, manners and prophetic biography.',
      keywords: ['Islamic studies online', 'learn Islamic studies', 'online Islamic education'],
    },
  },
];

export function getService(slug) {
  return services.find((service) => service.slug === slug);
}

export function serviceText(service, lng) {
  return service?.[lng === 'en' ? 'en' : 'ar'];
}

export const servicePageText = {
  ar: {
    indexTitle: 'برامج تعلّم القرآن والعربية والدراسات الإسلامية أونلاين',
    indexDescription: 'استكشف برامج أكاديمية آية للصغار والكبار، مع خطة تناسب مستوى الطالب وحصص مباشرة ودروس موجّهة.',
    indexEyebrow: 'برامج أكاديمية آية',
    indexCta: 'اعرف تفاصيل البرنامج',
    audienceTitle: 'لمن يناسب هذا البرنامج؟',
    audience: 'برامج لكل الأعمار — للصغار والكبار — بخطة تناسب مستوى الطالب.',
    formatTitle: 'كيف نتعلّم؟',
    format: 'جلسات مباشرة مع معلّم، بالإضافة إلى دروس قصيرة موجّهة يمكن للطالب متابعتها في أي وقت.',
    durationTitle: 'مدة الحصة',
    duration: 'كل حصة مدتها ساعة واحدة.',
    focusTitle: 'ماذا ستدرس؟',
    trialTitle: 'جرّب قبل الاشتراك',
    trial: 'الحصة التجريبية مجانية تمامًا، بدون بطاقة دفع وبدون أي التزام.',
    trialCta: 'احجز حصة مجانية',
    backToServices: 'كل البرامج',
  },
  en: {
    indexTitle: 'Online Quran, Arabic & Islamic Studies Programs',
    indexDescription: 'Explore Aya Academy programs for children and adults, with a plan that fits the student’s level, live sessions and guided lessons.',
    indexEyebrow: 'Aya Academy programs',
    indexCta: 'Explore the program',
    audienceTitle: 'Who is this program for?',
    audience: 'Programs for all ages — from young learners to adults — on a plan that fits the student’s level.',
    formatTitle: 'How do we learn?',
    format: 'Live sessions with a teacher, plus short guided lessons the student can follow anytime.',
    durationTitle: 'Session length',
    duration: 'Each session is one hour long.',
    focusTitle: 'What will you study?',
    trialTitle: 'Try before subscribing',
    trial: 'The trial session is completely free, with no card and no commitment.',
    trialCta: 'Book a free session',
    backToServices: 'All programs',
  },
};

export function getServicePageText(lng) {
  return servicePageText[lng === 'en' ? 'en' : 'ar'];
}
