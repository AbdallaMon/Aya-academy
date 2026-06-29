// @ts-check
import { prisma } from "../../../prisma.client.js";
import { clearGameQuestions } from "./helpers.js";

export async function seedAzkarMatch() {
  const game = await prisma.game.upsert({
    where: { slug: "azkar-match" },
    update: {
      titleAr: "طابق الأذكار",
      titleEn: "Match the Azkar",
      descriptionAr: "طابق الذِّكر المناسب مع كل موقف من مواقف الحياة اليومية!",
      descriptionEn: "Match the right dhikr to each everyday situation!",
      passThreshold: 3,
    },
    create: {
      slug: "azkar-match",
      titleAr: "طابق الأذكار",
      titleEn: "Match the Azkar",
      descriptionAr: "طابق الذِّكر المناسب مع كل موقف من مواقف الحياة اليومية!",
      descriptionEn: "Match the right dhikr to each everyday situation!",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 3,
      configJson: {
        theme: {
          primary: "#8a5bff",
          accent: "#ff5fa2",
          warn: "#ffa83d",
          bg: "#fdf7ff",
        },
        hero: { emoji: "🤲", nameAr: "بطل الأذكار", nameEn: "Azkar Champion" },
        stars: 4,
        certificate: {
          titleAr: "وسام بطل الأذكار الذكي",
          titleEn: "Smart Azkar Champion Medal",
          emoji: "💚",
          accent: "#8a5bff",
          background: "linear-gradient(135deg, #fdf7ff 0%, #ece0ff 100%)",
          decoration: "crescent",
        },
        reward: {
          giftNameAr: "قلب مطمئن",
          giftNameEn: "Peaceful Heart",
          emoji: "💚",
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  const questions = [
    {
      order: 0,
      promptAr: "ماذا نقول قبل الأكل؟",
      promptEn: "What do we say before eating?",
      options: [
        {
          order: 0,
          labelAr: "بِسْمِ الله",
          labelEn: "Bismillah",
          emoji: "🍽️",
          isCorrect: true,
          feedbackAr: "ممتاز! نقول بسم الله قبل الأكل 🤲",
          feedbackEn: "Excellent! We say Bismillah before eating 🤲",
        },
        {
          order: 1,
          labelAr: "الحمد لله",
          labelEn: "Alhamdulillah",
          emoji: "🤲",
          isCorrect: false,
          feedbackAr:
            "لا بأس! الحمد لله يُقال بعد الأكل. قبل الأكل نقول بسم الله. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Alhamdulillah is said after eating. Before eating we say Bismillah. Try again 😊",
        },
        {
          order: 2,
          labelAr: "سبحان الله",
          labelEn: "SubhanAllah",
          emoji: "🌸",
          isCorrect: false,
          feedbackAr:
            "لا بأس! سبحان الله للتعجب. قبل الأكل نقول بسم الله. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! SubhanAllah is for wonder. Before eating we say Bismillah. Try again 😊",
        },
      ],
    },
    {
      order: 1,
      promptAr: "ماذا نقول قبل النوم؟",
      promptEn: "What do we say before sleeping?",
      options: [
        {
          order: 0,
          labelAr: "بسم الله الرحمن الرحيم",
          labelEn: "Bismillah Ar-Rahman Ar-Raheem",
          emoji: "🍽️",
          isCorrect: false,
          feedbackAr:
            "لا بأس! هذا يُقال قبل الأكل. قبل النوم نقول: «باسمك اللهم أحيا وأموت». جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! That is before eating. Before sleeping we say: «In Your name, O Allah, I live and die». Try again 😊",
        },
        {
          order: 1,
          labelAr: "باسمك اللهم أحيا وأموت",
          labelEn: "In Your name O Allah I live and die",
          emoji: "😴",
          isCorrect: true,
          feedbackAr: "رائع! هذا ذكر النوم الجميل 🌙 نقوله كل ليلة",
          feedbackEn:
            "Wonderful! This is the beautiful sleeping dhikr 🌙 we say every night",
        },
        {
          order: 2,
          labelAr: "الحمد لله على كل حال",
          labelEn: "Alhamdulillah in all situations",
          emoji: "🤲",
          isCorrect: false,
          feedbackAr:
            "لا بأس! قبل النوم نقول: «باسمك اللهم أحيا وأموت». جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Before sleeping we say: «In Your name, O Allah, I live and die». Try again 😊",
        },
      ],
    },
    {
      order: 2,
      promptAr: "عطست! ماذا تقول؟",
      promptEn: "You sneezed! What do you say?",
      options: [
        {
          order: 0,
          labelAr: "بسم الله",
          labelEn: "Bismillah",
          emoji: "🤧",
          isCorrect: false,
          feedbackAr: "لا بأس! بعد العطاس نقول الحمد لله. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! After sneezing we say Alhamdulillah. Try again 😊",
        },
        {
          order: 1,
          labelAr: "الحمد لله",
          labelEn: "Alhamdulillah",
          emoji: "🤧",
          isCorrect: true,
          feedbackAr:
            "أحسنت! بعد العطاس نقول الحمد لله 🤧 ومن يسمعنا يقول: يرحمك الله!",
          feedbackEn:
            "Well done! After sneezing we say Alhamdulillah 🤧 and whoever hears says: May Allah have mercy on you!",
        },
        {
          order: 2,
          labelAr: "لا حول ولا قوة إلا بالله",
          labelEn: "La hawla wa la quwwata illa billah",
          emoji: "🤲",
          isCorrect: false,
          feedbackAr:
            "لا بأس! هذا يُقال عند الشدة. العطاس نقول بعده الحمد لله. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! That is said in hardship. After sneezing we say Alhamdulillah. Try again 😊",
        },
      ],
    },
    {
      order: 3,
      promptAr: "ماذا نقول عند الخروج من البيت؟",
      promptEn: "What do we say when leaving the house?",
      options: [
        {
          order: 0,
          labelAr: "باسم الله توكلت على الله",
          labelEn: "In Allah's name I put my trust in Allah",
          emoji: "🚪",
          isCorrect: true,
          feedbackAr:
            "ممتاز! عند الخروج نقول: «باسم الله توكلت على الله، لا حول ولا قوة إلا بالله» 🚪✨",
          feedbackEn:
            "Excellent! When leaving we say: «In Allah's name I trust in Allah, there is no power except with Allah» 🚪✨",
        },
        {
          order: 1,
          labelAr: "الحمد لله",
          labelEn: "Alhamdulillah",
          emoji: "🤲",
          isCorrect: false,
          feedbackAr:
            "لا بأس! عند الخروج نقول: «باسم الله توكلت على الله». جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! When leaving we say: «In Allah's name I trust in Allah». Try again 😊",
        },
        {
          order: 2,
          labelAr: "سبحان الله وبحمده",
          labelEn: "SubhanAllah wa bihamdihi",
          emoji: "🌸",
          isCorrect: false,
          feedbackAr:
            "لا بأس! عند الخروج نقول: «باسم الله توكلت على الله». جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! When leaving we say: «In Allah's name I trust in Allah». Try again 😊",
        },
      ],
    },
  ];

  for (const q of questions) {
    const { options, ...qData } = q;
    const created = await prisma.gameQuestion.create({
      data: {
        gameId: game.id,
        kind: "EMOJI_CHOICE",
        mediaJson: { layout: "grid" },
        ...qData,
      },
    });
    await prisma.gameOption.createMany({
      data: options.map((o) => ({ ...o, questionId: created.id })),
    });
  }

  console.log(`[seed] game azkar-match — ${questions.length} questions`);
  return game;
}

