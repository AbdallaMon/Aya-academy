// Service catalogue shared by the homepage program cards and the SEO landing
// pages. Every statement here already appears in the public marketing copy or
// FAQ; keeping it together prevents the service pages from drifting into claims
// we cannot support.

export const services = [
  {
    slug: 'quran-memorization',
    key: 'memorization',
    dateModified: '2026-07-25',
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
    slug: 'quran-classes-for-kids',
    key: 'kidsQuran',
    dateModified: '2026-07-25',
    ar: {
      title: 'دروس القرآن أونلاين للأطفال',
      description: 'حصص قرآن مباشرة للأطفال من ٥ سنوات فأكثر، تجمع بين القراءة الواضحة والحفظ والمعاني المبسطة مع معلّم مخصّص.',
      focus: 'القراءة والتلاوة، والحفظ والمراجعة، وأساسيات التجويد والمعاني المبسطة.',
      audience: 'للأطفال من ٥ سنوات فأكثر، من المبتدئ تمامًا إلى الطالب الذي يريد تقوية تلاوته وحفظه.',
      format: 'جلسات مباشرة مع معلّم مخصّص، تدعمها دروس قصيرة موجّهة وتدريب يناسب عمر الطالب.',
      duration: 'مدة كل جلسة مباشرة ساعة واحدة.',
      keywords: ['دروس قرآن للأطفال أونلاين', 'تحفيظ القرآن للأطفال', 'معلم قرآن للأطفال أونلاين'],
      sections: [
        {
          title: 'بداية تناسب عمر الطفل ومستواه',
          body: 'نبدأ من مستوى الطفل الحالي؛ سواء كان يتعرّف إلى الحروف والأصوات أو يقرأ سورًا قصيرة ويريد تلاوة أقوى. المستويات مرتبة حسب العمر والخبرة حتى يتقدّم كل طالب بإيقاع مناسب.',
        },
        {
          title: 'تعلّم لطيف يحافظ على اهتمامه',
          body: 'تجمع الحصة بين الشرح الواضح والتكرار الهادئ والتدريب المناسب للطفل. وتدعم لوحة الطالب الرحلة بالنقاط والأوسمة ولوحة الصدارة لتجعل التقدّم واضحًا ومحفّزًا.',
        },
        {
          title: 'متابعة واضحة لولي الأمر',
          body: 'تعرض لوحة ولي الأمر النقاط والمستوى والترتيب والأوسمة والساعات المتبقية، حتى يرى الأهل تقدّم الطفل ويتابعوا رحلته من مكان واحد.',
        },
        {
          title: 'ما يمكن أن تغطيه الحصة',
          body: 'بحسب مستوى الطفل وخطته، يمكن أن تشمل الحصة القراءة والتلاوة، والحفظ والمراجعة، وأساسيات التجويد، ومعاني مبسطة، وآدابًا وأخلاقًا إسلامية.',
        },
      ],
      faqs: [
        {
          q: 'هل يجب أن يعرف طفلي قراءة العربية قبل البدء؟',
          a: 'لا. يبدأ الطفل من المستوى المناسب له، بما في ذلك الحروف والأصوات للمبتدئين.',
        },
        {
          q: 'هل الدروس مباشرة مع معلّم؟',
          a: 'نعم، توجد جلسات مباشرة مع معلّم مخصّص، بالإضافة إلى دروس قصيرة موجّهة يمكن متابعتها في أي وقت.',
        },
        {
          q: 'كيف أتابع تقدّم طفلي؟',
          a: 'من خلال لوحة ولي الأمر التي تعرض النقاط والمستوى والترتيب والأوسمة والساعات المتبقية.',
        },
      ],
    },
    en: {
      title: 'Online Quran Classes for Kids',
      description: 'Live Quran classes for children aged 5 and up, combining clear reading, memorization and simple meanings with a dedicated teacher.',
      focus: 'Quran reading and recitation, memorization and review, Tajweed foundations and simple meanings.',
      audience: 'Children aged 5 and up, from complete beginners to students building stronger recitation and memorization.',
      format: 'Live sessions with a dedicated teacher, supported by short guided lessons and age-appropriate practice.',
      duration: 'Each live session is one hour.',
      keywords: ['online Quran classes for kids', 'Quran memorization for children', 'Quran teacher for kids online'],
      sections: [
        {
          title: 'A starting point that fits your child',
          body: 'Your child starts at the level that matches their age and experience, whether they are learning letters and sounds or already reading short Surahs and want stronger recitation and memorization.',
        },
        {
          title: 'Gentle learning that keeps them involved',
          body: 'Lessons use clear explanations, calm repetition and age-appropriate practice. Points, badges and the leaderboard make progress visible and give students an encouraging reason to keep going.',
        },
        {
          title: 'Clear visibility for parents',
          body: 'The bilingual parent dashboard shows points, level, rank, badges and remaining subscription hours, giving families one place to follow the student’s journey.',
        },
        {
          title: 'What a lesson can cover',
          body: 'Depending on the student’s level and plan, a lesson can include Quran reading and recitation, memorization and review, Tajweed foundations, simple meanings, and Islamic manners.',
        },
      ],
      faqs: [
        {
          q: 'Does my child need to read Arabic before starting?',
          a: 'No. Complete beginners can start with letters and basic sounds at the level that suits them.',
        },
        {
          q: 'Are the classes live with a teacher?',
          a: 'Yes. Students have live sessions with a dedicated teacher, plus short guided lessons they can follow anytime.',
        },
        {
          q: 'How can I follow my child’s progress?',
          a: 'The parent dashboard shows points, level, rank, badges and remaining subscription hours.',
        },
      ],
    },
  },
  {
    slug: 'quran-classes-for-adults',
    key: 'adultQuran',
    dateModified: '2026-07-25',
    ar: {
      title: 'دروس القرآن أونلاين للكبار',
      description: 'حصص قرآن مباشرة للكبار الراغبين في تحسين التلاوة أو بدء الحفظ والمراجعة أو تعلّم التجويد من المستوى المناسب لهم.',
      focus: 'تصحيح القراءة والتلاوة، والحفظ والمراجعة، وأحكام التجويد بحسب هدف الطالب.',
      audience: 'للكبار في كل المستويات؛ من المبتدئ الذي يبدأ من الأساس إلى من يريد تقوية التلاوة أو تثبيت الحفظ.',
      format: 'جلسات مباشرة مع معلّم، بالإضافة إلى دروس قصيرة موجّهة يمكن للطالب الرجوع إليها في أي وقت.',
      duration: 'مدة كل جلسة مباشرة ساعة واحدة.',
      keywords: ['دروس قرآن للكبار أونلاين', 'تحفيظ القرآن للكبار', 'تعلم قراءة القرآن للكبار'],
      sections: [
        {
          title: 'ابدأ من مستواك الحقيقي',
          body: 'لا تحتاج إلى خلفية سابقة أو مستوى محدد. تبدأ الخطة من القراءة الأساسية أو تصحيح التلاوة أو الحفظ والمراجعة وفق هدفك ومستواك الحالي.',
        },
        {
          title: 'خطة واضحة لهدفك',
          body: 'يختلف مسار الطالب الذي يريد تحسين القراءة عن مسار الحفظ أو التجويد. لذلك يركّز الدرس على الهدف الذي تبدأ به، مع تكرار ومراجعة تساعدانك على التقدّم بثبات.',
        },
        {
          title: 'تعلّم مباشر مع تصحيح مستمر',
          body: 'تمنحك الجلسة المباشرة فرصة القراءة أمام المعلّم، ومراجعة ما تعلّمته، والحصول على توجيه واضح في التلاوة والتجويد بدل الاعتماد على التعلّم الفردي وحده.',
        },
        {
          title: 'جرّب قبل الاشتراك',
          body: 'يمكنك البدء بحصة تجريبية مجانية، بدون بطاقة دفع وبدون اشتراك تلقائي. بعد التجربة تختار بنفسك إن كنت تريد الاستمرار.',
        },
      ],
      faqs: [
        {
          q: 'هل يمكنني البدء إذا كنت ضعيفًا في قراءة العربية؟',
          a: 'نعم. يمكن أن تبدأ من الحروف وأساسيات القراءة أو من مستوى التلاوة الحالي.',
        },
        {
          q: 'هل أستطيع التركيز على التلاوة فقط دون الحفظ؟',
          a: 'نعم. تُبنى الخطة بحسب هدفك، سواء كان القراءة والتلاوة أو الحفظ والمراجعة أو التجويد.',
        },
        {
          q: 'هل الحصة التجريبية تحتاج بطاقة دفع؟',
          a: 'لا. الحصة التجريبية مجانية ولا يتم تحصيل أي رسوم تلقائيًا بعدها.',
        },
      ],
    },
    en: {
      title: 'Online Quran Classes for Adults',
      description: 'Live Quran classes for adults who want to improve recitation, begin memorization and review, or study Tajweed from the right level.',
      focus: 'Quran reading and recitation, memorization and review, and Tajweed based on the student’s goal.',
      audience: 'Adults at every level, from complete beginners to students improving recitation or strengthening memorization.',
      format: 'Live sessions with a teacher, plus short guided lessons the student can revisit anytime.',
      duration: 'Each live session is one hour.',
      keywords: ['online Quran classes for adults', 'Quran memorization for adults', 'learn to read Quran online adults'],
      sections: [
        {
          title: 'Start from your real level',
          body: 'You do not need previous study or a particular starting level. Your plan can begin with reading foundations, recitation correction, memorization or review according to your current ability.',
        },
        {
          title: 'A clear plan for your goal',
          body: 'A student improving Quran reading needs a different focus from someone working on memorization or Tajweed. Lessons center on the goal you begin with, supported by steady repetition and review.',
        },
        {
          title: 'Live learning with direct correction',
          body: 'A live session lets you read to a teacher, review what you studied and receive clear guidance on recitation and Tajweed instead of relying on self-study alone.',
        },
        {
          title: 'Try the class before subscribing',
          body: 'Start with a free trial session, with no card and no automatic subscription. After the trial, you decide whether you want to continue.',
        },
      ],
      faqs: [
        {
          q: 'Can I start if my Arabic reading is weak?',
          a: 'Yes. You can begin with letters and reading foundations or from your current recitation level.',
        },
        {
          q: 'Can I focus on recitation without memorization?',
          a: 'Yes. Your plan can focus on reading and recitation, memorization and review, or Tajweed according to your goal.',
        },
        {
          q: 'Does the free trial require a payment card?',
          a: 'No. The trial is free and you are not charged automatically afterward.',
        },
      ],
    },
  },
  {
    slug: 'tajweed-courses',
    key: 'tajweed',
    dateModified: '2026-07-25',
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
    dateModified: '2026-07-25',
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
    dateModified: '2026-07-25',
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
    dateModified: '2026-07-25',
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
    dateModified: '2026-07-25',
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
    detailsEyebrow: 'تفاصيل البرنامج',
    detailsTitle: 'كيف تساعدك هذه الرحلة على التقدّم؟',
    faqTitle: 'أسئلة شائعة عن البرنامج',
    trialTitle: 'جرّب قبل الاشتراك',
    trial: 'الحصة التجريبية مجانية تمامًا، بدون بطاقة دفع وبدون أي التزام.',
    trialCta: 'احجز حصة مجانية',
    backToServices: 'كل البرامج',
  },
  en: {
    indexTitle: 'Online Quran, Arabic & Islamic Studies Programs',
    indexDescription: 'Explore Ayah Academy programs for children and adults, with a plan that fits the student’s level, live sessions and guided lessons.',
    indexEyebrow: 'Ayah Academy programs',
    indexCta: 'Explore the program',
    audienceTitle: 'Who is this program for?',
    audience: 'Programs for all ages — from young learners to adults — on a plan that fits the student’s level.',
    formatTitle: 'How do we learn?',
    format: 'Live sessions with a teacher, plus short guided lessons the student can follow anytime.',
    durationTitle: 'Session length',
    duration: 'Each session is one hour long.',
    focusTitle: 'What will you study?',
    detailsEyebrow: 'Program details',
    detailsTitle: 'How this learning journey supports progress',
    faqTitle: 'Questions about this program',
    trialTitle: 'Try before subscribing',
    trial: 'The trial session is completely free, with no card and no commitment.',
    trialCta: 'Book a free session',
    backToServices: 'All programs',
  },
};

export function getServicePageText(lng) {
  return servicePageText[lng === 'en' ? 'en' : 'ar'];
}
