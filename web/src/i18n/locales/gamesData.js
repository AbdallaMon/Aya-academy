// gamesData — i18n strings for the kids' game engine (list + player chrome).
// Game CONTENT (prompts, options, feedback, certificate titles) is authored in
// the seed/configJson in both AR/EN and chosen by language at render time; this
// section only covers the engine's own UI chrome. Keys exist in BOTH locales.
//
// Tone: warm, playful, "dalaa" kid language — lots of encouragement, never a
// scolding. Arabic leans gently colloquial so it feels like a friend cheering
// the child on. Every "wrong" string nudges the child toward the fix.

export const gamesData = {
  ar: {
    // list page
    pageTitle: "ألعاب أكاديمية آية",
    pageSubtitle: "العب واتعلّم أحلى الآداب، واجمع النجوم والأوسمة! 🌟",
    playNow: "يلا نلعب! 🚀",
    freeBadge: "مجانية",
    locked: "مقفول 🔒",
    noGames: "مفيش ألعاب دلوقتي.. استنونا قريب! 🎮",
    noAssignedGames: "مفيش ألعاب مسندة لك لسه.. كلّم معلمتك تبعتلك ألعاب حلوة! 🎮💛",
    loading: "بنجهّز الألعاب الحلوة...",
    backToGames: "كل الألعاب ←",
    backHome: "نرجع للرئيسية ←",
    myGamesTitle: "ألعابي",
    myGamesSubtitle: "العب، اتعلّم أحلى الآداب، واجمع النجوم والأوسمة! 🌟",

    // shell / header
    score: "النتيجة",
    soundOn: "🔊",
    soundOff: "🔇",
    star: "نجمة",

    // avatar select
    chooseAvatar: "اختار شكلك وابدأ المغامرة يا بطل!",
    startAdventure: "يلا نبدأ المغامرة! 🚀",
    collectStars: "اجمع كل النجوم وافتح مفاجأة حلوة! 🏆",

    // generic guide / feedback
    tryAgain: "معلش يا بطل! جرّب تاني، انت تقدر 💪😊",
    greatJob: "برافووو عليك! 🌟",
    correctGeneric: "يا سلام! إجابة صح يا نجم 👏💛",
    hintReveal: "خليني أساعدك يا حبيبي 💛 الإجابة الصح بتلمع ✨",
    almostThere: "قربت أوي! كمان شوية 🔥",
    nextTask: "للمهمة اللي بعدها ←",
    finishTask: "خلّص المغامرة! 🏆 ←",

    // dialpad
    dialClear: "✖ امسح",
    dialReady: "الرقم كمل! دوس الزرار الأخضر 📞 وكلّم 😊",
    dialHint: "دوس الأرقام بالترتيب، وبعدين الزرار الأخضر 📞",
    dialWrong: "معلش! اكتب الأرقام بالترتيب وبعدين دوس الأخضر 📞",
    dialWrongDigit: "أوبس! مش ده الرقم 🙈 امسحه ودوس الرقم اللي بينوّر 👆",
    dialHintNudge: "الرقم اللي بينوّر ده هو الصح.. دوس عليه 😉",
    dialShowMe: "💡 وريني",
    dialTyped: "اللي كتبته",
    dialEmptyDel: "مفيش حاجة تتمسح.. ابدأ اكتب الأرقام 😊",
    calling: "بنكلّم... 📞 تووت توووت",
    dialCalled: "اتصلنا! 🎉",

    // tone slider
    toneLow: "الصوت واطي خالص (الطرف التاني مش سامعك!) 🤫",
    toneMid: "صوت معتدل ومهذّب وجميل (الكل سامعك براحة!) 😊",
    toneHigh: "الصوت عالي ومزعج (بيوجع ودان الناس!) 📢",
    toneConfirmGood: "ده صوتي الذهبي المظبوط! ✨",
    toneConfirmTry: "جرّب الصوت ده 🔎",
    toneWrong: "معلش! لا واطي ولا عالي.. حرّك الزرار للنُص عند الوش المبسوط 😊",
    toneSliderHint: "حرّك الزرار يمين وشمال واسمع صوتك بيتغيّر 🎚️",

    // tap catch
    catchHint: "المس الأعمال الطيبة الطايرة عشان تجمعها! 💛 وخلّي بالك من الوحشة.",
    catchBadTap: "أوه! ده مش عمل طيّب 🙈 دوّر على الحاجات الحلوة 💛",
    catchProgress: "جمعت",
    catchGoal: "الهدف",
    catchDone: "ملّيت سلّتك حسنات! يلا انطلق! 🚀",
    catchMiss: "طارت منك! بسرعة الجاية امسكها 🤩",

    // matching (MATCHING)
    matchProgress: "وصّلت",
    matchHint: "وصّل المتشابهين 💞",
    matchTapHint: "المس كارت من اليمين وبعدين شريكه من الشمال 😊",
    matchDone: "وصّلت كل الكروت! ما شاء الله عليك 🌟",
    matchWrong: "معلش! الاتنين دول مش زي بعض.. جرّب تاني 😊",
    matchPicked: "حلو! دلوقتي دوّر على شريكه 👀",

    // compass (COMPASS)
    compassLabel: "لِف الإبرة ناحية الكعبة 🕋",
    compassOnTarget: "انت متجه للقبلة بالظبط! ✨",
    compassNear: "قربت أوي... حرّك الإبرة شوية كمان 🔎",
    compassFar: "لِف الإبرة ودوّر على الكعبة 🕋",
    compassGood: "برافو! لقيت اتجاه القبلة الصح! 🕋💚",
    compassBad: "معلش! حرّك الإبرة لحد ما توصل للكعبة 🕋",
    compassConfirmGood: "دي القبلة! ✨",
    compassConfirmTry: "جرّب الاتجاه ده 🔎",
    compassHint: "حرّك الزرار بالراحة وانت بتدوّر على الكعبة 🧭",

    // calendar drop (CALENDAR_DROP)
    calendarProgress: "حطّيت",
    calendarTrayHint: "المس عمل طيّب عشان ترفعه ✨",
    calendarHeldHint: "دلوقتي المس اليوم المناسب وحطّ عملك الطيّب 🌙",
    calendarAllPlaced: "حطّيت كل الأعمال الطيبة! 🌙",
    calendarDone: "ملّيت أيام رمضان بالأعمال الحلوة! 🌙✨",
    calendarWrong: "معلش! العمل ده مكانه يوم تاني.. جرّب تاني 😊",

    // coloring (COLORING)
    coloringProgress: "لوّنت",
    coloringHint: "اختار لون وبعدين المس جزء من المسجد عشان تلوّنه 🎨",
    coloringDone: "زيّنت مسجدك بألوان تحفة! ما شاء الله 🕌🎨",

    // board dice (BOARD_DICE)
    boardRoll: "ارمي النرد! 🎲",
    boardReached: "وصلت! 🏆",
    boardHint: "المس النرد عشان تتحرّك. الأعمال الطيبة بترفعك لفوق! 🪜",
    boardWin: "وصلت للقمة بأخلاقك الحلوة! 🏆✨",
    boardLadder: "يا سلام! خلق حلو طلّعك فوق 🪜⬆️",
    boardSlide: "معلش! نزلنا شوية.. المرة الجاية أحلى 🛝",

    // reward studio
    studioTitle: "🏆 استوديو المكافأة",
    studioSubtitle: "صمّم مكافأتك: اختار اللون وزوّد الاستيكرز!",
    studioPickColor: "١. اختار اللون:",
    studioPickStickers: "٢. زوّد استيكرزك (لحد ٥):",
    studioClear: "🗑 شيل الاستيكرز",
    studioMax: "وصلت لـ ٥ استيكرز! امسح واحد عشان تزوّد غيره 😊",
    studioToCert: "هات الشهادة 🏆",
    studioAdded: "زوّدت استيكر حلو! تقدر تزوّد لحد ٥! ✨",

    // certificate
    certAcademy: "أكاديمية آية لتعليم القرآن",
    certDefaultTitle: "وسام البطل الذهبي",
    certBody: "تشهد أكاديمية آية إن بطلنا المبدع اتعلّم وأتقن كل الآداب الجميلة!",
    certWho: "البطل المتوّج:",
    certDefaultName: "بطلنا الصغير",
    certNamePlaceholder: "اكتب اسمك هنا",
    certCongrats: "مبروووك! 🎉",
    badgeEarnedPrefix: "ولقد حصلت على وسام",
    certPrint: "اطبع 🖨️",
    certDownloadPdf: "نزّل PDF 📄",
    certDownloadImage: "نزّل صورة 🖼️",
    certThanks: "شكراً! 🎉",
    replay: "نلعب تاني 🔄",

    // misc states
    notFound: "ملقيناش اللعبة دي 😅",
    errorLoading: "حصل خطأ بسيط، جرّب تاني 💛",
  },
  en: {
    pageTitle: "Ayah Academy Games",
    pageSubtitle: "Play and learn beautiful manners — collect stars and medals! 🌟",
    playNow: "Let's play! 🚀",
    freeBadge: "Free",
    locked: "Locked 🔒",
    noGames: "No games available right now. Stay tuned! 🎮",
    noAssignedGames: "No games assigned to you yet.. ask your teacher to send you some fun ones! 🎮💛",
    loading: "Getting the games ready...",
    backToGames: "← All games",
    backHome: "← Back home",
    myGamesTitle: "My games",
    myGamesSubtitle: "Play, learn beautiful manners, and collect stars and medals! 🌟",

    score: "Score",
    soundOn: "🔊",
    soundOff: "🔇",
    star: "star",

    chooseAvatar: "Pick your look and start the adventure, champ!",
    startAdventure: "Start the adventure! 🚀",
    collectStars: "Collect all the stars and unlock a lovely surprise! 🏆",

    tryAgain: "That's okay, champ! Try again — you've got this 💪😊",
    greatJob: "Awesome job! 🌟",
    correctGeneric: "Yay! Correct, superstar! 👏💛",
    hintReveal: "Let me help you, sweetie 💛 the right answer is glowing ✨",
    almostThere: "So close! A tiny bit more 🔥",
    nextTask: "Next task →",
    finishTask: "Finish the adventure! 🏆 →",

    dialClear: "✖ Clear",
    dialReady: "Number complete! Tap the green button 📞 to call 😊",
    dialHint: "Tap the numbers in order, then the green button 📞",
    dialWrong: "No worries! Type the numbers in order, then tap the green 📞",
    dialWrongDigit: "Oops! Not that one 🙈 erase it and tap the glowing key 👆",
    dialHintNudge: "The glowing key is the right one.. tap it 😉",
    dialShowMe: "💡 Show me",
    dialTyped: "You typed",
    dialEmptyDel: "Nothing to erase yet.. start tapping the numbers 😊",
    calling: "Calling... 📞 ring ring",
    dialCalled: "Connected! 🎉",

    toneLow: "Too quiet (the other side can't hear you!) 🤫",
    toneMid: "A moderate, polite, lovely voice (everyone hears you comfortably!) 😊",
    toneHigh: "Too loud and noisy (it hurts other people's ears!) 📢",
    toneConfirmGood: "This is my golden, just-right voice! ✨",
    toneConfirmTry: "Try this voice 🔎",
    toneWrong: "No worries! Not too soft, not too loud — slide to the middle at the happy face 😊",
    toneSliderHint: "Slide left and right and hear your voice change 🎚️",

    catchHint: "Tap the flying good deeds to collect them! 💛 Avoid the not-so-good ones.",
    catchBadTap: "Oops! That's not a good deed 🙈 look for the lovely ones 💛",
    catchProgress: "Collected",
    catchGoal: "Goal",
    catchDone: "You filled your basket with good deeds! Blast off! 🚀",
    catchMiss: "It flew away! Catch it next time 🤩",

    matchProgress: "Matched",
    matchHint: "Match the pairs 💞",
    matchTapHint: "Tap a card on the right, then its partner on the left 😊",
    matchDone: "You matched all the cards! MashaAllah 🌟",
    matchWrong: "No worries! Those two don't match — try again 😊",
    matchPicked: "Nice! Now find its partner 👀",

    compassLabel: "Turn the needle toward the Kaaba 🕋",
    compassOnTarget: "You're pointing right at the Qibla! ✨",
    compassNear: "So close... nudge the needle a little 🔎",
    compassFar: "Turn the needle to find the Kaaba 🕋",
    compassGood: "Well done! You found the right Qibla direction! 🕋💚",
    compassBad: "No worries! Move the needle until it reaches the Kaaba 🕋",
    compassConfirmGood: "This is the Qibla! ✨",
    compassConfirmTry: "Try this direction 🔎",
    compassHint: "Move the slider slowly as you search for the Kaaba 🧭",

    calendarProgress: "Placed",
    calendarTrayHint: "Tap a good deed to pick it up ✨",
    calendarHeldHint: "Now tap the right day to place your good deed 🌙",
    calendarAllPlaced: "You placed all the good deeds! 🌙",
    calendarDone: "You filled the Ramadan days with good deeds! 🌙✨",
    calendarWrong: "No worries! That deed fits another day — try again 😊",

    coloringProgress: "Colored",
    coloringHint: "Pick a color, then tap a part of the mosque to color it 🎨",
    coloringDone: "You decorated your mosque with lovely colors! MashaAllah 🕌🎨",

    boardRoll: "Roll the die! 🎲",
    boardReached: "You made it! 🏆",
    boardHint: "Tap the die to move. Good manners lift you higher! 🪜",
    boardWin: "You reached the top with your beautiful manners! 🏆✨",
    boardLadder: "Yay! A kind deed lifted you up 🪜⬆️",
    boardSlide: "No worries! We slid down a little — next time's better 🛝",

    studioTitle: "🏆 Reward Studio",
    studioSubtitle: "Design your reward: pick a color and add stickers!",
    studioPickColor: "1. Pick a color:",
    studioPickStickers: "2. Add your stickers (up to 5):",
    studioClear: "🗑 Remove stickers",
    studioMax: "You reached 5 stickers! Remove one to add another 😊",
    studioToCert: "Get the certificate 🏆",
    studioAdded: "You added a lovely sticker! You can add up to 5! ✨",

    certAcademy: "Ayah Academy for Quran",
    certDefaultTitle: "Golden Champion Medal",
    certBody: "Ayah Academy certifies that our creative champion has learned and mastered all the beautiful manners!",
    certWho: "The crowned champion:",
    certDefaultName: "Our little champion",
    certNamePlaceholder: "Type your name here",
    certCongrats: "Congratulations! 🎉",
    badgeEarnedPrefix: "And you earned the badge",
    certPrint: "Print 🖨️",
    certDownloadPdf: "Download PDF 📄",
    certDownloadImage: "Download image 🖼️",
    certThanks: "Thank you! 🎉",
    replay: "Play again 🔄",

    notFound: "We couldn't find this game 😅",
    errorLoading: "A little error happened, please try again 💛",
  },
};
