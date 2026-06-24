// gamesData — i18n strings for the kids' game engine (list + player chrome).
// Game CONTENT (prompts, options, feedback, certificate titles) is authored in
// the seed/configJson in both AR/EN and chosen by language at render time; this
// section only covers the engine's own UI chrome. Keys exist in BOTH locales.

export const gamesData = {
  ar: {
    // list page
    pageTitle: "ألعاب أكاديمية آية",
    pageSubtitle: "العب وتعلّم الآداب الجميلة، واجمع النجوم والأوسمة! 🌟",
    playNow: "هيا نلعب! 🚀",
    freeBadge: "مجانية",
    noGames: "لا توجد ألعاب متاحة الآن. تابعنا قريباً! 🎮",
    loading: "جارٍ تحضير الألعاب...",
    backToGames: "كل الألعاب ←",
    backHome: "العودة للرئيسية ←",
    myGamesTitle: "ألعابي",
    myGamesSubtitle: "العب، تعلّم الآداب الجميلة، واجمع النجوم والأوسمة! 🌟",

    // shell / header
    score: "النتيجة",
    soundOn: "🔊",
    soundOff: "🔇",
    star: "نجمة",

    // avatar select
    chooseAvatar: "اختر شكلك لتبدأ المغامرة!",
    startAdventure: "هيا نبدأ المغامرة! 🚀",
    collectStars: "اجمع كل النجوم وافتح مفاجأة جميلة! 🏆",

    // generic guide / feedback
    tryAgain: "لا بأس يا بطل! جرّب مرة أخرى 😊",
    greatJob: "أحسنت! 🌟",
    correctGeneric: "رائع! إجابة صحيحة! 💛",
    nextTask: "للمهمة التالية ←",
    finishTask: "أنهِ المغامرة! 🏆 ←",

    // dialpad
    dialClear: "✖ مسح",
    dialReady: "اكتمل الرقم! اضغط الزر الأخضر 📞 للاتصال 😊",
    dialHint: "اضغط على الأرقام بالترتيب، ثم اضغط الزر الأخضر 📞",
    dialWrong: "لا بأس! اكتب الرقم بالترتيب ثم اضغط الزر الأخضر 📞",
    calling: "يتم الاتصال... 📞",

    // tone slider
    toneLow: "صوت خافت جداً (الطرف الآخر لا يسمعك!)",
    toneMid: "صوت معتدل ومهذب وجميل (الكل يسمعك براحة!)",
    toneHigh: "صوت عالٍ ومزعج (يؤذي آذان الآخرين!)",
    toneConfirmGood: "هذا صوتي الذهبي المعتدل! ✨",
    toneConfirmTry: "جرّب هذا الصوت 🔎",
    toneWrong: "لا بأس! اسحب الزر للمنتصف عند الوجه السعيد 😊",

    // tap catch
    catchHint: "المس الأعمال الطيبة الطائرة لتجمعها! 💛 تجنّب الأعمال السيئة.",
    catchBadTap: "هذا ليس عملاً طيباً! ابحث عن الأعمال الطيبة 💛",
    catchProgress: "جمعت",
    catchGoal: "الهدف",
    catchDone: "ملأت سلّتك بالحسنات! انطلق! 🚀",

    // matching (MATCHING)
    matchProgress: "طابقت",
    matchHint: "اختر المتشابهين 💞",
    matchTapHint: "المس بطاقة من اليمين ثم شريكتها من اليسار 😊",
    matchDone: "طابقت كل البطاقات! ما شاء الله 🌟",
    matchWrong: "لا بأس! هاتان البطاقتان غير متطابقتين. جرّب مرة أخرى 😊",

    // compass (COMPASS)
    compassLabel: "أَدِر الإبرة نحو الكعبة 🕋",
    compassOnTarget: "أنت متجه نحو القبلة تماماً! ✨",
    compassNear: "اقتربت كثيراً... حرّك الإبرة قليلاً 🔎",
    compassFar: "أَدِر الإبرة لتبحث عن الكعبة 🕋",
    compassGood: "أحسنت! وجدت اتجاه القبلة الصحيح! 🕋💚",
    compassBad: "لا بأس! حرّك الإبرة حتى تصل إلى الكعبة 🕋",
    compassConfirmGood: "هذه هي القبلة! ✨",
    compassConfirmTry: "جرّب هذا الاتجاه 🔎",

    // calendar drop (CALENDAR_DROP)
    calendarProgress: "وضعت",
    calendarTrayHint: "المس عملاً طيباً لترفعه ✨",
    calendarHeldHint: "الآن المس اليوم المناسب لتضع عملك الطيب 🌙",
    calendarAllPlaced: "وضعت كل الأعمال الطيبة! 🌙",
    calendarDone: "ملأت أيام رمضان بالأعمال الطيبة! 🌙✨",
    calendarWrong: "لا بأس! هذا العمل يناسب يوماً آخر. جرّب مرة أخرى 😊",

    // coloring (COLORING)
    coloringProgress: "لوّنت",
    coloringHint: "اختر لوناً ثم المس جزءاً من المسجد لتلوّنه 🎨",
    coloringDone: "زيّنت مسجدك بألوان جميلة! ما شاء الله 🕌🎨",

    // board dice (BOARD_DICE)
    boardRoll: "ارمِ النرد! 🎲",
    boardReached: "وصلت! 🏆",
    boardHint: "المس النرد لتتحرك. الأعمال الطيبة ترفعك للأعلى! 🪜",
    boardWin: "وصلت إلى القمة بأخلاقك الجميلة! 🏆✨",

    // reward studio
    studioTitle: "🏆 استوديو المكافأة",
    studioSubtitle: "صمّم مكافأتك: اختر اللون وأضف الملصقات!",
    studioPickColor: "١. اختر اللون:",
    studioPickStickers: "٢. أضف ملصقاتك (حتى ٥):",
    studioClear: "🗑 إزالة الملصقات",
    studioMax: "وصلت إلى ٥ ملصقات! امسح ملصقاً لتضيف غيره 😊",
    studioToCert: "احصل على الشهادة 🏆",
    studioAdded: "أضفت ملصقاً جميلاً! يمكنك إضافة حتى ٥ ملصقات!",

    // certificate
    certAcademy: "أكاديمية آية لتعليم القرآن",
    certDefaultTitle: "وسام البطل الذهبي",
    certBody: "تشهد أكاديمية آية بأن بطلنا المبدع قد تعلّم وأتقن كل الآداب الجميلة!",
    certWho: "البطل المتوّج:",
    certDefaultName: "بطلنا الصغير",
    certNamePlaceholder: "اكتب اسمك هنا",
    certPrint: "اطبع شهادتك 🖨️",
    certThanks: "شكراً! 🎉",
    replay: "إعادة اللعب 🔄",

    // misc states
    notFound: "لم نجد هذه اللعبة 😅",
    errorLoading: "حدث خطأ بسيط، حاول مرة أخرى 💛",
  },
  en: {
    pageTitle: "Aya Academy Games",
    pageSubtitle: "Play and learn beautiful manners — collect stars and medals! 🌟",
    playNow: "Let's play! 🚀",
    freeBadge: "Free",
    noGames: "No games available right now. Stay tuned! 🎮",
    loading: "Getting the games ready...",
    backToGames: "← All games",
    backHome: "← Back home",
    myGamesTitle: "My games",
    myGamesSubtitle: "Play, learn beautiful manners, and collect stars and medals! 🌟",

    score: "Score",
    soundOn: "🔊",
    soundOff: "🔇",
    star: "star",

    chooseAvatar: "Pick your look to start the adventure!",
    startAdventure: "Start the adventure! 🚀",
    collectStars: "Collect all the stars and unlock a lovely surprise! 🏆",

    tryAgain: "That's okay, champ! Try again 😊",
    greatJob: "Well done! 🌟",
    correctGeneric: "Wonderful! Correct answer! 💛",
    nextTask: "Next task →",
    finishTask: "Finish the adventure! 🏆 →",

    dialClear: "✖ Clear",
    dialReady: "Number complete! Press the green button 📞 to call 😊",
    dialHint: "Press the numbers in order, then press the green button 📞",
    dialWrong: "No worries! Type the number in order, then press the green button 📞",
    calling: "Calling... 📞",

    toneLow: "Too quiet (the other side can't hear you!)",
    toneMid: "A moderate, polite, lovely voice (everyone hears you comfortably!)",
    toneHigh: "Too loud and noisy (it hurts other people's ears!)",
    toneConfirmGood: "This is my golden, just-right voice! ✨",
    toneConfirmTry: "Try this voice 🔎",
    toneWrong: "No worries! Drag to the middle at the happy face 😊",

    catchHint: "Tap the flying good deeds to collect them! 💛 Avoid the bad deeds.",
    catchBadTap: "That is not a good deed! Look for the good deeds 💛",
    catchProgress: "Collected",
    catchGoal: "Goal",
    catchDone: "You filled your basket with good deeds! Blast off! 🚀",

    // matching (MATCHING)
    matchProgress: "Matched",
    matchHint: "Find the pairs 💞",
    matchTapHint: "Tap a card on the right, then its partner on the left 😊",
    matchDone: "You matched all the cards! MashaAllah 🌟",
    matchWrong: "No worries! Those two don't match. Try again 😊",

    // compass (COMPASS)
    compassLabel: "Turn the needle toward the Kaaba 🕋",
    compassOnTarget: "You're pointing right at the Qibla! ✨",
    compassNear: "So close... nudge the needle a little 🔎",
    compassFar: "Turn the needle to find the Kaaba 🕋",
    compassGood: "Well done! You found the right Qibla direction! 🕋💚",
    compassBad: "No worries! Move the needle until it reaches the Kaaba 🕋",
    compassConfirmGood: "This is the Qibla! ✨",
    compassConfirmTry: "Try this direction 🔎",

    // calendar drop (CALENDAR_DROP)
    calendarProgress: "Placed",
    calendarTrayHint: "Tap a good deed to pick it up ✨",
    calendarHeldHint: "Now tap the right day to place your good deed 🌙",
    calendarAllPlaced: "You placed all the good deeds! 🌙",
    calendarDone: "You filled the Ramadan days with good deeds! 🌙✨",
    calendarWrong: "No worries! That deed fits another day. Try again 😊",

    // coloring (COLORING)
    coloringProgress: "Colored",
    coloringHint: "Pick a color, then tap a part of the mosque to color it 🎨",
    coloringDone: "You decorated your mosque with lovely colors! MashaAllah 🕌🎨",

    // board dice (BOARD_DICE)
    boardRoll: "Roll the die! 🎲",
    boardReached: "You made it! 🏆",
    boardHint: "Tap the die to move. Good manners lift you higher! 🪜",
    boardWin: "You reached the top with your beautiful manners! 🏆✨",

    studioTitle: "🏆 Reward Studio",
    studioSubtitle: "Design your reward: pick a color and add stickers!",
    studioPickColor: "1. Pick a color:",
    studioPickStickers: "2. Add your stickers (up to 5):",
    studioClear: "🗑 Remove stickers",
    studioMax: "You reached 5 stickers! Remove one to add another 😊",
    studioToCert: "Get the certificate 🏆",
    studioAdded: "You added a lovely sticker! You can add up to 5!",

    certAcademy: "Aya Academy for Quran",
    certDefaultTitle: "Golden Champion Medal",
    certBody: "Aya Academy certifies that our creative champion has learned and mastered all the beautiful manners!",
    certWho: "The crowned champion:",
    certDefaultName: "Our little champion",
    certNamePlaceholder: "Type your name here",
    certPrint: "Print your certificate 🖨️",
    certThanks: "Thank you! 🎉",
    replay: "Play again 🔄",

    notFound: "We couldn't find this game 😅",
    errorLoading: "A little error happened, please try again 💛",
  },
};
