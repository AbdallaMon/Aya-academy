// @ts-check
import { prisma } from "../../../prisma.client.js";
import { clearGameQuestions } from "./helpers.js";

// Same catch idea, DIFFERENT topic (what makes prayer beautiful), a night-sky
// style and a slightly different feel: items fall faster and you gather glowing
// stars into the moon. Bad items are prayer distractions.
export async function seedPrayerStars() {
  const game = await prisma.game.upsert({
    where: { slug: "prayer-stars" },
    update: {
      titleAr: "نجوم الصلاة",
      titleEn: "Prayer Stars",
      descriptionAr:
        "نجوم الصلاة الجميلة تتساقط في الليل! المس ما يُحسِّن صلاتك واجمعه، وتجنّب ما يُلهيك عنها.",
      descriptionEn:
        "The stars of a beautiful prayer fall in the night! Tap what makes your prayer better, and avoid what distracts you.",
      passThreshold: 1,
    },
    create: {
      slug: "prayer-stars",
      titleAr: "نجوم الصلاة",
      titleEn: "Prayer Stars",
      descriptionAr:
        "نجوم الصلاة الجميلة تتساقط في الليل! المس ما يُحسِّن صلاتك واجمعه، وتجنّب ما يُلهيك عنها.",
      descriptionEn:
        "The stars of a beautiful prayer fall in the night! Tap what makes your prayer better, and avoid what distracts you.",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 1,
      configJson: {
        theme: {
          primary: "#6366F1",
          accent: "#FBBF24",
          warn: "#FB7185",
          bg: "#eef2ff",
        },
        hero: {
          emoji: "🌙",
          nameAr: "جامع النجوم",
          nameEn: "Star Gatherer",
        },
        stars: 4,
        certificate: {
          titleAr: "شهادة نجوم الصلاة",
          titleEn: "Prayer Stars Certificate",
          emoji: "🌙",
          accent: "#6366F1",
          background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
          decoration: "stars",
        },
        reward: {
          giftNameAr: "نجمة الصلاة",
          giftNameEn: "Prayer Star",
          emoji: "⭐",
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  const q1 = await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 0,
      kind: "TAP_CHOICE",
      promptAr:
        "النجوم تتساقط في الليل! المس ما يجعل صلاتك جميلة لتجمعه في القمر 🌙 وتجنّب ما يُلهيك.",
      promptEn:
        "Stars fall in the night! Tap what makes your prayer beautiful to gather it in the moon 🌙 and avoid distractions.",
      mediaJson: {
        mode: "catch",
        rounds: 8,
        direction: "fall",
        speed: "fast",
        goalEmoji: "⭐",
        catcherEmoji: "🌙",
        hintAr:
          "النجوم تتساقط بسرعة — المس ما يُحسِّن صلاتك! ⭐ تجنّب ما يُلهيك.",
        hintEn:
          "Stars fall fast — tap what makes your prayer better! ⭐ Avoid distractions.",
        doneAr: "جمعت نجوم صلاتك الجميلة! ما شاء الله 🌙⭐",
        doneEn:
          "You gathered the stars of your beautiful prayer! MashaAllah 🌙⭐",
        arena: {
          from: "#312e81",
          to: "#1e1b4b",
          glow: "#fde68a",
          border: "#4338ca",
        },
      },
    },
  });

  await prisma.gameOption.createMany({
    data: [
      // GOOD — what beautifies prayer (isCorrect = true → collect)
      {
        questionId: q1.id,
        order: 0,
        labelAr: "الوضوء",
        labelEn: "Wudu",
        emoji: "💧",
        isCorrect: true,
        feedbackAr: "أحسنت! الوضوء مفتاح الصلاة 🌟",
        feedbackEn: "Well done! Wudu is the key to prayer 🌟",
      },
      {
        questionId: q1.id,
        order: 1,
        labelAr: "استقبال القبلة",
        labelEn: "Facing the Qibla",
        emoji: "🧭",
        isCorrect: true,
        feedbackAr: "ممتاز! نتوجه إلى القبلة في صلاتنا 🕋",
        feedbackEn: "Excellent! We face the Qibla in our prayer 🕋",
      },
      {
        questionId: q1.id,
        order: 2,
        labelAr: "الخشوع",
        labelEn: "Focus & humility",
        emoji: "😌",
        isCorrect: true,
        feedbackAr: "رائع! الخشوع روح الصلاة 💛",
        feedbackEn: "Wonderful! Humility is the soul of prayer 💛",
      },
      {
        questionId: q1.id,
        order: 3,
        labelAr: "السجود",
        labelEn: "Prostration",
        emoji: "🤲",
        isCorrect: true,
        feedbackAr: "أحسنت! أقرب ما نكون من الله في السجود 💖",
        feedbackEn: "Well done! We are closest to Allah in prostration 💖",
      },
      {
        questionId: q1.id,
        order: 4,
        labelAr: "الطمأنينة",
        labelEn: "Calmness",
        emoji: "🕊️",
        isCorrect: true,
        feedbackAr: "جميل! نصلّي بهدوء وطمأنينة 🌱",
        feedbackEn: "Beautiful! We pray calmly and with stillness 🌱",
      },
      {
        questionId: q1.id,
        order: 5,
        labelAr: "الصلاة في وقتها",
        labelEn: "Praying on time",
        emoji: "⏰",
        isCorrect: true,
        feedbackAr: "ممتاز! الصلاة في وقتها من أحبّ الأعمال 💫",
        feedbackEn:
          "Excellent! Praying on time is among the most beloved deeds 💫",
      },
      {
        questionId: q1.id,
        order: 6,
        labelAr: "قول الله أكبر",
        labelEn: "Saying Allahu Akbar",
        emoji: "☝️",
        isCorrect: true,
        feedbackAr: "رائع! نكبّر بقلب حاضر 🌟",
        feedbackEn: "Wonderful! We say takbeer with a present heart 🌟",
      },
      {
        questionId: q1.id,
        order: 7,
        labelAr: "الصف المستقيم",
        labelEn: "A straight row",
        emoji: "🧍",
        isCorrect: true,
        feedbackAr: "جميل! نعتدل في صفّنا 🕌",
        feedbackEn: "Beautiful! We stand straight in our row 🕌",
      },
      // BAD — prayer distractions (isCorrect = false → leave it)
      {
        questionId: q1.id,
        order: 8,
        labelAr: "الاستعجال في الصلاة",
        labelEn: "Rushing the prayer",
        emoji: "🏃",
        isCorrect: false,
        feedbackAr: "لا بأس! نصلّي بهدوء، لا نستعجل 🌙",
        feedbackEn: "No worries! We pray calmly, not in a rush 🌙",
      },
      {
        questionId: q1.id,
        order: 9,
        labelAr: "اللعب أثناء الصلاة",
        labelEn: "Playing during prayer",
        emoji: "🤸",
        isCorrect: false,
        feedbackAr: "هذا يُلهي عن الصلاة! اجمع نجوم الخشوع ⭐",
        feedbackEn: "That distracts from prayer! Gather the stars of focus ⭐",
      },
      {
        questionId: q1.id,
        order: 10,
        labelAr: "كثرة الالتفات",
        labelEn: "Looking around a lot",
        emoji: "🔄",
        isCorrect: false,
        feedbackAr: "لا بأس! ننظر إلى موضع سجودنا 🌙",
        feedbackEn: "No worries! We look at the place of our prostration 🌙",
      },
    ],
  });

  console.log(`[seed] game prayer-stars — 1 question (11 options in pool)`);
  return game;
}

