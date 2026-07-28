// Public free-game copy shared by the server-rendered landing header and the
// interactive client game. Keeping it hook-free lets the important H1 and
// description ship in the first HTML response.

export const FREE_GAME_CONTENT = {
  ar: {
    title: "لعبة تعليمية إسلامية مجانية للأطفال",
    subtitle:
      "جرّب لعبة آداب وأخلاق تفاعلية من أكاديمية آية مجانًا، ثم سجّل واحصل على حصة تجريبية مجانية لطفلك.",
    cta: "سجّل واحصل على حصة مجانية",
    rateTitle: "لقد لعبت كثيرًا اليوم! 🎉",
    rateBody: "عُد بعد حوالي {min} دقيقة لتجربة اللعبة من جديد 😊",
    rateCta: "سجّل الآن والعب بلا حدود",
  },
  en: {
    title: "Free Islamic educational game for kids",
    subtitle:
      "Try an interactive manners game from Ayah Academy for free, then sign up for a free trial session for your child.",
    cta: "Sign up and get a free session",
    rateTitle: "You've played a lot today! 🎉",
    rateBody: "Come back in about {min} minutes to play again 😊",
    rateCta: "Sign up now and play without limits",
  },
};

export function getFreeGameContent(lng) {
  return FREE_GAME_CONTENT[lng === "en" ? "en" : "ar"];
}
