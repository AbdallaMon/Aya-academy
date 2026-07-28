// Service catalogue shared by the homepage program cards and the SEO landing
// pages. Every statement here already appears in the public marketing copy or
// FAQ; keeping it together prevents the service pages from drifting into claims
// we cannot support.

export const services = [
  {
    slug: 'quran-memorization',
    key: 'memorization',
    dateModified: '2026-07-28',
    ar: {
      title: 'تحفيظ القرآن أونلاين للأطفال والكبار',
      description: 'يساعد برنامج تحفيظ القرآن في أكاديمية آية الطالب على بناء حفظ ثابت بخطة تناسب مستواه، تجمع بين الحفظ الجديد والمراجعة وتصحيح التلاوة مع معلّم مؤهّل.',
      audience: 'للأطفال من ٥ سنوات فأكثر وللكبار، سواء كان الطالب يبدأ من السور القصيرة أو لديه محفوظ سابق يريد مراجعته وتثبيته.',
      focus: 'الحفظ الجديد، ومراجعة المحفوظ السابق، وتصحيح التلاوة أثناء الحفظ.',
      format: 'جلسات مباشرة مع معلّم، مع مقدار حفظ ومراجعة يناسب مستوى الطالب وتقدّمه.',
      duration: 'مدة كل جلسة مباشرة ساعة واحدة.',
      audienceItems: [
        'المبتدئ الذي يريد البدء من السور القصيرة.',
        'الطالب الذي لديه محفوظ سابق ويحتاج إلى مراجعته وتثبيته.',
        'الأطفال من ٥ سنوات فأكثر والكبار الذين يريدون خطة حفظ واضحة.',
      ],
      focusItems: [
        'حفظ مقدار جديد يناسب مستوى الطالب.',
        'الربط بين الحفظ الجديد والمحفوظ السابق بالمراجعة.',
        'تصحيح أخطاء التلاوة التي تظهر أثناء التسميع.',
        'بناء عادة مراجعة منتظمة للمحفوظ.',
      ],
      lessonSteps: [
        'مراجعة الجزء المتفق عليه من الحصة السابقة.',
        'تسميع الطالب وتصحيح أخطاء التلاوة.',
        'العمل على مقدار جديد يناسب مستواه.',
        'تحديد ما يراجعه الطالب قبل الحصة التالية.',
      ],
      keywords: ['تحفيظ القرآن أونلاين', 'حفظ القرآن للكبار والأطفال', 'مراجعة القرآن'],
      faqs: [
        {
          q: 'هل أستطيع البدء دون حفظ سابق؟',
          a: 'نعم. يمكن أن تبدأ من السور القصيرة أو من الموضع المناسب لمستواك الحالي.',
        },
        {
          q: 'هل برنامج التحفيظ مناسب للكبار؟',
          a: 'نعم. البرنامج متاح للأطفال من ٥ سنوات فأكثر وللكبار، وتبدأ الخطة من مستوى كل طالب.',
        },
        {
          q: 'كيف يتم تحديد مقدار الحفظ الجديد؟',
          a: 'يبدأ المعلّم من مستوى الطالب ومحفوظه الحالي، ثم يضبط مقدار الجديد والمراجعة بما يناسب تقدّمه.',
        },
        {
          q: 'هل يستطيع ولي الأمر متابعة الطالب؟',
          a: 'نعم. يمكن لولي الأمر متابعة الحصص والتقييمات والتقارير المتاحة من خلال حسابه.',
        },
      ],
    },
    en: {
      title: 'Online Quran Memorization for Kids & Adults',
      description: 'Ayah Academy helps students build steady Quran memorization through a level-based plan that combines new memorization, regular review and recitation correction with a qualified teacher.',
      audience: 'For children aged 5 and up and adults, whether the student is beginning with short Surahs or reviewing Quran they have already memorized.',
      focus: 'New memorization, review of previous portions and recitation correction during memorization.',
      format: 'Live sessions with a teacher, with new memorization and review adjusted to the student’s level and progress.',
      duration: 'Each live session is one hour.',
      audienceItems: [
        'Beginners who want to start with short Surahs.',
        'Students who have memorized portions of the Quran and need structured review.',
        'Children aged 5 and up and adults who want a clear memorization plan.',
      ],
      focusItems: [
        'Memorizing a new portion that suits the student’s level.',
        'Connecting new memorization with earlier portions through review.',
        'Correcting recitation mistakes that appear during listening.',
        'Building a consistent review routine.',
      ],
      lessonSteps: [
        'Review the portion agreed on in the previous session.',
        'Listen to the student and correct recitation mistakes.',
        'Work on a new portion that suits the student’s level.',
        'Set the review needed before the next session.',
      ],
      keywords: ['online Quran memorization', 'memorize Quran online', 'Quran review'],
      faqs: [
        {
          q: 'Can I start without previous memorization?',
          a: 'Yes. You can begin with short Surahs or from the point that matches your current level.',
        },
        {
          q: 'Is the memorization program suitable for adults?',
          a: 'Yes. It is available to children aged 5 and up and adults, with a plan that starts from each student’s level.',
        },
        {
          q: 'How is the new memorization amount chosen?',
          a: 'The teacher starts from the student’s current level and memorized portions, then adjusts new work and review as the student progresses.',
        },
        {
          q: 'Can a parent follow the student’s progress?',
          a: 'Yes. Parents can follow available sessions, ratings and progress reports through their account.',
        },
      ],
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
    dateModified: '2026-07-28',
    ar: {
      title: 'دورات التجويد أونلاين',
      description: 'تساعد دورة التجويد الطالب على فهم أحكام التلاوة وتطبيقها أثناء القراءة، مع تصحيح مباشر للمخارج والنطق على يد معلّم مؤهّل.',
      audience: 'لمن يريد تعلّم أساسيات التجويد أو تصحيح تلاوته الحالية، من الأطفال من ٥ سنوات فأكثر والكبار.',
      focus: 'مخارج الحروف وصفاتها، وأحكام التلاوة، والتطبيق العملي أثناء قراءة القرآن.',
      format: 'جلسات مباشرة يقرأ فيها الطالب أمام المعلّم، ثم يتعلّم القاعدة المناسبة لمستواه ويطبّقها.',
      duration: 'مدة كل جلسة مباشرة ساعة واحدة.',
      audienceItems: [
        'الطالب الذي يقرأ القرآن ويريد تصحيح أخطائه المتكررة.',
        'المبتدئ في أحكام التجويد الذي يريد تعلّمها بالتدرّج.',
        'الحافظ الذي يريد تحسين نطقه أثناء التسميع والمراجعة.',
      ],
      focusItems: [
        'نطق الحروف من مخارجها بصورة أوضح.',
        'التعرّف إلى صفات الحروف والفروق بينها.',
        'فهم أحكام التجويد المناسبة لمستوى الطالب.',
        'تطبيق القواعد في آيات يقرأها الطالب بنفسه.',
      ],
      lessonSteps: [
        'يقرأ الطالب جزءًا قصيرًا ليظهر مستواه والأخطاء التي تحتاج إلى عمل.',
        'يشرح المعلّم قاعدة أو مهارة مرتبطة بالتلاوة الحالية.',
        'يطبّق الطالب القاعدة مع تصحيح مباشر.',
        'يتدرّب على أمثلة يراجعها قبل الحصة التالية.',
      ],
      keywords: ['دورات التجويد أونلاين', 'تعلم التجويد', 'أحكام التلاوة'],
      faqs: [
        {
          q: 'هل أحتاج إلى دراسة التجويد قبل البدء؟',
          a: 'لا. يبدأ الشرح من القاعدة المناسبة لمستواك الحالي في القراءة.',
        },
        {
          q: 'هل الدورة نظرية أم عملية؟',
          a: 'تشمل شرح القاعدة ثم تطبيقها في التلاوة مع تصحيح المعلّم.',
        },
        {
          q: 'هل دورات التجويد مناسبة للأطفال والكبار؟',
          a: 'نعم. البرامج متاحة للطلاب من ٥ سنوات فأكثر وللكبار، ويختلف مستوى الشرح والتطبيق بحسب الطالب.',
        },
      ],
    },
    en: {
      title: 'Online Tajweed Courses',
      description: 'Online Tajweed classes help students understand recitation rules and apply them while reading, with direct correction of pronunciation and articulation from a qualified teacher.',
      audience: 'For children aged 5 and up and adults who want to learn Tajweed foundations or correct their current recitation.',
      focus: 'Letter articulation and qualities, recitation rules and practical application while reading Quran.',
      format: 'Live sessions where the student reads to a teacher, learns the rule that fits their level and applies it in recitation.',
      duration: 'Each live session is one hour.',
      audienceItems: [
        'Students who read Quran and want to correct repeated recitation mistakes.',
        'Tajweed beginners who want to learn the rules gradually.',
        'Memorization students who want clearer pronunciation during review.',
      ],
      focusItems: [
        'Pronouncing letters more clearly from their articulation points.',
        'Recognizing letter qualities and differences between similar sounds.',
        'Understanding Tajweed rules appropriate to the student’s level.',
        'Applying the rules in verses the student reads aloud.',
      ],
      lessonSteps: [
        'The student reads a short passage so the teacher can identify the current level.',
        'The teacher explains a rule or skill connected to that reading.',
        'The student applies it with direct correction.',
        'The teacher gives examples to review before the next session.',
      ],
      keywords: ['online Tajweed course', 'learn Tajweed online', 'Quran recitation rules'],
      faqs: [
        {
          q: 'Do I need previous Tajweed study?',
          a: 'No. Lessons begin with the rule that matches your current reading level.',
        },
        {
          q: 'Are the classes theoretical or practical?',
          a: 'They combine a clear explanation of the rule with recitation practice and teacher correction.',
        },
        {
          q: 'Are Tajweed classes suitable for children and adults?',
          a: 'Yes. Programs are available to students aged 5 and up and adults, with explanation and practice adjusted to the student.',
        },
      ],
    },
  },
  {
    slug: 'arabic-reading',
    key: 'reading',
    dateModified: '2026-07-28',
    ar: {
      title: 'تعليم العربية للقراءة أونلاين',
      description: 'يبني برنامج القراءة بالعربية مهارة الطالب خطوة بخطوة، من معرفة الحروف وأصواتها إلى قراءة الكلمات والجمل المناسبة لمستواه.',
      audience: 'للمبتدئ الذي لا يعرف الحروف، ولمن يعرفها لكنه يحتاج إلى قراءة الكلمات والجمل بصورة أوضح.',
      focus: 'الحروف وأصواتها، والحركات، وربط الحروف، ثم قراءة كلمات وجمل متدرّجة.',
      format: 'جلسات مباشرة مع معلّم، تعتمد على الشرح القصير والقراءة بصوت مسموع والتصحيح أثناء التدريب.',
      duration: 'مدة كل جلسة مباشرة ساعة واحدة.',
      audienceItems: [
        'المبتدئ الذي يبدأ تعلّم الحروف العربية وأصواتها.',
        'الطالب الذي يعرف الحروف لكنه يجد صعوبة في تركيب الكلمات.',
        'من يقرأ ببطء ويريد تدريبًا منتظمًا على كلمات وجمل أوضح.',
      ],
      focusItems: [
        'تمييز الحروف وأصواتها في مواضع مختلفة.',
        'قراءة الحركات والمقاطع القصيرة.',
        'ربط الحروف لتكوين كلمات.',
        'الانتقال تدريجيًا إلى جمل ونصوص تناسب المستوى.',
      ],
      lessonSteps: [
        'مراجعة الحروف أو الكلمات التي تدرب عليها الطالب.',
        'شرح صوت أو تركيب قراءة جديد بأمثلة واضحة.',
        'قراءة الطالب للأمثلة مع تصحيح المعلّم.',
        'تحديد تدريب قصير يراجعه قبل الحصة التالية.',
      ],
      keywords: ['تعليم العربية للقراءة أونلاين', 'تعلم القراءة بالعربية', 'تعليم الحروف العربية'],
      faqs: [
        {
          q: 'هل يمكنني البدء دون معرفة الحروف العربية؟',
          a: 'نعم. يمكن أن يبدأ الطالب من الحروف وأصواتها إذا كان مبتدئًا تمامًا.',
        },
        {
          q: 'هل يناسب البرنامج من يعرف الحروف لكنه يقرأ ببطء؟',
          a: 'نعم. يبدأ المعلّم من مستوى الطالب ويتدرّج معه من الكلمات إلى الجمل والنصوص المناسبة.',
        },
        {
          q: 'هل البرنامج مناسب للأطفال والكبار؟',
          a: 'نعم. البرامج متاحة للطلاب من ٥ سنوات فأكثر وللكبار، مع تدريب يناسب مستوى كل طالب.',
        },
      ],
    },
    en: {
      title: 'Online Arabic Reading Classes',
      description: 'Online Arabic reading classes build the student’s skills step by step, from recognizing letters and sounds to reading words and sentences at the right level.',
      audience: 'For complete beginners and students who know the Arabic letters but need clearer, more consistent reading practice.',
      focus: 'Letters and sounds, short vowels, joining letters, then graded words and sentences.',
      format: 'Live sessions with a teacher using short explanations, reading aloud and direct correction during practice.',
      duration: 'Each live session is one hour.',
      audienceItems: [
        'Complete beginners learning Arabic letters and sounds.',
        'Students who know the letters but find it difficult to form words.',
        'Slow readers who want regular practice with clearer words and sentences.',
      ],
      focusItems: [
        'Recognizing letters and their sounds in different positions.',
        'Reading short vowels and simple sound combinations.',
        'Joining letters to form words.',
        'Moving gradually to sentences and texts that suit the student’s level.',
      ],
      lessonSteps: [
        'Review letters or words practiced in the previous session.',
        'Explain a new sound or reading pattern with clear examples.',
        'Have the student read the examples with teacher correction.',
        'Set a short reading practice for the next session.',
      ],
      keywords: ['learn Arabic reading online', 'Arabic reading classes', 'Arabic letters for beginners'],
      faqs: [
        {
          q: 'Can I start without knowing the Arabic letters?',
          a: 'Yes. Complete beginners can start with letters and their sounds.',
        },
        {
          q: 'Is this suitable if I know the letters but read slowly?',
          a: 'Yes. The teacher starts from your current level and moves gradually from words to suitable sentences and texts.',
        },
        {
          q: 'Are Arabic reading classes for children and adults?',
          a: 'Yes. Programs are available to students aged 5 and up and adults, with practice adjusted to each student’s level.',
        },
      ],
    },
  },
  {
    slug: 'arabic-speaking',
    key: 'speaking',
    dateModified: '2026-07-28',
    ar: {
      title: 'تعليم العربية للمحادثة أونلاين',
      description: 'يدرّب برنامج المحادثة الطالب على استخدام العربية في مواقف يومية بسيطة من خلال الاستماع، وبناء الجمل، والحوار المباشر مع المعلّم.',
      audience: 'لمن يعرف بعض الكلمات ويريد استخدامها في جمل، وللمبتدئ الذي يحتاج إلى بداية منظّمة في الاستماع والتحدث.',
      focus: 'مفردات يومية، وبناء جمل قصيرة، وفهم الأسئلة، والتدرب على الحوار.',
      format: 'جلسات مباشرة تتضمن نماذج حوار قصيرة، وتدريبًا على الاستماع والإجابة، وتصحيحًا يساعد الطالب على التعبير بوضوح.',
      duration: 'مدة كل جلسة مباشرة ساعة واحدة.',
      audienceItems: [
        'المبتدئ الذي يريد تعلّم عبارات عربية أساسية.',
        'الطالب الذي يعرف كلمات متفرقة لكنه يتردد في تكوين جملة.',
        'من يريد تدريبًا مباشرًا على الاستماع والإجابة في مواقف يومية.',
      ],
      focusItems: [
        'مفردات وعبارات مرتبطة بمواقف الحياة اليومية.',
        'تكوين جمل قصيرة ومفهومة.',
        'فهم أسئلة بسيطة والرد عليها.',
        'التدرّب على حوار موجّه مع تصحيح النطق والتعبير.',
      ],
      lessonSteps: [
        'مراجعة العبارات التي تدرب عليها الطالب سابقًا.',
        'تقديم مفردات أو تركيب قصير مرتبط بموضوع الحصة.',
        'استخدام الكلمات في أسئلة وأجوبة وحوار موجّه.',
        'تكرار العبارات التي تحتاج إلى مزيد من تدريب قبل الحصة التالية.',
      ],
      keywords: ['تعليم العربية للمحادثة أونلاين', 'تعلم التحدث بالعربية', 'دروس محادثة عربية'],
      faqs: [
        {
          q: 'هل يمكنني البدء إذا كنت لا أتحدث العربية؟',
          a: 'نعم. يبدأ المبتدئ بعبارات وأسئلة قصيرة، ثم يزيد مستوى الحوار بالتدريج.',
        },
        {
          q: 'هل تركز الحصة على الاستماع أم التحدث؟',
          a: 'على الاثنين معًا؛ يستمع الطالب إلى السؤال أو النموذج ثم يستخدمه في الإجابة والحوار.',
        },
        {
          q: 'هل دروس المحادثة مناسبة للأطفال والكبار؟',
          a: 'نعم. البرامج متاحة من سن ٥ سنوات فأكثر وللكبار، ويختار المعلّم موضوعات وتدريبات تناسب مستوى الطالب.',
        },
      ],
    },
    en: {
      title: 'Online Arabic Speaking Classes',
      description: 'Online Arabic speaking classes help students use Arabic in simple everyday situations through listening, sentence building and guided conversation with a teacher.',
      audience: 'For beginners who need a structured start and students who know some words but want to use them in complete sentences.',
      focus: 'Everyday vocabulary, short sentences, understanding questions and guided conversation.',
      format: 'Live sessions with short dialogue models, listening and response practice, and correction that helps the student communicate more clearly.',
      duration: 'Each live session is one hour.',
      audienceItems: [
        'Beginners who want to learn essential Arabic phrases.',
        'Students who know separate words but hesitate when forming a sentence.',
        'Learners who want direct practice listening and responding in everyday situations.',
      ],
      focusItems: [
        'Vocabulary and phrases for everyday situations.',
        'Building short, understandable sentences.',
        'Understanding simple questions and answering them.',
        'Practicing guided dialogue with pronunciation and expression correction.',
      ],
      lessonSteps: [
        'Review phrases practiced in the previous session.',
        'Introduce vocabulary or a short sentence pattern for the lesson topic.',
        'Use the language in questions, answers and guided dialogue.',
        'Repeat the phrases that need more practice before the next session.',
      ],
      keywords: ['learn Arabic speaking online', 'Arabic conversation classes', 'Arabic listening skills'],
      faqs: [
        {
          q: 'Can I start if I do not speak Arabic?',
          a: 'Yes. Beginners start with short phrases and questions, then build up the conversation gradually.',
        },
        {
          q: 'Does the class focus on listening or speaking?',
          a: 'Both. The student listens to a question or model, then uses it in answers and dialogue.',
        },
        {
          q: 'Are speaking classes suitable for children and adults?',
          a: 'Yes. Programs are available from age 5 and up and to adults, with topics and practice adjusted to the student’s level.',
        },
      ],
    },
  },
  {
    slug: 'quranic-arabic',
    key: 'quranicArabic',
    dateModified: '2026-07-28',
    ar: {
      title: 'تعليم عربية القرآن أونلاين',
      description: 'يقدّم برنامج عربية القرآن مدخلًا لغويًا لفهم المفردات والتراكيب التي تظهر في الآيات، مع شرح تدريجي يناسب مستوى الطالب.',
      audience: 'لمن يقرأ القرآن ويريد فهم مفرداته بصورة أفضل، ولمن يريد بداية منظّمة في اللغة العربية المرتبطة بالنص القرآني.',
      focus: 'مفردات قرآنية شائعة، وتراكيب أساسية، وفهم الكلمة داخل سياق الآية.',
      format: 'جلسات مباشرة تبدأ بآيات أو مقطع قصير، ثم شرح المفردات والتركيب وتطبيق الفهم داخل السياق.',
      duration: 'مدة كل جلسة مباشرة ساعة واحدة.',
      audienceItems: [
        'قارئ القرآن الذي يريد فهم كلمات تتكرر في الآيات.',
        'طالب الحفظ أو التجويد الذي يريد ربط التلاوة بمعنى أوضح.',
        'من يريد دراسة لغة القرآن تدريجيًا دون الدخول مباشرة في موضوعات لغوية متقدمة.',
      ],
      focusItems: [
        'معاني مفردات قرآنية شائعة.',
        'ملاحظة التراكيب الأساسية داخل الآية.',
        'فهم معنى الكلمة من السياق الذي وردت فيه.',
        'مراجعة الكلمات والتراكيب في أكثر من مثال.',
      ],
      lessonSteps: [
        'قراءة آيات أو مقطع قصير مرتبط بموضوع الحصة.',
        'تحديد المفردات الجديدة وشرح معناها في السياق.',
        'ملاحظة تركيب لغوي أساسي وتطبيقه على أمثلة.',
        'مراجعة الكلمات والمعاني التي سيعود إليها الطالب قبل الحصة التالية.',
      ],
      keywords: ['تعلم عربية القرآن أونلاين', 'فهم مفردات القرآن', 'اللغة العربية للقرآن'],
      faqs: [
        {
          q: 'هل أحتاج إلى دراسة النحو قبل البدء؟',
          a: 'لا. يبدأ البرنامج بالمفردات والتراكيب الأساسية المناسبة لمستوى الطالب.',
        },
        {
          q: 'هل البرنامج تفسير للقرآن؟',
          a: 'البرنامج يركّز على الجانب اللغوي: المفردات والتراكيب وفهمها داخل سياق الآية، وليس بديلًا عن دراسة التفسير.',
        },
        {
          q: 'ماذا لو كانت قراءتي بالعربية ضعيفة؟',
          a: 'يبدأ المعلّم من مستواك، وقد يكون برنامج القراءة بالعربية أنسب أولًا إذا كنت لا تزال تتعلّم الحروف وتركيب الكلمات.',
        },
      ],
    },
    en: {
      title: 'Online Quranic Arabic Classes',
      description: 'Online Quranic Arabic classes provide a language-based introduction to vocabulary and structures found in Quran verses, explained gradually at the student’s level.',
      audience: 'For Quran readers who want to understand more vocabulary and students seeking a structured introduction to Arabic through the Quranic text.',
      focus: 'Common Quranic vocabulary, basic structures and understanding words in the context of a verse.',
      format: 'Live sessions that begin with a short passage, then explain its vocabulary and structure and apply that understanding in context.',
      duration: 'Each live session is one hour.',
      audienceItems: [
        'Quran readers who want to understand words that appear repeatedly in verses.',
        'Memorization or Tajweed students who want to connect recitation with clearer meaning.',
        'Students who want a gradual introduction to Quranic Arabic before advanced language topics.',
      ],
      focusItems: [
        'Meanings of common Quranic vocabulary.',
        'Recognizing basic structures inside a verse.',
        'Understanding a word through the context in which it appears.',
        'Reviewing vocabulary and structures across more than one example.',
      ],
      lessonSteps: [
        'Read a short passage connected to the lesson topic.',
        'Identify new vocabulary and explain its meaning in context.',
        'Notice a basic language structure and apply it to examples.',
        'Review the words and meanings to revisit before the next session.',
      ],
      keywords: ['learn Quranic Arabic online', 'Quran vocabulary', 'Arabic for Quran'],
      faqs: [
        {
          q: 'Do I need to study Arabic grammar first?',
          a: 'No. The program starts with vocabulary and basic structures suited to the student’s level.',
        },
        {
          q: 'Is this a Quran Tafsir course?',
          a: 'The program focuses on language: vocabulary, structures and their meaning in the verse context. It is not a replacement for formal Tafsir study.',
        },
        {
          q: 'What if my Arabic reading is weak?',
          a: 'The teacher starts from your level. Arabic reading classes may be a better first step if you are still learning letters and how to form words.',
        },
      ],
    },
  },
  {
    slug: 'islamic-studies',
    key: 'islamicStudies',
    dateModified: '2026-07-28',
    ar: {
      title: 'الدراسات الإسلامية أونلاين',
      description: 'يقدّم برنامج الدراسات الإسلامية موضوعات في العقيدة والعبادات والأخلاق والسيرة بشرح واضح يناسب عمر الطالب ومستواه.',
      audience: 'للأطفال من ٥ سنوات فأكثر وللكبار الذين يريدون دراسة أساسيات إسلامية بصورة منظّمة ومفهومة.',
      focus: 'أساسيات العقيدة والعبادات، والأخلاق والآداب، ومواقف من السيرة النبوية.',
      format: 'جلسات مباشرة مع معلّم، تتضمن شرح الموضوع ومناقشة أمثلة وأسئلة تناسب مستوى الطالب.',
      duration: 'مدة كل جلسة مباشرة ساعة واحدة.',
      audienceItems: [
        'الطفل الذي يحتاج إلى شرح مبسّط لموضوعات الدين والأخلاق.',
        'المبتدئ الذي يريد دراسة الأساسيات بترتيب واضح.',
        'الكبار الذين يريدون مراجعة موضوعات العقيدة والعبادات والسيرة.',
      ],
      focusItems: [
        'موضوعات أساسية في العقيدة.',
        'العبادات وما يرتبط بها من مفاهيم أولية.',
        'الأخلاق والآداب في المواقف اليومية.',
        'أحداث وشخصيات من السيرة النبوية.',
      ],
      lessonSteps: [
        'مراجعة الفكرة التي تناولتها الحصة السابقة.',
        'شرح موضوع جديد بلغة تناسب الطالب.',
        'مناقشة أمثلة أو أسئلة مرتبطة بالموضوع.',
        'تلخيص النقاط التي يحتاج الطالب إلى مراجعتها.',
      ],
      keywords: ['دراسات إسلامية أونلاين', 'تعليم العلوم الشرعية', 'تعلم السيرة والأخلاق'],
      faqs: [
        {
          q: 'ما الموضوعات التي يشملها البرنامج؟',
          a: 'يشمل موضوعات في العقيدة والعبادات والأخلاق والآداب والسيرة، ويُختار مستوى الشرح بحسب الطالب.',
        },
        {
          q: 'هل البرنامج مناسب للأطفال والكبار؟',
          a: 'نعم. البرامج متاحة من سن ٥ سنوات فأكثر وللكبار، مع شرح يناسب العمر والمستوى.',
        },
        {
          q: 'هل أحتاج إلى دراسة سابقة؟',
          a: 'لا. يمكن للمبتدئ أن يبدأ من الموضوعات الأساسية وباللغة التي تناسبه.',
        },
      ],
    },
    en: {
      title: 'Online Islamic Studies',
      description: 'Online Islamic Studies classes cover creed, worship, manners and the Prophetic biography with clear explanations suited to the student’s age and level.',
      audience: 'For children aged 5 and up and adults who want to study Islamic foundations in a structured, understandable way.',
      focus: 'Foundations of creed and worship, Islamic manners and lessons from the Prophetic biography.',
      format: 'Live sessions with a teacher, including an explanation of the topic and discussion of examples and questions at the student’s level.',
      duration: 'Each live session is one hour.',
      audienceItems: [
        'Children who need a simple explanation of Islamic topics and manners.',
        'Beginners who want to study the foundations in a clear order.',
        'Adults who want to review topics in creed, worship and the Prophetic biography.',
      ],
      focusItems: [
        'Foundational topics in Islamic creed.',
        'Worship and the basic concepts connected to it.',
        'Manners and character in everyday situations.',
        'Events and people from the Prophetic biography.',
      ],
      lessonSteps: [
        'Review the main idea from the previous session.',
        'Explain a new topic in language suited to the student.',
        'Discuss examples or questions connected to the topic.',
        'Summarize the points the student needs to review.',
      ],
      keywords: ['Islamic studies online', 'learn Islamic studies', 'online Islamic education'],
      faqs: [
        {
          q: 'What topics does the program cover?',
          a: 'It covers creed, worship, manners and the Prophetic biography, with the explanation level chosen for the student.',
        },
        {
          q: 'Is the program suitable for children and adults?',
          a: 'Yes. Programs are available from age 5 and up and to adults, with explanations suited to age and level.',
        },
        {
          q: 'Do I need previous Islamic studies?',
          a: 'No. Beginners can start with foundational topics in the language that suits them.',
        },
      ],
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
    lessonStepsTitle: 'كيف تسير الحصة؟',
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
    lessonStepsTitle: 'What happens in a session?',
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
