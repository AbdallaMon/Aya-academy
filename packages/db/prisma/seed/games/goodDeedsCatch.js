// @ts-check
import { prisma } from "../../../prisma.client.js";
import { clearGameQuestions } from "./helpers.js";

export async function seedGoodDeedsCatch() {
  const game = await prisma.game.upsert({
    where: { slug: "good-deeds-catch" },
    update: {
      titleAr: "اصطياد الحسنات",
      titleEn: "Catch the Good Deeds",
      descriptionAr:
        "المس الأعمال الطيبة الطائرة واجمعها في صاروخك! تجنّب الأعمال السيئة.",
      descriptionEn:
        "Tap the flying good deeds and collect them in your rocket! Avoid the bad deeds.",
      passThreshold: 1,
    },
    create: {
      slug: "good-deeds-catch",
      titleAr: "اصطياد الحسنات",
      titleEn: "Catch the Good Deeds",
      descriptionAr:
        "المس الأعمال الطيبة الطائرة واجمعها في صاروخك! تجنّب الأعمال السيئة.",
      descriptionEn:
        "Tap the flying good deeds and collect them in your rocket! Avoid the bad deeds.",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 1,
      configJson: {
        theme: {
          primary: "#3B82F6",
          accent: "#22C55E",
          warn: "#FF8C00",
          bg: "#f0f9ff",
        },
        hero: {
          emoji: "🚀",
          nameAr: "صاروخ الحسنات",
          nameEn: "Good Deeds Rocket",
        },
        stars: 4,
        certificate: {
          titleAr: "شهادة جامع الحسنات",
          titleEn: "Good Deeds Collector Certificate",
          emoji: "🚀",
          accent: "#22C55E",
          background: "linear-gradient(135deg, #f0f9ff 0%, #dcfce7 100%)",
          decoration: "stars",
        },
        reward: {
          giftNameAr: "نجمة الحسنات",
          giftNameEn: "Good Deeds Star",
          emoji: "✨",
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  // One TAP_CHOICE question — the options ARE the item pool.
  const q1 = await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 0,
      kind: "TAP_CHOICE",
      promptAr:
        "المس الأعمال الطيبة الطائرة لتجمعها في الصاروخ! 💛 تجنّب الأعمال السيئة.",
      promptEn:
        "Tap the flying good deeds to collect them in your rocket! 💛 Avoid the bad deeds.",
      mediaJson: { mode: "catch", rounds: 12 },
    },
  });

  await prisma.gameOption.createMany({
    data: [
      // GOOD deeds (isCorrect = true → should be tapped)
      {
        questionId: q1.id,
        order: 0,
        labelAr: "الصلاة",
        labelEn: "Prayer",
        emoji: "🤲",
        isCorrect: true,
        feedbackAr: "أحسنت! الصلاة من أعظم الحسنات 🌟",
        feedbackEn: "Well done! Prayer is one of the greatest good deeds 🌟",
      },
      {
        questionId: q1.id,
        order: 1,
        labelAr: "قراءة القرآن",
        labelEn: "Reading Quran",
        emoji: "📖",
        isCorrect: true,
        feedbackAr: "ممتاز! قراءة القرآن نور للقلب ✨",
        feedbackEn: "Excellent! Reading Quran is light for the heart ✨",
      },
      {
        questionId: q1.id,
        order: 2,
        labelAr: "مساعدة الناس",
        labelEn: "Helping people",
        emoji: "🤝",
        isCorrect: true,
        feedbackAr: "رائع! المساعدة حسنة عظيمة 💛",
        feedbackEn: "Wonderful! Helping others is a great good deed 💛",
      },
      {
        questionId: q1.id,
        order: 3,
        labelAr: "ابتسامة لأخيك",
        labelEn: "Smiling at your brother",
        emoji: "😊",
        isCorrect: true,
        feedbackAr: "جميل! الابتسامة صدقة 😊",
        feedbackEn: "Beautiful! A smile is charity 😊",
      },
      {
        questionId: q1.id,
        order: 4,
        labelAr: "برّ الوالدين",
        labelEn: "Being good to parents",
        emoji: "🫶",
        isCorrect: true,
        feedbackAr: "أحسنت! برّ الوالدين من أحبّ الأعمال إلى الله 💖",
        feedbackEn:
          "Well done! Being good to parents is one of the most beloved deeds to Allah 💖",
      },
      {
        questionId: q1.id,
        order: 5,
        labelAr: "إماطة الأذى",
        labelEn: "Removing harm from the path",
        emoji: "🧹",
        isCorrect: true,
        feedbackAr: "ممتاز! إماطة الأذى شعبة من الإيمان 🌱",
        feedbackEn:
          "Excellent! Removing harm from the path is a branch of faith 🌱",
      },
      {
        questionId: q1.id,
        order: 6,
        labelAr: "إطعام مسكين",
        labelEn: "Feeding a poor person",
        emoji: "🥗",
        isCorrect: true,
        feedbackAr: "رائع! إطعام الجائع حسنة عظيمة 💛",
        feedbackEn: "Wonderful! Feeding the hungry is a great good deed 💛",
      },
      {
        questionId: q1.id,
        order: 7,
        labelAr: "الرفق بالحيوان",
        labelEn: "Being kind to animals",
        emoji: "🐈",
        isCorrect: true,
        feedbackAr: "جميل! الرفق بالحيوانات يحبه الله 🐾",
        feedbackEn: "Beautiful! Allah loves kindness to animals 🐾",
      },
      {
        questionId: q1.id,
        order: 8,
        labelAr: "الصدقة",
        labelEn: "Giving charity",
        emoji: "💝",
        isCorrect: true,
        feedbackAr: "أحسنت! الصدقة تطفئ الخطيئة 💝",
        feedbackEn: "Well done! Charity wipes away mistakes 💝",
      },
      {
        questionId: q1.id,
        order: 9,
        labelAr: "قول الصدق",
        labelEn: "Telling the truth",
        emoji: "✅",
        isCorrect: true,
        feedbackAr: "رائع! الصدق يهدي إلى الجنة ✅",
        feedbackEn: "Wonderful! Truthfulness leads to Paradise ✅",
      },
      {
        questionId: q1.id,
        order: 10,
        labelAr: "سقي الماء",
        labelEn: "Giving water to drink",
        emoji: "💧",
        isCorrect: true,
        feedbackAr: "جميل! سقي الماء صدقة عظيمة 💧",
        feedbackEn: "Beautiful! Giving water to drink is a great charity 💧",
      },
      {
        questionId: q1.id,
        order: 11,
        labelAr: "صلة الرحم",
        labelEn: "Keeping family ties",
        emoji: "👵",
        isCorrect: true,
        feedbackAr: "ممتاز! صلة الرحم تزيد المحبة والبركة 👵",
        feedbackEn:
          "Excellent! Keeping family ties brings love and blessing 👵",
      },
      {
        questionId: q1.id,
        order: 12,
        labelAr: "إفشاء السلام",
        labelEn: "Spreading the greeting",
        emoji: "👋",
        isCorrect: true,
        feedbackAr: "أحسنت! إفشاء السلام ينشر المحبة بيننا 👋",
        feedbackEn: "Well done! Spreading salam spreads love between us 👋",
      },
      {
        questionId: q1.id,
        order: 13,
        labelAr: "ذكر الله",
        labelEn: "Remembering Allah",
        emoji: "📿",
        isCorrect: true,
        feedbackAr: "رائع! بذكر الله تطمئن القلوب 📿",
        feedbackEn: "Wonderful! Remembering Allah brings peace to hearts 📿",
      },
      // BAD deeds (isCorrect = false → should NOT be tapped)
      {
        questionId: q1.id,
        order: 14,
        labelAr: "الكذب",
        labelEn: "Lying",
        emoji: "🗣️",
        isCorrect: false,
        feedbackAr: "هذا ليس عملاً طيباً! ابحث عن الأعمال الطيبة 💛",
        feedbackEn: "That is not a good deed! Look for the good deeds 💛",
      },
      {
        questionId: q1.id,
        order: 15,
        labelAr: "الغضب",
        labelEn: "Anger",
        emoji: "😠",
        isCorrect: false,
        feedbackAr: "لا بأس! هذا ليس مما نجمعه. ابحث عن الحسنات 💛",
        feedbackEn:
          "No worries! This is not what we collect. Look for good deeds 💛",
      },
      {
        questionId: q1.id,
        order: 16,
        labelAr: "عصيان الوالدين",
        labelEn: "Disobeying parents",
        emoji: "🙉",
        isCorrect: false,
        feedbackAr: "هذا ليس عملاً طيباً! اجمع الحسنات وتجنب هذا 💛",
        feedbackEn:
          "That is not a good deed! Collect good deeds and avoid this 💛",
      },
      {
        questionId: q1.id,
        order: 17,
        labelAr: "الغش",
        labelEn: "Cheating",
        emoji: "🃏",
        isCorrect: false,
        feedbackAr: "هذا ليس عملاً طيباً! من غشّ فليس منّا 💛",
        feedbackEn: "That is not a good deed! Cheating is not from us 💛",
      },
      {
        questionId: q1.id,
        order: 18,
        labelAr: "إيذاء الجار",
        labelEn: "Hurting a neighbor",
        emoji: "💢",
        isCorrect: false,
        feedbackAr: "لا! أحسِن إلى جارك ولا تؤذِه 💛",
        feedbackEn: "No! Be kind to your neighbor, don't hurt them 💛",
      },
      {
        questionId: q1.id,
        order: 19,
        labelAr: "السبّ والشتم",
        labelEn: "Insulting others",
        emoji: "🤬",
        isCorrect: false,
        feedbackAr: "هذا ليس من الأعمال الطيبة! تكلّم بالكلام الطيب 💛",
        feedbackEn: "That is not a good deed! Speak only kind words 💛",
      },
    ],
  });

  console.log(`[seed] game good-deeds-catch — 1 question (20 options in pool)`);
  return game;
}

