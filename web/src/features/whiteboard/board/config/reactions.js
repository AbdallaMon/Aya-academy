// The playful reaction palette. Each fires a floating-emoji burst + a sound, and
// optionally a canvas-confetti effect and/or a big praise banner. When a student
// name is chosen, EVERY reaction shows a banner ("<praise> يا <name>"), falling
// back to `defaultPraise` for reactions that carry no praise of their own.
export const REACTIONS = [
  { key: "balloons", emoji: "🎈", labelAr: "بالونات", labelEn: "Balloons", sound: "pop", confetti: "up", color: "#ff6b9d" },
  { key: "star", emoji: "⭐", labelAr: "شاطر", labelEn: "Star", sound: "cheer", praiseAr: "شاطر", praiseEn: "Great job", confetti: "burst", color: "#ffc93c" },
  { key: "clap", emoji: "👏", labelAr: "تصفيق", labelEn: "Applause", sound: "clap", praiseAr: "أحسنت", praiseEn: "Well done", confetti: null, color: "#ffd56b" },
  { key: "heart", emoji: "❤️", labelAr: "قلوب", labelEn: "Hearts", sound: "sparkle", confetti: "hearts", color: "#ff5c8a" },
  { key: "firework", emoji: "🎆", labelAr: "ألعاب نارية", labelEn: "Fireworks", sound: "firework", confetti: "fireworks", color: "#845ef7" },
  { key: "mashallah", emoji: "🌟", labelAr: "ما شاء الله", labelEn: "MashaAllah", sound: "cheer", praiseAr: "ما شاء الله", praiseEn: "MashaAllah", confetti: "burst", color: "#4dd4ac" },
  { key: "trophy", emoji: "🏆", labelAr: "بطل", labelEn: "Champion", sound: "cheer", praiseAr: "بطل", praiseEn: "Champion", confetti: "burst", color: "#ffb020" },
  { key: "thumbs", emoji: "👍", labelAr: "برافو", labelEn: "Bravo", sound: "pop", praiseAr: "برافو", praiseEn: "Bravo", confetti: null, color: "#38b6ff" },
  { key: "rainbow", emoji: "🌈", labelAr: "قوس قزح", labelEn: "Rainbow", sound: "sparkle", confetti: "up", color: "#7c5cff" },
  { key: "flowers", emoji: "🌸", labelAr: "ورود", labelEn: "Flowers", sound: "sparkle", confetti: "up", color: "#ff8fab" },
  { key: "party", emoji: "🎉", labelAr: "احتفال", labelEn: "Celebration", sound: "cheer", praiseAr: "يا سلام", praiseEn: "Amazing", confetti: "burst", color: "#ff922b" },
  { key: "laugh", emoji: "😄", labelAr: "ابتسامة", labelEn: "Smile", sound: "pop", confetti: "up", color: "#ffd43b" },
];

// Used for the name banner when a reaction has no praise text of its own.
export const DEFAULT_PRAISE_AR = "أحسنت";
export const DEFAULT_PRAISE_EN = "Well done";

// Number of floating emoji particles per burst.
export const BURST_COUNT = 16;
