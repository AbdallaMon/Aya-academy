// FAQ content — bilingual (ar default / en). Kept in its own module so BOTH the
// visible <FAQ> accordion AND the FAQPage JSON-LD on the homepage read the exact
// same questions/answers (Google requires the structured data to match what the
// user sees on the page). Edit answers here to match your real policy.

export const faqContent = {
  ar: {
    eyebrow: 'الأسئلة الشائعة',
    title: 'كل ما يهم ولي الأمر',
    subtitle: 'إجابات سريعة عن أكثر ما يسأل عنه الأهل قبل البدء.',
    items: [
      {
        q: 'ما هي الأعمار المناسبة؟',
        a: 'أكاديمية آية مصمّمة للطلاب من ٥ سنوات فأكثر، مع مستويات مرتّبة حسب العمر والخبرة ليتقدّم كل طالب بإيقاع مناسب له.',
      },
      {
        q: 'هل الحصص مباشرة أم مسجّلة؟',
        a: 'الاثنان معًا: جلسات مباشرة مع معلّم، بالإضافة إلى دروس قصيرة موجّهة يمكن للطالب متابعتها في أي وقت.',
      },
      {
        q: 'كم تستغرق الحصة؟',
        a: 'كل حصة مدتها ساعة واحدة.',
      },
      {
        q: 'هل أحتاج بطاقة دفع لتجربة الأكاديمية؟',
        a: 'لا. الحصة التجريبية مجانية تمامًا وبدون بطاقة دفع وبدون أي التزام — جرّب أولًا ثم قرّر.',
      },
      {
        q: 'وماذا يحدث بعد الحصة التجريبية المجانية؟',
        a: 'لا شيء تلقائيًا — لن تُدفع أي رسوم إلا إذا اخترت الاشتراك بنفسك بعد التجربة.',
      },
      {
        q: 'كيف أتابع تقدّم الطالب؟',
        a: 'من خلال لوحة ولي الأمر ثنائية اللغة التي تعرض النقاط والمستوى والترتيب، مع الأوسمة ولوحة الصدارة والساعات المتبقية في الاشتراك.',
      },
      {
        q: 'هل يمكنني إلغاء الاشتراك في أي وقت؟',
        a: 'نعم، يمكنك الإلغاء في أي وقت بسهولة ودون أي تعقيد.',
      },
      {
        q: 'بأي لغة يتم الشرح؟',
        a: 'الشرح يكون بما يناسب لغة الطالب، ليفهم كل طالب ويشارك ولي الأمر بسهولة.',
      },
    ],
  },
  en: {
    eyebrow: 'FAQ',
    title: 'Everything parents ask',
    subtitle: 'Quick answers to what parents ask most before starting.',
    items: [
      {
        q: 'What ages is it for?',
        a: 'Ayah Academy is built for students aged 5 and up, with levels organized by age and experience so every student progresses at their own pace.',
      },
      {
        q: 'Are lessons live or recorded?',
        a: 'Both: live sessions with a teacher, plus short guided video lessons the student can follow anytime.',
      },
      {
        q: 'How long is each session?',
        a: 'Each session is one hour long.',
      },
      {
        q: 'Do I need a card to try it?',
        a: 'No. The trial session is completely free, with no card and no commitment — try first, then decide.',
      },
      {
        q: 'What happens after the free trial session?',
        a: 'Nothing automatic — you are never charged unless you choose to subscribe after the trial.',
      },
      {
        q: 'How do I track the student’s progress?',
        a: 'Through a bilingual parent dashboard that shows points, level and rank, plus badges, the leaderboard and your remaining subscription hours.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes, you can cancel anytime, easily and with no hassle.',
      },
      {
        q: 'What language is the teaching in?',
        a: 'Teaching is in the language that suits the student, so every student understands and parents can follow along.',
      },
    ],
  },
};

export function getFaq(lng) {
  return faqContent[lng === 'en' ? 'en' : 'ar'];
}
