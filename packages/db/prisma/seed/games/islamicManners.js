// @ts-check
import { prisma } from "../../../prisma.client.js";
import { clearGameQuestions } from "./helpers.js";

export async function seedIslamicManners() {
  const game = await prisma.game.upsert({
    where: { slug: "islamic-manners" },
    update: {
      titleAr: "آداب إسلامية",
      titleEn: "Islamic Manners",
      descriptionAr:
        "تعلّم آداب الإسلام الجميلة: كيف نتكلم، ونأكل، ونسلّم، ونشكر، ونستأذن، ونفي بالوعد!",
      descriptionEn:
        "Learn beautiful Islamic manners: how to speak, eat, greet, thank, ask permission, and keep promises!",
      passThreshold: 4,
    },
    create: {
      slug: "islamic-manners",
      titleAr: "آداب إسلامية",
      titleEn: "Islamic Manners",
      descriptionAr:
        "تعلّم آداب الإسلام الجميلة: كيف نتكلم، ونأكل، ونسلّم، ونشكر، ونستأذن، ونفي بالوعد!",
      descriptionEn:
        "Learn beautiful Islamic manners: how to speak, eat, greet, thank, ask permission, and keep promises!",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 4,
      configJson: {
        theme: {
          primary: "#23c483",
          accent: "#7c5cff",
          warn: "#ff7aa8",
          bg: "#f0fff8",
        },
        hero: { emoji: "🧒", nameAr: "بطل الآداب", nameEn: "Manners Hero" },
        stars: 6,
        certificate: {
          titleAr: "وسام الآداب الإسلامية",
          titleEn: "Islamic Manners Medal",
          emoji: "🌿",
          accent: "#23c483",
          background: "linear-gradient(135deg, #f0fff8 0%, #d9f7ea 100%)",
          decoration: "crescent",
        },
        reward: {
          giftNameAr: "نجمة الآداب الذهبية",
          giftNameEn: "Golden Manners Star",
          emoji: "⭐",
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  const questions = [
    {
      order: 0,
      kind: "MULTIPLE_CHOICE",
      promptAr: "كيف نتكلم مع أمنا الحبيبة؟",
      promptEn: "How do we speak to our dear mother?",
      mediaJson: { layout: "list" },
      options: [
        {
          order: 0,
          labelAr: "بصوت عالٍ وبأوامر",
          labelEn: "Loudly and with orders",
          emoji: "😤",
          isCorrect: false,
          feedbackAr:
            "لا بأس! نتكلم مع أمنا بهدوء وحب واحترام. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We speak to our mum gently with love and respect. Try again 😊",
        },
        {
          order: 1,
          labelAr: "بهدوء وحب واحترام",
          labelEn: "Gently with love and respect",
          emoji: "💖",
          isCorrect: true,
          feedbackAr: "أحسنت! كلامنا مع أمنا يكون دائماً بلطف وحب وتقدير 💖",
          feedbackEn:
            "Well done! We always speak to our mum with gentleness, love, and respect 💖",
        },
        {
          order: 2,
          labelAr: "نتجاهلها ولا نجيبها",
          labelEn: "Ignore her and not answer",
          emoji: "🙄",
          isCorrect: false,
          feedbackAr: "لا بأس! أمنا تستحق أحسن الكلام. جرّب مرة أخرى يا بطل 😊",
          feedbackEn:
            "That's okay! Our mum deserves our best words. Try again, champion 😊",
        },
      ],
    },
    {
      order: 1,
      kind: "MULTIPLE_CHOICE",
      promptAr: "ماذا نقول عند بدء الأكل؟",
      promptEn: "What do we say before we start eating?",
      mediaJson: { layout: "list" },
      options: [
        {
          order: 0,
          labelAr: "بسم الله ونأكل بيدنا اليمنى",
          labelEn: "Bismillah and eat with our right hand",
          emoji: "🤲",
          isCorrect: true,
          feedbackAr:
            "ممتاز! نقول بسم الله ونأكل باليد اليمنى، هذه سنة النبي ﷺ 🌙",
          feedbackEn:
            "Excellent! We say Bismillah and eat with our right hand — this is the Prophet's ﷺ way 🌙",
        },
        {
          order: 1,
          labelAr: "نبدأ الأكل بدون أي كلام",
          labelEn: "Start eating without saying anything",
          emoji: "😶",
          isCorrect: false,
          feedbackAr:
            "لا بأس! دائماً نقول بسم الله قبل الأكل. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We always say Bismillah before eating. Try again 😊",
        },
        {
          order: 2,
          labelAr: "نقول ماشاء الله ونأكل بيدنا اليسرى",
          labelEn: "Say MashaAllah and eat with our left hand",
          emoji: "🤔",
          isCorrect: false,
          feedbackAr:
            "لا بأس! نقول بسم الله ونأكل باليد اليمنى. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We say Bismillah and use our right hand. Try again 😊",
        },
      ],
    },
    {
      order: 2,
      kind: "MULTIPLE_CHOICE",
      promptAr: "ماذا نقول عند لقاء أصدقائنا؟",
      promptEn: "What do we say when we meet our friends?",
      mediaJson: { layout: "list" },
      options: [
        {
          order: 0,
          labelAr: "لا نقول شيئاً ونمشي",
          labelEn: "Say nothing and walk past",
          emoji: "🚶",
          isCorrect: false,
          feedbackAr: "لا بأس! السلام يفتح القلوب. جرّب مرة أخرى يا بطل 😊",
          feedbackEn: "No worries! Salam opens hearts. Try again, champion 😊",
        },
        {
          order: 1,
          labelAr: "السلام عليكم ورحمة الله",
          labelEn: "Assalamu Alaykum wa Rahmatullah",
          emoji: "👋",
          isCorrect: true,
          feedbackAr:
            "رائع! السلام عليكم تحية المسلمين الجميلة التي تنشر المحبة! 💚",
          feedbackEn:
            "Wonderful! Assalamu Alaykum is the beautiful Muslim greeting that spreads love! 💚",
        },
        {
          order: 2,
          labelAr: "نصرخ في وجههم للترحيب",
          labelEn: "Shout at them to say hello",
          emoji: "📢",
          isCorrect: false,
          feedbackAr: "لا بأس! نرحب بأصدقائنا بكلمات لطيفة. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We greet friends with kind words. Try again 😊",
        },
      ],
    },
    {
      order: 3,
      kind: "MULTIPLE_CHOICE",
      promptAr: "أعطاك أحد هدية جميلة. ماذا تقول؟",
      promptEn: "Someone gave you a lovely gift. What do you say?",
      mediaJson: { layout: "list" },
      options: [
        {
          order: 0,
          labelAr: "نأخذها ونذهب بدون كلام",
          labelEn: "Take it and leave without a word",
          emoji: "😑",
          isCorrect: false,
          feedbackAr: "لا بأس! نشكر دائماً من يعطينا. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We always thank those who give us things. Try again 😊",
        },
        {
          order: 1,
          labelAr: "جزاك الله خيراً، شكراً جزيلاً!",
          labelEn: "JazakAllah Khayran, thank you very much!",
          emoji: "💛",
          isCorrect: true,
          feedbackAr: "أحسنت! الشكر يجعل القلوب سعيدة ويبارك في الهدايا 💛",
          feedbackEn:
            "Well done! Saying thank you makes hearts happy and blesses the gifts 💛",
        },
        {
          order: 2,
          labelAr: "نقول: «هذا قليل ونريد أكثر»",
          labelEn: "Say: «This is not enough, we want more»",
          emoji: "😒",
          isCorrect: false,
          feedbackAr:
            "لا بأس! نشكر على كل شيء، صغيراً أو كبيراً. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We are thankful for everything, big or small. Try again 😊",
        },
      ],
    },
    {
      order: 4,
      kind: "MULTIPLE_CHOICE",
      promptAr: "أردت الدخول إلى غرفة أبيك. ماذا تفعل؟",
      promptEn: "You want to enter your father's room. What do you do?",
      mediaJson: { layout: "list" },
      options: [
        {
          order: 0,
          labelAr: "ندخل مباشرة دون أن نطرق",
          labelEn: "Go straight in without knocking",
          emoji: "🚪",
          isCorrect: false,
          feedbackAr: "لا بأس! نطرق الباب ونستأذن دائماً. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We always knock and ask permission. Try again 😊",
        },
        {
          order: 1,
          labelAr: "نطرق الباب ونقول: «إذن يا أبي؟»",
          labelEn: "Knock and say: «May I come in, Dad?»",
          emoji: "🤲",
          isCorrect: true,
          feedbackAr: "ممتاز! الاستئذان قبل الدخول أدب رائع يحبه الله 🌟",
          feedbackEn:
            "Excellent! Asking permission before entering is a wonderful manner that Allah loves 🌟",
        },
        {
          order: 2,
          labelAr: "نصرخ بصوت عالٍ من الخارج",
          labelEn: "Shout loudly from outside",
          emoji: "📢",
          isCorrect: false,
          feedbackAr: "لا بأس! الطرق اللطيف هو الأدب الصحيح. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Gentle knocking is the right manner. Try again 😊",
        },
      ],
    },
    {
      order: 5,
      kind: "MULTIPLE_CHOICE",
      promptAr: "وعدت صديقك أن تلعب معه غداً. ماذا تفعل غداً؟",
      promptEn:
        "You promised your friend to play with them tomorrow. What do you do tomorrow?",
      mediaJson: { layout: "list" },
      options: [
        {
          order: 0,
          labelAr: "تنسى الوعد وتذهب للعب وحدك",
          labelEn: "Forget the promise and play alone",
          emoji: "😔",
          isCorrect: false,
          feedbackAr:
            "لا بأس! الوفاء بالوعد يجعلنا أصدقاء حقيقيين. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Keeping promises makes us true friends. Try again 😊",
        },
        {
          order: 1,
          labelAr: "تفي بوعدك وتذهب للعب معه",
          labelEn: "Keep your promise and go play with them",
          emoji: "🤝",
          isCorrect: true,
          feedbackAr:
            "رائع! الوفاء بالوعد صفة المؤمن الصادق وأساس الصداقة الحقيقية 🤝💛",
          feedbackEn:
            "Wonderful! Keeping promises is a quality of a true believer and the basis of real friendship 🤝💛",
        },
        {
          order: 2,
          labelAr: "تكذب عليه وتقول إنك مريض",
          labelEn: "Lie to them and say you are sick",
          emoji: "🤥",
          isCorrect: false,
          feedbackAr:
            "لا بأس! الصدق والوفاء بالوعد من أجمل الأخلاق. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Honesty and keeping promises are beautiful qualities. Try again 😊",
        },
      ],
    },
  ];

  for (const q of questions) {
    const { options, ...qData } = q;
    const created = await prisma.gameQuestion.create({
      data: { gameId: game.id, ...qData },
    });
    await prisma.gameOption.createMany({
      data: options.map((o) => ({ ...o, questionId: created.id })),
    });
  }

  console.log(`[seed] game islamic-manners — ${questions.length} questions`);
  return game;
}

