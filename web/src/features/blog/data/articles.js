// Aya Academy blog — the single, backend-free source of truth for all articles.
// Same data-driven philosophy as the rest of the marketing site: every article is
// a structured, fully-bilingual ({ ar, en }) object. The list/detail pages read
// from here; no database, no CMS. To publish a new post, append an object below.
//
// EDITORIAL STANDARD — authentic sourcing only:
//   • Every Quran ayah carries an exact surah:ayah reference.
//   • Every hadith is authentic (صحيح / حسن), with its narrator (الراوي), source
//     book (المصدر) and grade (الدرجة) — verified against the Hadith Encyclopedia
//     of الدرر السنية (dorar.net). Each `hadith` block links back to it.
//   • Pedagogy is practical and concrete — most posts address parents of young
//     children; posts in the `adults` category address adult learners directly.
//
// Body is an ordered array of typed blocks rendered by features/blog/components/
// ArticleBody.jsx. Supported block types:
//   { type: 'p',     text: { ar, en } }                       — paragraph
//   { type: 'h2',    text: { ar, en } }                       — section heading
//   { type: 'h3',    text: { ar, en } }                       — sub-heading
//   { type: 'ul',    items: [{ ar, en }, ...] }               — bullet list
//   { type: 'ol',    items: [{ ar, en }, ...] }               — numbered list
//   { type: 'quote', text: { ar, en }, cite?: { ar, en } }    — pull-quote (generic wisdom; NOT used for hadith)
//   { type: 'callout', tone?: 'info'|'tip'|'warn', title?: { ar, en }, text: { ar, en } }
//   { type: 'ayah',  arabic: '…', surah?: { ar, en }, meaning?: { ar, en } } — Quran verse card
//   { type: 'hadith', arabic: '…', narrator?: { ar, en }, source: { ar, en },
//     grade: { ar, en }, muhaddith?: '…', dorarUrl?: '…', explanation?: { ar, en } } — authenticated hadith card
//
// Each article may also carry `sources: [{ ar, en, url? }]` — a transparent list
// of the references it draws on, rendered at the foot of the article.

// Category registry → bilingual labels. Article.categories references these keys.
export const blogCategories = {
  virtue: { ar: 'فضائل وأجر', en: 'Virtue & reward' },
  parenting: { ar: 'للأهل', en: 'For parents' },
  adults: { ar: 'للكبار', en: 'For adults' },
  memorization: { ar: 'الحفظ والمراجعة', en: 'Memorization' },
  manners: { ar: 'الأخلاق', en: 'Manners' },
  dua: { ar: 'دعاء وأذكار', en: 'Dua & dhikr' },
  tips: { ar: 'نصائح وأدوات', en: 'Tips & tools' },
};

