// The playful reaction palette. Each fires a burst animation + a sound; some
// carry an optional praise phrase that can be personalised with a student name.
export const REACTIONS = [
  { key: "balloons", emoji: "🎈", labelAr: "بالونات", labelEn: "Balloons", sound: "pop", praiseAr: null },
  { key: "star", emoji: "⭐", labelAr: "شاطر", labelEn: "Great", sound: "cheer", praiseAr: "شاطر" },
  { key: "clap", emoji: "👏", labelAr: "تصفيق", labelEn: "Clap", sound: "clap", praiseAr: null },
  { key: "heart", emoji: "❤️", labelAr: "قلوب", labelEn: "Hearts", sound: "sparkle", praiseAr: null },
  { key: "firework", emoji: "🎆", labelAr: "ألعاب نارية", labelEn: "Fireworks", sound: "firework", praiseAr: null },
  { key: "mashallah", emoji: "🌟", labelAr: "ما شاء الله", labelEn: "Bravo", sound: "cheer", praiseAr: "ما شاء الله" },
];

// Number of floating emoji particles per burst.
export const BURST_COUNT = 14;
