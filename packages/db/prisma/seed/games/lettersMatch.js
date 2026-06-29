// @ts-check
import { prisma } from "../../../prisma.client.js";
import { clearGameQuestions } from "./helpers.js";

export async function seedLettersMatch() {
  const game = await prisma.game.upsert({
    where: { slug: "letters-match" },
    update: {
      titleAr: "حروف القرآن",
      titleEn: "Quran Letters",
      descriptionAr:
        "طابق كل حرف عربي مع الكلمة التي تبدأ به! المس الحرف ثم شريكه.",
      descriptionEn:
        "Match each Arabic letter with a word that starts with it! Tap a letter then its partner.",
      passThreshold: 2,
    },
    create: {
      slug: "letters-match",
      titleAr: "حروف القرآن",
      titleEn: "Quran Letters",
      descriptionAr:
        "طابق كل حرف عربي مع الكلمة التي تبدأ به! المس الحرف ثم شريكه.",
      descriptionEn:
        "Match each Arabic letter with a word that starts with it! Tap a letter then its partner.",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 2,
      configJson: {
        theme: {
          primary: "#8a5bff",
          accent: "#23c483",
          warn: "#ffa83d",
          bg: "#fdf7ff",
        },
        hero: { emoji: "🔤", nameAr: "بطل الحروف", nameEn: "Letters Champion" },
        stars: 2,
        certificate: {
          titleAr: "وسام بطل حروف القرآن",
          titleEn: "Quran Letters Champion Medal",
          emoji: "🔤",
          accent: "#8a5bff",
          background: "linear-gradient(135deg, #fdf7ff 0%, #e3f7ec 100%)",
          decoration: "rainbow",
        },
        reward: {
          giftNameAr: "نجمة الحروف",
          giftNameEn: "Letters Star",
          emoji: "⭐",
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  // Two MATCHING screens; data lives entirely in mediaJson.pairs (no options).
  await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 0,
      kind: "MATCHING",
      promptAr: "طابق كل حرف مع الكلمة التي تبدأ به! 💞",
      promptEn: "Match each letter with the word that starts with it! 💞",
      mediaJson: {
        pairs: [
          {
            id: "alif",
            leftAr: "أ",
            leftEn: "Alif",
            rightAr: "أرنب",
            rightEn: "Rabbit",
            rightEmoji: "🐰",
          },
          {
            id: "baa",
            leftAr: "ب",
            leftEn: "Baa",
            rightAr: "بطة",
            rightEn: "Duck",
            rightEmoji: "🦆",
          },
          {
            id: "taa",
            leftAr: "ت",
            leftEn: "Taa",
            rightAr: "تفاحة",
            rightEn: "Apple",
            rightEmoji: "🍎",
          },
        ],
      },
    },
  });

  await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 1,
      kind: "MATCHING",
      promptAr: "طابق هذه الحروف الجميلة أيضاً! 💞",
      promptEn: "Match these lovely letters too! 💞",
      mediaJson: {
        pairs: [
          {
            id: "jeem",
            leftAr: "ج",
            leftEn: "Jeem",
            rightAr: "جمل",
            rightEn: "Camel",
            rightEmoji: "🐫",
          },
          {
            id: "noon",
            leftAr: "ن",
            leftEn: "Noon",
            rightAr: "نجمة",
            rightEn: "Star",
            rightEmoji: "⭐",
          },
          {
            id: "qaf",
            leftAr: "ق",
            leftEn: "Qaf",
            rightAr: "قمر",
            rightEn: "Moon",
            rightEmoji: "🌙",
          },
        ],
      },
    },
  });

  console.log(`[seed] game letters-match — 2 questions (MATCHING)`);
  return game;
}

