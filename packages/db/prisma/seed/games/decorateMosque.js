// @ts-check
import { prisma } from "../../../prisma.client.js";
import { clearGameQuestions } from "./helpers.js";

export async function seedDecorateMosque() {
  const game = await prisma.game.upsert({
    where: { slug: "decorate-mosque" },
    update: {
      titleAr: "زيّن مسجدك",
      titleEn: "Decorate Your Mosque",
      descriptionAr:
        "اختر الألوان وزيّن مسجدك الجميل كما تحب — لا توجد إجابات خاطئة!",
      descriptionEn:
        "Pick colors and decorate your beautiful mosque however you like — no wrong answers!",
      passThreshold: 1,
    },
    create: {
      slug: "decorate-mosque",
      titleAr: "زيّن مسجدك",
      titleEn: "Decorate Your Mosque",
      descriptionAr:
        "اختر الألوان وزيّن مسجدك الجميل كما تحب — لا توجد إجابات خاطئة!",
      descriptionEn:
        "Pick colors and decorate your beautiful mosque however you like — no wrong answers!",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 1,
      configJson: {
        theme: {
          primary: "#3B82F6",
          accent: "#06d6a0",
          warn: "#ffa83d",
          bg: "#f0f9ff",
        },
        hero: { emoji: "🎨", nameAr: "فنان المسجد", nameEn: "Mosque Artist" },
        stars: 1,
        certificate: {
          titleAr: "وسام فنان المسجد",
          titleEn: "Mosque Artist Medal",
          emoji: "🎨",
          accent: "#3B82F6",
          background: "linear-gradient(135deg, #f0f9ff 0%, #d8f5ee 100%)",
          decoration: "rainbow",
        },
        reward: {
          giftNameAr: "علبة ألوان ذهبية",
          giftNameEn: "Golden Paint Set",
          emoji: "🖌️",
        },
        rewardStudio: {
          coverColors: ["#FFC107", "#22C55E", "#3B82F6", "#EC4899", "#8B5CF6"],
          stickers: ["⭐", "🌙", "🕌", "❤️", "🌟", "🏮"],
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  // One COLORING screen. mediaJson lists the palette + which SVG regions to color.
  // Region ids must match the renderer's SVG: sky, dome, body, door, minaret, crescent.
  await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 0,
      kind: "COLORING",
      promptAr: "اختر لوناً ثم المس أجزاء المسجد لتلوّنها وتزيّنها! 🎨🕌",
      promptEn:
        "Pick a color and tap the mosque parts to color and decorate them! 🎨🕌",
      mediaJson: {
        palette: [
          "#ffd166",
          "#06d6a0",
          "#ef476f",
          "#118ab2",
          "#8a5bff",
          "#ffffff",
        ],
        regions: [
          { id: "dome", nameAr: "القبة", nameEn: "Dome" },
          { id: "body", nameAr: "المبنى", nameEn: "Body" },
          { id: "door", nameAr: "الباب", nameEn: "Door" },
          { id: "minaret", nameAr: "المئذنة", nameEn: "Minaret" },
          { id: "crescent", nameAr: "الهلال", nameEn: "Crescent" },
        ],
      },
    },
  });

  console.log(`[seed] game decorate-mosque — 1 question (COLORING)`);
  return game;
}

