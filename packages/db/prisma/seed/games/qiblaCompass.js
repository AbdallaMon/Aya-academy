// @ts-check
import { prisma } from "../../../prisma.client.js";
import { clearGameQuestions } from "./helpers.js";

export async function seedQiblaCompass() {
  const game = await prisma.game.upsert({
    where: { slug: "qibla-compass" },
    update: {
      titleAr: "بوصلة القبلة",
      titleEn: "Qibla Compass",
      descriptionAr:
        "أَدِر الإبرة نحو الكعبة الشريفة واكتشف اتجاه القبلة للصلاة!",
      descriptionEn:
        "Turn the needle toward the holy Kaaba and find the Qibla direction for prayer!",
      passThreshold: 2,
    },
    create: {
      slug: "qibla-compass",
      titleAr: "بوصلة القبلة",
      titleEn: "Qibla Compass",
      descriptionAr:
        "أَدِر الإبرة نحو الكعبة الشريفة واكتشف اتجاه القبلة للصلاة!",
      descriptionEn:
        "Turn the needle toward the holy Kaaba and find the Qibla direction for prayer!",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 2,
      configJson: {
        theme: {
          primary: "#23c483",
          accent: "#8a5bff",
          warn: "#ffa83d",
          bg: "#f0fff8",
        },
        hero: { emoji: "🧭", nameAr: "بطل القبلة", nameEn: "Qibla Champion" },
        stars: 3,
        certificate: {
          titleAr: "وسام بطل القبلة",
          titleEn: "Qibla Champion Medal",
          emoji: "🕋",
          accent: "#23c483",
          background: "linear-gradient(135deg, #f0fff8 0%, #e0e6ff 100%)",
          decoration: "crescent",
        },
        reward: {
          giftNameAr: "بوصلة ذهبية",
          giftNameEn: "Golden Compass",
          emoji: "🧭",
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  // Three COMPASS screens — correctness from mediaJson (targetAngle ± tolerance).
  const rounds = [
    {
      order: 0,
      targetAngle: 90,
      promptAr: "أَدِر الإبرة نحو الكعبة 🕋 لتعرف اتجاه القبلة!",
      promptEn: "Turn the needle toward the Kaaba 🕋 to find the Qibla!",
    },
    {
      order: 1,
      targetAngle: 200,
      promptAr: "الكعبة في اتجاه آخر الآن. أَدِر الإبرة نحوها! 🕋",
      promptEn:
        "The Kaaba is in another direction now. Turn the needle to it! 🕋",
    },
    {
      order: 2,
      targetAngle: 315,
      promptAr: "آخر تحدٍّ! وجّه الإبرة نحو الكعبة بدقة 🕋✨",
      promptEn: "Last challenge! Aim the needle right at the Kaaba 🕋✨",
    },
  ];

  for (const r of rounds) {
    await prisma.gameQuestion.create({
      data: {
        gameId: game.id,
        order: r.order,
        kind: "COMPASS",
        promptAr: r.promptAr,
        promptEn: r.promptEn,
        mediaJson: {
          targetAngle: r.targetAngle,
          tolerance: 20,
          labelAr: "أَدِر الإبرة نحو الكعبة 🕋",
          labelEn: "Turn the needle toward the Kaaba 🕋",
          goodAr: "أحسنت! وجدت اتجاه القبلة الصحيح! 🕋💚",
          goodEn: "Well done! You found the right Qibla direction! 🕋💚",
          badAr: "لا بأس! حرّك الإبرة حتى تصل إلى الكعبة 🕋",
          badEn: "No worries! Move the needle until it reaches the Kaaba 🕋",
        },
      },
    });
  }

  console.log(
    `[seed] game qibla-compass — ${rounds.length} questions (COMPASS)`,
  );
  return game;
}

