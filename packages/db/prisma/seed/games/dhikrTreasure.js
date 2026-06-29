// @ts-check
import { prisma } from "../../../prisma.client.js";
import { clearGameQuestions } from "./helpers.js";

// Same "tap-the-good" idea as good-deeds-catch, but a DIFFERENT topic (adhkar),
// a DIFFERENT style (items drop from the sky into a treasure pouch) and a small
// twist: you fill a treasure of remembrance instead of a rocket.
export async function seedDhikrTreasure() {
  const game = await prisma.game.upsert({
    where: { slug: "dhikr-treasure" },
    update: {
      titleAr: "كنز الأذكار",
      titleEn: "Dhikr Treasure",
      descriptionAr:
        "الأذكار تتساقط من السماء! المس الذكر الطيب لتجمعه في كنزك، وتجنّب الكلام السيّئ.",
      descriptionEn:
        "Words of remembrance fall from the sky! Tap the good dhikr to collect it in your treasure, and avoid bad words.",
      passThreshold: 1,
    },
    create: {
      slug: "dhikr-treasure",
      titleAr: "كنز الأذكار",
      titleEn: "Dhikr Treasure",
      descriptionAr:
        "الأذكار تتساقط من السماء! المس الذكر الطيب لتجمعه في كنزك، وتجنّب الكلام السيّئ.",
      descriptionEn:
        "Words of remembrance fall from the sky! Tap the good dhikr to collect it in your treasure, and avoid bad words.",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 1,
      configJson: {
        theme: {
          primary: "#0EA5E9",
          accent: "#F59E0B",
          warn: "#FB7185",
          bg: "#f0f9ff",
        },
        hero: {
          emoji: "💎",
          nameAr: "صائد الأذكار",
          nameEn: "Dhikr Hunter",
        },
        stars: 4,
        certificate: {
          titleAr: "شهادة كنز الأذكار",
          titleEn: "Dhikr Treasure Certificate",
          emoji: "💎",
          accent: "#F59E0B",
          background: "linear-gradient(135deg, #f0f9ff 0%, #fef3c7 100%)",
          decoration: "stars",
        },
        reward: {
          giftNameAr: "جوهرة الأذكار",
          giftNameEn: "Dhikr Gem",
          emoji: "💎",
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
        "الأذكار تتساقط من السماء! المس الذكر الطيب لتجمعه في كنزك 💎 وتجنّب الكلام السيّئ.",
      promptEn:
        "The adhkar fall from the sky! Tap the good dhikr to collect it in your treasure 💎 and avoid bad words.",
      mediaJson: {
        mode: "catch",
        rounds: 8,
        direction: "fall",
        speed: "normal",
        goalEmoji: "💎",
        catcherEmoji: "💰",
        hintAr:
          "الأذكار تتساقط من السماء — المسها لتجمعها في كنزك! 💎 تجنّب الكلام السيّئ.",
        hintEn:
          "The adhkar fall from the sky — tap them to fill your treasure! 💎 Avoid bad words.",
        doneAr: "ملأت كنزك بأجمل الأذكار! ما شاء الله 💎✨",
        doneEn:
          "You filled your treasure with the most beautiful dhikr! MashaAllah 💎✨",
        arena: {
          from: "#dbeafe",
          to: "#eff6ff",
          glow: "#fde68a",
          border: "#bfdbfe",
        },
      },
    },
  });

  await prisma.gameOption.createMany({
    data: [
      // GOOD dhikr (isCorrect = true → collect)
      {
        questionId: q1.id,
        order: 0,
        labelAr: "سبحان الله",
        labelEn: "SubhanAllah",
        emoji: "📿",
        isCorrect: true,
        feedbackAr: "أحسنت! سبحان الله تملأ الميزان 🌟",
        feedbackEn: "Well done! SubhanAllah fills the scale 🌟",
      },
      {
        questionId: q1.id,
        order: 1,
        labelAr: "الحمد لله",
        labelEn: "Alhamdulillah",
        emoji: "🤍",
        isCorrect: true,
        feedbackAr: "ممتاز! الحمد لله تملأ الميزان ✨",
        feedbackEn: "Excellent! Alhamdulillah fills the scale ✨",
      },
      {
        questionId: q1.id,
        order: 2,
        labelAr: "الله أكبر",
        labelEn: "Allahu Akbar",
        emoji: "☝️",
        isCorrect: true,
        feedbackAr: "رائع! الله أكبر ذكر عظيم 💛",
        feedbackEn: "Wonderful! Allahu Akbar is a great dhikr 💛",
      },
      {
        questionId: q1.id,
        order: 3,
        labelAr: "لا إله إلا الله",
        labelEn: "La ilaha illa Allah",
        emoji: "🌟",
        isCorrect: true,
        feedbackAr: "أحسنت! لا إله إلا الله أفضل الذكر 💖",
        feedbackEn: "Well done! La ilaha illa Allah is the best dhikr 💖",
      },
      {
        questionId: q1.id,
        order: 4,
        labelAr: "أستغفر الله",
        labelEn: "Astaghfirullah",
        emoji: "🤲",
        isCorrect: true,
        feedbackAr: "جميل! الاستغفار يمحو الذنوب 🌱",
        feedbackEn: "Beautiful! Seeking forgiveness wipes away sins 🌱",
      },
      {
        questionId: q1.id,
        order: 5,
        labelAr: "بسم الله",
        labelEn: "Bismillah",
        emoji: "✨",
        isCorrect: true,
        feedbackAr: "ممتاز! نبدأ كل شيء ببسم الله 💫",
        feedbackEn: "Excellent! We begin everything with Bismillah 💫",
      },
      {
        questionId: q1.id,
        order: 6,
        labelAr: "لا حول ولا قوة إلا بالله",
        labelEn: "La hawla wala quwwata illa billah",
        emoji: "💪",
        isCorrect: true,
        feedbackAr: "رائع! كنز من كنوز الجنة 💎",
        feedbackEn: "Wonderful! A treasure from the treasures of Paradise 💎",
      },
      {
        questionId: q1.id,
        order: 7,
        labelAr: "اللهم صلِّ على النبي",
        labelEn: "Send blessings on the Prophet",
        emoji: "🕌",
        isCorrect: true,
        feedbackAr: "جميل! الصلاة على النبي ﷺ نور 🌙",
        feedbackEn: "Beautiful! Sending blessings on the Prophet ﷺ is light 🌙",
      },
      // NOT dhikr (isCorrect = false → leave it)
      {
        questionId: q1.id,
        order: 8,
        labelAr: "كلام نابٍ",
        labelEn: "Rude words",
        emoji: "😣",
        isCorrect: false,
        feedbackAr: "هذا ليس ذكراً طيباً! اجمع الأذكار 💎",
        feedbackEn: "That is not a good word! Collect the dhikr 💎",
      },
      {
        questionId: q1.id,
        order: 9,
        labelAr: "الكذب",
        labelEn: "Lying",
        emoji: "🤥",
        isCorrect: false,
        feedbackAr: "لا بأس! هذا ليس مما نجمعه. ابحث عن الأذكار 💎",
        feedbackEn:
          "No worries! This is not what we collect. Look for the dhikr 💎",
      },
      {
        questionId: q1.id,
        order: 10,
        labelAr: "النميمة",
        labelEn: "Gossip",
        emoji: "🗣️",
        isCorrect: false,
        feedbackAr: "هذا ليس ذكراً طيباً! اجمع الأذكار وتجنّب هذا 💎",
        feedbackEn:
          "That is not a good word! Collect the dhikr and avoid this 💎",
      },
    ],
  });

  console.log(`[seed] game dhikr-treasure — 1 question (11 options in pool)`);
  return game;
}

