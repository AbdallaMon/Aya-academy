// The playful reaction palette. Each fires a floating-emoji burst + a sound, and
// optionally a canvas-confetti effect and/or a big praise banner. When a student
// name is chosen, EVERY reaction shows a banner ("<praise> يا <name>"), falling
// back to `defaultPraise` for reactions that carry no praise of their own.
export const REACTIONS = [
  { key: "balloons", emoji: "🎈", labelAr: "بالونات", sound: "pop", confetti: "up", color: "#ff6b9d" },
  { key: "star", emoji: "⭐", labelAr: "شاطر", sound: "cheer", praiseAr: "شاطر", confetti: "burst", color: "#ffc93c" },
  { key: "clap", emoji: "👏", labelAr: "تصفيق", sound: "clap", praiseAr: "أحسنت", confetti: null, color: "#ffd56b" },
  { key: "heart", emoji: "❤️", labelAr: "قلوب", sound: "sparkle", confetti: "hearts", color: "#ff5c8a" },
  { key: "firework", emoji: "🎆", labelAr: "ألعاب نارية", sound: "firework", confetti: "fireworks", color: "#845ef7" },
  { key: "mashallah", emoji: "🌟", labelAr: "ما شاء الله", sound: "cheer", praiseAr: "ما شاء الله", confetti: "burst", color: "#4dd4ac" },
  { key: "trophy", emoji: "🏆", labelAr: "بطل", sound: "cheer", praiseAr: "بطل", confetti: "burst", color: "#ffb020" },
  { key: "thumbs", emoji: "👍", labelAr: "برافو", sound: "pop", praiseAr: "برافو", confetti: null, color: "#38b6ff" },
  { key: "rainbow", emoji: "🌈", labelAr: "قوس قزح", sound: "sparkle", confetti: "up", color: "#7c5cff" },
  { key: "flowers", emoji: "🌸", labelAr: "ورود", sound: "sparkle", confetti: "up", color: "#ff8fab" },
  { key: "party", emoji: "🎉", labelAr: "احتفال", sound: "cheer", praiseAr: "يا سلام", confetti: "burst", color: "#ff922b" },
  { key: "laugh", emoji: "😄", labelAr: "ابتسامة", sound: "pop", confetti: "up", color: "#ffd43b" },
];

// Used for the name banner when a reaction has no praise text of its own.
export const DEFAULT_PRAISE_AR = "أحسنت";

// Number of floating emoji particles per burst.
export const BURST_COUNT = 16;
