// @ts-check
import { prisma } from "../../prisma.client.js";

export async function seedBadges() {
  return true;
  const badges = [
    {
      code: "FIRST_GAME",
      nameAr: "أول لعبة",
      nameEn: "First Game",
      descriptionAr: "لعبت أول لعبة لك في أكاديمية آية، أحسنت!",
      descriptionEn: "You played your first game at Ayah Academy!",
      icon: "🎮",
    },
    {
      code: "FIRST_QUIZ",
      nameAr: "أول اختبار",
      nameEn: "First Quiz",
      descriptionAr: "أكملت أول اختبار لك، ما شاء الله!",
      descriptionEn: "You completed your first quiz, well done!",
      icon: "📝",
    },
    {
      code: "STAR_COLLECTOR",
      nameAr: "جامع النجوم",
      nameEn: "Star Collector",
      descriptionAr: "جمعت ١٠٠ نقطة! أنت نجم أكاديمية آية.",
      descriptionEn: "You collected 100 points! You're a star!",
      icon: "⭐",
    },
    {
      code: "PERFECT_SCORE",
      nameAr: "الإجابة الكاملة",
      nameEn: "Perfect Score",
      descriptionAr: "أجبت على جميع الأسئلة بشكل صحيح، ممتاز!",
      descriptionEn: "You answered every question correctly, excellent!",
      icon: "💯",
    },
    {
      code: "STREAK_7",
      nameAr: "أسبوع المثابرة",
      nameEn: "7-Day Streak",
      descriptionAr: "لعبت سبعة أيام متتالية، أنت بطل المثابرة!",
      descriptionEn: "You played seven days in a row — you're a champion!",
      icon: "🔥",
    },
    {
      code: "HELPER",
      nameAr: "المساعد الصغير",
      nameEn: "Little Helper",
      descriptionAr: "تعلّمت كيف تساعد الآخرين وتكون لطيفاً. قلبك طيب!",
      descriptionEn:
        "You learned how to help others and be kind. What a good heart!",
      icon: "🤝",
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: {},
      create: badge,
    });
  }

  console.log(`[seed] badges — ${badges.length} upserted`);
  return badges.map((b) => b.code);
}
