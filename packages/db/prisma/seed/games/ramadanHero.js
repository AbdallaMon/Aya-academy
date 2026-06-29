// @ts-check
import { prisma } from "../../../prisma.client.js";
import { clearGameQuestions } from "./helpers.js";

export async function seedRamadanHero() {
  const game = await prisma.game.upsert({
    where: { slug: "ramadan-hero" },
    update: {
      titleAr: "بطل رمضان",
      titleEn: "Ramadan Hero",
      descriptionAr:
        "ضع كل عمل طيب من أعمال رمضان في يومه المناسب: الصيام والصلاة والصدقة!",
      descriptionEn:
        "Place each good Ramadan deed on its right day: fasting, prayer, and charity!",
      passThreshold: 1,
    },
    create: {
      slug: "ramadan-hero",
      titleAr: "بطل رمضان",
      titleEn: "Ramadan Hero",
      descriptionAr:
        "ضع كل عمل طيب من أعمال رمضان في يومه المناسب: الصيام والصلاة والصدقة!",
      descriptionEn:
        "Place each good Ramadan deed on its right day: fasting, prayer, and charity!",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 1,
      configJson: {
        theme: {
          primary: "#6536e0",
          accent: "#ffa83d",
          warn: "#ff6fa8",
          bg: "#f7f3ff",
        },
        hero: { emoji: "🌙", nameAr: "بطل رمضان", nameEn: "Ramadan Hero" },
        stars: 2,
        certificate: {
          titleAr: "وسام بطل رمضان",
          titleEn: "Ramadan Hero Medal",
          emoji: "🌙",
          accent: "#ffa83d",
          background: "linear-gradient(135deg, #f7f3ff 0%, #ffedd1 100%)",
          decoration: "crescent",
        },
        reward: {
          giftNameAr: "فانوس رمضان",
          giftNameEn: "Ramadan Lantern",
          emoji: "🏮",
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  // Two CALENDAR_DROP screens. mediaJson defines slots + draggable items; each
  // item carries the slotId it belongs to (no GameOption rows needed).
  await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 0,
      kind: "CALENDAR_DROP",
      promptAr: "ضع كل عمل طيب في يومه المناسب من أيام رمضان! 🌙",
      promptEn: "Place each good deed on its right Ramadan day! 🌙",
      mediaJson: {
        slots: [
          {
            id: "morning",
            labelAr: "السحور والصيام",
            labelEn: "Suhoor & Fasting",
            emoji: "🌅",
          },
          {
            id: "day",
            labelAr: "صلاة الظهر",
            labelEn: "Dhuhr Prayer",
            emoji: "🕌",
          },
          { id: "evening", labelAr: "الصدقة", labelEn: "Charity", emoji: "🤲" },
        ],
        items: [
          {
            id: "fasting",
            slotId: "morning",
            labelAr: "صيام",
            labelEn: "Fasting",
            emoji: "🍽️",
            feedbackAr:
              "لا بأس! الصيام يبدأ بعد السحور في الصباح. جرّب اليوم المناسب 😊",
            feedbackEn:
              "No worries! Fasting starts after Suhoor in the morning. Try the right day 😊",
          },
          {
            id: "prayer",
            slotId: "day",
            labelAr: "صلاة",
            labelEn: "Prayer",
            emoji: "🤲",
            feedbackAr: "لا بأس! الصلاة في وقتها. جرّب اليوم المناسب 😊",
            feedbackEn:
              "No worries! Prayer goes in its time. Try the right day 😊",
          },
          {
            id: "charity",
            slotId: "evening",
            labelAr: "صدقة",
            labelEn: "Charity",
            emoji: "💝",
            feedbackAr: "لا بأس! الصدقة عمل جميل. جرّب اليوم المناسب 😊",
            feedbackEn:
              "No worries! Charity is a lovely deed. Try the right day 😊",
          },
        ],
      },
    },
  });

  await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 1,
      kind: "CALENDAR_DROP",
      promptAr: "ليلة جميلة في رمضان! ضع كل عمل طيب في مكانه 🌙",
      promptEn: "A lovely Ramadan night! Place each good deed in its spot 🌙",
      mediaJson: {
        slots: [
          { id: "iftar", labelAr: "الإفطار", labelEn: "Iftar", emoji: "🌆" },
          {
            id: "taraweeh",
            labelAr: "صلاة التراويح",
            labelEn: "Taraweeh",
            emoji: "🌙",
          },
          {
            id: "quran",
            labelAr: "قراءة القرآن",
            labelEn: "Reading Quran",
            emoji: "📖",
          },
        ],
        items: [
          {
            id: "dates",
            slotId: "iftar",
            labelAr: "تمر وماء",
            labelEn: "Dates & Water",
            emoji: "🌴",
            feedbackAr: "لا بأس! نفطر على التمر والماء. جرّب اليوم المناسب 😊",
            feedbackEn:
              "No worries! We break the fast with dates and water. Try the right day 😊",
          },
          {
            id: "night-prayer",
            slotId: "taraweeh",
            labelAr: "قيام الليل",
            labelEn: "Night Prayer",
            emoji: "🤲",
            feedbackAr:
              "لا بأس! التراويح صلاة الليل في رمضان. جرّب اليوم المناسب 😊",
            feedbackEn:
              "No worries! Taraweeh is the Ramadan night prayer. Try the right day 😊",
          },
          {
            id: "mushaf",
            slotId: "quran",
            labelAr: "المصحف",
            labelEn: "The Mushaf",
            emoji: "📖",
            feedbackAr: "لا بأس! نقرأ القرآن من المصحف. جرّب اليوم المناسب 😊",
            feedbackEn:
              "No worries! We read the Quran from the Mushaf. Try the right day 😊",
          },
        ],
      },
    },
  });

  console.log(`[seed] game ramadan-hero — 2 questions (CALENDAR_DROP)`);
  return game;
}

