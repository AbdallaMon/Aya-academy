// @ts-check
import { prisma } from "../prisma.client.js";
import bcrypt from "bcrypt";

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Delete all GameQuestion rows for a game (cascades to GameOption). */
async function clearGameQuestions(gameId) {
  await prisma.gameQuestion.deleteMany({ where: { gameId } });
}

// Remove a retired game from an already-seeded DB. Prefer a full delete (so it
// vanishes from the games list); if it has graded attempts (whose certificates
// restrict deletion), fall back to deactivating it so it simply stops showing.
async function removeRetiredGame(slug) {
  const game = await prisma.game.findUnique({ where: { slug } });
  if (!game) return;
  try {
    await prisma.game.delete({ where: { id: game.id } });
    console.log(`[seed] retired game ${slug} — deleted`);
  } catch {
    await prisma.game.update({
      where: { id: game.id },
      data: { isActive: false, isPublic: false, isFree: false },
    });
    console.log(`[seed] retired game ${slug} — deactivated (had history)`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ADMIN USER
// ─────────────────────────────────────────────────────────────────────────────

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@aya.academy";
  // Fail closed: never ship a hardcoded admin password. Set SEED_ADMIN_PASSWORD
  // in the (gitignored) packages/db/.env before seeding.
  const rawPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!rawPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required to seed the admin user. " +
        "Set it in packages/db/.env (it is gitignored).",
    );
  }
  const passwordHash = bcrypt.hashSync(rawPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "مدير الأكاديمية",
      passwordHash,
      role: "ADMIN",
      locale: "ar",
      isActive: true,
    },
  });

  console.log(`[seed] admin user — id=${admin.id} email=${admin.email}`);
  return admin;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BADGES
// ─────────────────────────────────────────────────────────────────────────────