// Each article also carries a visual identity used by the generated (image-free)
// cover: `emoji` + `accent` (a theme palette key: 'primary'|'secondary'|'success'|
// 'warning'|'info'). Covers are composed from theme tokens so they stay crisp in
// light/dark and RTL — no raster assets to manage.
const articles = [
  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'adults-start-quran-journey',
    datePublished: '2026-07-05',
    readingTime: 8,
    categories: ['adults', 'memorization'],
    emoji: '🌱',
    accent: 'secondary',
    tags: [
      { ar: 'للكبار', en: 'For adults' },
      { ar: 'حفظ القرآن', en: 'Quran memorization' },
    ],
    title: {
      ar: 'لم يفُت الأوان: كيف يبدأ الكبار رحلتهم مع القرآن حفظًا وفهمًا',
      en: 'It’s Never Too Late: How Adults Can Begin Their Journey with the Quran',
    },
    description: {
      ar: 'تظنّ أن الحفظ للصغار وحدهم؟ آياتٌ محكمة وأحاديث صحيحة تؤكّد أن باب القرآن مفتوحٌ لكل عمر، وأن تعثّرك في البداية أجرٌ لا نقص. هذه خطة عملية للكبار المشغولين.',
      en: 'Think memorization is only for children? Firm verses and authentic hadiths confirm the door of the Quran is open at every age — and that your early struggle is reward, not shortcoming. Here is a practical plan for busy adults.',
    },
    body: [
      {
        type: 'p',
        text: {
          ar: 'كثيرٌ من الكبار يؤجّلون البدء مع القرآن بحجّةٍ واحدة: «فات الأوان، الحفظ للصغار». وهذا الظنّ يحرم صاحبه من خيرٍ عظيم لا علاقة له بالعمر. فكثيرٌ من الصحابة أسلموا كبارًا ثم صاروا حَمَلة القرآن وأئمّته، والله لم يشترط سنًّا لحامل كتابه. تعال نُزِل هذا الحاجز أولًا بالدليل، ثم نبني خطةً تناسب انشغالك.',
          en: 'Many adults keep postponing their start with the Quran on one excuse: “it’s too late, memorization is for the young.” That assumption robs a person of an immense good that has nothing to do with age. Many Companions embraced Islam as grown adults, then became carriers and leaders of the Quran — and Allah set no age condition for the one who carries His Book. Let us remove this barrier first with evidence, then build a plan that fits a busy life.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'القرآن مُيسَّرٌ لكل عمر', en: 'The Quran is made easy for every age' },
      },
      {
        type: 'p',
        text: {
          ar: 'أعظم ما يطمئن المبتدئ الكبير أنّ الله تكفّل بتيسير كتابه للحفظ والتذكّر، وكرّر هذا الوعد في سورة القمر أربع مرات كأنه يقول لك: لا تخفْ من الصعوبة، فقد يسّرتُه لك:',
          en: 'The greatest reassurance for an adult beginner is that Allah Himself guaranteed to make His Book easy to memorize and remember — repeating this promise four times in Surah Al-Qamar, as if telling you: do not fear the difficulty, for I have made it easy for you:',
        },
      },
      {
        type: 'ayah',
        arabic: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ',
        surah: { ar: 'سورة القمر — ١٧', en: 'Surah Al-Qamar — 17' },
        meaning: {
          ar: 'ولقد سهّلنا القرآن للحفظ والفهم والاتّعاظ، فهل من متّعظٍ يُقبل عليه؟ فالتيسير وعدٌ من الله، والعمر ليس عائقًا أمام من صدق في الطلب.',
          en: 'We have indeed made the Quran easy to memorize, understand and take heed from — so is there any who will take heed? Ease is a promise from Allah, and age is no barrier for the one sincere in seeking.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'وللمتعثّر أجران — لا تخجل من بدايتك', en: 'The one who struggles has a double reward' },
      },
      {
        type: 'p',
        text: {
          ar: 'ربما يثقل لسانُ الكبير بالحرف، ويطول عليه حفظ الآية القصيرة. والبشارة النبوية تقلب هذا «الضعف» إلى فضل مضاعف: فالماهر بالقرآن في منزلةٍ عالية، والذي يشقّ عليه ويتعتع فيه له أجران — أجر التلاوة وأجر المجاهدة.',
          en: 'An adult’s tongue may stumble over the letters, and a short verse may take long to settle. The Prophetic glad tiding turns this “weakness” into a doubled virtue: the one proficient in the Quran holds a high rank, and the one for whom it is hard, who falters in it, has two rewards — for reciting and for striving.',
        },
      },
      {
        type: 'hadith',
        arabic: 'الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ، وَالَّذِي يَقْرَأُ الْقُرْآنَ وَيَتَتَعْتَعُ فِيهِ وَهُوَ عَلَيْهِ شَاقٌّ لَهُ أَجْرَانِ',
        narrator: { ar: 'عائشة رضي الله عنها', en: 'Aisha (may Allah be pleased with her)' },
        source: { ar: 'صحيح مسلم (٧٩٨)', en: 'Sahih Muslim (798)' },
        grade: { ar: 'صحيح', en: 'Sahih (authentic)' },
        muhaddith: 'مسلم',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D8%A7%D9%84%D9%85%D8%A7%D9%87%D8%B1%20%D8%A8%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%85%D8%B9%20%D8%A7%D9%84%D8%B3%D9%81%D8%B1%D8%A9%20%D8%A7%D9%84%D9%83%D8%B1%D8%A7%D9%85%20%D8%A7%D9%84%D8%A8%D8%B1%D8%B1%D8%A9%20%D9%88%D8%A7%D9%84%D8%B0%D9%8A%20%D9%8A%D9%82%D8%B1%D8%A3%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%88%D9%8A%D8%AA%D8%AA%D8%B9%D8%AA%D8%B9%20%D9%81%D9%8A%D9%87%20%D9%88%D9%87%D9%88%20%D8%B9%D9%84%D9%8A%D9%87%20%D8%B4%D8%A7%D9%82%20%D9%84%D9%87%20%D8%A3%D8%AC%D8%B1%D8%A7%D9%86',
        explanation: {
          ar: 'فلا تقِس نفسك بالصغير الذي يحفظ سريعًا؛ تعثّرك اليوم مكتوبٌ لك أجرين، فداوِم ولا تيأس، فأنت أقرب إلى الأجر لا أبعد عنه.',
          en: 'Do not measure yourself against a child who memorizes quickly; your stumbling today is recorded as two rewards. Keep going and do not despair — you are nearer to reward, not farther from it.',
        },
      },
      {
        type: 'callout',
        tone: 'tip',
        title: { ar: 'أعِد تأطير الصعوبة', en: 'Reframe the difficulty' },
        text: {
          ar: 'كلّما شعرت أن الآية عصيّة عليك، ذكّر نفسك: هذه هي اللحظة التي يتضاعف فيها أجري. حوّل الإحباط إلى وقودٍ للاستمرار، فالثبات — لا السرعة — هو ميزان النجاح.',
          en: 'Whenever a verse feels stubborn, remind yourself: this is the very moment my reward is doubled. Turn frustration into fuel to continue — steadiness, not speed, is the true measure of success.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'كل آيةٍ تحفظها ترفع منزلتك', en: 'Every verse you learn raises your rank' },
      },
      {
        type: 'p',
        text: {
          ar: 'وليس الأمر مجرّد أجرٍ يُكتب؛ بل رفعةٌ دائمة في الآخرة تتناسب مع قدر ما حفظت. فصاحب القرآن يُقال له يوم القيامة أن يرتقي في درجات الجنة بعدد آياته، ولو بدأ كبيرًا. كل آيةٍ تضيفها اليوم درجةٌ تنتظرك غدًا.',
          en: 'And it is not merely a reward recorded; it is a lasting elevation in the Hereafter matching how much you carried. The companion of the Quran will be told on the Day of Judgment to ascend through the ranks of Paradise by the count of the verses they knew — even if they began late. Every verse you add today is a rank awaiting you tomorrow.',
        },
      },
      {
        type: 'hadith',
        arabic: 'يُقَالُ لِصَاحِبِ الْقُرْآنِ: اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا، فَإِنَّ مَنْزِلَتَكَ عِنْدَ آخِرِ آيَةٍ تَقْرَؤُهَا',
        narrator: { ar: 'عبد الله بن عمرو بن العاص رضي الله عنهما', en: 'Abdullah ibn Amr ibn al-As (may Allah be pleased with them)' },
        source: { ar: 'سنن أبي داود (١٤٦٤)', en: 'Sunan Abi Dawud (1464)' },
        grade: { ar: 'صحيح', en: 'Sahih (authentic)' },
        muhaddith: 'الألباني',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D8%A7%D9%82%D8%B1%D8%A3%20%D9%88%D8%A7%D8%B1%D8%AA%D9%82%20%D9%88%D8%B1%D8%AA%D9%84%20%D9%83%D9%85%D8%A7%20%D9%83%D9%86%D8%AA%20%D8%AA%D8%B1%D8%AA%D9%84%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%AF%D9%86%D9%8A%D8%A7%20%D9%81%D8%A5%D9%86%20%D9%85%D9%86%D8%B2%D9%84%D8%AA%D9%83%20%D8%B9%D9%86%D8%AF%20%D8%A2%D8%AE%D8%B1%20%D8%A2%D9%8A%D8%A9%20%D8%AA%D9%82%D8%B1%D8%A4%D9%87%D8%A7',
        explanation: {
          ar: 'منزلتك في الجنة عند آخر آيةٍ تُتقنها؛ فكلّ ما تضيفه من القرآن — ولو بعد الأربعين — يرفعك درجةً باقية. ابدأ الآن، فما فاتك يمكن تعويضه، والباب مفتوح.',
          en: 'Your rank in Paradise is at the last verse you master; everything you add of the Quran — even after forty — raises you a lasting degree. Begin now: what you missed can be made up, and the door is open.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'العلم رفعةٌ، وطلبه لا يتوقّف بعمر', en: 'Knowledge elevates, and seeking it has no age limit' },
      },
      {
        type: 'p',
        text: {
          ar: 'رحلتك مع القرآن ليست حفظًا للحروف فحسب، بل علمٌ يرفع صاحبه ويميّزه، وقد سوّى الله بين الناس في كل شيء إلا في العلم:',
          en: 'Your journey with the Quran is not merely memorizing letters; it is knowledge that raises and distinguishes its bearer. Allah made people equal in everything except in knowledge:',
        },
      },
      {
        type: 'ayah',
        arabic: 'قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ ۗ إِنَّمَا يَتَذَكَّرُ أُولُو الْأَلْبَابِ',
        surah: { ar: 'سورة الزمر — ٩', en: 'Surah Az-Zumar — 9' },
        meaning: {
          ar: 'قل — أيها النبي —: لا يستوي من يعلمون ومن لا يعلمون، إنما ينتفع بالموعظة أصحاب العقول. فطلبك للقرآن كبيرًا رِفعةٌ لك في الدنيا والآخرة.',
          en: 'Say — O Prophet —: those who know are not equal to those who do not know; only people of understanding take heed. Your pursuit of the Quran as an adult is an elevation for you in this life and the next.',
        },
      },
      {
        type: 'callout',
        tone: 'info',
        title: { ar: 'دعاءٌ لازِمْه', en: 'A du‘a to keep' },
        text: {
          ar: 'علّم اللهُ نبيَّه ﷺ أن يسأل المزيد من العلم: ﴿وَقُل رَّبِّ زِدْنِي عِلْمًا﴾ [طه: ١١٤]. اجعله دعاءك قبل كل جلسة حفظ؛ فالإخلاص والدعاء يفتحان القلب لما لا يفتحه المجهود وحده.',
          en: 'Allah taught His Prophet ﷺ to ask for more knowledge: “My Lord, increase me in knowledge” [Ta-Ha: 114]. Make it your du‘a before every memorization session; sincerity and supplication open the heart to what effort alone cannot.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'خطة عملية للكبار المشغولين', en: 'A practical plan for busy adults' },
      },
      {
        type: 'p',
        text: {
          ar: 'الفرق بين الكبير والصغير ليس في القدرة، بل في ازدحام الوقت. ولذلك تُبنى خطة الكبير على «القليل الثابت» لا على «الكثير المتقطّع»:',
          en: 'The difference between an adult and a child is not ability, but a crowded schedule. So an adult’s plan is built on “small and steady,” not “much and scattered”:',
        },
      },
      {
        type: 'ul',
        items: [
          { ar: 'ثبّت موعدًا واحدًا يوميًّا لا يتغيّر — ولو خمس دقائق بعد الفجر؛ فالانتظام اليومي القصير أرسخ من ساعةٍ متقطّعة كل أسبوع.', en: 'Fix one unchanging daily slot — even five minutes after Fajr; short daily consistency roots deeper than a scattered hour once a week.' },
          { ar: 'ابدأ من جزء عمّ من آخر المصحف؛ سوره قصيرة، وكثيرٌ منها تسمعه في الصلاة، فتحفظه بثقةٍ وتشعر بإنجازٍ مبكّر يحفّزك.', en: 'Begin with Juz’ Amma at the end of the mushaf; its surahs are short and many are heard in prayer, so you memorize with confidence and feel an early win that motivates you.' },
          { ar: 'استثمر «الوقت الميّت»: طريق العمل، المشي، الانتظار — استمع لآيةٍ واحدة تكرارًا حتى تلتصق قبل أن تفتح المصحف.', en: 'Use “dead time”: the commute, walking, waiting — listen to a single verse on repeat until it sticks before you even open the mushaf.' },
          { ar: 'اقرأ معنى الآية في تفسيرٍ موثوق قبل حفظها؛ فالكبير يحفظ ما فهمه أسرع بكثير من الكلمات المجرّدة.', en: 'Read the verse’s meaning in a trusted tafsir before memorizing; an adult memorizes what they understand far faster than abstract words.' },
          { ar: 'راجِع أكثر مما تحفظ: خصّص معظم وقتك لتثبيت ما مضى، فالحفظ بلا مراجعةٍ ماءٌ في غربال.', en: 'Review more than you memorize: spend most of your time consolidating what came before — memorizing without review is water in a sieve.' },
          { ar: 'لا تسِر وحدك: معلّمٌ يصحّح تلاوتك أو حلقةٌ تلتزم معها يضاعفان ثباتك ويقيانك أخطاء النطق التي تصعب لاحقًا.', en: 'Don’t go it alone: a teacher who corrects your recitation, or a circle you commit to, multiplies your consistency and spares you pronunciation errors that are hard to fix later.' },
        ],
      },
      {
        type: 'p',
        text: {
          ar: 'وابقَ على يقينٍ أن الطريق مضمون لمن صدق؛ فالله وعد المجاهدين في طلبه بالهداية والتيسير:',
          en: 'And stay certain that the path is guaranteed for the sincere; Allah has promised those who strive toward Him guidance and ease:',
        },
      },
      {
        type: 'ayah',
        arabic: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا ۚ وَإِنَّ اللَّهَ لَمَعَ الْمُحْسِنِينَ',
        surah: { ar: 'سورة العنكبوت — ٦٩', en: 'Surah Al-Ankabut — 69' },
        meaning: {
          ar: 'والذين بذلوا وسعهم في طاعتنا وطلب مرضاتنا، لنوفّقنّهم إلى طرق الخير والهدى، وإنّ الله لمع المحسنين بالعون والنصر. فاجتهد، والهداية على الله.',
          en: 'Those who strive their utmost in obeying Us and seeking Our pleasure, We will surely guide to the ways of goodness and guidance; and Allah is indeed with those who do good. So strive — the guidance rests with Allah.',
        },
      },
      {
        type: 'p',
        text: {
          ar: 'وهذا ما نراعيه في أكاديمية آية: برامجنا مفتوحة للكبار كما للصغار — حفظ القرآن والتجويد واللغة العربية — بحصصٍ مرنة تناسب انشغالك، وخطةٍ تبدأ من مستواك أنت لا من عمرك. الباب مفتوح، والخطوة الأولى تكفي.',
          en: 'This is what we honor at Aya Academy: our programs are open to adults as much as to children — Quran memorization, tajweed, and Arabic — with flexible sessions that fit a busy life, and a plan that starts from your level, not your age. The door is open, and the first step is enough.',
        },
      },
    ],
    related: ['review-plan-quran-retention', 'best-way-kids-memorize-quran'],
    sources: [
      { ar: 'القرآن الكريم — سورة القمر: ١٧، والزمر: ٩، وطه: ١١٤، والعنكبوت: ٦٩', en: 'The Noble Qur’an — Al-Qamar: 17, Az-Zumar: 9, Ta-Ha: 114, Al-Ankabut: 69', url: 'https://quran.com/54/17' },
      { ar: 'حديث «الماهر بالقرآن مع السفرة الكرام... وله أجران» — صحيح مسلم، عبر الموسوعة الحديثية بالدرر السنية', en: '“The one proficient in the Quran is with the noble angels… has two rewards” — Sahih Muslim, via the Dorar.net Hadith Encyclopedia', url: 'https://dorar.net/hadith/search?q=%D8%A7%D9%84%D9%85%D8%A7%D9%87%D8%B1%20%D8%A8%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%85%D8%B9%20%D8%A7%D9%84%D8%B3%D9%81%D8%B1%D8%A9%20%D8%A7%D9%84%D9%83%D8%B1%D8%A7%D9%85%20%D8%A7%D9%84%D8%A8%D8%B1%D8%B1%D8%A9%20%D9%88%D8%A7%D9%84%D8%B0%D9%8A%20%D9%8A%D9%82%D8%B1%D8%A3%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%88%D9%8A%D8%AA%D8%AA%D8%B9%D8%AA%D8%B9%20%D9%81%D9%8A%D9%87%20%D9%88%D9%87%D9%88%20%D8%B9%D9%84%D9%8A%D9%87%20%D8%B4%D8%A7%D9%82%20%D9%84%D9%87%20%D8%A3%D8%AC%D8%B1%D8%A7%D9%86' },
      { ar: 'حديث «اقرأ وارتقِ ورتّل... فإن منزلتك عند آخر آية تقرؤها» — سنن أبي داود، صحّحه الألباني، الدرر السنية', en: '“Recite and ascend… your rank is at the last verse you recite” — Sunan Abi Dawud, graded authentic by al-Albani, via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D8%A7%D9%82%D8%B1%D8%A3%20%D9%88%D8%A7%D8%B1%D8%AA%D9%82%20%D9%88%D8%B1%D8%AA%D9%84%20%D9%83%D9%85%D8%A7%20%D9%83%D9%86%D8%AA%20%D8%AA%D8%B1%D8%AA%D9%84%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%AF%D9%86%D9%8A%D8%A7%20%D9%81%D8%A5%D9%86%20%D9%85%D9%86%D8%B2%D9%84%D8%AA%D9%83%20%D8%B9%D9%86%D8%AF%20%D8%A2%D8%AE%D8%B1%20%D8%A2%D9%8A%D8%A9%20%D8%AA%D9%82%D8%B1%D8%A4%D9%87%D8%A7' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'virtue-of-teaching-children-quran',
    datePublished: '2026-06-22',
    readingTime: 7,
    categories: ['virtue'],
    emoji: '🌟',
    accent: 'primary',
    tags: [
      { ar: 'فضل القرآن', en: 'Virtue of the Quran' },
      { ar: 'أجر وثواب', en: 'Reward' },
    ],
    title: {
      ar: 'لماذا نعلّم أطفالنا القرآن؟ الفضل العظيم الذي يغيّر نظرتك',
      en: 'Why Teach Our Children the Quran? The Immense Reward That Changes How You See It',
    },
    description: {
      ar: 'قبل أن تسأل «كيف أعلّم طفلي القرآن»، اعرف «لماذا». فضائل ثابتة في الكتاب والسنة تجعل كل دقيقة تجلسها مع طفلك استثمارًا لا يضيع.',
      en: 'Before you ask “how do I teach my child the Quran,” know the “why.” Authentic virtues from the Book and the Sunnah make every minute you sit with your child an investment that never goes to waste.',
    },
    body: [
      {
        type: 'p',
        text: {
          ar: 'حين يثقل عليك وقتُ التحفيظ، أو يبطئ تقدّم طفلك، فإنّ ما يُبقيك ثابتًا ليس الجدول ولا الخطة، بل وضوح «لماذا». تعليم الطفل القرآن ليس مهارةً نضيفها إلى مهاراته، بل أعظم ميراثٍ نتركه له؛ ولهذا جعله النبي صلى الله عليه وسلم في قمّة الأعمال. تعال نقف على الفضل أولًا، فمنه يولد الصبر.',
          en: 'When memorization time feels heavy, or your child’s progress slows, what keeps you steady is not the schedule or the plan — it is a clear “why.” Teaching a child the Quran is not one more skill we add to their list; it is the greatest inheritance we leave them, which is why the Prophet (peace be upon him) placed it at the very top of all deeds. Let us stand on the virtue first — from it patience is born.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'خير الناس على الإطلاق', en: 'The best of all people' },
      },
      {
        type: 'p',
        text: {
          ar: 'لم يربط النبي صلى الله عليه وسلم «الخيرية» بمالٍ ولا جاه، بل بالقرآن: تعلُّمًا وتعليمًا. والأبُ أو الأمّ الذي يجلس يلقّن ولده آيةً يجمع الأمرين معًا — تعلَّم ثم علَّم — فيدخل في هذه البشارة من أوسع أبوابها.',
          en: 'The Prophet (peace be upon him) did not tie “excellence” to wealth or status, but to the Quran — learning it and teaching it. A parent who sits teaching their child a single verse combines both at once — they learned, then they taught — entering this glad tiding through its widest door.',
        },
      },
      {
        type: 'hadith',
        arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
        narrator: { ar: 'عثمان بن عفان رضي الله عنه', en: 'Uthman ibn Affan (may Allah be pleased with him)' },
        source: { ar: 'صحيح البخاري (٥٠٢٧)', en: 'Sahih al-Bukhari (5027)' },
        grade: { ar: 'صحيح', en: 'Sahih (authentic)' },
        muhaddith: 'البخاري',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D8%AE%D9%8A%D8%B1%D9%83%D9%85%20%D9%85%D9%86%20%D8%AA%D8%B9%D9%84%D9%85%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%88%D8%B9%D9%84%D9%85%D9%87',
        explanation: {
          ar: 'حين تجلس مع طفلك تلقّنه آيةً، تذكّر أنك في أشرف الأعمال؛ ودخولك في هذه الخيرية يبدأ من أنك متعلِّمٌ للقرآن أولًا، فكن أنت أول من يقرؤه في البيت.',
          en: 'When you sit teaching your child a verse, remember you are in the noblest of deeds; your share of this excellence begins with you being a learner of the Quran first — so be the first to recite it at home.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'القرآن دليلٌ وشفيع', en: 'The Quran is a guide and an intercessor' },
      },
      {
        type: 'p',
        text: {
          ar: 'حين تُعطي طفلك القرآن فأنت تسلّمه بوصلةً تهديه طوال عمره إلى أقوم الطرق في عقيدته وأخلاقه وقراراته، كما قال الله تعالى:',
          en: 'When you give your child the Quran, you hand them a compass that guides them their whole life to the most upright path — in belief, character, and decisions — as Allah says:',
        },
      },
      {
        type: 'ayah',
        arabic: 'إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ وَيُبَشِّرُ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا كَبِيرًا',
        surah: { ar: 'سورة الإسراء — ٩', en: 'Surah Al-Isra — 9' },
        meaning: {
          ar: 'إنّ هذا القرآن يرشد إلى أعدل الطرق وأقومها، ويبشّر المؤمنين العاملين بالصالحات بأجرٍ عظيم. فتعليم طفلك القرآن هو تسليمه أصدق دليلٍ يهديه طوال حياته.',
          en: 'Indeed this Quran guides to the most upright path, and gives glad tidings to the believers who do good of a great reward. Teaching your child the Quran is handing them the truest guide for life.',
        },
      },
      {
        type: 'p',
        text: {
          ar: 'وليست الهداية في الدنيا فحسب؛ فالقرآن يوم القيامة يشفع لأهله الذين لازموا تلاوته والعمل به. ومن أعظم ما يدّخره الوالد لولده أن يجعله من أصحاب القرآن منذ الصِّغر.',
          en: 'And the guidance is not for this life only; on the Day of Judgment the Quran intercedes for its companions who kept to its recitation and acted upon it. Among the greatest things a parent can store up for their child is to make them a companion of the Quran from a young age.',
        },
      },
      {
        type: 'hadith',
        arabic: 'اقْرَؤُوا الْقُرْآنَ؛ فَإِنَّهُ يَأْتِي يَوْمَ الْقِيَامَةِ شَفِيعًا لِأَصْحَابِهِ',
        narrator: { ar: 'أبو أمامة الباهلي رضي الله عنه', en: 'Abu Umamah al-Bahili (may Allah be pleased with him)' },
        source: { ar: 'صحيح مسلم (٨٠٤)', en: 'Sahih Muslim (804)' },
        grade: { ar: 'صحيح', en: 'Sahih (authentic)' },
        muhaddith: 'مسلم',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D8%A7%D9%82%D8%B1%D8%A4%D9%88%D8%A7%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%81%D8%A5%D9%86%D9%87%20%D9%8A%D8%A3%D8%AA%D9%8A%20%D9%8A%D9%88%D9%85%20%D8%A7%D9%84%D9%82%D9%8A%D8%A7%D9%85%D8%A9%20%D8%B4%D9%81%D9%8A%D8%B9%D8%A7%20%D9%84%D8%A3%D8%B5%D8%AD%D8%A7%D8%A8%D9%87',
        explanation: {
          ar: 'يأتي القرآن يوم القيامة يشفع لمن لازمه. فاجعل طفلك من أصحابه؛ تدّخر له شفيعًا يوم لا ينفع مالٌ ولا بنون.',
          en: 'The Quran comes on the Day of Judgment to intercede for those who kept to it. Make your child one of its companions — you store up for them an intercessor on the Day when neither wealth nor children avail.',
        },
      },
      {
        type: 'callout',
        tone: 'info',
        title: { ar: 'واجبٌ قبل أن يكون فضلًا', en: 'A duty before it is a virtue' },
        text: {
          ar: 'قال الله: ﴿قُوا أَنفُسَكُمْ وَأَهْلِيكُمْ نَارًا﴾ [التحريم: ٦]. قال السلف في تفسيرها: «علّموهم وأدّبوهم». فتعليم القرآن للطفل ليس تحسينًا كماليًّا، بل من صميم وقاية الوالد لولده.',
          en: 'Allah says: “Protect yourselves and your families from a Fire” [At-Tahrim: 6]. The early scholars explained it as: “Teach them and discipline them.” Teaching a child the Quran is not an optional extra — it is at the heart of how a parent protects their child.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'وحتى المتعثّر مأجور', en: 'Even the one who struggles is rewarded' },
      },
      {
        type: 'p',
        text: {
          ar: 'قد يقلق الأب من بطء طفله أو كثرة خطئه. والبشارة النبوية تزيل هذا القلق تمامًا: الطفل الذي يتعتع ويشقّ عليه الحفظ له أجران — أجر القراءة وأجر المجاهدة. فلا تقِس النجاح بالسرعة، بل بالاستمرار.',
          en: 'A parent may worry about a child’s slowness or frequent mistakes. The Prophetic glad tiding removes that worry entirely: the child who falters and finds it hard earns two rewards — for reciting and for the struggle. So do not measure success by speed, but by perseverance.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'كيف تترجم هذا الفضل إلى عملٍ يومي', en: 'Turning this virtue into daily action' },
      },
      {
        type: 'ul',
        items: [
          { ar: 'ابدأ بقصار السور التي يسمعها الطفل كثيرًا في الصلاة (الفاتحة، الإخلاص، الفلق، الناس)؛ فأذنه ألِفتها فيحفظها بسهولة ويشعر بإنجازٍ سريع يحفّزه.', en: 'Start with the short surahs the child already hears in prayer (Al-Fatihah, Al-Ikhlas, Al-Falaq, An-Nas); their ear is familiar with them, so they memorize easily and feel a quick win.' },
          { ar: 'شغّل تلاوة قارئٍ واحدٍ ثابت في أوقاتٍ روتينية (السيارة، قبل النوم)؛ فيحفظ الطفل بالسماع قبل أن يُطلب منه الحفظ.', en: 'Play one consistent reciter at routine times (the car, before bed); the child memorizes by listening before ever being asked to memorize.' },
          { ar: 'اربط الحفظ بوقتٍ قصيرٍ ثابت يوميًّا (٥–١٠ دقائق للصغار) بعد الفجر أو المغرب؛ فالقليل المنتظم أرسخ من الكثير المتقطّع.', en: 'Tie memorization to a short, fixed daily slot (5–10 minutes for little ones) after Fajr or Maghrib; small and regular outlasts much and scattered.' },
          { ar: 'اشرح معنى الآية بقصةٍ قصيرة قبل تحفيظها؛ فالطفل يحفظ ما فهمه وأحبّه أسرع من الكلمات المجرّدة.', en: 'Explain the verse’s meaning with a short story before memorizing it; a child memorizes what they understood and loved faster than abstract words.' },
          { ar: 'تجنّب التهديد والعقاب على الخطأ، وامدح المحاولة لا النتيجة فقط؛ فالتجربة المقترنة بالحبّ تثبّت الطفل، والمقترنة بالخوف تنفّره سنوات.', en: 'Avoid threats and punishment for mistakes; praise the effort, not only the result. An experience tied to love roots the child; one tied to fear repels them for years.' },
          { ar: 'كن أنت القدوة: اجلس واقرأ أمام طفلك، واحفظ معه أو راجع حفظك؛ فالطفل يقلّد ما يراه لا ما يُؤمر به.', en: 'Be the model: sit and recite in front of your child, memorizing alongside them or reviewing your own portion; a child imitates what they see, not what they are told.' },
        ],
      },
      {
        type: 'p',
        text: {
          ar: 'هذا هو الأساس الذي نبني عليه في أكاديمية آية: نبدأ من «لماذا» قبل «كيف»، فنزرع في الطفل محبّة القرآن وفهم فضله، ثم نبني الحفظ على حصصٍ قصيرة وألعابٍ تعليمية ومتابعةٍ لطيفة للأهل.',
          en: 'This is the foundation we build on at Aya Academy: we begin with the “why” before the “how,” planting love of the Quran and an understanding of its virtue, then building memorization on short sessions, learning games, and gentle parent tracking.',
        },
      },
    ],
    related: ['best-way-kids-memorize-quran', 'help-your-child-love-the-quran'],
    sources: [
      { ar: 'القرآن الكريم — سورة الإسراء: ٩، وسورة التحريم: ٦', en: 'The Noble Qur’an — Al-Isra: 9, At-Tahrim: 6', url: 'https://quran.com/17/9' },
      { ar: 'حديث «خيركم من تعلّم القرآن وعلّمه» — صحيح البخاري، عبر الموسوعة الحديثية بالدرر السنية', en: '“The best of you are those who learn the Quran and teach it” — Sahih al-Bukhari, via the Dorar.net Hadith Encyclopedia', url: 'https://dorar.net/hadith/search?q=%D8%AE%D9%8A%D8%B1%D9%83%D9%85%20%D9%85%D9%86%20%D8%AA%D8%B9%D9%84%D9%85%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%88%D8%B9%D9%84%D9%85%D9%87' },
      { ar: 'حديث «اقرؤوا القرآن فإنه يأتي يوم القيامة شفيعًا لأصحابه» — صحيح مسلم، الدرر السنية', en: '“Recite the Quran, for it comes as an intercessor on the Day of Judgment” — Sahih Muslim, via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D8%A7%D9%82%D8%B1%D8%A4%D9%88%D8%A7%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%81%D8%A5%D9%86%D9%87%20%D9%8A%D8%A3%D8%AA%D9%8A%20%D9%8A%D9%88%D9%85%20%D8%A7%D9%84%D9%82%D9%8A%D8%A7%D9%85%D8%A9%20%D8%B4%D9%81%D9%8A%D8%B9%D8%A7%20%D9%84%D8%A3%D8%B5%D8%AD%D8%A7%D8%A8%D9%87' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'help-your-child-love-the-quran',
    datePublished: '2026-06-18',
    readingTime: 6,
    categories: ['parenting'],
    emoji: '🌙',
    accent: 'secondary',
    tags: [
      { ar: 'حب القرآن', en: 'Loving the Quran' },
      { ar: 'تربية', en: 'Parenting' },
    ],
    title: {
      ar: 'كيف تجعل طفلك يُحبّ القرآن قبل أن يحفظه',
      en: 'How to Make Your Child Love the Quran Before Memorizing It',
    },
    description: {
      ar: 'الحبّ يسبق الحفظ. دليلٌ عملي لزرع علاقةٍ دافئة بين الطفل والقرآن، مبنيّ على قاعدة نبوية: «يسّروا ولا تعسّروا».',
      en: 'Love comes before memorization. A practical guide to building a warm bond between your child and the Quran — built on a Prophetic rule: “Make things easy, not hard.”',
    },
    body: [
      {
        type: 'p',
        text: {
          ar: 'كثيرٌ من الأهل يبدؤون رحلة القرآن بسؤال: «كم آية حفظ اليوم؟». لكنّ أهمّ سؤالٍ في البداية هو: «هل أحبّ طفلي هذه اللحظة؟». الطفل الذي يحبّ القرآن سيعود إليه طوال عمره؛ أمّا من حفظ تحت الضغط فقد ينساه ويهجره بمجرّد أن يكبر. مهمّتك الأولى ليست أن يحفظ، بل أن يحبّ.',
          en: 'Many parents begin the Quran journey by asking: “How many ayahs today?” But the most important early question is: “Did my child love this moment?” A child who loves the Quran returns to it for life; one who memorized under pressure may forget it — and abandon it — the moment they grow up. Your first task is not that they memorize, but that they love.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'القاعدة الذهبية: يسّر ولا تعسّر', en: 'The golden rule: make it easy' },
      },
      {
        type: 'p',
        text: {
          ar: 'حين أرسل النبي صلى الله عليه وسلم أصحابه للتعليم، أوصاهم بقاعدةٍ تربويةٍ جامعة تصلح لكل بيت:',
          en: 'When the Prophet (peace be upon him) sent his Companions to teach, he gave them a sweeping educational rule that fits every home:',
        },
      },
      {
        type: 'hadith',
        arabic: 'يَسِّرُوا وَلَا تُعَسِّرُوا، وَبَشِّرُوا وَلَا تُنَفِّرُوا',
        narrator: { ar: 'أنس بن مالك رضي الله عنه', en: 'Anas ibn Malik (may Allah be pleased with him)' },
        source: { ar: 'متفق عليه — صحيح البخاري (٦٩) وصحيح مسلم (١٧٣٤)', en: 'Agreed upon — Sahih al-Bukhari (69) & Sahih Muslim (1734)' },
        grade: { ar: 'صحيح (متفق عليه)', en: 'Sahih (agreed upon)' },
        muhaddith: 'البخاري ومسلم',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D9%8A%D8%B3%D8%B1%D9%88%D8%A7%20%D9%88%D9%84%D8%A7%20%D8%AA%D8%B9%D8%B3%D8%B1%D9%88%D8%A7%20%D9%88%D8%A8%D8%B4%D8%B1%D9%88%D8%A7%20%D9%88%D9%84%D8%A7%20%D8%AA%D9%86%D9%81%D8%B1%D9%88%D8%A7',
        explanation: {
          ar: 'يسِّر الطريق على طفلك ولا تعسّره، وبشّره وحبّبه ولا تنفّره. الإكراه والتشديد ينفّران القلب الصغير، واللين والتبشير يفتحان له باب المحبّة.',
          en: 'Make the path easy for your child, not hard; cheer and endear it to them, do not drive them away. Coercion and harshness repel a young heart; gentleness and good news open the door of love.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'ابدأ بالقصة لا بالتكرار', en: 'Start with the story, not repetition' },
      },
      {
        type: 'p',
        text: {
          ar: 'قبل أن يحفظ الطفل سورة، احكِ له قصّتها بأسلوبٍ مشوّق، ثم قل: «هذه القصة حكاها الله في القرآن، تعال نسمعها بكلامه». المعنى أولًا ثم اللفظ؛ فالطفل يحفظ ما فهمه وأحبّه. والله جعل القرآن مُيسَّرًا بطبعه:',
          en: 'Before a child memorizes a surah, tell its story in an engaging way, then say: “Allah Himself told this story in the Quran — come, let us hear it in His words.” Meaning first, then wording; a child memorizes what they understood and loved. And Allah made the Quran inherently easy:',
        },
      },
      {
        type: 'ayah',
        arabic: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ',
        surah: { ar: 'سورة القمر — ١٧', en: 'Surah Al-Qamar — 17' },
        meaning: {
          ar: 'ولقد سهّلنا القرآن للحفظ والتذكّر والاتّعاظ، فهل من متذكّرٍ مُتّعظ؟ القرآن مُيسّرٌ بطبعه، ومهمّتنا أن نقدّمه بالطريق الميسّر لا المعسّر.',
          en: 'We have made the Quran easy to remember and take heed from — so is there any who will be reminded? The Quran is made easy by nature; our task is to present it through the path of ease.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'حين يخطئ: ذكّره بأجر المتعثّر', en: 'When they stumble: remind them of the reward' },
      },
      {
        type: 'p',
        text: {
          ar: 'أكبر ما ينفّر الطفل هو الخوف من الخطأ. اقلب المعادلة: اجعل الخطأ بابًا للأجر لا للخيبة، مستندًا إلى بشارةٍ نبوية عظيمة:',
          en: 'The thing that most repels a child is the fear of mistakes. Flip the equation: make a mistake a door to reward, not to disappointment, leaning on a great Prophetic glad tiding:',
        },
      },
      {
        type: 'hadith',
        arabic: 'الْمَاهِرُ بِالْقُرْآنِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ، وَالَّذِي يَقْرَأُ الْقُرْآنَ وَيَتَتَعْتَعُ فِيهِ، وَهُوَ عَلَيْهِ شَاقٌّ، لَهُ أَجْرَانِ',
        narrator: { ar: 'عائشة أم المؤمنين رضي الله عنها', en: 'Aisha, Mother of the Believers (may Allah be pleased with her)' },
        source: { ar: 'صحيح مسلم (٧٩٨)، وأخرجه البخاري (٤٩٣٧) — متفق عليه', en: 'Sahih Muslim (798); also al-Bukhari (4937) — agreed upon' },
        grade: { ar: 'صحيح (متفق عليه)', en: 'Sahih (agreed upon)' },
        muhaddith: 'مسلم',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D8%A7%D9%84%D9%85%D8%A7%D9%87%D8%B1%20%D8%A8%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%85%D8%B9%20%D8%A7%D9%84%D8%B3%D9%81%D8%B1%D8%A9%20%D8%A7%D9%84%D9%83%D8%B1%D8%A7%D9%85%20%D8%A7%D9%84%D8%A8%D8%B1%D8%B1%D8%A9',
        explanation: {
          ar: 'الحاذق المتقن مع الملائكة الكرام، ومن يقرأ متعثّرًا والقراءة شاقّة عليه فله أجران. ذكّر طفلك بهذا حين يخطئ؛ فالتعثّر ليس فشلًا بل أجرٌ مضاعف.',
          en: 'The fluent and skilled is with the noble angels, and the one who reads haltingly, finding it hard, has two rewards. Remind your child of this when they err — stumbling is not failure but a doubled reward.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'خمس عادات تزرع المحبّة', en: 'Five habits that plant love' },
      },
      {
        type: 'ol',
        items: [
          { ar: 'اجعل وقت القرآن مقترنًا بشعورٍ جميل: حضنٌ، صوتٌ هادئ، ابتسامة. الدماغ يربط العادة بالشعور المصاحب لها.', en: 'Pair Quran time with a good feeling: a hug, a calm voice, a smile. The brain links a habit to the emotion attached to it.' },
          { ar: 'شغّل تلاوةً جميلة (كالحصري المعلّم أو المنشاوي المجوّد) في أوقات السعادة — أثناء اللعب وقبل النوم — حتى يرتبط صوت القرآن بالطمأنينة لا بالامتحان.', en: 'Play a beautiful recitation (such as al-Husary’s teaching mushaf or al-Minshawi) during happy moments — while playing and before sleep — so the sound of the Quran links to serenity, not testing.' },
          { ar: 'أنهِ الجلسة وطفلُك ما زال متحمّسًا لا منهكًا، حتى يشتاق للغد. الثبات اليومي القصير يبني العادة والمحبّة معًا.', en: 'End the session while your child is still eager, not exhausted, so they look forward to tomorrow. Short daily consistency builds habit and love together.' },
          { ar: 'اجلسا جنبًا إلى جنب وتعلّما الآية معًا: «تعال نتعلّمها سويًّا». الطفل يحبّ ما يرى أبويه يحبّانه.', en: 'Sit side by side and learn the verse together: “Come, let us learn it together.” A child loves what they see their parents love.' },
          { ar: 'احتفِ بكل خطوة: مصحفٌ بألوانه المفضّلة، ملصقات تشجيع، احتفالٌ صغير عند ختم سورة، ودعاءٌ له أمامه. واخلِ وقت القرآن من التهديد تمامًا.', en: 'Celebrate every step: a mushaf in their favorite colors, encouragement stickers, a small celebration on finishing a surah, and a du‘a for them in their presence. Keep Quran time entirely free of threats.' },
        ],
      },
      {
        type: 'quote',
        text: {
          ar: 'الطفل لا يتذكّر كم آية حفظ، لكنه يتذكّر كيف كان يشعر وهو يحفظها.',
          en: 'A child won’t remember how many ayahs they memorized — but they’ll remember how they felt while memorizing them.',
        },
      },
      {
        type: 'p',
        text: {
          ar: 'في أكاديمية آية نبني هذه العلاقة أولًا: حصصٌ قصيرة، وألعابٌ تعليمية، ومتابعةٌ لطيفة للأهل بلا ضغط. الحفظ يأتي بعد الحبّ، لا قبله.',
          en: 'At Aya Academy we build this bond first: short sessions, learning games, and gentle parent tracking with no pressure. Memorization follows love — never the other way around.',
        },
      },
    ],
    related: ['virtue-of-teaching-children-quran', 'best-way-kids-memorize-quran'],
    sources: [
      { ar: 'القرآن الكريم — سورة القمر: ١٧، وسورة يونس: ٥٧', en: 'The Noble Qur’an — Al-Qamar: 17, Yunus: 57', url: 'https://quran.com/54/17' },
      { ar: 'حديث «يسّروا ولا تعسّروا» — متفق عليه، الدرر السنية', en: '“Make things easy, not hard” — agreed upon, via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D9%8A%D8%B3%D8%B1%D9%88%D8%A7%20%D9%88%D9%84%D8%A7%20%D8%AA%D8%B9%D8%B3%D8%B1%D9%88%D8%A7%20%D9%88%D8%A8%D8%B4%D8%B1%D9%88%D8%A7%20%D9%88%D9%84%D8%A7%20%D8%AA%D9%86%D9%81%D8%B1%D9%88%D8%A7' },
      { ar: 'حديث «الماهر بالقرآن... وله أجران» — متفق عليه، الدرر السنية', en: '“The one proficient in the Quran… has two rewards” — agreed upon, via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D8%A7%D9%84%D9%85%D8%A7%D9%87%D8%B1%20%D8%A8%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%85%D8%B9%20%D8%A7%D9%84%D8%B3%D9%81%D8%B1%D8%A9%20%D8%A7%D9%84%D9%83%D8%B1%D8%A7%D9%85%20%D8%A7%D9%84%D8%A8%D8%B1%D8%B1%D8%A9' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'best-way-kids-memorize-quran',
    datePublished: '2026-06-12',
    readingTime: 7,
    categories: ['memorization'],
    emoji: '📖',
    accent: 'success',
    tags: [
      { ar: 'تحفيظ', en: 'Memorization' },
      { ar: 'تلقين', en: 'Talqin' },
    ],
    title: {
      ar: 'أفضل طريقة لتحفيظ القرآن للأطفال (خطوة بخطوة)',
      en: 'The Best Way for Kids to Memorize the Quran (Step by Step)',
    },
    description: {
      ar: 'الحفظ المتقن ليس عن الموهبة بل عن الطريقة. منهجٌ عملي مجرّب: تلقين بالسماع، تكرار مقسّم، ربطٌ بالمعنى، وترتيلٌ منذ اليوم الأول.',
      en: 'Solid memorization isn’t about talent — it’s about method. A proven, practical approach: audio talqin, chunked repetition, linking to meaning, and tarteel from day one.',
    },
    body: [
      {
        type: 'p',
        text: {
          ar: 'الطفل العادي يستطيع حفظ القرآن إذا اتّبعنا معه نظامًا واضحًا يحترم قدرته على التركيز ويبني على المراجعة. الموهبة تساعد، لكنّ الطريقة هي الفيصل. إليك المنهج خطوة بخطوة.',
          en: 'An ordinary child can memorize the Quran if we follow a clear system that respects their attention span and builds on review. Talent helps, but method is decisive. Here is the approach, step by step.',
        },
      },
      {
        type: 'h2',
        text: { ar: '١) التلقين بالسماع قبل القراءة بالعين', en: '1) Audio talqin before eye-reading' },
      },
      {
        type: 'p',
        text: {
          ar: 'قبل أن يحفظ الطفل آية، اقرأها له مرتّلةً ثلاث مرّات وهو يستمع، ثم يردّدها معك ثلاثًا، ثم وحده ثلاثًا. الأذن تحفظ النغمة والمخارج قبل أن يحفظ اللسان، وهذا يقلّل الأخطاء كثيرًا — خصوصًا لمن لم يتقن القراءة بعد.',
          en: 'Before a child memorizes a verse, recite it to them slowly three times while they listen, then have them repeat it with you three times, then alone three times. The ear captures the melody and articulation before the tongue does, which greatly reduces mistakes — especially for a child who cannot yet read fluently.',
        },
      },
      {
        type: 'h2',
        text: { ar: '٢) التكرار المقسّم والربط التراكمي', en: '2) Chunked repetition + cumulative linking' },
      },
      {
        type: 'ol',
        items: [
          { ar: 'كرّر الآية الأولى ٥ مرّات وحدها.', en: 'Repeat the first ayah 5 times alone.' },
          { ar: 'كرّر الآية الثانية ٥ مرّات وحدها.', en: 'Repeat the second ayah 5 times alone.' },
          { ar: 'اربط الآيتين معًا ٥ مرّات في نَفَسٍ واحد متصل.', en: 'Connect both ayahs together 5 times in one continuous breath.' },
          { ar: 'لا تنتقل لمقطعٍ جديد حتى يصِل الطفل ما حفظه اليوم بما حفظه أمس.', en: 'Don’t move to a new passage until the child links today’s lesson to yesterday’s.' },
          { ar: 'في اليوم التالي راجع قبل أن تضيف جديدًا، وخصّص يومًا أسبوعيًّا للمراجعة فقط.', en: 'The next day, review before adding anything new, and reserve one day a week for review only.' },
        ],
      },
      {
        type: 'h2',
        text: { ar: '٣) الترتيل وتصحيح المخارج من اليوم الأول', en: '3) Tarteel & correct articulation from day one' },
      },
      {
        type: 'p',
        text: {
          ar: 'الخطأ الذي يُحفظ يصعب إصلاحه لاحقًا. لقّن الطفل النطق الصحيح من البداية بقراءةٍ بطيئةٍ واضحة، عملًا بأمر الله:',
          en: 'An error once memorized is hard to undo later. Teach correct pronunciation from the start through slow, clear reading, in obedience to Allah’s command:',
        },
      },
      {
        type: 'ayah',
        arabic: 'أَوْ زِدْ عَلَيْهِ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا',
        surah: { ar: 'سورة المزمل — ٤', en: 'Surah Al-Muzzammil — 4' },
        meaning: {
          ar: 'اقرأ القرآن على تمهّلٍ وتؤدةٍ، مع إخراج الحروف واضحةً وبيان الكلمات. والترتيل البطيء الواضح يثبّت الحفظ ويعين على الفهم أكثر من السرعة.',
          en: 'Recite the Quran slowly and deliberately, pronouncing each letter clearly. Slow, clear tarteel anchors memory and aids understanding far more than rushing.',
        },
      },
      {
        type: 'h2',
        text: { ar: '٤) اربط الحفظ بطموحٍ أخروي', en: '4) Tie memorization to an eternal aspiration' },
      },
      {
        type: 'p',
        text: {
          ar: 'لا تجعل هدف الطفل مجرّد «عدد». اربط كل آيةٍ جديدة بمنزلةٍ ترتفع يوم القيامة، فيحمل في قلبه دافعًا أعمق من الرقم:',
          en: 'Don’t make the child’s goal a mere “count.” Tie each new verse to a rank that rises on the Day of Judgment, so they carry a motive deeper than a number:',
        },
      },
      {
        type: 'hadith',
        arabic: 'يُقَالُ لِصَاحِبِ الْقُرْآنِ: اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا، فَإِنَّ مَنْزِلَتَكَ عِنْدَ آخِرِ آيَةٍ تَقْرَؤُهَا',
        narrator: { ar: 'عبد الله بن عمرو رضي الله عنهما', en: 'Abdullah ibn Amr (may Allah be pleased with them both)' },
        source: { ar: 'سنن أبي داود (١٤٦٤) والترمذي', en: 'Sunan Abi Dawud (1464) & al-Tirmidhi' },
        grade: { ar: 'حسن صحيح', en: 'Hasan Sahih (sound & authentic)' },
        muhaddith: 'صحّحه الألباني في صحيح أبي داود',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D9%8A%D9%82%D8%A7%D9%84%20%D9%84%D8%B5%D8%A7%D8%AD%D8%A8%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D8%A7%D9%82%D8%B1%D8%A3%20%D9%88%D8%A7%D8%B1%D8%AA%D9%82%20%D9%88%D8%B1%D8%AA%D9%84',
        explanation: {
          ar: 'منزلة حافظ القرآن في الجنة عند آخر آيةٍ يحفظها؛ فكلّما زاد حفظه ارتفعت درجته. حافزٌ عظيم: كل آيةٍ جديدة تُعلّي منزلة طفلك عند الله.',
          en: 'The reciter’s rank in Paradise is at the last verse they memorize; the more they carry, the higher they rise. A powerful motivator: every new verse raises your child’s standing with Allah.',
        },
      },
      {
        type: 'callout',
        tone: 'info',
        title: { ar: 'القاعدة الذهبية', en: 'The golden rule' },
        text: {
          ar: 'المراجعة أهمّ من الحفظ الجديد. حفظٌ بلا مراجعة يتبخّر، ومراجعةٌ منتظمة تثبّت ما حُفظ مدى الحياة. اجعل قاعدتك: «قليلٌ جديد + كثيرٌ مراجعة».',
          en: 'Review matters more than new memorization. Memorizing without review evaporates; regular review locks it in for life. Make your rule: “a little new + a lot of review.”',
        },
      },
      {
        type: 'p',
        text: {
          ar: 'وأخيرًا: اصنع بيئةً محفّزة بالحبّ لا بالضغط. امدح المجهود، واحتفِ بكل سورةٍ تُختَم، واجعل الطفل يؤمّ أهله بما حفظ في نافلة. هذا بالضبط ما تبنيه حصص آية: خطّة حفظٍ ومراجعةٍ واضحة لكل طفل، مع متابعة الأهل أوّلًا بأوّل.',
          en: 'Finally: build a loving environment, not a pressured one. Praise the effort, celebrate every completed surah, and let the child lead the family in a voluntary prayer using what they memorized. This is exactly what Aya’s sessions are built on: a clear memorize-and-review plan for each child, with parents tracking progress as it happens.',
        },
      },
    ],
    related: ['review-plan-quran-retention', 'help-your-child-love-the-quran'],
    sources: [
      { ar: 'القرآن الكريم — سورة المزمل: ٤', en: 'The Noble Qur’an — Al-Muzzammil: 4', url: 'https://quran.com/73/4' },
      { ar: 'حديث «يقال لصاحب القرآن: اقرأ وارتقِ ورتّل» — حسن صحيح (أبو داود والترمذي)، الدرر السنية', en: '“It will be said to the companion of the Quran: recite and ascend” — Hasan Sahih (Abu Dawud & Tirmidhi), via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D9%8A%D9%82%D8%A7%D9%84%20%D9%84%D8%B5%D8%A7%D8%AD%D8%A8%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D8%A7%D9%82%D8%B1%D8%A3%20%D9%88%D8%A7%D8%B1%D8%AA%D9%82%20%D9%88%D8%B1%D8%AA%D9%84' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'review-plan-quran-retention',
    datePublished: '2026-06-05',
    readingTime: 6,
    categories: ['memorization'],
    emoji: '🔁',
    accent: 'info',
    tags: [
      { ar: 'مراجعة', en: 'Review' },
      { ar: 'تثبيت الحفظ', en: 'Retention' },
    ],
    title: {
      ar: 'سرّ تثبيت الحفظ: خطة المراجعة الذكية التي تمنع النسيان',
      en: 'The Secret to Retention: A Smart Review Plan That Stops Forgetting',
    },
    description: {
      ar: 'الحفظ لا يُحفظ بالإتمام مرّة، بل بالتعاهد. خطّة مراجعةٍ عملية بدوائر زمنية وتكرارٍ متباعد تجعل المحفوظ يثبت مدى الحياة.',
      en: 'Memorization isn’t kept by finishing once — it’s kept by faithful review. A practical plan with time-circles and spaced repetition that makes memorized material last for life.',
    },
    body: [
      {
        type: 'p',
        text: {
          ar: 'أكثر ما يُحبط الأهل والأطفال أن يحفظ الطفل سورةً ثم ينساها بعد أسابيع. والسبب ليس ضعف الحفظ، بل غياب المراجعة. النبي صلى الله عليه وسلم شبّه القرآن بالإبل التي تشرد بسرعةٍ إن لم تُربَط:',
          en: 'What most frustrates parents and children is a child memorizing a surah, then forgetting it weeks later. The cause isn’t weak memorization — it’s the absence of review. The Prophet (peace be upon him) likened the Quran to camels that bolt swiftly if not tethered:',
        },
      },
      {
        type: 'hadith',
        arabic: 'تَعَاهَدُوا الْقُرْآنَ؛ فَوَالَّذِي نَفْسِي بِيَدِهِ لَهُوَ أَشَدُّ تَفَصِّيًا مِنَ الْإِبِلِ فِي عُقُلِهَا',
        narrator: { ar: 'أبو موسى الأشعري رضي الله عنه', en: 'Abu Musa al-Ash‘ari (may Allah be pleased with him)' },
        source: { ar: 'صحيح البخاري (٥٠٣٣)، وأخرجه مسلم (٧٩١) — متفق عليه', en: 'Sahih al-Bukhari (5033); also Muslim (791) — agreed upon' },
        grade: { ar: 'صحيح (متفق عليه)', en: 'Sahih (agreed upon)' },
        muhaddith: 'البخاري',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D8%AA%D8%B9%D8%A7%D9%87%D8%AF%D9%88%D8%A7%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%81%D9%88%D8%A7%D9%84%D8%B0%D9%8A%20%D9%86%D9%81%D8%B3%D9%8A%20%D8%A8%D9%8A%D8%AF%D9%87%20%D9%84%D9%87%D9%88%20%D8%A3%D8%B4%D8%AF%20%D8%AA%D9%81%D8%B5%D9%8A%D8%A7',
        explanation: {
          ar: 'أمرٌ بالمداومة على مراجعة القرآن، وتشبيهٌ لتفلّته عند الإهمال بالإبل التي تهرب بسرعة من حبالها. هذا لبّ خطة المراجعة: بلا تعاهدٍ يتفلّت الحفظ مهما كان متقنًا.',
          en: 'A command to keep up reviewing the Quran, likening how it slips when neglected to camels bolting from their tethers. This is the heart of any review plan: without tending, memorization escapes — no matter how well learned.',
        },
      },
      {
        type: 'hadith',
        arabic: 'إِنَّمَا مَثَلُ صَاحِبِ الْقُرْآنِ كَمَثَلِ الْإِبِلِ الْمُعَقَّلَةِ، إِنْ عَاهَدَ عَلَيْهَا أَمْسَكَهَا، وَإِنْ أَطْلَقَهَا ذَهَبَتْ',
        narrator: { ar: 'عبد الله بن عمر رضي الله عنهما', en: 'Abdullah ibn Umar (may Allah be pleased with them both)' },
        source: { ar: 'صحيح البخاري (٥٠٣١) وصحيح مسلم (٧٨٩) — متفق عليه', en: 'Sahih al-Bukhari (5031) & Sahih Muslim (789) — agreed upon' },
        grade: { ar: 'صحيح (متفق عليه)', en: 'Sahih (agreed upon)' },
        muhaddith: 'مسلم',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D9%85%D8%AB%D9%84%20%D8%B5%D8%A7%D8%AD%D8%A8%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%83%D9%85%D8%AB%D9%84%20%D8%A7%D9%84%D8%A5%D8%A8%D9%84%20%D8%A7%D9%84%D9%85%D8%B9%D9%82%D9%84%D8%A9',
        explanation: {
          ar: 'صورةٌ عملية للأبناء: المراجعة هي «العِقال» الذي يربط المحفوظ. إن لازم الطفل تعاهده بقي معه، وإن أهمله ذهب مهما كان متقنًا.',
          en: 'A vivid image for children: review is the tether that holds memorized portions. Keep tending it and it stays; let it loose and it wanders off — however well it was once learned.',
        },
      },
      {
        type: 'p',
        text: {
          ar: 'والحفظ نعمةٌ من الله، لكنّ سنّته أن يثبّته بالتعاهد والتكرار لا بمجرّد التمنّي. طمأن الله نبيه صلى الله عليه وسلم فقال:',
          en: 'Retention is a gift from Allah, yet His way is to firm it up through review and repetition — not by wishing alone. Allah reassured His Prophet (peace be upon him):',
        },
      },
      {
        type: 'ayah',
        arabic: 'سَنُقْرِئُكَ فَلَا تَنسَىٰ',
        surah: { ar: 'سورة الأعلى — ٦', en: 'Surah Al-A‘la — 6' },
        meaning: {
          ar: 'وعدٌ من الله بأن يُقرئ نبيَّه القرآن إقراءً يثبت في صدره فلا ينساه. والحفظ نعمةٌ تُحفظ بالتلقّي والتعاهد، فاجعل المراجعة عادةً يومية لطفلك.',
          en: 'Allah’s promise to make His Prophet recite the Quran in a way that settles firmly so he will not forget it. Retention is a gift kept through receiving and faithful review — so make review a daily habit for your child.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'دوائر المراجعة الثلاث', en: 'The three review circles' },
      },
      {
        type: 'ul',
        items: [
          { ar: 'دائرة يومية: آخر ما حُفظ (راجِعه كل يوم).', en: 'Daily circle: the most recently memorized (review every day).' },
          { ar: 'دائرة أسبوعية: حفظ الشهر الحالي (وزّعه على أيام الأسبوع).', en: 'Weekly circle: this month’s memorization (spread across the week).' },
          { ar: 'دائرة شهرية: الأجزاء القديمة (راجِع جزءًا منها كل أسبوع بالتناوب).', en: 'Monthly circle: older parts (rotate through a portion each week).' },
        ],
      },
      {
        type: 'h2',
        text: { ar: 'التكرار المتباعد', en: 'Spaced repetition' },
      },
      {
        type: 'p',
        text: {
          ar: 'راجِع المقطع الجديد في نفس اليوم، ثم بعد يوم، ثم بعد ثلاثة أيام، ثم أسبوعيًّا، ثم شهريًّا. كل مراجعةٍ قبل لحظة النسيان تثبّت الحفظ أعمق، وتقلّل عدد المراجعات اللازمة لاحقًا.',
          en: 'Review a new passage the same day, then after 1 day, 3 days, weekly, then monthly. Each review just before the point of forgetting locks it in deeper and reduces how often you’ll need to repeat it later.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'اجعلها مراجعةً نشطة لا سلبية', en: 'Make review active, not passive' },
      },
      {
        type: 'ol',
        items: [
          { ar: 'لا يكتفِ الطفل بالاستماع، بل يسمّع من حفظه أمامك أو لأخيه، أو يكمل الآية التي تبدؤها له. التسميع بصوتٍ مرتفع يكشف نقاط الضعف التي تخفيها القراءة الصامتة.', en: 'Don’t let the child just listen — have them recite from memory to you or a sibling, or finish a verse you begin. Reciting aloud exposes weak spots that silent reading hides.' },
          { ar: 'اربط المراجعة بأوقاتٍ يصعب نسيانها: في الصلوات (يقرأ محفوظه)، وفي السيارة، وقبل النوم.', en: 'Anchor review to hard-to-skip moments: inside prayers (reciting memorized portions), in the car, and at bedtime.' },
          { ar: 'علّق جدولًا مرئيًّا على الحائط يلوّن فيه الطفل مربعًا بعد كل مراجعة ليرى تقدّمه.', en: 'Hang a visible wall chart where the child colors a box after each review so they see their progress.' },
        ],
      },
      {
        type: 'p',
        text: {
          ar: 'ولا تتعجّل في الحفظ الجديد على حساب التثبيت؛ فصفحةٌ واحدةٌ راسخة خيرٌ من جزءٍ مهتزّ. واجعل الدعاء بالتثبيت جزءًا من العادة، ليشعر الطفل أنّ الحفظ نعمةٌ من الله تُحفظ بالتعاهد. وفي أكاديمية آية تُبنى خطّة كل طفل على هذا التوازن: قليلٌ جديد، وكثيرٌ مُراجَع ومُثبَّت.',
          en: 'Don’t rush new memorization at the expense of consolidation; one firmly-rooted page beats a shaky whole juz’. Make du‘a for retention part of the routine, so the child feels memorization is a gift from Allah kept through faithful review. At Aya Academy each child’s plan is built on this balance: a little new, and a lot reviewed and made firm.',
        },
      },
    ],
    related: ['best-way-kids-memorize-quran', 'when-to-start-teaching-quran'],
    sources: [
      { ar: 'القرآن الكريم — سورة الأعلى: ٦، وسورة القيامة: ١٧', en: 'The Noble Qur’an — Al-A‘la: 6, Al-Qiyamah: 17', url: 'https://quran.com/87/6' },
      { ar: 'حديث «تعاهدوا القرآن...» — متفق عليه، الدرر السنية', en: '“Keep tending the Quran…” — agreed upon, via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D8%AA%D8%B9%D8%A7%D9%87%D8%AF%D9%88%D8%A7%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%81%D9%88%D8%A7%D9%84%D8%B0%D9%8A%20%D9%86%D9%81%D8%B3%D9%8A%20%D8%A8%D9%8A%D8%AF%D9%87%20%D9%84%D9%87%D9%88%20%D8%A3%D8%B4%D8%AF%20%D8%AA%D9%81%D8%B5%D9%8A%D8%A7' },
      { ar: 'حديث «مثل صاحب القرآن كمثل الإبل المعقّلة» — متفق عليه، الدرر السنية', en: '“The likeness of the companion of the Quran is the tethered camels” — agreed upon, via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D9%85%D8%AB%D9%84%20%D8%B5%D8%A7%D8%AD%D8%A8%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D9%83%D9%85%D8%AB%D9%84%20%D8%A7%D9%84%D8%A5%D8%A8%D9%84%20%D8%A7%D9%84%D9%85%D8%B9%D9%82%D9%84%D8%A9' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'parent-role-quran-journey',
    datePublished: '2026-05-28',
    readingTime: 6,
    categories: ['parenting'],
    emoji: '🤲',
    accent: 'secondary',
    tags: [
      { ar: 'دور الأهل', en: 'Parent role' },
      { ar: 'مسؤولية', en: 'Responsibility' },
    ],
    title: {
      ar: 'دور الأهل في رحلة طفلهم القرآنية: أمانةٌ لا تُفوَّض',
      en: 'The Parent’s Role in a Child’s Quran Journey: A Trust You Can’t Delegate',
    },
    description: {
      ar: 'تعليم القرآن ليس مهمّة المعلّم وحده. الطفل يتعلّم من البيت أكثر من أي حصة، وأنت «الراعي المسؤول» الأول عن هذه الأمانة.',
      en: 'Teaching the Quran is not the teacher’s job alone. A child learns more from home than from any class, and you are the first “responsible guardian” over this trust.',
    },
    body: [
      {
        type: 'p',
        text: {
          ar: 'كثيرٌ من الأهل يظنّون أنّ تعليم القرآن مهمّة المعلّم وحده. والحقيقة أنّ الطفل يتعلّم من البيت أكثر مما يتعلّم من أي حصة. الله جعل وقاية الأهل مسؤوليةً صريحة على عاتق الوالدين:',
          en: 'Many parents think teaching the Quran is the teacher’s job alone. The truth is a child learns more from home than from any single class. Allah made protecting the family an explicit responsibility on the parents:',
        },
      },
      {
        type: 'ayah',
        arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا قُوا أَنفُسَكُمْ وَأَهْلِيكُمْ نَارًا وَقُودُهَا النَّاسُ وَالْحِجَارَةُ',
        surah: { ar: 'سورة التحريم — ٦', en: 'Surah At-Tahrim — 6' },
        meaning: {
          ar: 'احفظوا أنفسكم وأهليكم من النار بطاعة الله وتعليم الأهل والأولاد الدين وتربيتهم عليه. ولاحظ: «أنفسكم» أولًا ثم «أهليكم»؛ فالقدوة قبل الأمر.',
          en: 'Guard yourselves and your families from the Fire through obeying Allah and teaching and raising your family upon the faith. Note: “yourselves” first, then “your families” — example before instruction.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'أنت راعٍ ومسؤول', en: 'You are a shepherd, and accountable' },
      },
      {
        type: 'p',
        text: {
          ar: 'هذه المسؤولية ليست شعورًا غامضًا، بل أمانةٌ ستُسأل عنها يوم القيامة. قال النبي صلى الله عليه وسلم:',
          en: 'This responsibility is not a vague feeling — it is a trust you will be asked about on the Day of Judgment. The Prophet (peace be upon him) said:',
        },
      },
      {
        type: 'hadith',
        arabic: 'كُلُّكُمْ رَاعٍ وَكُلُّكُمْ مَسْؤُولٌ عَنْ رَعِيَّتِهِ، وَالرَّجُلُ رَاعٍ فِي أَهْلِهِ وَهُوَ مَسْؤُولٌ عَنْ رَعِيَّتِهِ، وَالْمَرْأَةُ رَاعِيَةٌ فِي بَيْتِ زَوْجِهَا وَمَسْؤُولَةٌ عَنْ رَعِيَّتِهَا',
        narrator: { ar: 'عبد الله بن عمر رضي الله عنهما', en: 'Abdullah ibn Umar (may Allah be pleased with them both)' },
        source: { ar: 'متفق عليه — صحيح البخاري (٨٩٣) وصحيح مسلم (١٨٢٩)', en: 'Agreed upon — Sahih al-Bukhari (893) & Sahih Muslim (1829)' },
        grade: { ar: 'صحيح (متفق عليه)', en: 'Sahih (agreed upon)' },
        muhaddith: 'البخاري',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D9%83%D9%84%D9%83%D9%85%20%D8%B1%D8%A7%D8%B9%20%D9%88%D9%83%D9%84%D9%83%D9%85%20%D9%85%D8%B3%D8%A4%D9%88%D9%84%20%D8%B9%D9%86%20%D8%B1%D8%B9%D9%8A%D8%AA%D9%87',
        explanation: {
          ar: 'يضع الحديث الأب والأم في موضع «الراعي المسؤول»؛ فرحلة الطفل القرآنية أمانةٌ يُسأل عنها الوالدان، فتتحوّل التربية القرآنية من خيارٍ إلى مسؤولية.',
          en: 'The hadith places father and mother as “responsible guardians”; the child’s Quran journey is a trust the parents are asked about — turning Quranic upbringing from an option into a duty.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'البيت يصوغ الفطرة', en: 'The home shapes the fitrah' },
      },
      {
        type: 'p',
        text: {
          ar: 'الطفل يولد مهيّأً للخير والإيمان على الفطرة، ثم يأتي دور البيت في توجيهه. فكما يمكن أن يصرفه المحيط عن فطرته، يمكن للوالدين أن يثبّتاه عليها بالقرآن:',
          en: 'A child is born predisposed to goodness and faith upon the fitrah, then the home’s role in steering them begins. Just as the environment can pull a child away from their fitrah, parents can anchor them upon it through the Quran:',
        },
      },
      {
        type: 'hadith',
        arabic: 'مَا مِنْ مَوْلُودٍ إِلَّا يُولَدُ عَلَى الْفِطْرَةِ، فَأَبَوَاهُ يُهَوِّدَانِهِ، أَوْ يُنَصِّرَانِهِ، أَوْ يُمَجِّسَانِهِ',
        narrator: { ar: 'أبو هريرة رضي الله عنه', en: 'Abu Hurayrah (may Allah be pleased with him)' },
        source: { ar: 'متفق عليه — صحيح البخاري وصحيح مسلم', en: 'Agreed upon — Sahih al-Bukhari & Sahih Muslim' },
        grade: { ar: 'صحيح (متفق عليه)', en: 'Sahih (agreed upon)' },
        muhaddith: 'البخاري ومسلم',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D9%83%D9%84%20%D9%85%D9%88%D9%84%D9%88%D8%AF%20%D9%8A%D9%88%D9%84%D8%AF%20%D8%B9%D9%84%D9%89%20%D8%A7%D9%84%D9%81%D8%B7%D8%B1%D8%A9%20%D9%81%D8%A3%D8%A8%D9%88%D8%A7%D9%87%20%D9%8A%D9%87%D9%88%D8%AF%D8%A7%D9%86%D9%87',
        explanation: {
          ar: 'البيئة البيتية أول ما يصوغ هوية الطفل الدينية. فالسنوات الأولى وعاءٌ صافٍ، وما نملؤه به من قرآنٍ وإيمانٍ يثبت ويستقر.',
          en: 'The home is the first thing to shape a child’s religious identity. The earliest years are a pure vessel, and what we fill them with — Quran and faith — settles and endures.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'أربعة أدوار عملية تلعبها كل يوم', en: 'Four practical roles you play every day' },
      },
      {
        type: 'ul',
        items: [
          { ar: 'القدوة: لا تطلب من طفلك حفظ القرآن وأنت لا تفتح المصحف أمامه. خصّص خمس دقائق تقرأ فيها بصوتٍ مسموع بحضوره يوميًّا.', en: 'The role model: don’t ask your child to memorize while they never see you open the mushaf. Set aside five minutes of audible recitation in their presence daily.' },
          { ar: 'صانع البيئة: شغّل تلاوة قارئٍ يحبّه الطفل أثناء اللعب والطعام والسيارة؛ فتكرار السماع يحفظ الآيات في أذنه دون جهد.', en: 'The environment-builder: play a reciter the child loves during play, meals, and car rides; repeated listening fixes verses in their ear effortlessly.' },
          { ar: 'المُتابِع لا المُفوِّض: اسأل طفلك يوميًّا عمّا حفظ، واستمع لمراجعته بنفسك، وتواصل مع معلّمه أسبوعيًّا. الحلقة شريكٌ لا بديل.', en: 'The follow-up, not the delegator: ask your child daily what they memorized, listen to their review yourself, and contact the teacher weekly. The class is a partner, not a replacement.' },
          { ar: 'المُشجّع: علّق على كل سورةٍ جديدة بثناءٍ صادق ومكافأةٍ معنوية (دعاءٌ له أمام الناس، لوحة إنجاز)، وتجنّب ربط القرآن بالعقاب أو المقارنة بإخوته.', en: 'The encourager: mark each new surah with sincere praise and a meaningful reward (a public du‘a, an achievement chart), and avoid tying the Quran to punishment or comparison with siblings.' },
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        text: {
          ar: 'في لوحة وليّ الأمر بأكاديمية آية ترى تقدّم طفلك وأوسمته بنظرةٍ واحدة — متابعةٌ هادئة تعينك على دورك دون أن تثقل على الطفل.',
          en: 'In the Aya Academy parent dashboard you see your child’s progress and badges at a glance — calm tracking that supports your role without burdening the child.',
        },
      },
    ],
    related: ['virtue-of-teaching-children-quran', 'manners-from-quran-and-sunnah'],
    sources: [
      { ar: 'القرآن الكريم — سورة التحريم: ٦', en: 'The Noble Qur’an — At-Tahrim: 6', url: 'https://quran.com/66/6' },
      { ar: 'حديث «كلكم راعٍ وكلكم مسؤول عن رعيته» — متفق عليه، الدرر السنية', en: '“Each of you is a shepherd, responsible for his flock” — agreed upon, via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D9%83%D9%84%D9%83%D9%85%20%D8%B1%D8%A7%D8%B9%20%D9%88%D9%83%D9%84%D9%83%D9%85%20%D9%85%D8%B3%D8%A4%D9%88%D9%84%20%D8%B9%D9%86%20%D8%B1%D8%B9%D9%8A%D8%AA%D9%87' },
      { ar: 'حديث «كل مولود يولد على الفطرة...» — متفق عليه، الدرر السنية', en: '“Every child is born upon the fitrah…” — agreed upon, via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D9%83%D9%84%20%D9%85%D9%88%D9%84%D9%88%D8%AF%20%D9%8A%D9%88%D9%84%D8%AF%20%D8%B9%D9%84%D9%89%20%D8%A7%D9%84%D9%81%D8%B7%D8%B1%D8%A9%20%D9%81%D8%A3%D8%A8%D9%88%D8%A7%D9%87%20%D9%8A%D9%87%D9%88%D8%AF%D8%A7%D9%86%D9%87' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'manners-from-quran-and-sunnah',
    datePublished: '2026-05-20',
    readingTime: 7,
    categories: ['manners'],
    emoji: '🌸',
    accent: 'warning',
    tags: [
      { ar: 'أخلاق', en: 'Manners' },
      { ar: 'قدوة', en: 'Role model' },
    ],
    title: {
      ar: 'الأخلاق من القرآن والسنّة: من الآية إلى السلوك',
      en: 'Manners from the Quran and Sunnah: From Verse to Behavior',
    },
    description: {
      ar: 'القرآن ليس حفظًا فقط، بل خُلُقٌ يُعاش. كيف نحوّل آيات الصدق والرحمة والرفق إلى سلوكٍ يومي يراه الطفل فينا قبل أن يسمعه.',
      en: 'The Quran isn’t only memorization — it’s character lived out. How to turn verses of honesty, mercy, and gentleness into daily behavior a child sees in us before hearing it.',
    },
    body: [
      {
        type: 'p',
        text: {
          ar: 'الهدف الأكبر من تعليم القرآن ليس أن يردّد الطفل الكلمات، بل أن تتحوّل هذه الكلمات إلى خُلُق. وقد كان النبي صلى الله عليه وسلم القرآنَ ماشيًا على الأرض؛ سُئلت عائشة رضي الله عنها عن خُلُقه فأجابت بجوابٍ جامع:',
          en: 'The greatest goal of teaching the Quran is not for a child to repeat words, but for those words to become character. The Prophet (peace be upon him) was the Quran walking on the earth; when Aisha was asked about his character, she gave a sweeping answer:',
        },
      },
      {
        type: 'hadith',
        arabic: 'سُئِلَتْ عَائِشَةُ عَنْ خُلُقِ رَسُولِ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، فَقَالَتْ: كَانَ خُلُقُهُ الْقُرْآنَ',
        narrator: { ar: 'عائشة أم المؤمنين رضي الله عنها', en: 'Aisha, Mother of the Believers (may Allah be pleased with her)' },
        source: { ar: 'أصله في صحيح مسلم (٧٤٦)', en: 'Its origin is in Sahih Muslim (746)' },
        grade: { ar: 'صحيح', en: 'Sahih (authentic)' },
        muhaddith: 'صحّحه شعيب الأرناؤوط',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D9%83%D8%A7%D9%86%20%D8%AE%D9%84%D9%82%D9%87%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86',
        explanation: {
          ar: 'خُلُق النبي صلى الله عليه وسلم كان تطبيقًا حيًّا للقرآن. ومعناه للأسرة: الأخلاق ليست شعارًا يُحفظ، بل آيةٌ تُترجَم إلى سلوكٍ يراه الطفل في والديه قبل أن يسمعه.',
          en: 'The Prophet’s character was a living embodiment of the Quran. For a family it means manners are not a slogan to memorize but a verse translated into behavior the child sees in the parents before hearing it.',
        },
      },
      {
        type: 'p',
        text: {
          ar: 'وقد جعل النبي صلى الله عليه وسلم تتميم الأخلاق غايةً من غايات بعثته، فليست الأخلاق تحسينًا كماليًّا بل صميم الدين:',
          en: 'The Prophet (peace be upon him) made perfecting character one of the very aims of his mission — so manners are not an optional polish but the core of the religion:',
        },
      },
      {
        type: 'hadith',
        arabic: 'إِنَّمَا بُعِثْتُ لِأُتَمِّمَ صَالِحَ الْأَخْلَاقِ',
        narrator: { ar: 'أبو هريرة رضي الله عنه', en: 'Abu Hurayrah (may Allah be pleased with him)' },
        source: { ar: 'رواه أحمد، والبخاري في الأدب المفرد', en: 'Narrated by Ahmad, and al-Bukhari in al-Adab al-Mufrad' },
        grade: { ar: 'صحيح (إسناده جيّد)', en: 'Sahih (its chain is sound)' },
        muhaddith: 'حسّنه ابن باز وصحّحه الألباني',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D8%A5%D9%86%D9%85%D8%A7%20%D8%A8%D8%B9%D8%AB%D8%AA%20%D9%84%D8%A3%D8%AA%D9%85%D9%85%20%D8%B5%D8%A7%D9%84%D8%AD%20%D8%A7%D9%84%D8%A3%D8%AE%D9%84%D8%A7%D9%82',
        explanation: {
          ar: 'تتميم مكارم الأخلاق غايةٌ من غايات البعثة، لا أمرٌ ثانوي. فتعليم الطفل الصدق والرحمة والأدب جزءٌ أصيل من دينه، يُربّى عليه كما يُربّى على الصلاة.',
          en: 'Perfecting noble character was a core aim of the mission, not a side matter. Teaching a child honesty, mercy, and good manners is an essential part of their religion, raised on it as on prayer.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'من الآية إلى الموقف', en: 'From verse to real-life moment' },
      },
      {
        type: 'p',
        text: {
          ar: 'حُسن الخُلق يبدأ من اللسان: كلمةٌ طيبة، وصوتٌ لطيف، واحترامٌ في الخطاب. وهي قاعدةٌ عملية يسهل تعليمها للطفل في بيته:',
          en: 'Good character begins with the tongue: a kind word, a soft tone, respectful address. It is a practical rule easy to teach a child at home:',
        },
      },
      {
        type: 'ayah',
        arabic: 'وَقُولُوا لِلنَّاسِ حُسْنًا',
        surah: { ar: 'سورة البقرة — ٨٣', en: 'Surah Al-Baqarah — 83' },
        meaning: {
          ar: 'وقولوا للناس جميعًا كلامًا حسنًا طيّبًا ليّنًا. درّب طفلك على ثلاث عبارات يومية: «من فضلك»، «شكرًا»، «آسف»، ونبرةٍ هادئة.',
          en: 'Speak to all people with good, kind, gentle words. Drill three daily phrases with your child: “please,” “thank you,” “sorry,” and a calm tone.',
        },
      },
      {
        type: 'p',
        text: {
          ar: 'والأخلاق تُختبر في العلاقات: رحمةٌ بالصغير، وتوقيرٌ للكبير. وهذا درسٌ مباشر للطفل في معاملة إخوته الأصغر، ووالديه وجدّه:',
          en: 'Manners are tested in relationships: mercy to the young, respect for the elder. This is a direct lesson for a child in how to treat younger siblings, parents, and grandparents:',
        },
      },
      {
        type: 'hadith',
        arabic: 'لَيْسَ مِنَّا مَنْ لَمْ يَرْحَمْ صَغِيرَنَا، وَيُوَقِّرْ كَبِيرَنَا',
        narrator: { ar: 'عبد الله بن عمرو بن العاص رضي الله عنهما', en: 'Abdullah ibn Amr ibn al-As (may Allah be pleased with them both)' },
        source: { ar: 'رواه أبو داود والترمذي وأحمد', en: 'Narrated by Abu Dawud, al-Tirmidhi, and Ahmad' },
        grade: { ar: 'صحيح', en: 'Sahih (authentic)' },
        muhaddith: 'صحّحه الألباني',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D9%84%D9%8A%D8%B3%20%D9%85%D9%86%D8%A7%20%D9%85%D9%86%20%D9%84%D9%85%20%D9%8A%D8%B1%D8%AD%D9%85%20%D8%B5%D8%BA%D9%8A%D8%B1%D9%86%D8%A7%20%D9%88%D9%8A%D9%88%D9%82%D8%B1%20%D9%83%D8%A8%D9%8A%D8%B1%D9%86%D8%A7',
        explanation: {
          ar: 'حسن الخُلق سلوكٌ تجاه الناس بأعمارهم المختلفة، لا مجرّد كلامٍ مهذّب. اجعل رحمة الصغير وتوقير الكبير مهمّةً عمليّة يطبّقها طفلك أسبوعيًّا.',
          en: 'Good character is behavior toward people of every age, not merely polite words. Make mercy to the young and respect for the elder a weekly practical task your child carries out.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'أربع قواعد لتثبيت الخُلُق', en: 'Four rules to anchor a manner' },
      },
      {
        type: 'ol',
        items: [
          { ar: 'سمِّ السلوك لحظة حدوثه: حين يصدق قل «هذا الصدق الذي يحبّه الله»، وحين يشارك لعبته قل «هذه الرحمة». التسمية الفورية تحوّل النصّ إلى سلوكٍ محسوس.', en: 'Name the behavior the moment it happens: when they tell the truth, say “this is the honesty Allah loves”; when they share, say “this is mercy.” Naming it on the spot turns text into felt behavior.' },
          { ar: 'كن أنت الآية المتحرّكة: اعتذر أمام طفلك إذا أخطأت، واخفض صوتك عند الغضب، وقل «شكرًا» للبائع. سلوكك يومًا واحدًا أبلغ من شهر مواعظ.', en: 'Be the walking ayah: apologize in front of your child when you err, lower your voice when angry, say “thank you” to the cashier. One day of your behavior outweighs a month of lectures.' },
          { ar: 'صحّح في الخلوة وامدح أمام الناس: لا تفضح الطفل إذا أساء، بل ذكّره جانبًا بهدوء؛ وإذا أحسن فامدحه أمام الجميع.', en: 'Correct in private, praise in public: don’t shame a child for misbehaving — remind them aside, calmly; when they do well, praise them before everyone.' },
          { ar: 'اختر «خُلُق الأسبوع» واحدًا فقط (الصدق، ثم الأمانة، ثم الرفق)، وركّز عليه سبعة أيام بقصةٍ قبل النوم ولوحة نجوم. التركيز على خُلُقٍ واحد يمنع التشتّت.', en: 'Pick just one “manner of the week” (honesty, then trustworthiness, then gentleness), and focus on it for seven days with a bedtime story and a star chart. One trait at a time prevents overload.' },
        ],
      },
      {
        type: 'p',
        text: {
          ar: 'في أكاديمية آية نربط كل حصة قرآن بقيمةٍ خُلُقية وألعاب آداب، حتى ينمو الطفل علمًا وخُلُقًا في آنٍ واحد — فالقرآن نورٌ في السلوك لا حفظٌ في الذاكرة فقط.',
          en: 'At Aya Academy we tie every Quran session to a value and manners games, so a child grows in knowledge and character at once — the Quran as light in behavior, not just memory in the mind.',
        },
      },
    ],
    related: ['teaching-children-dua-and-dhikr', 'parent-role-quran-journey'],
    sources: [
      { ar: 'القرآن الكريم — سورة القلم: ٤، وسورة البقرة: ٨٣', en: 'The Noble Qur’an — Al-Qalam: 4, Al-Baqarah: 83', url: 'https://quran.com/68/4' },
      { ar: 'حديث «كان خُلُقه القرآن» — أصله في صحيح مسلم (٧٤٦)، الدرر السنية', en: '“His character was the Quran” — origin in Sahih Muslim (746), via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D9%83%D8%A7%D9%86%20%D8%AE%D9%84%D9%82%D9%87%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86' },
      { ar: 'حديث «إنما بُعثت لأتمم صالح الأخلاق» — صحيح، الدرر السنية', en: '“I was sent to perfect good character” — authentic, via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D8%A5%D9%86%D9%85%D8%A7%20%D8%A8%D8%B9%D8%AB%D8%AA%20%D9%84%D8%A3%D8%AA%D9%85%D9%85%20%D8%B5%D8%A7%D9%84%D8%AD%20%D8%A7%D9%84%D8%A3%D8%AE%D9%84%D8%A7%D9%82' },
      { ar: 'حديث «ليس منا من لم يرحم صغيرنا...» — صحيح، الدرر السنية', en: '“He is not one of us who does not show mercy to our young…” — authentic, via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D9%84%D9%8A%D8%B3%20%D9%85%D9%86%D8%A7%20%D9%85%D9%86%20%D9%84%D9%85%20%D9%8A%D8%B1%D8%AD%D9%85%20%D8%B5%D8%BA%D9%8A%D8%B1%D9%86%D8%A7%20%D9%88%D9%8A%D9%88%D9%82%D8%B1%20%D9%83%D8%A8%D9%8A%D8%B1%D9%86%D8%A7' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'teaching-children-dua-and-dhikr',
    datePublished: '2026-05-12',
    readingTime: 6,
    categories: ['dua'],
    emoji: '📿',
    accent: 'primary',
    tags: [
      { ar: 'دعاء', en: 'Dua' },
      { ar: 'أذكار', en: 'Adhkar' },
    ],
    title: {
      ar: 'الدعاء والأذكار: كنزٌ نُعلّمه أطفالنا',
      en: 'Du‘a and Dhikr: A Treasure We Teach Our Children',
    },
    description: {
      ar: 'النبي صلى الله عليه وسلم علّم الأطفال الدعاء والذكر بكلماتٍ بسيطة في مواقف يومية. كيف نزرع تعلّق القلب بالله مبكّرًا بأذكارٍ يحبّها الطفل.',
      en: 'The Prophet (peace be upon him) taught children du‘a and dhikr in simple words at everyday moments. How to plant an early attachment of the heart to Allah through adhkar a child loves.',
    },
    body: [
      {
        type: 'p',
        text: {
          ar: 'من أعظم ما نهديه لأطفالنا أن نعلّمهم كيف يطرقون باب الله مبكّرًا. والدعاء عبادةٌ أمر الله بها ووعد بالإجابة عليها، فحين نعلّم الطفل أن يدعو، نربطه بربٍّ قريبٍ يسمع ويجيب:',
          en: 'Among the greatest gifts we give our children is teaching them to knock on Allah’s door early. Du‘a is an act of worship Allah commanded, promising to answer it; when we teach a child to call upon Allah, we connect them to a Lord who is near, hears, and answers:',
        },
      },
      {
        type: 'ayah',
        arabic: 'وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ',
        surah: { ar: 'سورة غافر — ٦٠', en: 'Surah Ghafir — 60' },
        meaning: {
          ar: 'أمرٌ من الله لعباده أن يدعوه وحده، ووعدٌ منه بالإجابة. علّم طفلك أن يدعو الله بحاجاته الصغيرة بكلماته هو، فيشعر أن الله قريبٌ يسمعه.',
          en: 'A command from Allah that His servants call upon Him alone, with His promise to respond. Teach your child to ask Allah for their small needs in their own words, so they feel Allah is near and hears them.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'النبي ﷺ علّم الأطفال مباشرةً', en: 'The Prophet ﷺ taught children directly' },
      },
      {
        type: 'p',
        text: {
          ar: 'أجمل ما في تعليم الأذكار للأطفال أنّ النبي صلى الله عليه وسلم فعله بنفسه مع الصغار. خاطب ابنَ عباس وهو غلامٌ صغير بأسلوبٍ محبّب، وغرس فيه أعظم عقيدة بكلماتٍ يحفظها الطفل:',
          en: 'The most beautiful thing about teaching children adhkar is that the Prophet (peace be upon him) did it himself with the young. He addressed Ibn Abbas as a small boy lovingly, planting in him the greatest creed through words a child can memorize:',
        },
      },
      {
        type: 'hadith',
        arabic: 'يَا غُلَامُ إِنِّي أُعَلِّمُكَ كَلِمَاتٍ: احْفَظِ اللَّهَ يَحْفَظْكَ، احْفَظِ اللَّهَ تَجِدْهُ تُجَاهَكَ، إِذَا سَأَلْتَ فَاسْأَلِ اللَّهَ، وَإِذَا اسْتَعَنْتَ فَاسْتَعِنْ بِاللَّهِ',
        narrator: { ar: 'عبد الله بن عباس رضي الله عنهما', en: 'Abdullah ibn Abbas (may Allah be pleased with them both)' },
        source: { ar: 'سنن الترمذي', en: 'Sunan al-Tirmidhi' },
        grade: { ar: 'صحيح', en: 'Sahih (authentic)' },
        muhaddith: 'صحّحه الألباني في صحيح الترمذي',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D9%8A%D8%A7%20%D8%BA%D9%84%D8%A7%D9%85%20%D8%A5%D9%86%D9%8A%20%D8%A3%D8%B9%D9%84%D9%85%D9%83%20%D9%83%D9%84%D9%85%D8%A7%D8%AA%20%D8%A7%D8%AD%D9%81%D8%B8%20%D8%A7%D9%84%D9%84%D9%87%20%D9%8A%D8%AD%D9%81%D8%B8%D9%83',
        explanation: {
          ar: 'خاطب النبيُّ الطفلَ بأسلوبٍ مباشرٍ محبّب «يا غلام»، وعلّمه عقيدة التوكّل والدعاء: أن يسأل الله وحده ويستعين به. أصلٌ عظيم: العقائد الكبرى تُغرَس مبكّرًا بكلماتٍ بسيطة محفوظة.',
          en: 'The Prophet addressed the child directly and lovingly (“O boy”), teaching him the creed of reliance and du‘a: to ask Allah alone and seek His help. A great foundation: the greatest beliefs are planted early through simple memorable words.',
        },
      },
      {
        type: 'p',
        text: {
          ar: 'وعلّم النبيُّ صلى الله عليه وسلم الطفلَ عمر بن أبي سلمة أدب الطعام بربط الذكر بلحظةٍ يومية متكرّرة:',
          en: 'And the Prophet (peace be upon him) taught the child Umar ibn Abi Salamah the manners of eating by tying dhikr to a recurring daily moment:',
        },
      },
      {
        type: 'hadith',
        arabic: 'يَا غُلَامُ، سَمِّ اللَّهَ، وَكُلْ بِيَمِينِكَ، وَكُلْ مِمَّا يَلِيكَ',
        narrator: { ar: 'عمر بن أبي سلمة رضي الله عنه', en: 'Umar ibn Abi Salamah (may Allah be pleased with him)' },
        source: { ar: 'متفق عليه — صحيح البخاري (٥٣٧٦) وصحيح مسلم (٢٠٢٢)', en: 'Agreed upon — Sahih al-Bukhari (5376) & Sahih Muslim (2022)' },
        grade: { ar: 'صحيح (متفق عليه)', en: 'Sahih (agreed upon)' },
        muhaddith: 'البخاري ومسلم',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D9%8A%D8%A7%20%D8%BA%D9%84%D8%A7%D9%85%20%D8%B3%D9%85%20%D8%A7%D9%84%D9%84%D9%87%20%D9%88%D9%83%D9%84%20%D8%A8%D9%8A%D9%85%D9%8A%D9%86%D9%83%20%D9%88%D9%83%D9%84%20%D9%85%D9%85%D8%A7%20%D9%8A%D9%84%D9%8A%D9%83',
        explanation: {
          ar: 'ربط النبيُّ الذكرَ بلحظة الأكل المتكرّرة، فتعلّم الطفل «بسم الله» في موقفٍ حيّ. درسٌ عملي: علّم الأطفال الأذكار من خلال المواقف اليومية لا التلقين المجرّد.',
          en: 'The Prophet tied dhikr to the recurring moment of eating, so the child learned “Bismillah” in a living context. A practical lesson: teach children adhkar through everyday situations, not abstract drilling.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'كيف تزرع الأذكار في يوم طفلك', en: 'How to plant dhikr in your child’s day' },
      },
      {
        type: 'ul',
        items: [
          { ar: 'اربط الذكر بمواقف اليوم: «بسم الله» عند الأكل، «الحمد لله» عند العطاس، ودعاء النوم والاستيقاظ، ودعاء دخول الخلاء والخروج منه. الطفل يحفظ ما يتكرّر في سياقٍ حيّ.', en: 'Tie dhikr to daily moments: “Bismillah” at eating, “Alhamdulillah” at sneezing, the du‘as for sleeping and waking, and for entering and leaving the bathroom. A child memorizes what recurs in a living context.' },
          { ar: 'ابدأ بدعاءٍ واحد قصير كل أسبوع لا قائمةً طويلة. كرّره أمام الطفل في وقته الطبيعي حتى تسمعه يردّده تلقائيًّا، ثم انتقل لغيره.', en: 'Start with one short du‘a per week, not a long list. Say it in front of the child at its natural moment until you hear them repeat it on their own, then move to the next.' },
          { ar: 'كن أنت القدوة المسموعة: سمِّ عند الطعام، وقل دعاء الركوب في السيارة، واستعذ عند الغضب. الأطفال يقلّدون ما يرونه يُمارَس.', en: 'Be the audible role model: say Bismillah at food, the travel du‘a in the car, seek refuge when angry. Children imitate what they see practiced.' },
          { ar: 'استثمر وقت النوم: اجعل آخر ما يسمعه الطفل أذكار النوم وآية الكرسي والمعوّذتين، مع شرحٍ بسيط أنها «حمايةٌ من الله». الربط بالأمان يجعل الذكر محبوبًا.', en: 'Use bedtime: make the last thing the child hears the sleep adhkar, Ayat al-Kursi, and the two Mu‘awwidhatayn, with a simple note that they are “protection from Allah.” Linking it to safety makes dhikr beloved.' },
          { ar: 'حوّل الذكر إلى لعبةٍ ومكافأة لا إلى تأنيب: لوحة نجوم عند المداومة على دعاءٍ معيّن، أو سؤال «من يتذكّر دعاء الطعام اليوم؟».', en: 'Turn dhikr into a game and a reward, not scolding: a star chart for sticking with a chosen du‘a, or asking “Who remembers the food du‘a today?”' },
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        text: {
          ar: 'علّم طفلك أن يدعو الله بحاجاته الصغيرة بكلماته: «يا ربّ أنجِحني»، «يا ربّ اشفِ جدّتي». بهذا تتحوّل آية ﴿ادْعُونِي أَسْتَجِبْ لَكُمْ﴾ من فكرةٍ مجرّدة إلى عقيدةٍ يعيشها.',
          en: 'Teach your child to ask Allah for their small needs in their words: “O Allah, help me succeed,” “O Allah, heal my grandmother.” This turns “Call upon Me, I will respond” from an abstract idea into a lived creed.',
        },
      },
      {
        type: 'p',
        text: {
          ar: 'في أكاديمية آية نجعل الأذكار جزءًا من رحلة الطفل، نربطها بالقرآن وبمواقف يومه، حتى ينشأ قلبُه معلّقًا بالله، داعيًا ذاكرًا في فرحه وحاجته.',
          en: 'At Aya Academy we make adhkar part of the child’s journey, tying them to the Quran and to the moments of their day, so their heart grows attached to Allah — supplicating and remembering Him in joy and in need.',
        },
      },
    ],
    related: ['manners-from-quran-and-sunnah', 'when-to-start-teaching-quran'],
    sources: [
      { ar: 'القرآن الكريم — سورة غافر: ٦٠، وسورة الفرقان: ٧٤', en: 'The Noble Qur’an — Ghafir: 60, Al-Furqan: 74', url: 'https://quran.com/40/60' },
      { ar: 'حديث «يا غلام إني أعلّمك كلمات: احفظ الله يحفظك» — صحيح (الترمذي)، الدرر السنية', en: '“O boy, I will teach you words: be mindful of Allah and He will protect you” — Sahih (Tirmidhi), via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D9%8A%D8%A7%20%D8%BA%D9%84%D8%A7%D9%85%20%D8%A5%D9%86%D9%8A%20%D8%A3%D8%B9%D9%84%D9%85%D9%83%20%D9%83%D9%84%D9%85%D8%A7%D8%AA%20%D8%A7%D8%AD%D9%81%D8%B8%20%D8%A7%D9%84%D9%84%D9%87%20%D9%8A%D8%AD%D9%81%D8%B8%D9%83' },
      { ar: 'حديث «يا غلام سمِّ الله وكل بيمينك» — متفق عليه، الدرر السنية', en: '“O boy, say Bismillah and eat with your right hand” — agreed upon, via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D9%8A%D8%A7%20%D8%BA%D9%84%D8%A7%D9%85%20%D8%B3%D9%85%20%D8%A7%D9%84%D9%84%D9%87%20%D9%88%D9%83%D9%84%20%D8%A8%D9%8A%D9%85%D9%8A%D9%86%D9%83%20%D9%88%D9%83%D9%84%20%D9%85%D9%85%D8%A7%20%D9%8A%D9%84%D9%8A%D9%83' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'when-to-start-teaching-quran',
    datePublished: '2026-05-04',
    readingTime: 6,
    categories: ['tips'],
    emoji: '🌱',
    accent: 'success',
    tags: [
      { ar: 'متى نبدأ', en: 'When to start' },
      { ar: 'تدرّج', en: 'Gradual' },
    ],
    title: {
      ar: 'متى نبدأ تحفيظ القرآن للطفل ومن أين؟ خطة عملية حسب العمر',
      en: 'When and Where to Start Teaching Your Child the Quran: An Age-by-Age Plan',
    },
    description: {
      ar: 'لا تنتظر «حتى يكبر». خطّة متدرّجة حسب العمر — من التعريض السمعي إلى التلقين المنظَّم — على نهج لقمان في تعليم ابنه بالحنان لا القسوة.',
      en: 'Don’t wait “until they grow up.” An age-staged plan — from passive listening to structured talqin — modeled on Luqman teaching his son with tenderness, not harshness.',
    },
    body: [
      {
        type: 'p',
        text: {
          ar: 'السؤال الذي يتردّد على كل والد: «متى أبدأ؟ وهل طفلي صغيرٌ على القرآن؟». والجواب: ابدأ الآن، لكن بما يناسب عمره. الطفل يولد على الفطرة، والسنوات الأولى وعاءٌ صافٍ، فما نملؤه به يثبت ويستقرّ — ولهذا لا ننتظر حتى يكبر:',
          en: 'The question every parent asks: “When do I start? Is my child too young for the Quran?” The answer: start now, but with what suits their age. A child is born upon the fitrah, and the earliest years are a pure vessel — what we fill them with settles and endures. That is why we don’t wait until they grow up:',
        },
      },
      {
        type: 'hadith',
        arabic: 'مَا مِنْ مَوْلُودٍ إِلَّا يُولَدُ عَلَى الْفِطْرَةِ',
        narrator: { ar: 'أبو هريرة رضي الله عنه', en: 'Abu Hurayrah (may Allah be pleased with him)' },
        source: { ar: 'صحيح مسلم (٢٦٥٨)', en: 'Sahih Muslim (2658)' },
        grade: { ar: 'صحيح', en: 'Sahih (authentic)' },
        muhaddith: 'مسلم',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D9%83%D9%84%20%D9%85%D9%88%D9%84%D9%88%D8%AF%20%D9%8A%D9%88%D9%84%D8%AF%20%D8%B9%D9%84%D9%89%20%D8%A7%D9%84%D9%81%D8%B7%D8%B1%D8%A9%20%D9%81%D8%A3%D8%A8%D9%88%D8%A7%D9%87%20%D9%8A%D9%87%D9%88%D8%AF%D8%A7%D9%86%D9%87',
        explanation: {
          ar: 'كل طفلٍ يولد على الفطرة السليمة ثم يصوغه أبواه. أقوى حافزٍ للبدء مبكّرًا: ما نملأ به السنوات الأولى من قرآنٍ وإيمانٍ يثبت ويستقرّ.',
          en: 'Every child is born upon a sound disposition, then the parents shape it. The strongest motive to start early: what we fill the first years with — Quran and faith — settles and endures.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'قدوتنا: لقمان وهو يعلّم ابنه', en: 'Our model: Luqman teaching his son' },
      },
      {
        type: 'p',
        text: {
          ar: 'صوّر القرآن لقمان وهو يعلّم ابنه بأسلوب الموعظة الرفيقة، فبدأ بأهمّ شيء (التوحيد) بنداء الحنان «يا بُنيّ» الذي يفتح قلب الطفل قبل عقله:',
          en: 'The Quran portrays Luqman teaching his son through gentle admonition, beginning with the most important matter (tawhid) with the tender address “O my dear son,” which opens the child’s heart before their mind:',
        },
      },
      {
        type: 'ayah',
        arabic: 'وَإِذْ قَالَ لُقْمَانُ لِابْنِهِ وَهُوَ يَعِظُهُ يَا بُنَيَّ لَا تُشْرِكْ بِاللَّهِ إِنَّ الشِّرْكَ لَظُلْمٌ عَظِيمٌ',
        surah: { ar: 'سورة لقمان — ١٣', en: 'Surah Luqman — 13' },
        meaning: {
          ar: 'يعظ لقمانُ ابنه بحنانٍ فيبدأ بالأصل الأعظم: توحيد الله. وهذا نموذج الأب المربّي: يبدأ بالأصول الكبرى بلطفٍ لا بقسوة، وبالموعظة لا بالتوبيخ.',
          en: 'Luqman counsels his son tenderly, beginning with the greatest foundation: the Oneness of Allah. This is the model parent-teacher: starting with the great fundamentals gently, with admonition rather than scolding.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'خطّة عملية حسب العمر', en: 'A practical age-by-age plan' },
      },
      {
        type: 'ol',
        items: [
          { ar: 'من الميلاد إلى ٣ سنوات — التعريض السمعي: شغّل تلاوةً هادئة بصوت قارئٍ واحدٍ ثابت وقت النوم والهدوء (١٠–١٥ دقيقة). الأذن تختزن النغمة قبل أن ينطق اللسان. لا تطلب حفظًا بعد، فقط بيئةٌ يطفو فيها القرآن.', en: 'Birth to 3 — passive listening: play calm recitation by one consistent reciter at sleep and quiet times (10–15 min). The ear stores the melody before the tongue speaks. Don’t ask for memorization yet — just an environment where the Quran is always present.' },
          { ar: 'من ٤ إلى ٦ سنوات — التلقين بالمشافهة: آيةٌ أو نصف آية في اليوم تكرّرها معه ٥ مرّات، واختر قِصار المفصّل (الناس، الفلق، الإخلاص، الكوثر). القاعدة: قطعةٌ صغيرة جدًّا + تكرارٌ يومي ثابت.', en: 'Ages 4–6 — oral talqin: one ayah or half an ayah a day, repeated with them 5 times, choosing the short surahs (an-Nas, al-Falaq, al-Ikhlas, al-Kawthar). The rule: a very small piece + steady daily repetition.' },
          { ar: 'من ٧ سنوات — الانطلاق المنظَّم: مع تعليمه الصلاة، اربط بين السورة والعبادة: «نحفظ سورةً لنقرأها في الصلاة». هذا يعطي الحفظ هدفًا عمليًّا فوريًّا يراه الطفل.', en: 'From age 7 — structured start: as you teach prayer, link each surah to worship: “we memorize a surah to recite it in salah.” This gives memorization an immediate, visible purpose.' },
        ],
      },
      {
        type: 'p',
        text: {
          ar: 'ولماذا السابعة تحديدًا نقطةَ انطلاقٍ منظَّمة؟ لأنّ النبي صلى الله عليه وسلم ربط بها بداية التدريب على الصلاة، وهي وعاءٌ للقرآن:',
          en: 'Why age seven as the structured starting point? Because the Prophet (peace be upon him) tied the start of prayer-training to it, and prayer is a vessel for the Quran:',
        },
      },
      {
        type: 'hadith',
        arabic: 'مُرُوا أَوْلَادَكُمْ بِالصَّلَاةِ وَهُمْ أَبْنَاءُ سَبْعِ سِنِينَ، وَاضْرِبُوهُمْ عَلَيْهَا وَهُمْ أَبْنَاءُ عَشْرِ سِنِينَ، وَفَرِّقُوا بَيْنَهُمْ فِي الْمَضَاجِعِ',
        narrator: { ar: 'عبد الله بن عمرو بن العاص رضي الله عنهما', en: 'Abdullah ibn Amr ibn al-As (may Allah be pleased with them both)' },
        source: { ar: 'سنن أبي داود (٤٩٥)', en: 'Sunan Abi Dawud (495)' },
        grade: { ar: 'حسن صحيح', en: 'Hasan Sahih (sound & authentic)' },
        muhaddith: 'صحّحه الألباني',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D9%85%D8%B1%D9%88%D8%A7%20%D8%A3%D9%88%D9%84%D8%A7%D8%AF%D9%83%D9%85%20%D8%A8%D8%A7%D9%84%D8%B5%D9%84%D8%A7%D8%A9%20%D9%88%D9%87%D9%85%20%D8%A3%D8%A8%D9%86%D8%A7%D8%A1%20%D8%B3%D8%A8%D8%B9%20%D8%B3%D9%86%D9%8A%D9%86',
        explanation: {
          ar: 'أصلٌ في التربية بالتدرّج حسب العمر: نأمر الطفل بالصلاة عند السابعة أمرَ تدريبٍ ولطفٍ لا إلزامٍ وعقاب — فالعمل لا يجب عليه قبل البلوغ، لكنّ التعويد يبدأ مبكّرًا لتترسّخ العادة قبل التكليف. ونفس المبدأ يُطبَّق على القرآن: ابدأ مبكّرًا بالحبّ والتعويد.',
          en: 'A foundation for age-staged upbringing: at seven we direct the child to prayer as gentle training, not coercion and punishment — the act is not yet obligatory upon them before puberty, but habituation begins early so the habit takes root before the duty falls due. The same principle applies to the Quran: start early through love and habituation.',
        },
      },
      {
        type: 'callout',
        tone: 'warn',
        title: { ar: 'القرآن يُحبَّب ولا يُكرَّه', en: 'The Quran is endeared, never forced' },
        text: {
          ar: 'لا تضرب الطفل على التحفيظ أبدًا. حتى ما ورد في الحديث محصورٌ في الصلاة بعد العاشرة، بعد ثلاث سنواتٍ من التدريب اللطيف. اقتدِ بأسلوب لقمان: ابدأ كل جلسةٍ بنداء الحنان وبالموعظة لا بالتوبيخ.',
          en: 'Never strike a child over memorization. Even what the hadith mentions is limited to prayer after age ten, following three years of gentle training. Follow Luqman’s method: open each session with a tender address and admonition, not scolding.',
        },
      },
      {
        type: 'p',
        text: {
          ar: 'وأخيرًا: ثبّت المحفوظ بالمراجعة قبل الزيادة، واربط القرآن بالعاطفة والمكافأة لا بالضغط، وكن أنت القدوة التي يراها الطفل تقرأ. في أكاديمية آية نبني لكل طفلٍ خطّةً تناسب عمره وقدرته، تبدأ من حيث هو، وتتدرّج به بثبات.',
          en: 'Finally: anchor what’s learned by reviewing before adding more, tie the Quran to warmth and reward rather than pressure, and be the model your child sees reading. At Aya Academy we build each child a plan that fits their age and ability, starting where they are and progressing steadily.',
        },
      },
    ],
    related: ['best-way-kids-memorize-quran', 'parent-role-quran-journey'],
    sources: [
      { ar: 'القرآن الكريم — سورة لقمان: ١٣ و١٧', en: 'The Noble Qur’an — Luqman: 13 & 17', url: 'https://quran.com/31/13' },
      { ar: 'حديث «كل مولود يولد على الفطرة» — صحيح مسلم، الدرر السنية', en: '“Every child is born upon the fitrah” — Sahih Muslim, via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D9%83%D9%84%20%D9%85%D9%88%D9%84%D9%88%D8%AF%20%D9%8A%D9%88%D9%84%D8%AF%20%D8%B9%D9%84%D9%89%20%D8%A7%D9%84%D9%81%D8%B7%D8%B1%D8%A9%20%D9%81%D8%A3%D8%A8%D9%88%D8%A7%D9%87%20%D9%8A%D9%87%D9%88%D8%AF%D8%A7%D9%86%D9%87' },
      { ar: 'حديث «مروا أولادكم بالصلاة وهم أبناء سبع» — حسن صحيح (أبو داود)، الدرر السنية', en: '“Command your children to pray at seven” — Hasan Sahih (Abu Dawud), via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D9%85%D8%B1%D9%88%D8%A7%20%D8%A3%D9%88%D9%84%D8%A7%D8%AF%D9%83%D9%85%20%D8%A8%D8%A7%D9%84%D8%B5%D9%84%D8%A7%D8%A9%20%D9%88%D9%87%D9%85%20%D8%A3%D8%A8%D9%86%D8%A7%D8%A1%20%D8%B3%D8%A8%D8%B9%20%D8%B3%D9%86%D9%8A%D9%86' },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  {
    slug: 'screen-time-into-learning',
    datePublished: '2026-04-26',
    readingTime: 5,
    categories: ['tips'],
    emoji: '🎮',
    accent: 'info',
    tags: [
      { ar: 'وقت الشاشة', en: 'Screen time' },
      { ar: 'تعلّم تفاعلي', en: 'Interactive learning' },
    ],
    title: {
      ar: 'حوّل وقت الشاشة إلى وقت تعلّم',
      en: 'Turn Screen Time Into Learning Time',
    },
    description: {
      ar: 'الشاشة ليست عدوًّا إذا أحسنّا توجيهها. وقت طفلك أمانة، فكيف نحوّل دقائق اللعب إلى دقائق تعلّم قرآنٍ وعربيةٍ وعلمٍ نافع؟',
      en: 'Screens aren’t the enemy when guided well. Your child’s time is a trust — so how do we turn minutes of play into minutes of learning Quran, Arabic, and beneficial knowledge?',
    },
    body: [
      {
        type: 'p',
        text: {
          ar: 'الأطفال اليوم يولدون في عالم الشاشات. وبدل أن نحارب الشاشة حربًا خاسرة، نستطيع توجيهها لتصبح أداة تعلّم. والوقت في ميزان الإسلام رأس مالٍ لا يُعوّض؛ أقسم الله به في سورةٍ كاملة:',
          en: 'Children today are born into a world of screens. Instead of fighting a losing battle against the screen, we can steer it into a learning tool. In Islam, time is irreplaceable capital — Allah swore by it in an entire surah:',
        },
      },
      {
        type: 'ayah',
        arabic: 'وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ ۝ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ',
        surah: { ar: 'سورة العصر — ١–٣', en: 'Surah Al-Asr — 1-3' },
        meaning: {
          ar: 'يقسم الله بالزمن أنّ الإنسان في خسارة، إلا من جمع الإيمان والعمل الصالح والتواصي بالحق والصبر. الوقت الذي يُملأ بالنافع رِبح، والذي يُهدر في اللهو خسارة — وهذا جوهر مسألة وقت الشاشة.',
          en: 'Allah swears by time that mankind is in loss, except those who believe, do good, and counsel one another to truth and patience. Time filled with benefit is profit; time wasted in idleness is loss — the very heart of the screen-time question.',
        },
      },
      {
        type: 'p',
        text: {
          ar: 'ووقت الطفل أمامك أمانة، وأنت «الراعي المسؤول» عمّا يدخل بيته وعقله. والنبي صلى الله عليه وسلم نبّه أنّ الفراغ نعمةٌ يغبن فيها كثيرٌ من الناس:',
          en: 'Your child’s time is a trust, and you are the “responsible guardian” over what enters their home and mind. The Prophet (peace be upon him) warned that free time is a blessing many people squander:',
        },
      },
      {
        type: 'hadith',
        arabic: 'نِعْمَتَانِ مَغْبُونٌ فِيهِمَا كَثِيرٌ مِنَ النَّاسِ: الصِّحَّةُ وَالْفَرَاغُ',
        narrator: { ar: 'عبد الله بن عباس رضي الله عنهما', en: 'Abdullah ibn Abbas (may Allah be pleased with them both)' },
        source: { ar: 'صحيح البخاري (٦٤١٢)', en: 'Sahih al-Bukhari (6412)' },
        grade: { ar: 'صحيح', en: 'Sahih (authentic)' },
        muhaddith: 'البخاري',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D9%86%D8%B9%D9%85%D8%AA%D8%A7%D9%86%20%D9%85%D8%BA%D8%A8%D9%88%D9%86%20%D9%81%D9%8A%D9%87%D9%85%D8%A7%20%D9%83%D8%AB%D9%8A%D8%B1%20%D9%85%D9%86%20%D8%A7%D9%84%D9%86%D8%A7%D8%B3%20%D8%A7%D9%84%D8%B5%D8%AD%D8%A9%20%D9%88%D8%A7%D9%84%D9%81%D8%B1%D8%A7%D8%BA',
        explanation: {
          ar: 'وقت الطفل أمام الشاشة هو عين هذا «الفراغ»: إن لم نملأه بنافعٍ ضاع، وإن وجّهناه ربح الطفل وقته وصحته معًا.',
          en: 'A child’s hours before a screen are exactly this “free time”: left empty it is lost; directed to benefit, the child gains both their time and their health.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'لماذا تنجح الألعاب التعليمية', en: 'Why learning games work' },
      },
      {
        type: 'p',
        text: {
          ar: 'اللعبة تمنح الطفل تغذيةً راجعة فورية ومكافأةً صغيرة على كل خطوةٍ صحيحة. هذا بالضبط ما يحتاجه الدماغ ليبقى متحفّزًا، وهو ما تفتقده طرق الحفظ التقليدية أحيانًا. والمفتاح هو نوع المحتوى، لا الجهاز نفسه. وحين يكون «الطريق» علمًا نافعًا فهو طريقٌ إلى الجنة:',
          en: 'A game gives a child instant feedback and a small reward for every correct step — exactly what the brain needs to stay motivated, something traditional methods sometimes lack. The key is the type of content, not the device itself. And when the “path” is beneficial knowledge, it is a path to Paradise:',
        },
      },
      {
        type: 'hadith',
        arabic: 'وَمَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا، سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ',
        narrator: { ar: 'أبو هريرة رضي الله عنه', en: 'Abu Hurayrah (may Allah be pleased with him)' },
        source: { ar: 'صحيح مسلم (٢٦٩٩)', en: 'Sahih Muslim (2699)' },
        grade: { ar: 'صحيح', en: 'Sahih (authentic)' },
        muhaddith: 'مسلم',
        dorarUrl: 'https://dorar.net/hadith/search?q=%D9%85%D9%86%20%D8%B3%D9%84%D9%83%20%D8%B7%D8%B1%D9%8A%D9%82%D8%A7%20%D9%8A%D9%84%D8%AA%D9%85%D8%B3%20%D9%81%D9%8A%D9%87%20%D8%B9%D9%84%D9%85%D8%A7%20%D8%B3%D9%87%D9%84%20%D8%A7%D9%84%D9%84%D9%87%20%D9%84%D9%87%20%D8%B7%D8%B1%D9%8A%D9%82%D8%A7%20%D8%A5%D9%84%D9%89%20%D8%A7%D9%84%D8%AC%D9%86%D8%A9',
        explanation: {
          ar: '«الطريق» اليوم قد يكون شاشةً تُحسن توجيهها. فحين نحوّل الجهاز إلى أداةٍ لتعلّم القرآن والعربية والعلم النافع، يصير وقت الشاشة خطوةً على طريق الجنة لا على طريق الضياع.',
          en: 'Today that “path” may be a well-directed screen. When we turn the device into a tool for learning Quran, Arabic, and beneficial knowledge, screen time becomes a step toward Paradise rather than toward waste.',
        },
      },
      {
        type: 'h2',
        text: { ar: 'كيف تحوّل الشاشة إلى أداة', en: 'How to turn the screen into a tool' },
      },
      {
        type: 'ul',
        items: [
          { ar: '«المحتوى أولًا ثم الوقت»: قبل أن تحدّد الدقائق، انتقِ قائمةً من ٣–٥ تطبيقاتٍ أو قنواتٍ نافعة (تحفيظ، عربية، علوم، قصص أنبياء) وامنع التنقّل الحر. الطفل الذي يختار من رفٍّ منتقى لا يضيع وقته في التمرير العشوائي.', en: '“Content before clock”: before deciding minutes, curate a shortlist of 3–5 beneficial apps or channels (Quran, Arabic, science, prophets’ stories) and disable free browsing. A child choosing from a vetted shelf doesn’t lose time to mindless scrolling.' },
          { ar: '«شاهِد ثم اصنع»: بعد كل مقطع، اطلب من الطفل أن يعيد ما تعلّمه بكلماته، أو يرسمه، أو يطبّقه (يكرّر آية، يعدّ بالعربية). الدقيقة التي يتبعها إنتاجٌ تساوي عشرًا من التلقّي السلبي.', en: '“Watch then make”: after each clip, have the child retell what they learned, draw it, or do it (repeat an ayah, count in Arabic). A minute followed by output is worth ten of passive intake.' },
          { ar: 'شاهِد معه أحيانًا (Co-viewing): اجلس بجانبه واسأل أسئلةً مفتوحة («ماذا فعل هذا النبي؟ لماذا برأيك؟»). مشاركتك تحوّل الشاشة من جليسٍ يعزله إلى نشاطٍ يربطكما.', en: 'Co-view sometimes: sit beside them and ask open questions (“What did this prophet do? Why do you think?”). Your presence turns the screen from an isolating babysitter into a shared activity.' },
          { ar: 'ثبّت الزمن بطقوسٍ واضحة لا بالصراخ: حدّد «متى» (بعد الواجب وقبل المغرب) و«كم» (مؤقّتٌ مرئي)، واجعل النهاية انتقالًا لنشاطٍ محبّب لا عقابًا.', en: 'Anchor timing with clear rituals, not shouting: define “when” (after homework and before Maghrib) and “how much” (a visual timer), and make the end a transition to a loved activity, not a punishment.' },
          { ar: 'اربط وقت الشاشة بهدفٍ مرئي: لوحة نجومٍ يجمع فيها الطفل نجمةً عن كل سورةٍ حفظها أو كلمةٍ عربيةٍ أتقنها عبر التطبيق. وكن أنت القدوة بإغلاق جهازك في مواعيد خالية من الشاشات.', en: 'Tie screen time to a visible goal: a star chart where the child earns a star for each surah memorized or Arabic word mastered via an app. And model it by powering down your own device in screen-free times.' },
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: { ar: 'جرّبها الآن', en: 'Try it now' },
        text: {
          ar: 'لدى أكاديمية آية لعبة آدابٍ تفاعلية مجانية يمكن لطفلك أن يلعبها الآن — تعلّمٌ ممتع بلا تسجيلٍ معقّد، يحوّل دقائق الشاشة إلى دقائق نافعة.',
          en: 'Aya Academy has a free interactive manners game your child can play right now — fun learning with no complicated sign-up, turning screen minutes into beneficial ones.',
        },
      },
      {
        type: 'p',
        text: {
          ar: 'حين يصبح التعلّم ممتعًا، يطلب الطفل المزيد بنفسه. هذا هو الفرق بين طفلٍ «يُجبَر» على التعلّم وطفلٍ «يحبّ» أن يتعلّم.',
          en: 'When learning becomes fun, the child asks for more on their own. That’s the difference between a child forced to learn and a child who loves to learn.',
        },
      },
    ],
    related: ['best-way-kids-memorize-quran', 'teaching-children-dua-and-dhikr'],
    sources: [
      { ar: 'القرآن الكريم — سورة العصر: ١–٣، وسورة التحريم: ٦', en: 'The Noble Qur’an — Al-Asr: 1-3, At-Tahrim: 6', url: 'https://quran.com/103' },
      { ar: 'حديث «نعمتان مغبون فيهما كثير من الناس: الصحة والفراغ» — صحيح البخاري، الدرر السنية', en: '“Two blessings many squander: health and free time” — Sahih al-Bukhari, via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D9%86%D8%B9%D9%85%D8%AA%D8%A7%D9%86%20%D9%85%D8%BA%D8%A8%D9%88%D9%86%20%D9%81%D9%8A%D9%87%D9%85%D8%A7%20%D9%83%D8%AB%D9%8A%D8%B1%20%D9%85%D9%86%20%D8%A7%D9%84%D9%86%D8%A7%D8%B3%20%D8%A7%D9%84%D8%B5%D8%AD%D8%A9%20%D9%88%D8%A7%D9%84%D9%81%D8%B1%D8%A7%D8%BA' },
      { ar: 'حديث «ومن سلك طريقًا يلتمس فيه علمًا...» — صحيح مسلم، الدرر السنية', en: '“Whoever travels a path seeking knowledge…” — Sahih Muslim, via Dorar.net', url: 'https://dorar.net/hadith/search?q=%D9%85%D9%86%20%D8%B3%D9%84%D9%83%20%D8%B7%D8%B1%D9%8A%D9%82%D8%A7%20%D9%8A%D9%84%D8%AA%D9%85%D8%B3%20%D9%81%D9%8A%D9%87%20%D8%B9%D9%84%D9%85%D8%A7%20%D8%B3%D9%87%D9%84%20%D8%A7%D9%84%D9%84%D9%87%20%D9%84%D9%87%20%D8%B7%D8%B1%D9%8A%D9%82%D8%A7%20%D8%A5%D9%84%D9%89%20%D8%A7%D9%84%D8%AC%D9%86%D8%A9' },
    ],
  },
];

// ─── Lookups (read by the list + detail pages and static-param generation) ──────
export const articleSlugs = articles.map((a) => a.slug);

export const getArticle = (slug) => articles.find((a) => a.slug === slug);

export const sortedArticles = [...articles].sort((a, b) =>
  a.datePublished < b.datePublished ? 1 : -1,
);

// Categories that actually appear on at least one article, as {key,label} for a
// given locale — used to render the filter chips without dead/empty options.
export function presentCategories(lng) {
  const keys = [...new Set(sortedArticles.flatMap((a) => a.categories || []))];
  return keys
    .filter((key) => blogCategories[key])
    .map((key) => ({ key, label: blogCategories[key][lng] || blogCategories[key].ar }));
}

export default articles;
