// @ts-check
import { prisma } from "../../../prisma.client.js";
import { clearGameQuestions } from "./helpers.js";

export async function seedKindWords() {
  const game = await prisma.game.upsert({
    where: { slug: "kind-words" },
    update: {
      titleAr: "الكلمات الطيبة",
      titleEn: "Kind Words",
      descriptionAr:
        "اختر الكلمة الطيبة المناسبة في كل موقف: الشكر، الاعتذار، التشجيع، واللطف!",
      descriptionEn:
        "Pick the kind word for each moment: thanking, apologising, encouraging, and being gentle!",
      passThreshold: 4,
    },
    create: {
      slug: "kind-words",
      titleAr: "الكلمات الطيبة",
      titleEn: "Kind Words",
      descriptionAr:
        "اختر الكلمة الطيبة المناسبة في كل موقف: الشكر، الاعتذار، التشجيع، واللطف!",
      descriptionEn:
        "Pick the kind word for each moment: thanking, apologising, encouraging, and being gentle!",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 4,
      configJson: {
        theme: {
          primary: "#e8589b",
          accent: "#7c5cff",
          warn: "#ffb74d",
          bg: "#fff5fa",
        },
        hero: { emoji: "🌸", nameAr: "زهرة", nameEn: "Zahra" },
        stars: 5,
        certificate: {
          titleAr: "وسام الكلمة الطيبة",
          titleEn: "Kind Word Medal",
          emoji: "💐",
          accent: "#e8589b",
          background: "linear-gradient(135deg, #fff5fa 0%, #fcdcec 100%)",
          decoration: "balloons",
        },
        reward: {
          giftNameAr: "باقة الكلمات الطيبة",
          giftNameEn: "Bouquet of Kind Words",
          emoji: "💗",
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  const questions = [
    {
      order: 0,
      kind: "MULTIPLE_CHOICE",
      promptAr: "صديقك حزين اليوم. ما الكلمة الطيبة التي تقولها له؟",
      promptEn: "Your friend is sad today. What kind word do you say?",
      mediaJson: { layout: "list", sceneEmoji: "🥺" },
      options: [
        {
          order: 0,
          labelAr: "«لا تحزن، أنا معك دائماً 🤗»",
          labelEn: "«Don't be sad, I'm always with you 🤗»",
          emoji: "💞",
          isCorrect: true,
          feedbackAr: "ما أجملك! كلمة طيبة تواسي القلوب الحزينة 💞",
          feedbackEn: "How lovely! A kind word comforts a sad heart 💞",
        },
        {
          order: 1,
          labelAr: "«هذه مشكلتك أنت!»",
          labelEn: "«That's your problem!»",
          emoji: "😕",
          isCorrect: false,
          feedbackAr: "لا بأس! الصديق الطيب يواسي صديقه. جرّب مرة أخرى 😊",
          feedbackEn: "It's okay! A good friend comforts. Try again 😊",
        },
        {
          order: 2,
          labelAr: "«لا وقت لدي لك»",
          labelEn: "«I have no time for you»",
          emoji: "🙄",
          isCorrect: false,
          feedbackAr:
            "لا بأس يا بطل! نعطي أصدقاءنا وقتاً وحُباً. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries, champ! We give friends time and love. Try again 😊",
        },
      ],
    },
    {
      order: 1,
      kind: "EMOJI_CHOICE",
      promptAr: "أيّ وجه يقول «شكراً لك» بلطف؟",
      promptEn: "Which face kindly says 'thank you'?",
      mediaJson: { layout: "grid" },
      options: [
        {
          order: 0,
          labelAr: "وجه شاكر مبتسم",
          labelEn: "A grateful smile",
          emoji: "😊",
          isCorrect: true,
          feedbackAr: "أحسنت! الابتسامة والشكر يصنعان السعادة 😊",
          feedbackEn: "Well done! A smile and thanks create happiness 😊",
        },
        {
          order: 1,
          labelAr: "وجه غاضب",
          labelEn: "An angry face",
          emoji: "😠",
          isCorrect: false,
          feedbackAr: "لا بأس! نشكر الناس بوجه لطيف. جرّب مرة أخرى 😊",
          feedbackEn:
            "It's okay! We thank people with a kind face. Try again 😊",
        },
        {
          order: 2,
          labelAr: "وجه عابس",
          labelEn: "A frowning face",
          emoji: "😒",
          isCorrect: false,
          feedbackAr: "لا بأس! الشكر يكون بلطف وابتسامة. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Thanks come with a gentle smile. Try again 😊",
        },
        {
          order: 3,
          labelAr: "وجه يبكي",
          labelEn: "A crying face",
          emoji: "😢",
          isCorrect: false,
          feedbackAr: "لا بأس يا بطل! نشكر بفرح وابتسامة. جرّب مرة أخرى 😊",
          feedbackEn: "No worries, champ! We thank with joy. Try again 😊",
        },
      ],
    },
    {
      order: 2,
      kind: "MULTIPLE_CHOICE",
      promptAr: "أخطأت في حقّ أخيك الصغير. ماذا تقول؟",
      promptEn: "You made a mistake with your little brother. What do you say?",
      mediaJson: { layout: "list" },
      options: [
        {
          order: 0,
          labelAr: "«آسف يا أخي، سامحني 💗»",
          labelEn: "«I'm sorry brother, please forgive me 💗»",
          emoji: "🤝",
          isCorrect: true,
          feedbackAr: "رائع! الاعتذار شجاعة، والكلمة الطيبة تُصلح القلوب 💗",
          feedbackEn:
            "Wonderful! Apologising is brave, and kind words mend hearts 💗",
        },
        {
          order: 1,
          labelAr: "«أنت السبب دائماً!»",
          labelEn: "«It's always your fault!»",
          emoji: "😤",
          isCorrect: false,
          feedbackAr: "لا بأس! نعترف بخطئنا ونعتذر بلطف. جرّب مرة أخرى 😊",
          feedbackEn:
            "It's okay! We admit our mistake and apologise. Try again 😊",
        },
        {
          order: 2,
          labelAr: "«لن أكلّمك بعد الآن»",
          labelEn: "«I won't talk to you anymore»",
          emoji: "🙅",
          isCorrect: false,
          feedbackAr: "لا بأس يا بطل! الاعتذار يعيد المحبة. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries, champ! An apology restores love. Try again 😊",
        },
      ],
    },
    {
      order: 3,
      kind: "MULTIPLE_CHOICE",
      promptAr: "نجح زميلك في حفظ سورة جديدة! ماذا تقول له؟",
      promptEn: "Your classmate memorised a new surah! What do you say?",
      mediaJson: { layout: "list", sceneEmoji: "🎉" },
      options: [
        {
          order: 0,
          labelAr: "«ما شاء الله، مبروك! أحسنت 🎉»",
          labelEn: "«MashaAllah, congratulations! Well done 🎉»",
          emoji: "🌟",
          isCorrect: true,
          feedbackAr: "أحسنت! نفرح لنجاح غيرنا ونشجّعهم بالكلمة الطيبة 🌟",
          feedbackEn: "Well done! We rejoice for others and encourage them 🌟",
        },
        {
          order: 1,
          labelAr: "«وماذا في ذلك؟»",
          labelEn: "«So what?»",
          emoji: "😐",
          isCorrect: false,
          feedbackAr: "لا بأس! نشجّع أصدقاءنا ونفرح لهم. جرّب مرة أخرى 😊",
          feedbackEn: "It's okay! We cheer for our friends. Try again 😊",
        },
        {
          order: 2,
          labelAr: "«أنا أفضل منك»",
          labelEn: "«I'm better than you»",
          emoji: "😎",
          isCorrect: false,
          feedbackAr:
            "لا بأس يا بطل! التشجيع أجمل من المقارنة. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries, champ! Encouraging beats comparing. Try again 😊",
        },
      ],
    },
    {
      order: 4,
      kind: "MULTIPLE_CHOICE",
      promptAr: "تريد أن تطلب كوب ماء من أمّك. كيف تطلب بأدب؟",
      promptEn: "You want to ask your mum for water. How do you ask politely?",
      mediaJson: { layout: "list" },
      options: [
        {
          order: 0,
          labelAr: "«من فضلكِ يا أمي، أريد ماءً، شكراً لكِ 🌷»",
          labelEn: "«Please mum, may I have water? Thank you 🌷»",
          emoji: "🤲",
          isCorrect: true,
          feedbackAr: "ممتاز! «من فضلك» و«شكراً» مفتاح الكلام الطيب 🌷",
          feedbackEn:
            "Excellent! 'Please' and 'thank you' are the keys to kind speech 🌷",
        },
        {
          order: 1,
          labelAr: "«أحضري لي ماءً الآن!»",
          labelEn: "«Get me water now!»",
          emoji: "😠",
          isCorrect: false,
          feedbackAr: "لا بأس! نطلب بلطف ونقول من فضلك. جرّب مرة أخرى 😊",
          feedbackEn: "It's okay! We ask gently and say please. Try again 😊",
        },
        {
          order: 2,
          labelAr: "آخذ الماء دون أن أقول شيئاً",
          labelEn: "Take the water without saying anything",
          emoji: "🤐",
          isCorrect: false,
          feedbackAr:
            "لا بأس يا بطل! الكلمة الطيبة تُسعد من حولنا. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries, champ! Kind words make others happy. Try again 😊",
        },
      ],
    },
  ];

  for (const q of questions) {
    const { options, ...qData } = q;
    const created = await prisma.gameQuestion.create({
      data: { gameId: game.id, ...qData },
    });
    await prisma.gameOption.createMany({
      data: options.map((o) => ({ ...o, questionId: created.id })),
    });
  }

  console.log(`[seed] game kind-words — ${questions.length} questions`);
  return game;
}