async function seedBadges() {
  const badges = [
    {
      code: "FIRST_GAME",
      nameAr: "أول لعبة",
      nameEn: "First Game",
      descriptionAr: "لعبت أول لعبة لك في أكاديمية آية، أحسنت!",
      descriptionEn: "You played your first game at Aya Academy!",
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

// ─────────────────────────────────────────────────────────────────────────────
// 2b. CERTIFICATE TEMPLATES (reusable certificate copy + style)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Idempotent: upsert the seeded certificate templates by key. Three visually
 * distinct GENERAL templates (admin-pickable for manual certificates) plus the
 * single GAME template that is auto-applied to every game certificate.
 */
async function seedCertificateTemplates() {
  const templates = [
    // ── 1. GENERAL · ornate green/gold portrait (the default) ──────────────
    {
      key: "achievement",
      type: "GENERAL",
      nameAr: "شهادة تقدير",
      nameEn: "Certificate of Achievement",
      isDefault: true,
      isActive: true,
      headingAr: "شهادة تقدير",
      headingEn: "Certificate of Achievement",
      introAr:
        "يسرّ أكاديمية آية لتعليم القرآن والعربية أونلاين أن تمنح هذه الشهادة للطالب:",
      introEn:
        "Ayah Academy for teaching Qur'an and Arabic online is pleased to grant this certificate to the student:",
      bodyAr:
        "تقديرًا لتفانيه واجتهاده المتميّز في {reason}. نسأل الله أن يبارك له في علمه ويزيده من فضله ويثيبه على جهده ومثابرته.",
      bodyEn:
        "in recognition of dedication and excellent effort in {reason}. May Allah bless them with beneficial knowledge, increase them in faith, and reward them for their hard work and perseverance.",
      congratsAr: "تهانينا على هذا الإنجاز الرائع!",
      congratsEn: "Congratulations on this wonderful achievement!",
      thanksAr: "بارك الله فيك",
      thanksEn: "May Allah reward you",
      signatureName: "Aya",
      signatureTitleAr: "المعلمة",
      signatureTitleEn: "Teacher",
      themeJson: {
        orientation: "portrait",
        decoration: "elegant",
        fontStyle: "elegant",
        accent: "#1E6F5C",
        secondary: "#C9A227",
        background: "#FBF7EC",
        borderStyle: "ornate",
        showPhoto: true,
        showBismillah: true,
        showSeal: true,
        showWatermark: true,
        showTagline: true,
        showDate: true,
        logoSize: "md",
        nameScale: 1,
      },
    },

    // ── 2. GENERAL · regal navy/gold landscape (formal excellence) ─────────
    {
      key: "excellence-royal",
      type: "GENERAL",
      nameAr: "شهادة تميّز",
      nameEn: "Certificate of Excellence",
      isDefault: false,
      isActive: true,
      headingAr: "شهادة تميّز",
      headingEn: "Certificate of Excellence",
      introAr: "تشهد أكاديمية آية لتعليم القرآن والعربية بأن الطالب:",
      introEn:
        "Ayah Academy for Qur'an and Arabic hereby certifies that the student:",
      bodyAr:
        "قد حقّق تميّزًا واضحًا في {reason}، فاستحقّ هذه الشهادة تقديرًا لتفوّقه وحرصه على التعلّم.",
      bodyEn:
        "has demonstrated clear excellence in {reason}, earning this certificate in recognition of outstanding achievement and dedication to learning.",
      congratsAr: "نبارك لك هذا التفوّق المستحق!",
      congratsEn: "Congratulations on this well-deserved distinction!",
      thanksAr: "زادك الله علمًا وتوفيقًا",
      thanksEn: "May Allah increase you in knowledge",
      signatureName: "Aya",
      signatureTitleAr: "إدارة الأكاديمية",
      signatureTitleEn: "Academy Management",
      themeJson: {
        orientation: "landscape",
        decoration: "geometric",
        fontStyle: "classic",
        accent: "#1B3A6B",
        secondary: "#C9A227",
        background: "#FAF7EF",
        borderStyle: "foil",
        showPhoto: false,
        showBismillah: true,
        showSeal: true,
        showWatermark: true,
        showTagline: true,
        showDate: true,
        logoSize: "lg",
        nameScale: 1.05,
      },
    },

    // ── 3. GENERAL · playful teal/coral portrait (kid-friendly star) ───────
    {
      key: "little-star",
      type: "GENERAL",
      nameAr: "شهادة نجمة",
      nameEn: "Little Star Certificate",
      isDefault: false,
      isActive: true,
      headingAr: "نجمة آية",
      headingEn: "Ayah Star",
      introAr: "نفخر بنجمتنا الصغيرة:",
      introEn: "We are so proud of our little star:",
      bodyAr: "على تميّزك الرائع في {reason}. واصل التألّق يا نجم! 🌟",
      bodyEn:
        "for shining so brightly in {reason}. Keep it up, little star! 🌟",
      congratsAr: "أحسنت صنعًا!",
      congratsEn: "Wonderful work!",
      thanksAr: "بارك الله فيك",
      thanksEn: "May Allah bless you",
      signatureName: "Aya",
      signatureTitleAr: "المعلمة",
      signatureTitleEn: "Teacher",
      themeJson: {
        orientation: "portrait",
        decoration: "stars",
        fontStyle: "modern",
        accent: "#0E9594",
        secondary: "#FF7A59",
        background: "#FFF8F0",
        borderStyle: "double",
        showPhoto: true,
        showBismillah: false,
        showSeal: true,
        showWatermark: true,
        showTagline: true,
        showDate: true,
        logoSize: "md",
        nameScale: 1,
      },
    },

    // ── 4. GAME · the single template auto-applied to game certificates ────
    {
      key: "game-champion",
      type: "GAME",
      nameAr: "شهادة الألعاب",
      nameEn: "Game Certificate",
      isDefault: false,
      isActive: true,
      headingAr: "بطل الألعاب",
      headingEn: "Game Champion",
      introAr: "تهانينا للبطل الصغير:",
      introEn: "Congratulations to our little champion:",
      bodyAr:
        "لقد أتممت لعبة {reason} بنجاح وأظهرت تركيزًا ومثابرة رائعة. أحسنت!",
      bodyEn:
        "You completed the {reason} game successfully and showed wonderful focus and perseverance. Well done!",
      congratsAr: "أحسنت! استمر في التألّق 🌟",
      congratsEn: "Great job — keep shining! 🌟",
      thanksAr: "بارك الله فيك",
      thanksEn: "May Allah bless you",
      signatureName: "Aya",
      signatureTitleAr: "المعلمة",
      signatureTitleEn: "Teacher",
      themeJson: {
        orientation: "landscape",
        decoration: "stars",
        fontStyle: "modern",
        accent: "#7C4DFF",
        secondary: "#FFC93C",
        background: "#F5F0FF",
        borderStyle: "foil",
        emoji: "🏆",
        showPhoto: false,
        showBismillah: false,
        showSeal: true,
        showWatermark: true,
        showTagline: true,
        showDate: true,
        logoSize: "md",
        nameScale: 1.05,
      },
    },
  ];

  for (const tpl of templates) {
    await prisma.certificateTemplate.upsert({
      where: { key: tpl.key },
      update: tpl,
      create: tpl,
    });
  }

  console.log(`[seed] certificate templates — ${templates.length} upserted`);
  return templates.map((t) => t.key);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. QUIZ BANK (categories + questions)
// ─────────────────────────────────────────────────────────────────────────────

async function seedQuizBank(adminId) {
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
        { labelAr: "ثلاثة", labelEn: "Three", isCorrect: false, order: 0 },
        { labelAr: "خمسة", labelEn: "Five", isCorrect: true, order: 1 },
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
          order: 0,
        },
        {
          labelAr: "عفواً، بكل سرور",
          labelEn: "You're welcome, with pleasure",
          isCorrect: true,
          order: 1,
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
          order: 1,
        },
        {
          labelAr: "نكذب عليه",
          labelEn: "Lie to them",
          isCorrect: false,
          order: 2,
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
          order: 1,
        },
        {
          labelAr: "سورة الإخلاص",
          labelEn: "Al-Ikhlas",
          isCorrect: false,
          order: 2,
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

// ─────────────────────────────────────────────────────────────────────────────
// 4. GAMES
// ─────────────────────────────────────────────────────────────────────────────

// ── 4a. phone-manners ──────────────────────────────────────────────────────

async function seedPhoneManners() {
  const game = await prisma.game.upsert({
    where: { slug: "phone-manners" },
    update: {
      titleAr: "مغامرة آداب الاتصال الذكي",
      titleEn: "Smart Call Manners Adventure",
      descriptionAr:
        "تعلّم مع عبود آداب الهاتف: السلام، نبرة الصوت، أفضل الأوقات، والرد بلطف على المتصلين!",
      descriptionEn:
        "Learn phone manners with Aboud: greetings, voice tone, right timing, and polite responses!",
      isPublic: true,
      isFree: true,
      passThreshold: 3,
      configJson: {
        theme: {
          primary: "#7c5cff",
          accent: "#23c483",
          warn: "#ff7aa8",
          bg: "#fff7fb",
        },
        hero: { emoji: "🦸", nameAr: "عبّود", nameEn: "Aboud" },
        avatars: [
          {
            id: "explorer",
            emoji: "🧑‍🚀",
            labelAr: "مستكشف",
            labelEn: "Explorer",
          },
          { id: "hero", emoji: "🦸", labelAr: "عبود", labelEn: "Aboud" },
          { id: "cowboy", emoji: "🤠", labelAr: "راعي", labelEn: "Cowboy" },
          { id: "diver", emoji: "🤿", labelAr: "غواص", labelEn: "Diver" },
        ],
        stars: 6,
        certificate: {
          titleAr: "وسام الهاتف الذهبي الساحر",
          titleEn: "Golden Phone Medal",
          emoji: "👑",
          accent: "#7c5cff",
          background: "linear-gradient(135deg, #fff7fb 0%, #efe7ff 100%)",
          decoration: "badges",
        },
        reward: {
          giftNameAr: "استوديو الهاتف الذهبي",
          giftNameEn: "Golden Phone Studio",
          emoji: "🏆",
        },
        rewardStudio: {
          coverColors: ["#FFC107", "#22C55E", "#3B82F6", "#EC4899", "#8B5CF6"],
          stickers: ["⭐", "👑", "🚀", "🐱", "🍩", "🐼", "🐎", "🦄"],
        },
      },
    },
    create: {
      slug: "phone-manners",
      titleAr: "مغامرة آداب الاتصال الذكي",
      titleEn: "Smart Call Manners Adventure",
      descriptionAr:
        "تعلّم مع عبود آداب الهاتف: السلام، نبرة الصوت، أفضل الأوقات، والرد بلطف على المتصلين!",
      descriptionEn:
        "Learn phone manners with Aboud: greetings, voice tone, right timing, and polite responses!",
      type: "INTERACTIVE",
      isPublic: true,
      isActive: true,
      isFree: true,
      passThreshold: 3,
      configJson: {
        theme: {
          primary: "#7c5cff",
          accent: "#23c483",
          warn: "#ff7aa8",
          bg: "#fff7fb",
        },
        hero: { emoji: "🦸", nameAr: "عبّود", nameEn: "Aboud" },
        avatars: [
          {
            id: "explorer",
            emoji: "🧑‍🚀",
            labelAr: "مستكشف",
            labelEn: "Explorer",
          },
          { id: "hero", emoji: "🦸", labelAr: "عبود", labelEn: "Aboud" },
          { id: "cowboy", emoji: "🤠", labelAr: "راعي", labelEn: "Cowboy" },
          { id: "diver", emoji: "🤿", labelAr: "غواص", labelEn: "Diver" },
        ],
        stars: 6,
        certificate: {
          titleAr: "وسام الهاتف الذهبي الساحر",
          titleEn: "Golden Phone Medal",
          emoji: "👑",
          accent: "#7c5cff",
          background: "linear-gradient(135deg, #fff7fb 0%, #efe7ff 100%)",
          decoration: "badges",
        },
        reward: {
          giftNameAr: "استوديو الهاتف الذهبي",
          giftNameEn: "Golden Phone Studio",
          emoji: "🏆",
        },
        rewardStudio: {
          coverColors: ["#FFC107", "#22C55E", "#3B82F6", "#EC4899", "#8B5CF6"],
          stickers: ["⭐", "👑", "🚀", "🐱", "🍩", "🐼", "🐎", "🦄"],
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  // Task 1 — DIALPAD then polite reply (DIALPAD question seeds the dial step;
  // the choice sub-step is a separate MULTIPLE_CHOICE question immediately after)
  const q1a = await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 0,
      kind: "DIALPAD",
      promptAr:
        "ساعد عبود في الاتصال بماما! اضغط على الأرقام بالترتيب: ٥ ثم ٥ ثم ٥ ثم ٥، ثم اضغط الزر الأخضر 📞",
      promptEn:
        "Help Aboud call Mama! Press the numbers in order: 5, 5, 5, 5 — then press the green button 📞",
      mediaJson: { sequence: "5555", thenChoose: true },
    },
  });
  // No options on the DIALPAD itself — thenChoose triggers the next question.

  const q1b = await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 1,
      kind: "MULTIPLE_CHOICE",
      promptAr:
        "ترن.. ترن! ماما تجيب بلطف: «السلام عليكم، أهلاً يا عبود!» ماذا يقول عبود؟ 🤔",
      promptEn:
        "Ring.. ring! Mama answers gently: «Assalamu Alaykum, hello Aboud!» What does Aboud say?",
      mediaJson: {
        layout: "list",
        sceneEmoji: "👩",
        captionAr: "ماما تبتسم وتنتظر رد عبود!",
        captionEn: "Mama smiles and waits for Aboud's reply!",
        optionMeta: [{ tone: "warn" }, { tone: "good" }, { tone: "bad" }],
      },
    },
  });
  await prisma.gameOption.createMany({
    data: [
      {
        questionId: q1b.id,
        order: 0,
        labelAr: "«ألو ماما! أحضري لي اللعبة الآن وبسرعة!»",
        labelEn: "«Hello Mama! Bring me the toy right now, hurry!»",
        emoji: "⚠️",
        isCorrect: false,
        feedbackAr:
          "لا بأس يا بطل! نبدأ دائماً بالسلام ونسأل عن الحال بلطف. جرّب مرة أخرى 😊",
        feedbackEn:
          "That's okay, champ! We always start with Salam and ask kindly. Try again 😊",
      },
      {
        questionId: q1b.id,
        order: 1,
        labelAr: "«وعليكم السلام يا أمي الحبيبة، أنا عبود، كيف حالك اليوم؟»",
        labelEn:
          "«Wa Alaykum Assalam, dear Mama, it's Aboud — how are you today?»",
        emoji: "💚",
        isCorrect: true,
        feedbackAr: "رائع! هذا هو الرد الذهبي المهذب الذي يفرح قلب ماما! 💛",
        feedbackEn:
          "Wonderful! That is the golden polite reply that warms Mama's heart! 💛",
      },
      {
        questionId: q1b.id,
        order: 2,
        labelAr: "«ألووو! ألووو! اسمعيني ألووو!» (بصراخ)",
        labelEn: "«Helloooo! Helloooo! Hear me, helloooo!» (shouting)",
        emoji: "📢",
        isCorrect: false,
        feedbackAr: "لا بأس! نتكلم بهدوء ونبدأ بالسلام دائماً 😊",
        feedbackEn:
          "No worries! We speak calmly and always start with Salam 😊",
      },
    ],
  });

  // Task 2 — TONE_SLIDER
  const q2 = await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 2,
      kind: "TONE_SLIDER",
      promptAr:
        "حرّك الزر لتختار النبرة المناسبة — صوت معتدل يحبه الجميع! اجعله في المنتصف 😊",
      promptEn:
        "Move the slider to the right voice tone — a moderate voice everyone loves! Keep it in the middle 😊",
      mediaJson: {
        min: 0,
        max: 100,
        goodMin: 34,
        goodMax: 66,
        labels: {
          lowAr: "همس خافت 🤫",
          midAr: "معتدل 😊",
          highAr: "صراخ 📢",
          lowEn: "Too quiet 🤫",
          midEn: "Just right 😊",
          highEn: "Too loud 📢",
        },
        goodAr: "رائع! هذا هو الصوت الذهبي المريح المناسب للمكالمات! ✨",
        goodEn: "Wonderful! That is the perfect golden voice for calls! ✨",
        badAr:
          "لا بأس! لا همس خافت ولا صراخ. اسحب الزر للمنتصف عند الوجه السعيد 😊",
        badEn:
          "That's okay! No whispering or shouting — drag to the middle at the happy face 😊",
      },
    },
  });
  // TONE_SLIDER has no options rows (graded by position in mediaJson).

  // Task 3 — right time / right place to use phone
  const q3 = await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 3,
      kind: "MULTIPLE_CHOICE",
      promptAr: "حان وقت الصلاة في المسجد. ماذا نفعل بالهاتف؟",
      promptEn:
        "It is prayer time at the mosque. What do we do with the phone?",
      mediaJson: {
        layout: "list",
        optionMeta: [{ tone: "good" }, { tone: "warn" }, { tone: "bad" }],
      },
    },
  });
  await prisma.gameOption.createMany({
    data: [
      {
        questionId: q3.id,
        order: 0,
        labelAr: "نجعله صامتاً ونضعه جانباً باحترام، فالصلاة أهم شيء.",
        labelEn:
          "Silence it and put it aside respectfully — prayer is most important.",
        emoji: "🤫",
        isCorrect: true,
        feedbackAr:
          "أحسنت! نسكت الهاتف ونضعه جانباً باحترام وقت الصلاة. هذا أدب جميل! 🕌✨",
        feedbackEn:
          "Well done! We silence the phone during prayer — that is beautiful manners! 🕌✨",
      },
      {
        questionId: q3.id,
        order: 1,
        labelAr: "نتركه يرن بصوت عالٍ لنسمع من يتصل بنا.",
        labelEn: "Leave it ringing loudly to hear who is calling.",
        emoji: "🔊",
        isCorrect: false,
        feedbackAr:
          "لا بأس يا بطل! وقت الصلاة نجعل الهاتف صامتاً ونضعه جانباً. جرّب مرة أخرى 😊",
        feedbackEn:
          "No worries, champ! During prayer we silence the phone. Try again 😊",
      },
      {
        questionId: q3.id,
        order: 2,
        labelAr: "نلعب به ونتكلم بصوت مرتفع داخل المسجد.",
        labelEn: "Play with it and talk loudly inside the mosque.",
        emoji: "🎮",
        isCorrect: false,
        feedbackAr:
          "لا بأس! المسجد مكان للصلاة والهدوء. نضع الهاتف صامتاً دائماً 😊",
        feedbackEn:
          "That's okay! The mosque is a place for prayer and quiet. Always silence the phone 😊",
      },
    ],
  });

  // Task 4 — SCENARIO: wrong-number caller
  const q4 = await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 4,
      kind: "SCENARIO",
      promptAr:
        "شخص يتصل بالخطأ ويظنك صديقه سامر. اختر الرد المهذب للمتصل المخطئ:",
      promptEn:
        "Someone calls by mistake thinking you are their friend Samer. Choose the polite reply:",
      mediaJson: {
        sceneEmoji: "📞",
        captionAr: "«أهلاً يا سامر! هل تلعب معي اليوم؟»",
        captionEn: "«Hello Samer! Can you play with me today?»",
        optionMeta: [{ tone: "good" }, { tone: "warn" }, { tone: "bad" }],
      },
    },
  });
  await prisma.gameOption.createMany({
    data: [
      {
        questionId: q4.id,
        order: 0,
        labelAr:
          "«عذراً يا صديقي، أظن أنك أخطأت في الرقم، أنا عبود ولست سامر. مع السلامة!»",
        labelEn:
          "«Sorry friend, I think you have the wrong number — I am Aboud, not Samer. Take care!»",
        emoji: "💖",
        isCorrect: true,
        feedbackAr:
          "يا لك من بطل لطيف! توضيح الخطأ بأدب وقول مع السلامة من شيم الأبطال! 🏆✨",
        feedbackEn:
          "What a kind champion! Politely explaining the mistake is a hero's quality! 🏆✨",
      },
      {
        questionId: q4.id,
        order: 1,
        labelAr: "نغلق الخط مباشرة دون أن نوضح له شيئاً.",
        labelEn: "Hang up right away without explaining anything.",
        emoji: "🙂",
        isCorrect: false,
        feedbackAr:
          "لا بأس! نوضّح الخطأ بلطف ونقول مع السلامة. جرّب مرة أخرى يا بطل 😊",
        feedbackEn:
          "No worries! We explain the mistake gently and say goodbye. Try again, champion 😊",
      },
      {
        questionId: q4.id,
        order: 2,
        labelAr: "نصرخ فيه: «أنت مزعج، لا تتصل بنا مجدداً!»",
        labelEn: "Shout at them: «You're annoying, don't call again!»",
        emoji: "😠",
        isCorrect: false,
        feedbackAr:
          "لا بأس! نتحدث دائماً بلطف وهدوء، حتى مع الخطأ. جرّب مرة أخرى 😊",
        feedbackEn:
          "That's okay! We always speak gently and calmly, even for mistakes. Try again 😊",
      },
    ],
  });

  // Task 5 — Replying to grandma with love
  const q5 = await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 5,
      kind: "MULTIPLE_CHOICE",
      promptAr:
        "جدتك الحبيبة تتصل وتقول: «السلام عليكم يا حبيبي!» اختر الرد المليء بالحب:",
      promptEn:
        "Your dear grandmother calls and says: «Assalamu Alaykum, my dear!» Choose the loving reply:",
      mediaJson: {
        layout: "list",
        optionMeta: [{ tone: "good" }, { tone: "warn" }, { tone: "bad" }],
      },
    },
  });
  await prisma.gameOption.createMany({
    data: [
      {
        questionId: q5.id,
        order: 0,
        labelAr: "«وعليكم السلام يا جدتي الحبيبة، اشتقت إليكِ!»",
        labelEn: "«Wa Alaykum Assalam, dear Grandma — I missed you!»",
        emoji: "💖",
        isCorrect: true,
        feedbackAr:
          "ما أجملك! ردّك بحب يُسعد قلب جدتك كثيراً. الجدة كنز نحبه! 👵💕",
        feedbackEn:
          "How lovely! Your loving reply makes Grandma so happy. Grandma is a treasure! 👵💕",
      },
      {
        questionId: q5.id,
        order: 1,
        labelAr: "«نعم؟ ماذا تريدين؟ أنا مشغول الآن.»",
        labelEn: "«Yes? What do you want? I am busy right now.»",
        emoji: "😐",
        isCorrect: false,
        feedbackAr:
          "لا بأس! نرد على جدتنا بالسلام وبكلمات لطيفة مليئة بالحب. جرّب مرة أخرى 😊",
        feedbackEn:
          "No worries! We answer Grandma with Salam and loving words. Try again 😊",
      },
      {
        questionId: q5.id,
        order: 2,
        labelAr: "لا نرد عليها ونغلق الهاتف بسرعة.",
        labelEn: "We do not answer and quickly hang up.",
        emoji: "🙉",
        isCorrect: false,
        feedbackAr:
          "لا بأس! جدتنا تستحق أجمل الكلمات والحب الكثير. جرّب مرة أخرى يا بطل 😊",
        feedbackEn:
          "That's okay! Grandma deserves the kindest words and lots of love. Try again 😊",
      },
    ],
  });

  // Task 6 — Ending the call politely
  const q6 = await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 6,
      kind: "MULTIPLE_CHOICE",
      promptAr: "انتهت المكالمة الجميلة. كيف نودّع بأدب؟",
      promptEn: "The lovely call has ended. How do we say goodbye politely?",
      mediaJson: {
        layout: "list",
        optionMeta: [{ tone: "good" }, { tone: "warn" }, { tone: "bad" }],
      },
    },
  });
  await prisma.gameOption.createMany({
    data: [
      {
        questionId: q6.id,
        order: 0,
        labelAr: "«مع السلامة، في أمان الله!» ثم نغلق الهاتف بلطف.",
        labelEn:
          "«Ma'a Assalama, may Allah keep you safe!» then gently end the call.",
        emoji: "💚",
        isCorrect: true,
        feedbackAr:
          "أحسنت! نختم بكلمات لطيفة: «مع السلامة، في أمان الله!» 👋💛",
        feedbackEn:
          "Well done! We end with kind words: «Take care, in Allah's protection!» 👋💛",
      },
      {
        questionId: q6.id,
        order: 1,
        labelAr: "نغلق الهاتف فجأة دون أن نقول أي كلمة.",
        labelEn: "Hang up suddenly without saying anything.",
        emoji: "🤐",
        isCorrect: false,
        feedbackAr:
          "لا بأس! نودّع بلطف ونقول «مع السلامة، في أمان الله». جرّب مرة أخرى 😊",
        feedbackEn: "No worries! We say a gentle goodbye. Try again 😊",
      },
      {
        questionId: q6.id,
        order: 2,
        labelAr: "نصرخ «خلاص! وداعاً!» ونرمي الهاتف.",
        labelEn: "Shout «That's it! Goodbye!» and throw the phone.",
        emoji: "📢",
        isCorrect: false,
        feedbackAr: "لا بأس! نودع بهدوء وكلمات جميلة. جرّب مرة أخرى يا بطل 😊",
        feedbackEn:
          "That's okay! We say a calm and kind goodbye. Try again, champion 😊",
      },
    ],
  });

  console.log(`[seed] game phone-manners — 6 questions`);
  return game;
}

