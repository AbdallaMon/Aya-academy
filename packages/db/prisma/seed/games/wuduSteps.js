// @ts-check
import { prisma } from "../../../prisma.client.js";
import { clearGameQuestions } from "./helpers.js";

export async function seedWuduSteps() {
  const game = await prisma.game.upsert({
    where: { slug: "wudu-steps" },
    update: {
      titleAr: "بطل الوضوء",
      titleEn: "Wudu Champion",
      descriptionAr: "اختر الخطوة التالية من خطوات الوضوء بالترتيب الصحيح!",
      descriptionEn: "Choose the next wudu step in the correct order!",
      passThreshold: 4,
    },
    create: {
      slug: "wudu-steps",
      titleAr: "بطل الوضوء",
      titleEn: "Wudu Champion",
      descriptionAr: "اختر الخطوة التالية من خطوات الوضوء بالترتيب الصحيح!",
      descriptionEn: "Choose the next wudu step in the correct order!",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 4,
      configJson: {
        theme: {
          primary: "#3B82F6",
          accent: "#06d6a0",
          warn: "#ff7aa8",
          bg: "#f0f9ff",
        },
        hero: { emoji: "💧", nameAr: "بطل الوضوء", nameEn: "Wudu Champion" },
        stars: 4,
        certificate: {
          titleAr: "شهادة بطل الوضوء النظيف",
          titleEn: "Clean Wudu Champion Certificate",
          emoji: "💧",
          accent: "#06d6a0",
          background: "linear-gradient(135deg, #f0f9ff 0%, #d6f7ef 100%)",
          decoration: "stars",
        },
        reward: {
          giftNameAr: "درع الطهارة",
          giftNameEn: "Purity Shield",
          emoji: "🛡️",
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  // 4 questions: "what is step N?" — each with correct next step + 2 distractors from other steps.
  const questions = [
    {
      order: 0,
      promptAr: "ما هي الخطوة الأولى من الوضوء؟",
      promptEn: "What is the first step of wudu?",
      options: [
        {
          order: 0,
          labelAr: "النِّيّة في القلب",
          labelEn: "The intention in the heart",
          emoji: "🤲",
          isCorrect: true,
          feedbackAr: "ممتاز! الوضوء يبدأ بالنية في القلب 💙",
          feedbackEn:
            "Excellent! Wudu starts with the intention in your heart 💙",
        },
        {
          order: 1,
          labelAr: "غسل الوجه",
          labelEn: "Washing the face",
          emoji: "🧒",
          isCorrect: false,
          feedbackAr: "لا بأس! نبدأ بالنية أولاً. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We start with the intention first. Try again 😊",
        },
        {
          order: 2,
          labelAr: "غسل الرجلين",
          labelEn: "Washing the feet",
          emoji: "🦶",
          isCorrect: false,
          feedbackAr: "لا بأس! الخطوة الأولى هي النية. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! The first step is the intention. Try again 😊",
        },
      ],
    },
    {
      order: 1,
      promptAr: "بعد النية، ماذا نقول وماذا نغسل؟",
      promptEn: "After the intention, what do we say and what do we wash?",
      options: [
        {
          order: 0,
          labelAr: "نقول بسم الله ونغسل كفّينا",
          labelEn: "We say Bismillah and wash our palms",
          emoji: "👐",
          isCorrect: true,
          feedbackAr: "رائع! التسمية وغسل الكفين هما الخطوة الثانية 💦",
          feedbackEn:
            "Wonderful! Saying Bismillah and washing the palms is step two 💦",
        },
        {
          order: 1,
          labelAr: "نمسح الرأس",
          labelEn: "Wipe the head",
          emoji: "🧒",
          isCorrect: false,
          feedbackAr:
            "لا بأس! نقول بسم الله ونغسل الكفين أولاً. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We say Bismillah and wash the palms first. Try again 😊",
        },
        {
          order: 2,
          labelAr: "نغسل القدمين",
          labelEn: "Wash the feet",
          emoji: "🦶",
          isCorrect: false,
          feedbackAr: "لا بأس! الكفان يُغسلان قبل القدمين. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! The palms are washed before the feet. Try again 😊",
        },
      ],
    },
    {
      order: 2,
      promptAr: "بعد غسل الكفين، ما الخطوة التالية؟",
      promptEn: "After washing the palms, what is the next step?",
      options: [
        {
          order: 0,
          labelAr: "المضمضة والاستنشاق",
          labelEn: "Rinsing the mouth and nose",
          emoji: "💦",
          isCorrect: true,
          feedbackAr: "أحسنت! المضمضة والاستنشاق تأتيان بعد غسل الكفين 😄",
          feedbackEn:
            "Well done! Rinsing mouth and nose comes after washing the palms 😄",
        },
        {
          order: 1,
          labelAr: "غسل اليدين إلى المرفقين",
          labelEn: "Washing arms to the elbows",
          emoji: "💪",
          isCorrect: false,
          feedbackAr:
            "لا بأس! المضمضة والاستنشاق تأتيان قبل غسل الوجه. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Mouth and nose come before the face. Try again 😊",
        },
        {
          order: 2,
          labelAr: "مسح الرأس",
          labelEn: "Wiping the head",
          emoji: "🧒",
          isCorrect: false,
          feedbackAr: "لا بأس! مسح الرأس يأتي لاحقاً. جرّب مرة أخرى 😊",
          feedbackEn: "No worries! Wiping the head comes later. Try again 😊",
        },
      ],
    },
    {
      order: 3,
      promptAr: "بعد غسل الوجه والذراعين، ما الذي يأتي بعده؟",
      promptEn: "After washing the face and arms, what comes next?",
      options: [
        {
          order: 0,
          labelAr: "مسح الرأس ثم غسل الرجلين",
          labelEn: "Wiping the head then washing the feet",
          emoji: "🦶",
          isCorrect: true,
          feedbackAr: "ممتاز! مسح الرأس ثم غسل الرجلين آخر خطوات الوضوء 🎉",
          feedbackEn:
            "Excellent! Wiping the head then washing the feet are the last wudu steps 🎉",
        },
        {
          order: 1,
          labelAr: "غسل الكفين مرة أخرى",
          labelEn: "Washing the palms again",
          emoji: "👐",
          isCorrect: false,
          feedbackAr: "لا بأس! نمسح الرأس ونغسل الرجلين الآن. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Now we wipe the head and wash the feet. Try again 😊",
        },
        {
          order: 2,
          labelAr: "المضمضة مرة أخرى",
          labelEn: "Rinsing the mouth again",
          emoji: "💦",
          isCorrect: false,
          feedbackAr:
            "لا بأس! الخطوة الأخيرة هي مسح الرأس وغسل الرجلين. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! The last step is wiping the head and washing the feet. Try again 😊",
        },
      ],
    },
  ];

  for (const q of questions) {
    const { options, ...qData } = q;
    const created = await prisma.gameQuestion.create({
      data: {
        gameId: game.id,
        kind: "MULTIPLE_CHOICE",
        mediaJson: { layout: "list" },
        ...qData,
      },
    });
    await prisma.gameOption.createMany({
      data: options.map((o) => ({ ...o, questionId: created.id })),
    });
  }

  console.log(`[seed] game wudu-steps — ${questions.length} questions`);
  return game;
}

