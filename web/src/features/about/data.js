export const aboutContent = {
  ar: {
    eyebrow: 'أكاديمية آية',
    title: 'من نحن في أكاديمية آية',
    description: 'فريق متخصص في تعليم القرآن الكريم والدراسات الإسلامية واللغة العربية لغير الناطقين بالعربية من مختلف الأعمار.',
    points: [
      {
        title: 'خبرة في تعليم مختلف الأعمار',
        body: 'لدى أكاديمية آية فريق من معلمي القرآن الكريم والدراسات الإسلامية المتفانين، ويتمتعون بسنوات من الخبرة في تعليم غير الناطقين بالعربية من مختلف الأعمار.',
      },
      {
        title: 'علم موثوق وأساليب تفاعلية',
        body: 'تجمع دروسهم بين العلم الإسلامي الموثوق والأساليب التفاعلية المشوقة التي تجعل التعلم ممتعًا وهادفًا.',
      },
      {
        title: 'صلة أقوى وثقة أكبر',
        body: 'يحرص معلمونا على مساعدة الطلاب في تقوية صلتهم بالقرآن، وفهم الإسلام فهمًا صحيحًا، وبناء الثقة في قراءة العربية والتحدث بها وفهمها.',
      },
    ],
    metaTitle: 'من نحن | فريق تعليم القرآن والدراسات الإسلامية',
    metaDescription: 'تعرّف على فريق أكاديمية آية المتخصص في تعليم القرآن الكريم والدراسات الإسلامية واللغة العربية لغير الناطقين بالعربية من مختلف الأعمار.',
    keywords: ['فريق أكاديمية آية', 'معلمو قرآن لغير الناطقين بالعربية', 'تعليم الدراسات الإسلامية أونلاين', 'تعليم العربية أونلاين'],
  },
  en: {
    eyebrow: 'Ayah Academy',
    title: 'About Ayah Academy',
    description: 'A dedicated team teaching the Qur’an, Islamic Studies and Arabic to non-Arabic speakers of all ages.',
    points: [
      {
        title: 'Experience across all ages',
        body: 'Ayah Academy has a team of dedicated Qur’an and Islamic Studies teachers with years of experience teaching non-Arabic speakers of all ages.',
      },
      {
        title: 'Authentic and interactive learning',
        body: 'Their lessons combine authentic Islamic knowledge with engaging, interactive methods that make learning enjoyable and meaningful.',
      },
      {
        title: 'Stronger connection and confidence',
        body: 'They are passionate about helping students strengthen their connection with the Qur’an, understand Islam correctly, and build confidence in reading, speaking, and understanding Arabic.',
      },
    ],
    metaTitle: 'About Our Qur’an and Islamic Studies Teachers',
    metaDescription: 'Meet Ayah Academy’s experienced Qur’an and Islamic Studies teachers for non-Arabic speakers of all ages, with authentic and interactive lessons.',
    keywords: ['Ayah Academy teachers', 'Quran teachers for non-Arabic speakers', 'online Islamic Studies teachers', 'online Arabic teachers'],
  },
};

export function getAboutContent(lng) {
  return aboutContent[lng === 'en' ? 'en' : 'ar'];
}