// ── 4b. islamic-manners ────────────────────────────────────────────────────

async function seedIslamicManners() {
  const game = await prisma.game.upsert({
    where: { slug: "islamic-manners" },
    update: {
      titleAr: "آداب إسلامية",
      titleEn: "Islamic Manners",
      descriptionAr:
        "تعلّم آداب الإسلام الجميلة: كيف نتكلم، ونأكل، ونسلّم، ونشكر، ونستأذن، ونفي بالوعد!",
      descriptionEn:
        "Learn beautiful Islamic manners: how to speak, eat, greet, thank, ask permission, and keep promises!",
      passThreshold: 4,
    },
    create: {
      slug: "islamic-manners",
      titleAr: "آداب إسلامية",
      titleEn: "Islamic Manners",
      descriptionAr:
        "تعلّم آداب الإسلام الجميلة: كيف نتكلم، ونأكل، ونسلّم، ونشكر، ونستأذن، ونفي بالوعد!",
      descriptionEn:
        "Learn beautiful Islamic manners: how to speak, eat, greet, thank, ask permission, and keep promises!",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 4,
      configJson: {
        theme: {
          primary: "#23c483",
          accent: "#7c5cff",
          warn: "#ff7aa8",
          bg: "#f0fff8",
        },
        hero: { emoji: "🧒", nameAr: "بطل الآداب", nameEn: "Manners Hero" },
        stars: 6,
        certificate: {
          titleAr: "وسام الآداب الإسلامية",
          titleEn: "Islamic Manners Medal",
          emoji: "🌿",
          accent: "#23c483",
          background: "linear-gradient(135deg, #f0fff8 0%, #d9f7ea 100%)",
          decoration: "crescent",
        },
        reward: {
          giftNameAr: "نجمة الآداب الذهبية",
          giftNameEn: "Golden Manners Star",
          emoji: "⭐",
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  const questions = [
    {
      order: 0,
      kind: "MULTIPLE_CHOICE",
      promptAr: "كيف نتكلم مع أمنا الحبيبة؟",
      promptEn: "How do we speak to our dear mother?",
      mediaJson: { layout: "list" },
      options: [
        {
          order: 0,
          labelAr: "بصوت عالٍ وبأوامر",
          labelEn: "Loudly and with orders",
          emoji: "😤",
          isCorrect: false,
          feedbackAr:
            "لا بأس! نتكلم مع أمنا بهدوء وحب واحترام. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We speak to our mum gently with love and respect. Try again 😊",
        },
        {
          order: 1,
          labelAr: "بهدوء وحب واحترام",
          labelEn: "Gently with love and respect",
          emoji: "💖",
          isCorrect: true,
          feedbackAr: "أحسنت! كلامنا مع أمنا يكون دائماً بلطف وحب وتقدير 💖",
          feedbackEn:
            "Well done! We always speak to our mum with gentleness, love, and respect 💖",
        },
        {
          order: 2,
          labelAr: "نتجاهلها ولا نجيبها",
          labelEn: "Ignore her and not answer",
          emoji: "🙄",
          isCorrect: false,
          feedbackAr: "لا بأس! أمنا تستحق أحسن الكلام. جرّب مرة أخرى يا بطل 😊",
          feedbackEn:
            "That's okay! Our mum deserves our best words. Try again, champion 😊",
        },
      ],
    },
    {
      order: 1,
      kind: "MULTIPLE_CHOICE",
      promptAr: "ماذا نقول عند بدء الأكل؟",
      promptEn: "What do we say before we start eating?",
      mediaJson: { layout: "list" },
      options: [
        {
          order: 0,
          labelAr: "بسم الله ونأكل بيدنا اليمنى",
          labelEn: "Bismillah and eat with our right hand",
          emoji: "🤲",
          isCorrect: true,
          feedbackAr:
            "ممتاز! نقول بسم الله ونأكل باليد اليمنى، هذه سنة النبي ﷺ 🌙",
          feedbackEn:
            "Excellent! We say Bismillah and eat with our right hand — this is the Prophet's ﷺ way 🌙",
        },
        {
          order: 1,
          labelAr: "نبدأ الأكل بدون أي كلام",
          labelEn: "Start eating without saying anything",
          emoji: "😶",
          isCorrect: false,
          feedbackAr:
            "لا بأس! دائماً نقول بسم الله قبل الأكل. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We always say Bismillah before eating. Try again 😊",
        },
        {
          order: 2,
          labelAr: "نقول ماشاء الله ونأكل بيدنا اليسرى",
          labelEn: "Say MashaAllah and eat with our left hand",
          emoji: "🤔",
          isCorrect: false,
          feedbackAr:
            "لا بأس! نقول بسم الله ونأكل باليد اليمنى. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We say Bismillah and use our right hand. Try again 😊",
        },
      ],
    },
    {
      order: 2,
      kind: "MULTIPLE_CHOICE",
      promptAr: "ماذا نقول عند لقاء أصدقائنا؟",
      promptEn: "What do we say when we meet our friends?",
      mediaJson: { layout: "list" },
      options: [
        {
          order: 0,
          labelAr: "لا نقول شيئاً ونمشي",
          labelEn: "Say nothing and walk past",
          emoji: "🚶",
          isCorrect: false,
          feedbackAr: "لا بأس! السلام يفتح القلوب. جرّب مرة أخرى يا بطل 😊",
          feedbackEn: "No worries! Salam opens hearts. Try again, champion 😊",
        },
        {
          order: 1,
          labelAr: "السلام عليكم ورحمة الله",
          labelEn: "Assalamu Alaykum wa Rahmatullah",
          emoji: "👋",
          isCorrect: true,
          feedbackAr:
            "رائع! السلام عليكم تحية المسلمين الجميلة التي تنشر المحبة! 💚",
          feedbackEn:
            "Wonderful! Assalamu Alaykum is the beautiful Muslim greeting that spreads love! 💚",
        },
        {
          order: 2,
          labelAr: "نصرخ في وجههم للترحيب",
          labelEn: "Shout at them to say hello",
          emoji: "📢",
          isCorrect: false,
          feedbackAr: "لا بأس! نرحب بأصدقائنا بكلمات لطيفة. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We greet friends with kind words. Try again 😊",
        },
      ],
    },
    {
      order: 3,
      kind: "MULTIPLE_CHOICE",
      promptAr: "أعطاك أحد هدية جميلة. ماذا تقول؟",
      promptEn: "Someone gave you a lovely gift. What do you say?",
      mediaJson: { layout: "list" },
      options: [
        {
          order: 0,
          labelAr: "نأخذها ونذهب بدون كلام",
          labelEn: "Take it and leave without a word",
          emoji: "😑",
          isCorrect: false,
          feedbackAr: "لا بأس! نشكر دائماً من يعطينا. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We always thank those who give us things. Try again 😊",
        },
        {
          order: 1,
          labelAr: "جزاك الله خيراً، شكراً جزيلاً!",
          labelEn: "JazakAllah Khayran, thank you very much!",
          emoji: "💛",
          isCorrect: true,
          feedbackAr: "أحسنت! الشكر يجعل القلوب سعيدة ويبارك في الهدايا 💛",
          feedbackEn:
            "Well done! Saying thank you makes hearts happy and blesses the gifts 💛",
        },
        {
          order: 2,
          labelAr: "نقول: «هذا قليل ونريد أكثر»",
          labelEn: "Say: «This is not enough, we want more»",
          emoji: "😒",
          isCorrect: false,
          feedbackAr:
            "لا بأس! نشكر على كل شيء، صغيراً أو كبيراً. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We are thankful for everything, big or small. Try again 😊",
        },
      ],
    },
    {
      order: 4,
      kind: "MULTIPLE_CHOICE",
      promptAr: "أردت الدخول إلى غرفة أبيك. ماذا تفعل؟",
      promptEn: "You want to enter your father's room. What do you do?",
      mediaJson: { layout: "list" },
      options: [
        {
          order: 0,
          labelAr: "ندخل مباشرة دون أن نطرق",
          labelEn: "Go straight in without knocking",
          emoji: "🚪",
          isCorrect: false,
          feedbackAr: "لا بأس! نطرق الباب ونستأذن دائماً. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We always knock and ask permission. Try again 😊",
        },
        {
          order: 1,
          labelAr: "نطرق الباب ونقول: «إذن يا أبي؟»",
          labelEn: "Knock and say: «May I come in, Dad?»",
          emoji: "🤲",
          isCorrect: true,
          feedbackAr: "ممتاز! الاستئذان قبل الدخول أدب رائع يحبه الله 🌟",
          feedbackEn:
            "Excellent! Asking permission before entering is a wonderful manner that Allah loves 🌟",
        },
        {
          order: 2,
          labelAr: "نصرخ بصوت عالٍ من الخارج",
          labelEn: "Shout loudly from outside",
          emoji: "📢",
          isCorrect: false,
          feedbackAr: "لا بأس! الطرق اللطيف هو الأدب الصحيح. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Gentle knocking is the right manner. Try again 😊",
        },
      ],
    },
    {
      order: 5,
      kind: "MULTIPLE_CHOICE",
      promptAr: "وعدت صديقك أن تلعب معه غداً. ماذا تفعل غداً؟",
      promptEn:
        "You promised your friend to play with them tomorrow. What do you do tomorrow?",
      mediaJson: { layout: "list" },
      options: [
        {
          order: 0,
          labelAr: "تنسى الوعد وتذهب للعب وحدك",
          labelEn: "Forget the promise and play alone",
          emoji: "😔",
          isCorrect: false,
          feedbackAr:
            "لا بأس! الوفاء بالوعد يجعلنا أصدقاء حقيقيين. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Keeping promises makes us true friends. Try again 😊",
        },
        {
          order: 1,
          labelAr: "تفي بوعدك وتذهب للعب معه",
          labelEn: "Keep your promise and go play with them",
          emoji: "🤝",
          isCorrect: true,
          feedbackAr:
            "رائع! الوفاء بالوعد صفة المؤمن الصادق وأساس الصداقة الحقيقية 🤝💛",
          feedbackEn:
            "Wonderful! Keeping promises is a quality of a true believer and the basis of real friendship 🤝💛",
        },
        {
          order: 2,
          labelAr: "تكذب عليه وتقول إنك مريض",
          labelEn: "Lie to them and say you are sick",
          emoji: "🤥",
          isCorrect: false,
          feedbackAr:
            "لا بأس! الصدق والوفاء بالوعد من أجمل الأخلاق. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Honesty and keeping promises are beautiful qualities. Try again 😊",
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

  console.log(`[seed] game islamic-manners — ${questions.length} questions`);
  return game;
}

// ── 4c. good-deeds-catch ───────────────────────────────────────────────────

async function seedGoodDeedsCatch() {
  const game = await prisma.game.upsert({
    where: { slug: "good-deeds-catch" },
    update: {
      titleAr: "اصطياد الحسنات",
      titleEn: "Catch the Good Deeds",
      descriptionAr:
        "المس الأعمال الطيبة الطائرة واجمعها في صاروخك! تجنّب الأعمال السيئة.",
      descriptionEn:
        "Tap the flying good deeds and collect them in your rocket! Avoid the bad deeds.",
      passThreshold: 1,
    },
    create: {
      slug: "good-deeds-catch",
      titleAr: "اصطياد الحسنات",
      titleEn: "Catch the Good Deeds",
      descriptionAr:
        "المس الأعمال الطيبة الطائرة واجمعها في صاروخك! تجنّب الأعمال السيئة.",
      descriptionEn:
        "Tap the flying good deeds and collect them in your rocket! Avoid the bad deeds.",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 1,
      configJson: {
        theme: {
          primary: "#3B82F6",
          accent: "#22C55E",
          warn: "#FF8C00",
          bg: "#f0f9ff",
        },
        hero: {
          emoji: "🚀",
          nameAr: "صاروخ الحسنات",
          nameEn: "Good Deeds Rocket",
        },
        stars: 4,
        certificate: {
          titleAr: "شهادة جامع الحسنات",
          titleEn: "Good Deeds Collector Certificate",
          emoji: "🚀",
          accent: "#22C55E",
          background: "linear-gradient(135deg, #f0f9ff 0%, #dcfce7 100%)",
          decoration: "stars",
        },
        reward: {
          giftNameAr: "نجمة الحسنات",
          giftNameEn: "Good Deeds Star",
          emoji: "✨",
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  // One TAP_CHOICE question — the options ARE the item pool.
  const q1 = await prisma.gameQuestion.create({
    data: {
      gameId: game.id,
      order: 0,
      kind: "TAP_CHOICE",
      promptAr:
        "المس الأعمال الطيبة الطائرة لتجمعها في الصاروخ! 💛 تجنّب الأعمال السيئة.",
      promptEn:
        "Tap the flying good deeds to collect them in your rocket! 💛 Avoid the bad deeds.",
      mediaJson: { mode: "catch", rounds: 12 },
    },
  });

  await prisma.gameOption.createMany({
    data: [
      // GOOD deeds (isCorrect = true → should be tapped)
      {
        questionId: q1.id,
        order: 0,
        labelAr: "الصلاة",
        labelEn: "Prayer",
        emoji: "🤲",
        isCorrect: true,
        feedbackAr: "أحسنت! الصلاة من أعظم الحسنات 🌟",
        feedbackEn: "Well done! Prayer is one of the greatest good deeds 🌟",
      },
      {
        questionId: q1.id,
        order: 1,
        labelAr: "قراءة القرآن",
        labelEn: "Reading Quran",
        emoji: "📖",
        isCorrect: true,
        feedbackAr: "ممتاز! قراءة القرآن نور للقلب ✨",
        feedbackEn: "Excellent! Reading Quran is light for the heart ✨",
      },
      {
        questionId: q1.id,
        order: 2,
        labelAr: "مساعدة الناس",
        labelEn: "Helping people",
        emoji: "🤝",
        isCorrect: true,
        feedbackAr: "رائع! المساعدة حسنة عظيمة 💛",
        feedbackEn: "Wonderful! Helping others is a great good deed 💛",
      },
      {
        questionId: q1.id,
        order: 3,
        labelAr: "ابتسامة لأخيك",
        labelEn: "Smiling at your brother",
        emoji: "😊",
        isCorrect: true,
        feedbackAr: "جميل! الابتسامة صدقة 😊",
        feedbackEn: "Beautiful! A smile is charity 😊",
      },
      {
        questionId: q1.id,
        order: 4,
        labelAr: "برّ الوالدين",
        labelEn: "Being good to parents",
        emoji: "🫶",
        isCorrect: true,
        feedbackAr: "أحسنت! برّ الوالدين من أحبّ الأعمال إلى الله 💖",
        feedbackEn:
          "Well done! Being good to parents is one of the most beloved deeds to Allah 💖",
      },
      {
        questionId: q1.id,
        order: 5,
        labelAr: "إماطة الأذى",
        labelEn: "Removing harm from the path",
        emoji: "🧹",
        isCorrect: true,
        feedbackAr: "ممتاز! إماطة الأذى شعبة من الإيمان 🌱",
        feedbackEn:
          "Excellent! Removing harm from the path is a branch of faith 🌱",
      },
      {
        questionId: q1.id,
        order: 6,
        labelAr: "إطعام مسكين",
        labelEn: "Feeding a poor person",
        emoji: "🥗",
        isCorrect: true,
        feedbackAr: "رائع! إطعام الجائع حسنة عظيمة 💛",
        feedbackEn: "Wonderful! Feeding the hungry is a great good deed 💛",
      },
      {
        questionId: q1.id,
        order: 7,
        labelAr: "الرفق بالحيوان",
        labelEn: "Being kind to animals",
        emoji: "🐈",
        isCorrect: true,
        feedbackAr: "جميل! الرفق بالحيوانات يحبه الله 🐾",
        feedbackEn: "Beautiful! Allah loves kindness to animals 🐾",
      },
      {
        questionId: q1.id,
        order: 8,
        labelAr: "الصدقة",
        labelEn: "Giving charity",
        emoji: "💝",
        isCorrect: true,
        feedbackAr: "أحسنت! الصدقة تطفئ الخطيئة 💝",
        feedbackEn: "Well done! Charity wipes away mistakes 💝",
      },
      {
        questionId: q1.id,
        order: 9,
        labelAr: "قول الصدق",
        labelEn: "Telling the truth",
        emoji: "✅",
        isCorrect: true,
        feedbackAr: "رائع! الصدق يهدي إلى الجنة ✅",
        feedbackEn: "Wonderful! Truthfulness leads to Paradise ✅",
      },
      {
        questionId: q1.id,
        order: 10,
        labelAr: "سقي الماء",
        labelEn: "Giving water to drink",
        emoji: "💧",
        isCorrect: true,
        feedbackAr: "جميل! سقي الماء صدقة عظيمة 💧",
        feedbackEn: "Beautiful! Giving water to drink is a great charity 💧",
      },
      {
        questionId: q1.id,
        order: 11,
        labelAr: "صلة الرحم",
        labelEn: "Keeping family ties",
        emoji: "👵",
        isCorrect: true,
        feedbackAr: "ممتاز! صلة الرحم تزيد المحبة والبركة 👵",
        feedbackEn:
          "Excellent! Keeping family ties brings love and blessing 👵",
      },
      {
        questionId: q1.id,
        order: 12,
        labelAr: "إفشاء السلام",
        labelEn: "Spreading the greeting",
        emoji: "👋",
        isCorrect: true,
        feedbackAr: "أحسنت! إفشاء السلام ينشر المحبة بيننا 👋",
        feedbackEn: "Well done! Spreading salam spreads love between us 👋",
      },
      {
        questionId: q1.id,
        order: 13,
        labelAr: "ذكر الله",
        labelEn: "Remembering Allah",
        emoji: "📿",
        isCorrect: true,
        feedbackAr: "رائع! بذكر الله تطمئن القلوب 📿",
        feedbackEn: "Wonderful! Remembering Allah brings peace to hearts 📿",
      },
      // BAD deeds (isCorrect = false → should NOT be tapped)
      {
        questionId: q1.id,
        order: 14,
        labelAr: "الكذب",
        labelEn: "Lying",
        emoji: "🗣️",
        isCorrect: false,
        feedbackAr: "هذا ليس عملاً طيباً! ابحث عن الأعمال الطيبة 💛",
        feedbackEn: "That is not a good deed! Look for the good deeds 💛",
      },
      {
        questionId: q1.id,
        order: 15,
        labelAr: "الغضب",
        labelEn: "Anger",
        emoji: "😠",
        isCorrect: false,
        feedbackAr: "لا بأس! هذا ليس مما نجمعه. ابحث عن الحسنات 💛",
        feedbackEn:
          "No worries! This is not what we collect. Look for good deeds 💛",
      },
      {
        questionId: q1.id,
        order: 16,
        labelAr: "عصيان الوالدين",
        labelEn: "Disobeying parents",
        emoji: "🙉",
        isCorrect: false,
        feedbackAr: "هذا ليس عملاً طيباً! اجمع الحسنات وتجنب هذا 💛",
        feedbackEn:
          "That is not a good deed! Collect good deeds and avoid this 💛",
      },
      {
        questionId: q1.id,
        order: 17,
        labelAr: "الغش",
        labelEn: "Cheating",
        emoji: "🃏",
        isCorrect: false,
        feedbackAr: "هذا ليس عملاً طيباً! من غشّ فليس منّا 💛",
        feedbackEn: "That is not a good deed! Cheating is not from us 💛",
      },
      {
        questionId: q1.id,
        order: 18,
        labelAr: "إيذاء الجار",
        labelEn: "Hurting a neighbor",
        emoji: "💢",
        isCorrect: false,
        feedbackAr: "لا! أحسِن إلى جارك ولا تؤذِه 💛",
        feedbackEn: "No! Be kind to your neighbor, don't hurt them 💛",
      },
      {
        questionId: q1.id,
        order: 19,
        labelAr: "السبّ والشتم",
        labelEn: "Insulting others",
        emoji: "🤬",
        isCorrect: false,
        feedbackAr: "هذا ليس من الأعمال الطيبة! تكلّم بالكلام الطيب 💛",
        feedbackEn: "That is not a good deed! Speak only kind words 💛",
      },
    ],
  });

  console.log(`[seed] game good-deeds-catch — 1 question (20 options in pool)`);
  return game;
}

// ── 4c-2. dhikr-treasure (TAP_CHOICE — falling from the sky) ────────────────
// Same "tap-the-good" idea as good-deeds-catch, but a DIFFERENT topic (adhkar),
// a DIFFERENT style (items drop from the sky into a treasure pouch) and a small
// twist: you fill a treasure of remembrance instead of a rocket.

async function seedDhikrTreasure() {
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

// ── 4c-3. prayer-stars (TAP_CHOICE — falling at night) ─────────────────────
// Same catch idea, DIFFERENT topic (what makes prayer beautiful), a night-sky
// style and a slightly different feel: items fall faster and you gather glowing
// stars into the moon. Bad items are prayer distractions.

async function seedPrayerStars() {
  const game = await prisma.game.upsert({
    where: { slug: "prayer-stars" },
    update: {
      titleAr: "نجوم الصلاة",
      titleEn: "Prayer Stars",
      descriptionAr:
        "نجوم الصلاة الجميلة تتساقط في الليل! المس ما يُحسِّن صلاتك واجمعه، وتجنّب ما يُلهيك عنها.",
      descriptionEn:
        "The stars of a beautiful prayer fall in the night! Tap what makes your prayer better, and avoid what distracts you.",
      passThreshold: 1,
    },
    create: {
      slug: "prayer-stars",
      titleAr: "نجوم الصلاة",
      titleEn: "Prayer Stars",
      descriptionAr:
        "نجوم الصلاة الجميلة تتساقط في الليل! المس ما يُحسِّن صلاتك واجمعه، وتجنّب ما يُلهيك عنها.",
      descriptionEn:
        "The stars of a beautiful prayer fall in the night! Tap what makes your prayer better, and avoid what distracts you.",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 1,
      configJson: {
        theme: {
          primary: "#6366F1",
          accent: "#FBBF24",
          warn: "#FB7185",
          bg: "#eef2ff",
        },
        hero: {
          emoji: "🌙",
          nameAr: "جامع النجوم",
          nameEn: "Star Gatherer",
        },
        stars: 4,
        certificate: {
          titleAr: "شهادة نجوم الصلاة",
          titleEn: "Prayer Stars Certificate",
          emoji: "🌙",
          accent: "#6366F1",
          background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
          decoration: "stars",
        },
        reward: {
          giftNameAr: "نجمة الصلاة",
          giftNameEn: "Prayer Star",
          emoji: "⭐",
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
        "النجوم تتساقط في الليل! المس ما يجعل صلاتك جميلة لتجمعه في القمر 🌙 وتجنّب ما يُلهيك.",
      promptEn:
        "Stars fall in the night! Tap what makes your prayer beautiful to gather it in the moon 🌙 and avoid distractions.",
      mediaJson: {
        mode: "catch",
        rounds: 8,
        direction: "fall",
        speed: "fast",
        goalEmoji: "⭐",
        catcherEmoji: "🌙",
        hintAr:
          "النجوم تتساقط بسرعة — المس ما يُحسِّن صلاتك! ⭐ تجنّب ما يُلهيك.",
        hintEn:
          "Stars fall fast — tap what makes your prayer better! ⭐ Avoid distractions.",
        doneAr: "جمعت نجوم صلاتك الجميلة! ما شاء الله 🌙⭐",
        doneEn:
          "You gathered the stars of your beautiful prayer! MashaAllah 🌙⭐",
        arena: {
          from: "#312e81",
          to: "#1e1b4b",
          glow: "#fde68a",
          border: "#4338ca",
        },
      },
    },
  });

  await prisma.gameOption.createMany({
    data: [
      // GOOD — what beautifies prayer (isCorrect = true → collect)
      {
        questionId: q1.id,
        order: 0,
        labelAr: "الوضوء",
        labelEn: "Wudu",
        emoji: "💧",
        isCorrect: true,
        feedbackAr: "أحسنت! الوضوء مفتاح الصلاة 🌟",
        feedbackEn: "Well done! Wudu is the key to prayer 🌟",
      },
      {
        questionId: q1.id,
        order: 1,
        labelAr: "استقبال القبلة",
        labelEn: "Facing the Qibla",
        emoji: "🧭",
        isCorrect: true,
        feedbackAr: "ممتاز! نتوجه إلى القبلة في صلاتنا 🕋",
        feedbackEn: "Excellent! We face the Qibla in our prayer 🕋",
      },
      {
        questionId: q1.id,
        order: 2,
        labelAr: "الخشوع",
        labelEn: "Focus & humility",
        emoji: "😌",
        isCorrect: true,
        feedbackAr: "رائع! الخشوع روح الصلاة 💛",
        feedbackEn: "Wonderful! Humility is the soul of prayer 💛",
      },
      {
        questionId: q1.id,
        order: 3,
        labelAr: "السجود",
        labelEn: "Prostration",
        emoji: "🤲",
        isCorrect: true,
        feedbackAr: "أحسنت! أقرب ما نكون من الله في السجود 💖",
        feedbackEn: "Well done! We are closest to Allah in prostration 💖",
      },
      {
        questionId: q1.id,
        order: 4,
        labelAr: "الطمأنينة",
        labelEn: "Calmness",
        emoji: "🕊️",
        isCorrect: true,
        feedbackAr: "جميل! نصلّي بهدوء وطمأنينة 🌱",
        feedbackEn: "Beautiful! We pray calmly and with stillness 🌱",
      },
      {
        questionId: q1.id,
        order: 5,
        labelAr: "الصلاة في وقتها",
        labelEn: "Praying on time",
        emoji: "⏰",
        isCorrect: true,
        feedbackAr: "ممتاز! الصلاة في وقتها من أحبّ الأعمال 💫",
        feedbackEn:
          "Excellent! Praying on time is among the most beloved deeds 💫",
      },
      {
        questionId: q1.id,
        order: 6,
        labelAr: "قول الله أكبر",
        labelEn: "Saying Allahu Akbar",
        emoji: "☝️",
        isCorrect: true,
        feedbackAr: "رائع! نكبّر بقلب حاضر 🌟",
        feedbackEn: "Wonderful! We say takbeer with a present heart 🌟",
      },
      {
        questionId: q1.id,
        order: 7,
        labelAr: "الصف المستقيم",
        labelEn: "A straight row",
        emoji: "🧍",
        isCorrect: true,
        feedbackAr: "جميل! نعتدل في صفّنا 🕌",
        feedbackEn: "Beautiful! We stand straight in our row 🕌",
      },
      // BAD — prayer distractions (isCorrect = false → leave it)
      {
        questionId: q1.id,
        order: 8,
        labelAr: "الاستعجال في الصلاة",
        labelEn: "Rushing the prayer",
        emoji: "🏃",
        isCorrect: false,
        feedbackAr: "لا بأس! نصلّي بهدوء، لا نستعجل 🌙",
        feedbackEn: "No worries! We pray calmly, not in a rush 🌙",
      },
      {
        questionId: q1.id,
        order: 9,
        labelAr: "اللعب أثناء الصلاة",
        labelEn: "Playing during prayer",
        emoji: "🤸",
        isCorrect: false,
        feedbackAr: "هذا يُلهي عن الصلاة! اجمع نجوم الخشوع ⭐",
        feedbackEn: "That distracts from prayer! Gather the stars of focus ⭐",
      },
      {
        questionId: q1.id,
        order: 10,
        labelAr: "كثرة الالتفات",
        labelEn: "Looking around a lot",
        emoji: "🔄",
        isCorrect: false,
        feedbackAr: "لا بأس! ننظر إلى موضع سجودنا 🌙",
        feedbackEn: "No worries! We look at the place of our prostration 🌙",
      },
    ],
  });

  console.log(`[seed] game prayer-stars — 1 question (11 options in pool)`);
  return game;
}

// ── 4d. wudu-steps ────────────────────────────────────────────────────────

async function seedWuduSteps() {
  const game = await prisma.game.upsert({
    where: { slug: "wudu-steps" },
    update: {
      titleAr: "بطل الوضوء",
      titleEn: "Wudu Champion",
      descriptionAr: "اختر الخطوة التالية من خطوات الوضوء بالترتيب الصحيح!",
      descriptionEn: "Choose the next wudu step in the correct order!",
      passThreshold: 4,
    },
    create: {
      slug: "wudu-steps",
      titleAr: "بطل الوضوء",
      titleEn: "Wudu Champion",
      descriptionAr: "اختر الخطوة التالية من خطوات الوضوء بالترتيب الصحيح!",
      descriptionEn: "Choose the next wudu step in the correct order!",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 4,
      configJson: {
        theme: {
          primary: "#3B82F6",
          accent: "#06d6a0",
          warn: "#ff7aa8",
          bg: "#f0f9ff",
        },
        hero: { emoji: "💧", nameAr: "بطل الوضوء", nameEn: "Wudu Champion" },
        stars: 4,
        certificate: {
          titleAr: "شهادة بطل الوضوء النظيف",
          titleEn: "Clean Wudu Champion Certificate",
          emoji: "💧",
          accent: "#06d6a0",
          background: "linear-gradient(135deg, #f0f9ff 0%, #d6f7ef 100%)",
          decoration: "stars",
        },
        reward: {
          giftNameAr: "درع الطهارة",
          giftNameEn: "Purity Shield",
          emoji: "🛡️",
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  // 4 questions: "what is step N?" — each with correct next step + 2 distractors from other steps.
  const questions = [
    {
      order: 0,
      promptAr: "ما هي الخطوة الأولى من الوضوء؟",
      promptEn: "What is the first step of wudu?",
      options: [
        {
          order: 0,
          labelAr: "النِّيّة في القلب",
          labelEn: "The intention in the heart",
          emoji: "🤲",
          isCorrect: true,
          feedbackAr: "ممتاز! الوضوء يبدأ بالنية في القلب 💙",
          feedbackEn:
            "Excellent! Wudu starts with the intention in your heart 💙",
        },
        {
          order: 1,
          labelAr: "غسل الوجه",
          labelEn: "Washing the face",
          emoji: "🧒",
          isCorrect: false,
          feedbackAr: "لا بأس! نبدأ بالنية أولاً. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We start with the intention first. Try again 😊",
        },
        {
          order: 2,
          labelAr: "غسل الرجلين",
          labelEn: "Washing the feet",
          emoji: "🦶",
          isCorrect: false,
          feedbackAr: "لا بأس! الخطوة الأولى هي النية. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! The first step is the intention. Try again 😊",
        },
      ],
    },
    {
      order: 1,
      promptAr: "بعد النية، ماذا نقول وماذا نغسل؟",
      promptEn: "After the intention, what do we say and what do we wash?",
      options: [
        {
          order: 0,
          labelAr: "نقول بسم الله ونغسل كفّينا",
          labelEn: "We say Bismillah and wash our palms",
          emoji: "👐",
          isCorrect: true,
          feedbackAr: "رائع! التسمية وغسل الكفين هما الخطوة الثانية 💦",
          feedbackEn:
            "Wonderful! Saying Bismillah and washing the palms is step two 💦",
        },
        {
          order: 1,
          labelAr: "نمسح الرأس",
          labelEn: "Wipe the head",
          emoji: "🧒",
          isCorrect: false,
          feedbackAr:
            "لا بأس! نقول بسم الله ونغسل الكفين أولاً. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! We say Bismillah and wash the palms first. Try again 😊",
        },
        {
          order: 2,
          labelAr: "نغسل القدمين",
          labelEn: "Wash the feet",
          emoji: "🦶",
          isCorrect: false,
          feedbackAr: "لا بأس! الكفان يُغسلان قبل القدمين. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! The palms are washed before the feet. Try again 😊",
        },
      ],
    },
    {
      order: 2,
      promptAr: "بعد غسل الكفين، ما الخطوة التالية؟",
      promptEn: "After washing the palms, what is the next step?",
      options: [
        {
          order: 0,
          labelAr: "المضمضة والاستنشاق",
          labelEn: "Rinsing the mouth and nose",
          emoji: "💦",
          isCorrect: true,
          feedbackAr: "أحسنت! المضمضة والاستنشاق تأتيان بعد غسل الكفين 😄",
          feedbackEn:
            "Well done! Rinsing mouth and nose comes after washing the palms 😄",
        },
        {
          order: 1,
          labelAr: "غسل اليدين إلى المرفقين",
          labelEn: "Washing arms to the elbows",
          emoji: "💪",
          isCorrect: false,
          feedbackAr:
            "لا بأس! المضمضة والاستنشاق تأتيان قبل غسل الوجه. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Mouth and nose come before the face. Try again 😊",
        },
        {
          order: 2,
          labelAr: "مسح الرأس",
          labelEn: "Wiping the head",
          emoji: "🧒",
          isCorrect: false,
          feedbackAr: "لا بأس! مسح الرأس يأتي لاحقاً. جرّب مرة أخرى 😊",
          feedbackEn: "No worries! Wiping the head comes later. Try again 😊",
        },
      ],
    },
    {
      order: 3,
      promptAr: "بعد غسل الوجه والذراعين، ما الذي يأتي بعده؟",
      promptEn: "After washing the face and arms, what comes next?",
      options: [
        {
          order: 0,
          labelAr: "مسح الرأس ثم غسل الرجلين",
          labelEn: "Wiping the head then washing the feet",
          emoji: "🦶",
          isCorrect: true,
          feedbackAr: "ممتاز! مسح الرأس ثم غسل الرجلين آخر خطوات الوضوء 🎉",
          feedbackEn:
            "Excellent! Wiping the head then washing the feet are the last wudu steps 🎉",
        },
        {
          order: 1,
          labelAr: "غسل الكفين مرة أخرى",
          labelEn: "Washing the palms again",
          emoji: "👐",
          isCorrect: false,
          feedbackAr: "لا بأس! نمسح الرأس ونغسل الرجلين الآن. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Now we wipe the head and wash the feet. Try again 😊",
        },
        {
          order: 2,
          labelAr: "المضمضة مرة أخرى",
          labelEn: "Rinsing the mouth again",
          emoji: "💦",
          isCorrect: false,
          feedbackAr:
            "لا بأس! الخطوة الأخيرة هي مسح الرأس وغسل الرجلين. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! The last step is wiping the head and washing the feet. Try again 😊",
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

  console.log(`[seed] game wudu-steps — ${questions.length} questions`);
  return game;
}

// ── 4e. azkar-match ───────────────────────────────────────────────────────

async function seedAzkarMatch() {
  const game = await prisma.game.upsert({
    where: { slug: "azkar-match" },
    update: {
      titleAr: "طابق الأذكار",
      titleEn: "Match the Azkar",
      descriptionAr: "طابق الذِّكر المناسب مع كل موقف من مواقف الحياة اليومية!",
      descriptionEn: "Match the right dhikr to each everyday situation!",
      passThreshold: 3,
    },
    create: {
      slug: "azkar-match",
      titleAr: "طابق الأذكار",
      titleEn: "Match the Azkar",
      descriptionAr: "طابق الذِّكر المناسب مع كل موقف من مواقف الحياة اليومية!",
      descriptionEn: "Match the right dhikr to each everyday situation!",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 3,
      configJson: {
        theme: {
          primary: "#8a5bff",
          accent: "#ff5fa2",
          warn: "#ffa83d",
          bg: "#fdf7ff",
        },
        hero: { emoji: "🤲", nameAr: "بطل الأذكار", nameEn: "Azkar Champion" },
        stars: 4,
        certificate: {
          titleAr: "وسام بطل الأذكار الذكي",
          titleEn: "Smart Azkar Champion Medal",
          emoji: "💚",
          accent: "#8a5bff",
          background: "linear-gradient(135deg, #fdf7ff 0%, #ece0ff 100%)",
          decoration: "crescent",
        },
        reward: {
          giftNameAr: "قلب مطمئن",
          giftNameEn: "Peaceful Heart",
          emoji: "💚",
        },
      },
    },
  });

  await clearGameQuestions(game.id);

  const questions = [
    {
      order: 0,
      promptAr: "ماذا نقول قبل الأكل؟",
      promptEn: "What do we say before eating?",
      options: [
        {
          order: 0,
          labelAr: "بِسْمِ الله",
          labelEn: "Bismillah",
          emoji: "🍽️",
          isCorrect: true,
          feedbackAr: "ممتاز! نقول بسم الله قبل الأكل 🤲",
          feedbackEn: "Excellent! We say Bismillah before eating 🤲",
        },
        {
          order: 1,
          labelAr: "الحمد لله",
          labelEn: "Alhamdulillah",
          emoji: "🤲",
          isCorrect: false,
          feedbackAr:
            "لا بأس! الحمد لله يُقال بعد الأكل. قبل الأكل نقول بسم الله. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Alhamdulillah is said after eating. Before eating we say Bismillah. Try again 😊",
        },
        {
          order: 2,
          labelAr: "سبحان الله",
          labelEn: "SubhanAllah",
          emoji: "🌸",
          isCorrect: false,
          feedbackAr:
            "لا بأس! سبحان الله للتعجب. قبل الأكل نقول بسم الله. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! SubhanAllah is for wonder. Before eating we say Bismillah. Try again 😊",
        },
      ],
    },
    {
      order: 1,
      promptAr: "ماذا نقول قبل النوم؟",
      promptEn: "What do we say before sleeping?",
      options: [
        {
          order: 0,
          labelAr: "بسم الله الرحمن الرحيم",
          labelEn: "Bismillah Ar-Rahman Ar-Raheem",
          emoji: "🍽️",
          isCorrect: false,
          feedbackAr:
            "لا بأس! هذا يُقال قبل الأكل. قبل النوم نقول: «باسمك اللهم أحيا وأموت». جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! That is before eating. Before sleeping we say: «In Your name, O Allah, I live and die». Try again 😊",
        },
        {
          order: 1,
          labelAr: "باسمك اللهم أحيا وأموت",
          labelEn: "In Your name O Allah I live and die",
          emoji: "😴",
          isCorrect: true,
          feedbackAr: "رائع! هذا ذكر النوم الجميل 🌙 نقوله كل ليلة",
          feedbackEn:
            "Wonderful! This is the beautiful sleeping dhikr 🌙 we say every night",
        },
        {
          order: 2,
          labelAr: "الحمد لله على كل حال",
          labelEn: "Alhamdulillah in all situations",
          emoji: "🤲",
          isCorrect: false,
          feedbackAr:
            "لا بأس! قبل النوم نقول: «باسمك اللهم أحيا وأموت». جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Before sleeping we say: «In Your name, O Allah, I live and die». Try again 😊",
        },
      ],
    },
    {
      order: 2,
      promptAr: "عطست! ماذا تقول؟",
      promptEn: "You sneezed! What do you say?",
      options: [
        {
          order: 0,
          labelAr: "بسم الله",
          labelEn: "Bismillah",
          emoji: "🤧",
          isCorrect: false,
          feedbackAr: "لا بأس! بعد العطاس نقول الحمد لله. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! After sneezing we say Alhamdulillah. Try again 😊",
        },
        {
          order: 1,
          labelAr: "الحمد لله",
          labelEn: "Alhamdulillah",
          emoji: "🤧",
          isCorrect: true,
          feedbackAr:
            "أحسنت! بعد العطاس نقول الحمد لله 🤧 ومن يسمعنا يقول: يرحمك الله!",
          feedbackEn:
            "Well done! After sneezing we say Alhamdulillah 🤧 and whoever hears says: May Allah have mercy on you!",
        },
        {
          order: 2,
          labelAr: "لا حول ولا قوة إلا بالله",
          labelEn: "La hawla wa la quwwata illa billah",
          emoji: "🤲",
          isCorrect: false,
          feedbackAr:
            "لا بأس! هذا يُقال عند الشدة. العطاس نقول بعده الحمد لله. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! That is said in hardship. After sneezing we say Alhamdulillah. Try again 😊",
        },
      ],
    },
    {
      order: 3,
      promptAr: "ماذا نقول عند الخروج من البيت؟",
      promptEn: "What do we say when leaving the house?",
      options: [
        {
          order: 0,
          labelAr: "باسم الله توكلت على الله",
          labelEn: "In Allah's name I put my trust in Allah",
          emoji: "🚪",
          isCorrect: true,
          feedbackAr:
            "ممتاز! عند الخروج نقول: «باسم الله توكلت على الله، لا حول ولا قوة إلا بالله» 🚪✨",
          feedbackEn:
            "Excellent! When leaving we say: «In Allah's name I trust in Allah, there is no power except with Allah» 🚪✨",
        },
        {
          order: 1,
          labelAr: "الحمد لله",
          labelEn: "Alhamdulillah",
          emoji: "🤲",
          isCorrect: false,
          feedbackAr:
            "لا بأس! عند الخروج نقول: «باسم الله توكلت على الله». جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! When leaving we say: «In Allah's name I trust in Allah». Try again 😊",
        },
        {
          order: 2,
          labelAr: "سبحان الله وبحمده",
          labelEn: "SubhanAllah wa bihamdihi",
          emoji: "🌸",
          isCorrect: false,
          feedbackAr:
            "لا بأس! عند الخروج نقول: «باسم الله توكلت على الله». جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! When leaving we say: «In Allah's name I trust in Allah». Try again 😊",
        },
      ],
    },
  ];

  for (const q of questions) {
    const { options, ...qData } = q;
    const created = await prisma.gameQuestion.create({
      data: {
        gameId: game.id,
        kind: "EMOJI_CHOICE",
        mediaJson: { layout: "grid" },
        ...qData,
      },
    });
    await prisma.gameOption.createMany({
      data: options.map((o) => ({ ...o, questionId: created.id })),
    });
  }

  console.log(`[seed] game azkar-match — ${questions.length} questions`);
  return game;
}

// ── 4f. pillars-build ─────────────────────────────────────────────────────

async function seedPillarsBuild() {
  const game = await prisma.game.upsert({
    where: { slug: "pillars-build" },
    update: {
      titleAr: "ابنِ أركان الإسلام",
      titleEn: "Build the Pillars of Islam",
      descriptionAr: "اكتشف أركان الإسلام الخمسة وابنِ المسجد خطوة بخطوة!",
      descriptionEn:
        "Discover the five pillars of Islam and build the mosque step by step!",
      passThreshold: 3,
    },
    create: {
      slug: "pillars-build",
      titleAr: "ابنِ أركان الإسلام",
      titleEn: "Build the Pillars of Islam",
      descriptionAr: "اكتشف أركان الإسلام الخمسة وابنِ المسجد خطوة بخطوة!",
      descriptionEn:
        "Discover the five pillars of Islam and build the mosque step by step!",
      type: "INTERACTIVE",
      isPublic: false,
      isActive: true,
      passThreshold: 3,
      configJson: {
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
        stars: 5,
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
      },
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
            "لا بأس! الصيام ركن لكنه الرابع. الأول هو الشهادتان. جرّب مرة أخرى 😊",
          feedbackEn:
            "No worries! Fasting is a pillar but it is the fourth. The first is the Testimonies. Try again 😊",
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

// ── 4g. letters-match (MATCHING) ──────────────────────────────────────────

async function seedLettersMatch() {
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

// ── 4h. qibla-compass (COMPASS) ───────────────────────────────────────────

async function seedQiblaCompass() {
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

// ── 4i. ramadan-hero (CALENDAR_DROP) ──────────────────────────────────────

async function seedRamadanHero() {
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

// ── 4j. decorate-mosque (COLORING) ────────────────────────────────────────

async function seedDecorateMosque() {
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// 5. PLANS (GBP) — public pricing + an example discount
// ─────────────────────────────────────────────────────────────────────────────

async function seedPlans() {
  // A plan stores ONLY its hours. The price is derived from the single global
  // hourly rate (AppSetting.hourlyRate): monthly = hours × rate, yearly = ×12.
  const planDefs = [
    {
      titleAr: "الباقة التمهيدية",
      titleEn: "Starter",
      descriptionAr: "٤ ساعات شهريًا — مثالية للبداية واكتشاف المنصّة.",
      descriptionEn: "4 hours per month — perfect to start and explore.",
      hours: 4,
      isFeatured: false,
      sortOrder: 1,
    },
    {
      titleAr: "الباقة المتوازنة",
      titleEn: "Standard",
      descriptionAr: "٨ ساعات شهريًا — الأكثر اختيارًا للأسر.",
      descriptionEn: "8 hours per month — the most popular for families.",
      hours: 8,
      isFeatured: true,
      sortOrder: 2,
    },
    {
      titleAr: "الباقة المميّزة",
      titleEn: "Premium",
      descriptionAr: "١٢ ساعة شهريًا — تقدّم أسرع ومتابعة أقرب.",
      descriptionEn: "12 hours per month — faster progress, closer follow-up.",
      hours: 12,
      isFeatured: false,
      sortOrder: 3,
    },
  ];

  const plans = {};
  for (const def of planDefs) {
    let plan = await prisma.plan.findFirst({ where: { titleEn: def.titleEn } });
    if (!plan) {
      plan = await prisma.plan.create({
        data: { ...def, isActive: true },
      });
    }
    plans[def.titleEn] = plan;
  }

  // Example plan discount, now modelled as a plan-linked coupon (15% off the
  // monthly price of the featured plan) — idempotent-ish.
  const featured = plans.Standard;
  if (featured) {
    const code = "AYA-WELCOME15";
    const hasCoupon = await prisma.coupon.findUnique({ where: { code } });
    if (!hasCoupon) {
      await prisma.coupon.create({
        data: {
          code,
          type: "PERCENT",
          value: 15,
          source: "MANUAL",
          billingPeriod: "MONTHLY",
          isActive: true,
          plans: { create: [{ planId: featured.id }] },
        },
      });
    }
  }

  console.log(`[seed] plans — ${planDefs.length} upserted (hours only)`);
  return plans;
}

// Seed the singleton global settings (hourly rate + currency) if absent.
async function seedAppSettings() {
  const existing = await prisma.appSetting.findFirst();
  if (!existing) {
    await prisma.appSetting.create({
      data: { hourlyRate: 8.0, currency: "USD" },
    });
    console.log("[seed] app settings — created (8.00 USD)");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SAMPLE FAMILY — removed. Students, parents, and everything linked to them
// (parent↔student links, subscriptions, certificates, etc.) are no longer
// seeded. Plans, templates, games, badges, and the quiz bank are kept.
// ─────────────────────────────────────────────────────────────────────────────

// ── 4l. kind-words (الكلمات الطيبة) — MULTIPLE_CHOICE + EMOJI_CHOICE ─────────
async function seedKindWords() {
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

// Guarantee exactly-at-least-one public free-trial game. Called at the end of
// the seed: if no game is flagged isFree, promote one (prefer a public + active
// game, else any game) and make it public + active so /free-game always works.
async function ensureFreeGame() {
  const freeCount = await prisma.game.count({ where: { isFree: true } });
  if (freeCount > 0) {
    console.log(`[seed] free game already set (${freeCount}).`);
    return;
  }

  const pick =
    (await prisma.game.findFirst({
      where: { isPublic: true, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, slug: true },
    })) ??
    (await prisma.game.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true, slug: true },
    }));

  if (!pick) {
    console.log("[seed] no games found — could not auto-set a free game.");
    return;
  }

  await prisma.game.update({
    where: { id: pick.id },
    data: { isFree: true, isPublic: true, isActive: true },
  });
  console.log(`[seed] auto-selected free game: ${pick.slug}`);
}

async function main() {
  console.log("[seed] starting...");

  const admin = await seedAdmin();
  const badgeCodes = await seedBadges();
  await seedCertificateTemplates();
  await seedQuizBank(admin.id);
  await seedAppSettings();
  await seedPlans();

  await seedPhoneManners();
  await seedIslamicManners();
  await seedGoodDeedsCatch();
  // Two falling-from-the-sky catch games, right after "Catch the Good Deeds".
  await seedDhikrTreasure();
  await seedPrayerStars();
  await seedWuduSteps();
  await seedAzkarMatch();
  await seedPillarsBuild();

  // ── Phase D animation games ──
  await seedLettersMatch();
  await seedQiblaCompass();
  await seedRamadanHero();
  await seedDecorateMosque();
  await seedKindWords();

  // Retired game: "سُلّم الأخلاق" (akhlaq-ladder) was removed. Clean it out of
  // any already-seeded DB. Delete if it has no graded history; otherwise just
  // deactivate so it disappears from the games list without breaking FKs.
  await removeRetiredGame("akhlaq-ladder");

  // Safety net: the public /free-game page must always have a game to show. If
  // nothing is flagged isFree (older DB, or the chosen game was deactivated),
  // promote one automatically.
  await ensureFreeGame();

  console.log(`\n[seed] done.`);
  console.log(`  admin      : ${admin.email}`);
  console.log(`  badges     : ${badgeCodes.join(", ")}`);
  console.log(`  categories : عقيدة, آداب وأخلاق, قرآن وسور (3)`);
  console.log(`  bank qs    : up to 8 defined (skips existing)`);
  console.log(
    `  games      : phone-manners(6q) | islamic-manners(6q) | good-deeds-catch(1q/20opts) | dhikr-treasure(1q/11opts) | prayer-stars(1q/11opts) | wudu-steps(4q) | azkar-match(4q) | pillars-build(4q)`,
  );
  console.log(
    `  games (D)  : letters-match(2q/MATCHING) | qibla-compass(3q/COMPASS) | ramadan-hero(2q/CALENDAR_DROP) | decorate-mosque(1q/COLORING) | kind-words`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
