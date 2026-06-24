// devData — a DEV-ONLY mirror of ONE seeded game (phone-manners), shaped exactly
// like the PUBLIC API response from `GET /games/public/:slug` (i.e. `isCorrect`
// is STRIPPED from options; correctness is inferred client-side from
// mediaJson.optionMeta tones / dial sequence / slider zone — see the contract).
//
// `useGame` falls back to this ONLY when the API is unreachable, so the engine
// is demoable without a running DB/server. The API is always the primary path.

export const PHONE_MANNERS_DEV = {
  id: 1,
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
  passThreshold: 3,
  configJson: {
    theme: { primary: "#7c5cff", accent: "#23c483", warn: "#ff7aa8", bg: "#fff7fb" },
    hero: { emoji: "🦸", nameAr: "عبّود", nameEn: "Aboud" },
    avatars: [
      { id: "explorer", emoji: "🧑‍🚀", labelAr: "مستكشف", labelEn: "Explorer" },
      { id: "hero", emoji: "🦸", labelAr: "عبود", labelEn: "Aboud" },
      { id: "cowboy", emoji: "🤠", labelAr: "راعي", labelEn: "Cowboy" },
      { id: "diver", emoji: "🤿", labelAr: "غواص", labelEn: "Diver" },
    ],
    stars: 6,
    certificate: {
      titleAr: "وسام الهاتف الذهبي الساحر",
      titleEn: "Golden Phone Medal",
      emoji: "👑",
    },
    reward: { giftNameAr: "استوديو الهاتف الذهبي", giftNameEn: "Golden Phone Studio", emoji: "🏆" },
    rewardStudio: {
      coverColors: ["#FFC107", "#22C55E", "#3B82F6", "#EC4899", "#8B5CF6"],
      stickers: ["⭐", "👑", "🚀", "🐱", "🍩", "🐼", "🐎", "🦄"],
    },
  },
  questions: [
    {
      id: 101,
      order: 0,
      kind: "DIALPAD",
      promptAr:
        "ساعد عبود في الاتصال بماما! اضغط على الأرقام بالترتيب: ٥ ثم ٥ ثم ٥ ثم ٥، ثم اضغط الزر الأخضر 📞",
      promptEn:
        "Help Aboud call Mama! Press the numbers in order: 5, 5, 5, 5 — then press the green button 📞",
      mediaJson: { sequence: "5555", thenChoose: true },
      options: [],
    },
    {
      id: 102,
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
      options: [
        {
          id: 1021, order: 0,
          labelAr: "«ألو ماما! أحضري لي اللعبة الآن وبسرعة!»",
          labelEn: "«Hello Mama! Bring me the toy right now, hurry!»",
          emoji: "⚠️",
          feedbackAr: "لا بأس يا بطل! نبدأ دائماً بالسلام ونسأل عن الحال بلطف. جرّب مرة أخرى 😊",
          feedbackEn: "That's okay, champ! We always start with Salam and ask kindly. Try again 😊",
        },
        {
          id: 1022, order: 1,
          labelAr: "«وعليكم السلام يا أمي الحبيبة، أنا عبود، كيف حالك اليوم؟»",
          labelEn: "«Wa Alaykum Assalam, dear Mama, it's Aboud — how are you today?»",
          emoji: "💚",
          feedbackAr: "رائع! هذا هو الرد الذهبي المهذب الذي يفرح قلب ماما! 💛",
          feedbackEn: "Wonderful! That is the golden polite reply that warms Mama's heart! 💛",
        },
        {
          id: 1023, order: 2,
          labelAr: "«ألووو! ألووو! اسمعيني ألووو!» (بصراخ)",
          labelEn: "«Helloooo! Helloooo! Hear me, helloooo!» (shouting)",
          emoji: "📢",
          feedbackAr: "لا بأس! نتكلم بهدوء ونبدأ بالسلام دائماً 😊",
          feedbackEn: "No worries! We speak calmly and always start with Salam 😊",
        },
      ],
    },
    {
      id: 103,
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
          lowAr: "همس خافت 🤫", midAr: "معتدل 😊", highAr: "صراخ 📢",
          lowEn: "Too quiet 🤫", midEn: "Just right 😊", highEn: "Too loud 📢",
        },
        goodAr: "رائع! هذا هو الصوت الذهبي المريح المناسب للمكالمات! ✨",
        goodEn: "Wonderful! That is the perfect golden voice for calls! ✨",
        badAr: "لا بأس! لا همس خافت ولا صراخ. اسحب الزر للمنتصف عند الوجه السعيد 😊",
        badEn: "That's okay! No whispering or shouting — drag to the middle at the happy face 😊",
      },
      options: [],
    },
    {
      id: 104,
      order: 3,
      kind: "MULTIPLE_CHOICE",
      promptAr: "حان وقت الصلاة في المسجد. ماذا نفعل بالهاتف؟",
      promptEn: "It is prayer time at the mosque. What do we do with the phone?",
      mediaJson: { layout: "list", optionMeta: [{ tone: "good" }, { tone: "warn" }, { tone: "bad" }] },
      options: [
        {
          id: 1041, order: 0,
          labelAr: "نجعله صامتاً ونضعه جانباً باحترام، فالصلاة أهم شيء.",
          labelEn: "Silence it and put it aside respectfully — prayer is most important.",
          emoji: "🤫",
          feedbackAr: "أحسنت! نسكت الهاتف ونضعه جانباً باحترام وقت الصلاة. هذا أدب جميل! 🕌✨",
          feedbackEn: "Well done! We silence the phone during prayer — that is beautiful manners! 🕌✨",
        },
        {
          id: 1042, order: 1,
          labelAr: "نتركه يرن بصوت عالٍ لنسمع من يتصل بنا.",
          labelEn: "Leave it ringing loudly to hear who is calling.",
          emoji: "🔊",
          feedbackAr: "لا بأس يا بطل! وقت الصلاة نجعل الهاتف صامتاً ونضعه جانباً. جرّب مرة أخرى 😊",
          feedbackEn: "No worries, champ! During prayer we silence the phone. Try again 😊",
        },
        {
          id: 1043, order: 2,
          labelAr: "نلعب به ونتكلم بصوت مرتفع داخل المسجد.",
          labelEn: "Play with it and talk loudly inside the mosque.",
          emoji: "🎮",
          feedbackAr: "لا بأس! المسجد مكان للصلاة والهدوء. نضع الهاتف صامتاً دائماً 😊",
          feedbackEn: "That's okay! The mosque is a place for prayer and quiet. Always silence the phone 😊",
        },
      ],
    },
    {
      id: 105,
      order: 4,
      kind: "SCENARIO",
      promptAr: "شخص يتصل بالخطأ ويظنك صديقه سامر. اختر الرد المهذب للمتصل المخطئ:",
      promptEn: "Someone calls by mistake thinking you are their friend Samer. Choose the polite reply:",
      mediaJson: {
        sceneEmoji: "📞",
        captionAr: "«أهلاً يا سامر! هل تلعب معي اليوم؟»",
        captionEn: "«Hello Samer! Can you play with me today?»",
        optionMeta: [{ tone: "good" }, { tone: "warn" }, { tone: "bad" }],
      },
      options: [
        {
          id: 1051, order: 0,
          labelAr: "«عذراً يا صديقي، أظن أنك أخطأت في الرقم، أنا عبود ولست سامر. مع السلامة!»",
          labelEn: "«Sorry friend, I think you have the wrong number — I am Aboud, not Samer. Take care!»",
          emoji: "💖",
          feedbackAr: "يا لك من بطل لطيف! توضيح الخطأ بأدب وقول مع السلامة من شيم الأبطال! 🏆✨",
          feedbackEn: "What a kind champion! Politely explaining the mistake is a hero's quality! 🏆✨",
        },
        {
          id: 1052, order: 1,
          labelAr: "نغلق الخط مباشرة دون أن نوضح له شيئاً.",
          labelEn: "Hang up right away without explaining anything.",
          emoji: "🙂",
          feedbackAr: "لا بأس! نوضّح الخطأ بلطف ونقول مع السلامة. جرّب مرة أخرى يا بطل 😊",
          feedbackEn: "No worries! We explain the mistake gently and say goodbye. Try again, champion 😊",
        },
        {
          id: 1053, order: 2,
          labelAr: "نصرخ فيه: «أنت مزعج، لا تتصل بنا مجدداً!»",
          labelEn: "Shout at them: «You're annoying, don't call again!»",
          emoji: "😠",
          feedbackAr: "لا بأس! نتحدث دائماً بلطف وهدوء، حتى مع الخطأ. جرّب مرة أخرى 😊",
          feedbackEn: "That's okay! We always speak gently and calmly, even for mistakes. Try again 😊",
        },
      ],
    },
    {
      id: 106,
      order: 5,
      kind: "MULTIPLE_CHOICE",
      promptAr: "انتهت المكالمة الجميلة. كيف نودّع بأدب؟",
      promptEn: "The lovely call has ended. How do we say goodbye politely?",
      mediaJson: { layout: "list", optionMeta: [{ tone: "good" }, { tone: "warn" }, { tone: "bad" }] },
      options: [
        {
          id: 1061, order: 0,
          labelAr: "«مع السلامة، في أمان الله!» ثم نغلق الهاتف بلطف.",
          labelEn: "«Ma'a Assalama, may Allah keep you safe!» then gently end the call.",
          emoji: "💚",
          feedbackAr: "أحسنت! نختم بكلمات لطيفة: «مع السلامة، في أمان الله!» 👋💛",
          feedbackEn: "Well done! We end with kind words: «Take care, in Allah's protection!» 👋💛",
        },
        {
          id: 1062, order: 1,
          labelAr: "نغلق الهاتف فجأة دون أن نقول أي كلمة.",
          labelEn: "Hang up suddenly without saying anything.",
          emoji: "🤐",
          feedbackAr: "لا بأس! نودّع بلطف ونقول «مع السلامة، في أمان الله». جرّب مرة أخرى 😊",
          feedbackEn: "No worries! We say a gentle goodbye. Try again 😊",
        },
        {
          id: 1063, order: 2,
          labelAr: "نصرخ «خلاص! وداعاً!» ونرمي الهاتف.",
          labelEn: "Shout «That's it! Goodbye!» and throw the phone.",
          emoji: "📢",
          feedbackAr: "لا بأس! نودع بهدوء وكلمات جميلة. جرّب مرة أخرى يا بطل 😊",
          feedbackEn: "That's okay! We say a calm and kind goodbye. Try again, champion 😊",
        },
      ],
    },
  ],
};

// Minimal list mirror for the games list page when the API is unreachable.
export const DEV_GAMES_LIST = [
  {
    id: PHONE_MANNERS_DEV.id,
    slug: PHONE_MANNERS_DEV.slug,
    titleAr: PHONE_MANNERS_DEV.titleAr,
    titleEn: PHONE_MANNERS_DEV.titleEn,
    descriptionAr: PHONE_MANNERS_DEV.descriptionAr,
    descriptionEn: PHONE_MANNERS_DEV.descriptionEn,
    isPublic: true,
    isActive: true,
    configJson: PHONE_MANNERS_DEV.configJson,
  },
];

export const DEV_GAMES_BY_SLUG = {
  [PHONE_MANNERS_DEV.slug]: PHONE_MANNERS_DEV,
};
