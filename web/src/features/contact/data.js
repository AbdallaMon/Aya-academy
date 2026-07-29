export const CONTACT_EMAIL = 'info@ayah.academy';
export const CONTACT_PHONE_DISPLAY = '+966 58 250 9655';
export const CONTACT_WHATSAPP_URL = 'https://wa.me/966582509655';

export const contactContent = {
  ar: {
    eyebrow: 'تواصل مع أكاديمية آية',
    title: 'تواصل مع أكاديمية آية',
    description:
      'لديك سؤال قبل البدء أو تحتاج إلى مساعدة في حسابك؟ تواصل معنا بشأن برامج القرآن والتجويد والعربية والدراسات الإسلامية، أو التسجيل والمواعيد والفواتير والدعم التقني.',
    metaTitle: 'تواصل معنا بشأن برامج تعليم القرآن أونلاين',
    metaDescription:
      'تواصل مع أكاديمية آية للاستفسار عن تحفيظ القرآن والتجويد والعربية والدراسات الإسلامية أونلاين، أو لحجز حصة تجريبية مجانية.',
    methodsTitle: 'اختر وسيلة التواصل المناسبة',
    email: {
      title: 'راسلنا عبر البريد الإلكتروني',
      body: 'مناسب للأسئلة التفصيلية، ومساعدة الحساب، والاستفسارات المتعلقة بالبرامج والاشتراكات.',
      action: 'إرسال بريد إلكتروني',
      subject: 'استفسار إلى أكاديمية آية',
    },
    whatsapp: {
      title: 'تحدث معنا عبر واتساب',
      body: 'أرسل استفسارك عن البرنامج أو المواعيد، وسيرد عليك فريق أكاديمية آية عبر رقمنا الرسمي.',
      action: 'فتح واتساب',
      message: 'السلام عليكم، أود الاستفسار عن برامج أكاديمية آية.',
    },
    prepareTitle: 'معلومات تساعدنا على إرشادك بصورة أفضل',
    prepareIntro:
      'يمكنك إضافة المعلومات المناسبة لك فقط، ولا حاجة لإرسال أي بيانات حساسة.',
    prepareItems: [
      'الفئة العمرية للمتعلّم',
      'المستوى الحالي في قراءة القرآن أو اللغة العربية',
      'الهدف التعليمي: قراءة، تحفيظ، تجويد، عربية، أو دراسات إسلامية',
      'لغة التواصل والمنطقة الزمنية أو الأوقات المناسبة',
    ],
    safetyNote:
      'لا ترسل كلمات المرور أو بيانات بطاقات الدفع أو المستندات الحساسة عبر البريد أو واتساب.',
    trialTitle: 'هل تريد تجربة الأكاديمية أولًا؟',
    trialBody:
      'أنشئ حساب ولي الأمر واحجز حصة تجريبية مجانية للمتعلّم، بدون بطاقة دفع عند التسجيل.',
    trialAction: 'احجز حصة تجريبية مجانية',
    privacyAction: 'اقرأ سياسة الخصوصية',
  },
  en: {
    eyebrow: 'Contact Ayah Academy',
    title: 'Contact Ayah Academy',
    description:
      'Have a question before you start, or need help with an existing account? Contact us about Quran, Tajweed, Arabic and Islamic studies programs, enrolment, scheduling, invoices or technical support.',
    metaTitle: 'Contact Us About Online Quran Classes',
    metaDescription:
      'Contact Ayah Academy about online Quran memorization, Tajweed, Arabic and Islamic studies, or book a free trial session.',
    methodsTitle: 'Choose the contact method that suits you',
    email: {
      title: 'Email Ayah Academy',
      body: 'Best for detailed questions, account help, and program or subscription enquiries.',
      action: 'Send an email',
      subject: 'Question for Ayah Academy',
    },
    whatsapp: {
      title: 'Chat with us on WhatsApp',
      body: 'Ask about a program or schedule and the Ayah Academy team will reply through our official number.',
      action: 'Open WhatsApp',
      message: 'Assalamu alaikum, I would like to ask about Ayah Academy programs.',
    },
    prepareTitle: 'Information that helps us guide you',
    prepareIntro:
      'Share only what is relevant to your enquiry. You do not need to send sensitive information.',
    prepareItems: [
      'The learner’s age group',
      'Current Quran reading or Arabic level',
      'Learning goal: reading, memorization, Tajweed, Arabic, or Islamic studies',
      'Preferred communication language, time zone, or suitable times',
    ],
    safetyNote:
      'Never send passwords, payment-card details, or sensitive documents by email or WhatsApp.',
    trialTitle: 'Would you like to try the academy first?',
    trialBody:
      'Create a parent account and book a free trial session for the learner. No payment card is required at registration.',
    trialAction: 'Book a free trial session',
    privacyAction: 'Read our Privacy Policy',
  },
};

export function getContactContent(lng) {
  return contactContent[lng === 'en' ? 'en' : 'ar'];
}
