// @ts-check
import { prisma } from "../../../prisma.client.js";
import { clearGameQuestions } from "./helpers.js";

export async function seedPillarsBuild() {
  const configJson = {
    theme: {
      primary: "#6536e0",
      accent: "#ffa83d",
      warn: "#ff6fa8",
      bg: "#f7f3ff",
    },
    hero: {
      emoji: "🕌",
      nameAr: "بطل الأركان",
      nameEn: "Pillars Champion",
    },
    stars: 6,
    certificate: {
      titleAr: "وسام بطل أركان الإسلام",
      titleEn: "Pillars of Islam Champion Medal",
      emoji: "🕌",
      accent: "#6536e0",
      background: "linear-gradient(135deg, #f7f3ff 0%, #e6dbff 100%)",
      decoration: "crescent",
    },
    reward: {
      giftNameAr: "مسجد ذهبي",
      giftNameEn: "Golden Mosque",
      emoji: "🌟",
    },
  };
  const game = await prisma.game.upsert({
    where: { slug: "pillars-build" },
    update: {
      titleAr: "ابنِ أركان الإسلام",
      titleEn: "Build the Pillars of Islam",
      descriptionAr: "تعرّف إلى أركان الإسلام الخمسة من خلال أسئلة ممتعة!",
      descriptionEn: "Learn the five pillars of Islam through fun questions!",
      passThreshold: 6,
      configJson,
    },
    create: {
      slug: "pillars-build",
      titleAr: "ابنِ أركان الإسلام",
      titleEn: "Build the Pillars of Islam",
      descriptionAr: "تعرّف إلى أركان الإسلام الخمسة من خلال أسئلة ممتعة!",
      descriptionEn: "Learn the five pillars of Islam through fun questions!",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 6,
      configJson,
    },
  });

  await clearGameQuestions(game.id);

  const questions = [
    {
      order: 0,
      promptAr: "ما هو الركن الأول من أركان الإسلام؟",
      promptEn: "What is the first pillar of Islam?",
      options: [
        {
          order: 0,
          labelAr: "الشهادتان: لا إله إلا الله محمد رسول الله",
          labelEn:
            "The Two Testimonies: No god but Allah, Muhammad is His messenger",
          emoji: "🕋",
          isCorrect: true,
          feedbackAr: "ممتاز! الشهادتان هما أساس الإسلام وأول أركانه 🤍",
          feedbackEn:
            "Excellent! The Two Testimonies are the foundation of Islam and its first pillar 🤍",
        },
        {
          order: 1,
          labelAr: "الصيام",
          labelEn: "Fasting",
          emoji: "🌙",
          isCorrect: false,
          feedbackAr:
            "لا بأس! الصيام ركن من أركان الإسلام، لكن أولها الشهادتان. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Fasting is a pillar, but the Testimonies come first. Try again 😊",
        },
        {
          order: 2,
          labelAr: "الزكاة",
          labelEn: "Zakat",
          emoji: "💰",
          isCorrect: false,
          feedbackAr:
            "لا بأس! الزكاة ركن لكنه الثالث. الأول هو الشهادتان. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Zakat is a pillar but it is the third. The first is the Testimonies. Try again 😊",
        },
      ],
    },
    {
      order: 1,
      promptAr: "أي من هذه هو ركن من أركان الإسلام؟",
      promptEn: "Which of these is a pillar of Islam?",
      options: [
        {
          order: 0,
          labelAr: "مشاهدة التلفاز",
          labelEn: "Watching television",
          emoji: "📺",
          isCorrect: false,
          feedbackAr:
            "لا بأس! مشاهدة التلفاز ليست ركناً. اختر الإجابة الصحيحة. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Watching television is not a pillar. Try again 😊",
        },
        {
          order: 1,
          labelAr: "الصلاة خمس مرات في اليوم",
          labelEn: "Praying five times a day",
          emoji: "🤲",
          isCorrect: true,
          feedbackAr: "أحسنت! الصلاة هي الركن الثاني ونصلي خمس صلوات كل يوم 🤲",
          feedbackEn:
            "Well done! Prayer is the second pillar — we pray five times every day 🤲",
        },
        {
          order: 2,
          labelAr: "اللعب بالكرة",
          labelEn: "Playing football",
          emoji: "⚽",
          isCorrect: false,
          feedbackAr:
            "لا بأس! اللعب ليس ركناً. الصلاة هي الركن الثاني. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Playing is not a pillar. Prayer is the second pillar. Try again 😊",
        },
      ],
    },
    {
      order: 2,
      promptAr: "ماذا نقول في الشهادة؟",
      promptEn: "What do we say in the Shahada?",
      options: [
        {
          order: 0,
          labelAr: "الحمد لله رب العالمين",
          labelEn: "All praise is for Allah, Lord of the worlds",
          emoji: "📖",
          isCorrect: false,
          feedbackAr:
            "لا بأس! هذه بداية الفاتحة. الشهادة هي «لا إله إلا الله». جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! That is the start of Al-Fatihah. The Shahada is «No god but Allah». Try again 😊",
        },
        {
          order: 1,
          labelAr: "لا إله إلا الله وأن محمداً رسول الله",
          labelEn: "No god but Allah and Muhammad is His messenger",
          emoji: "🕋",
          isCorrect: true,
          feedbackAr: "رائع! هذه هي الشهادة العظيمة التي تدخلنا في الإسلام 🌟",
          feedbackEn:
            "Wonderful! This is the great Testimony that brings us into Islam 🌟",
        },
        {
          order: 2,
          labelAr: "بسم الله الرحمن الرحيم",
          labelEn: "In the name of Allah the Most Gracious the Most Merciful",
          emoji: "📖",
          isCorrect: false,
          feedbackAr:
            "لا بأس! هذه البسملة. الشهادة هي «لا إله إلا الله». جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! That is the Basmala. The Shahada is «No god but Allah». Try again 😊",
        },
      ],
    },
    {
      order: 3,
      promptAr: "في أي شهر يصوم المسلمون؟",
      promptEn: "In which month do Muslims fast?",
      options: [
        {
          order: 0,
          labelAr: "شهر محرم",
          labelEn: "Month of Muharram",
          emoji: "📅",
          isCorrect: false,
          feedbackAr: "لا بأس! نصوم في شهر رمضان المبارك. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We fast in the blessed month of Ramadan. Try again 😊",
        },
        {
          order: 1,
          labelAr: "شهر رمضان",
          labelEn: "Month of Ramadan",
          emoji: "🌙",
          isCorrect: true,
          feedbackAr:
            "ممتاز! شهر رمضان المبارك هو شهر الصيام والقرآن والخير 🌙",
          feedbackEn:
            "Excellent! The blessed month of Ramadan is the month of fasting, Quran, and goodness 🌙",
        },
        {
          order: 2,
          labelAr: "شهر رجب",
          labelEn: "Month of Rajab",
          emoji: "📅",
          isCorrect: false,
          feedbackAr: "لا بأس! الصيام في رمضان. جرّب مرة أخرى 😊",
          feedbackEn: "No worries! Fasting is in Ramadan. Try again 😊",
        },
      ],
    },
    {
      order: 4,
      promptAr: "ما الركن الذي نؤدي فيه حقًا واجبًا من المال للمستحقين؟",
      promptEn: "Which pillar gives a required share of wealth to those entitled to it?",
      options: [
        {
          order: 0,
          labelAr: "الصيام",
          labelEn: "Fasting",
          emoji: "🌙",
          isCorrect: false,
          feedbackAr: "لا بأس! الصيام امتناع عن الطعام والشراب في رمضان. جرّب مرة أخرى 😊",
          feedbackEn: "No worries! Fasting means abstaining from food and drink in Ramadan. Try again 😊",
        },
        {
          order: 1,
          labelAr: "الحج",
          labelEn: "Hajj",
          emoji: "🕋",
          isCorrect: false,
          feedbackAr: "لا بأس! الحج إلى بيت الله الحرام، أما حق المال فهو الزكاة. جرّب مرة أخرى 😊",
          feedbackEn: "No worries! Hajj is pilgrimage to the Sacred House; the wealth pillar is Zakat. Try again 😊",
        },
        {
          order: 2,
          labelAr: "الزكاة",
          labelEn: "Zakat",
          emoji: "💰",
          isCorrect: true,
          feedbackAr: "أحسنت! الزكاة حق واجب في المال إذا تحققت شروطها 💛",
          feedbackEn: "Well done! Zakat is a required share of wealth when its conditions are met 💛",
        },
      ],
    },
    {
      order: 5,
      promptAr: "ما الركن الذي نحج فيه إلى بيت الله الحرام لمن استطاع؟",
      promptEn: "Which pillar is pilgrimage to the Sacred House for those able to go?",
      options: [
        {
          order: 0,
          labelAr: "الزكاة",
          labelEn: "Zakat",
          emoji: "💰",
          isCorrect: false,
          feedbackAr: "لا بأس! الزكاة تتعلق بالمال، أما السفر إلى بيت الله فهو الحج. جرّب مرة أخرى 😊",
          feedbackEn: "No worries! Zakat concerns wealth; pilgrimage to the Sacred House is Hajj. Try again 😊",
        },
        {
          order: 1,
          labelAr: "الحج",
          labelEn: "Hajj",
          emoji: "🕋",
          isCorrect: true,
          feedbackAr: "رائع! الحج إلى بيت الله الحرام ركن من أركان الإسلام لمن استطاع 🕋",
          feedbackEn: "Great! Hajj to the Sacred House is a pillar of Islam for those able to go 🕋",
        },
        {
          order: 2,
          labelAr: "الصلاة",
          labelEn: "Prayer",
          emoji: "🤲",
          isCorrect: false,
          feedbackAr: "لا بأس! الصلاة نؤديها كل يوم، أما زيارة بيت الله للحج فهي الركن المقصود. جرّب مرة أخرى 😊",
          feedbackEn: "No worries! Prayer is daily; the pilgrimage to the Sacred House is Hajj. Try again 😊",
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

  console.log(`[seed] game pillars-build — ${questions.length} questions`);
  return game;
}

