// @ts-check
import { prisma } from "../../prisma.client.js";

export async function seedQuizBank(adminId) {
  // categories — findFirst guard for idempotency
  const categoryDefs = [
    { nameAr: "عقيدة", nameEn: "Aqeedah" },
    { nameAr: "آداب وأخلاق", nameEn: "Manners & Ethics" },
    { nameAr: "قرآن وسور", nameEn: "Quran & Surahs" },
  ];

  const categories = {};
  for (const def of categoryDefs) {
    let cat = await prisma.questionCategory.findFirst({
      where: { nameAr: def.nameAr },
    });
    if (!cat) {
      cat = await prisma.questionCategory.create({
        data: { ...def, createdById: adminId },
      });
    }
    categories[def.nameAr] = cat;
  }

  // questions — findFirst guard on textAr
  const questionDefs = [
    // ── Aqeedah ──
    {
      categoryNameAr: "عقيدة",
      textAr: "كم عدد أركان الإسلام؟",
      textEn: "How many pillars of Islam are there?",
      options: [
        { labelAr: "ثلاثة", labelEn: "Three", isCorrect: false, order: 1 },
        { labelAr: "خمسة", labelEn: "Five", isCorrect: true, order: 0 },
        { labelAr: "سبعة", labelEn: "Seven", isCorrect: false, order: 2 },
      ],
    },
    {
      categoryNameAr: "عقيدة",
      textAr: "ماذا نقول عند بدء أي عمل؟",
      textEn: "What do we say at the start of any action?",
      options: [
        {
          labelAr: "الحمد لله",
          labelEn: "Alhamdulillah",
          isCorrect: false,
          order: 0,
        },
        {
          labelAr: "بسم الله",
          labelEn: "Bismillah",
          isCorrect: true,
          order: 1,
        },
        {
          labelAr: "سبحان الله",
          labelEn: "SubhanAllah",
          isCorrect: false,
          order: 2,
        },
      ],
    },
    {
      categoryNameAr: "عقيدة",
      textAr: "كم عدد الصلوات اليومية في الإسلام؟",
      textEn: "How many daily prayers are there in Islam?",
      options: [
        {
          labelAr: "ثلاث صلوات",
          labelEn: "Three prayers",
          isCorrect: false,
          order: 0,
        },
        {
          labelAr: "خمس صلوات",
          labelEn: "Five prayers",
          isCorrect: true,
          order: 1,
        },
        {
          labelAr: "أربع صلوات",
          labelEn: "Four prayers",
          isCorrect: false,
          order: 2,
        },
      ],
    },
    // ── Manners ──
    {
      categoryNameAr: "آداب وأخلاق",
      textAr: "ماذا نقول عند الدخول على شخص في غرفته؟",
      textEn: "What do we say before entering someone's room?",
      options: [
        {
          labelAr: "نفتح الباب مباشرة",
          labelEn: "Open the door straight away",
          isCorrect: false,
          order: 0,
        },
        {
          labelAr: "نطرق الباب ونستأذن",
          labelEn: "Knock and ask permission",
          isCorrect: true,
          order: 1,
        },
        {
          labelAr: "ننادي بصوت عالٍ",
          labelEn: "Call out loudly",
          isCorrect: false,
          order: 2,
        },
      ],
    },
    {
      categoryNameAr: "آداب وأخلاق",
      textAr: "كيف نرد على شخص قال لنا شكراً؟",
      textEn: "How do we respond when someone says 'thank you' to us?",
      options: [
        {
          labelAr: "لا نقول شيئاً",
          labelEn: "Say nothing",
          isCorrect: false,
          order: 1,
        },
        {
          labelAr: "عفواً، بكل سرور",
          labelEn: "You're welcome, with pleasure",
          isCorrect: true,
          order: 0,
        },
        {
          labelAr: "نعم، صحيح",
          labelEn: "Yes, correct",
          isCorrect: false,
          order: 2,
        },
      ],
    },
    {
      categoryNameAr: "آداب وأخلاق",
      textAr: "ماذا نفعل إذا وعدنا صديقنا بشيء؟",
      textEn: "What do we do when we promise a friend something?",
      options: [
        {
          labelAr: "ننسى الوعد",
          labelEn: "Forget the promise",
          isCorrect: false,
          order: 0,
        },
        {
          labelAr: "نوفي بالوعد دائماً",
          labelEn: "Always keep the promise",
          isCorrect: true,
          order: 2,
        },
        {
          labelAr: "نكذب عليه",
          labelEn: "Lie to them",
          isCorrect: false,
          order: 1,
        },
      ],
    },
    // ── Quran ──
    {
      categoryNameAr: "قرآن وسور",
      textAr: "ما هي أول سورة في القرآن الكريم؟",
      textEn: "What is the first surah of the Holy Quran?",
      options: [
        {
          labelAr: "سورة البقرة",
          labelEn: "Al-Baqarah",
          isCorrect: false,
          order: 0,
        },
        {
          labelAr: "سورة الفاتحة",
          labelEn: "Al-Fatihah",
          isCorrect: true,
          order: 2,
        },
        {
          labelAr: "سورة الإخلاص",
          labelEn: "Al-Ikhlas",
          isCorrect: false,
          order: 1,
        },
      ],
    },
    {
      categoryNameAr: "قرآن وسور",
      textAr: "ما هي أقصر سورة في القرآن الكريم؟",
      textEn: "What is the shortest surah in the Holy Quran?",
      options: [
        {
          labelAr: "سورة الناس",
          labelEn: "An-Nas",
          isCorrect: false,
          order: 0,
        },
        {
          labelAr: "سورة الكوثر",
          labelEn: "Al-Kawthar",
          isCorrect: true,
          order: 1,
        },
        {
          labelAr: "سورة الفلق",
          labelEn: "Al-Falaq",
          isCorrect: false,
          order: 2,
        },
      ],
    },
  ];

  let createdCount = 0;
  for (const q of questionDefs) {
    const existing = await prisma.quizQuestion.findFirst({
      where: { textAr: q.textAr },
    });
    if (existing) continue;

    const cat = categories[q.categoryNameAr];
    await prisma.quizQuestion.create({
      data: {
        textAr: q.textAr,
        textEn: q.textEn,
        categoryId: cat.id,
        createdById: adminId,
        isActive: true,
        options: {
          create: q.options,
        },
      },
    });
    createdCount++;
  }

  console.log(
    `[seed] quiz bank — ${Object.keys(categories).length} categories, ${createdCount} new questions (${questionDefs.length} total defined)`,
  );
  return categories;
}
