// Full-screen background scenes for the kids' whiteboard.
//
// Each scene is rendered on a plain <div> that sits BEHIND a transparent
// Excalidraw canvas — the teacher draws (usually black/colored strokes) directly
// on top. So every `css` value here is a ready-to-use CSS `background` shorthand
// and, apart from the intentionally-dark chalkboard, stays light/low-contrast so
// drawings and handwriting on top stay readable.
//
// Everything is GENERATED: gradients and small, tileable inline SVGs encoded as
// data URIs. No external files, no network. `svgUrl()` wraps an SVG string in a
// `url("data:image/svg+xml,...")` via encodeURIComponent — that turns `#` into
// %23 (so hex colors survive) and spaces/`<`/`>` into escapes, while leaving the
// single quotes we use for SVG attributes untouched (double quotes would break).
// So: write SVGs with SINGLE-quoted attributes and raw `#hex` colors, then pass
// them through svgUrl().

/** Encode a raw SVG string into a CSS url() data URI. */
export function svgUrl(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Small convenience so tiles read cleanly below.
const xmlns = "http://www.w3.org/2000/svg";

// ── Sky & weather ─────────────────────────────────────────────────────────────
// Soft blue sky with fluffy white clouds drifting across a pale-blue wash.
const CLOUDS = `<svg xmlns='${xmlns}' width='160' height='110'><g fill='#ffffff' opacity='0.85'><ellipse cx='42' cy='60' rx='26' ry='16'/><ellipse cx='66' cy='52' rx='22' ry='20'/><ellipse cx='90' cy='60' rx='24' ry='15'/><ellipse cx='118' cy='30' rx='16' ry='10'/><ellipse cx='134' cy='34' rx='13' ry='9'/></g></svg>`;

// Ocean with gentle waves and rising bubbles.
const OCEAN = `<svg xmlns='${xmlns}' width='90' height='50'><g fill='none' stroke='#7fd4f0' stroke-width='2' stroke-linecap='round' opacity='0.55'><path d='M0 22 Q22 8 45 22 T90 22'/><path d='M0 40 Q22 28 45 40 T90 40'/></g><g fill='#bfeafc' opacity='0.7'><circle cx='20' cy='12' r='3'/><circle cx='60' cy='32' r='2.5'/><circle cx='78' cy='10' r='2'/></g></svg>`;

// ── Sky at night / space ──────────────────────────────────────────────────────
// Calm night sky (great for a Quran / night theme): a crescent-friendly deep
// indigo with a glowing moon in the corner and scattered twinkling stars.
const STARS = `<svg xmlns='${xmlns}' width='100' height='100'><g fill='#fff7d6' opacity='0.9'><circle cx='18' cy='24' r='1.6'/><circle cx='72' cy='16' r='1.2'/><circle cx='50' cy='58' r='1.8'/><circle cx='86' cy='70' r='1.3'/><circle cx='30' cy='82' r='1.4'/></g><g fill='#ffffff' opacity='0.5'><circle cx='60' cy='40' r='0.9'/><circle cx='12' cy='60' r='0.9'/></g></svg>`;

// Cheerful pastel "space" with cute planets and little stars (kept light).
const PLANETS = `<svg xmlns='${xmlns}' width='150' height='150'><g opacity='0.5'><circle cx='38' cy='42' r='18' fill='#c9b9ff'/><ellipse cx='38' cy='42' rx='28' ry='7' fill='none' stroke='#b6a2f0' stroke-width='2'/><circle cx='108' cy='104' r='14' fill='#ffd0a6'/><circle cx='96' cy='30' r='8' fill='#a6e2ff'/></g><g fill='#e7b8ff' opacity='0.7'><path d='M120 60 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z'/><path d='M22 108 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z'/></g></svg>`;

// ── Nature ────────────────────────────────────────────────────────────────────
// Green meadow: pale-green wash with tufts of grass.
const GRASS = `<svg xmlns='${xmlns}' width='48' height='48'><g fill='none' stroke='#8fce6b' stroke-width='2.2' stroke-linecap='round' opacity='0.5'><path d='M10 48 Q7 34 12 26'/><path d='M15 48 Q15 36 15 27'/><path d='M20 48 Q23 34 18 26'/><path d='M34 48 Q31 36 36 30'/><path d='M39 48 Q40 38 39 31'/></g></svg>`;

// Jungle leaves floating on a soft green background.
const LEAVES = `<svg xmlns='${xmlns}' width='70' height='70'><g opacity='0.4'><path d='M18 12 C34 16 34 44 18 54 C6 42 6 22 18 12 Z' fill='#9fd884'/><path d='M18 16 L18 50' stroke='#7cc063' stroke-width='1.4'/><path d='M52 34 C64 38 64 60 52 68 C42 58 42 42 52 34 Z' fill='#b7e39f'/></g></svg>`;

// Little five-petal flowers scattered on a pale-pink field.
const FLOWERS = `<svg xmlns='${xmlns}' width='80' height='80'><g opacity='0.5'><g transform='translate(24 24)' fill='#ffcbe0'><circle cx='0' cy='-9' r='6'/><circle cx='9' cy='-3' r='6'/><circle cx='6' cy='8' r='6'/><circle cx='-6' cy='8' r='6'/><circle cx='-9' cy='-3' r='6'/></g><circle cx='24' cy='24' r='5' fill='#ffe08a'/><g transform='translate(58 58)' fill='#c9ddff'><circle cx='0' cy='-8' r='5'/><circle cx='8' cy='-2' r='5'/><circle cx='5' cy='7' r='5'/><circle cx='-5' cy='7' r='5'/><circle cx='-8' cy='-2' r='5'/></g><circle cx='58' cy='58' r='4' fill='#ffe08a'/></g></svg>`;

// ── Fun patterns ──────────────────────────────────────────────────────────────
// Pastel polka dots on cream.
const DOTS = `<svg xmlns='${xmlns}' width='44' height='44'><circle cx='11' cy='11' r='6' fill='#ffd0e0'/><circle cx='33' cy='33' r='6' fill='#cfe6ff'/><circle cx='33' cy='11' r='4' fill='#d7f2cf'/><circle cx='11' cy='33' r='4' fill='#fff0b8'/></svg>`;

// Floating balloons with little strings.
const BALLOONS = `<svg xmlns='${xmlns}' width='100' height='130'><g opacity='0.55'><ellipse cx='26' cy='30' rx='15' ry='19' fill='#ffc2d4'/><path d='M26 49 q4 11 -2 22' stroke='#e0aebd' fill='none' stroke-width='1.5'/><ellipse cx='68' cy='58' rx='14' ry='18' fill='#bfe0ff'/><path d='M68 76 q4 11 -2 22' stroke='#a9c8e6' fill='none' stroke-width='1.5'/><ellipse cx='44' cy='102' rx='12' ry='15' fill='#c9edc0'/><path d='M44 117 q3 8 -2 14' stroke='#a7d29a' fill='none' stroke-width='1.5'/></g></svg>`;

// ── Study surfaces ────────────────────────────────────────────────────────────
// Chalkboard star specks — faint white flecks for the dark green board.
const CHALK_STARS = `<svg xmlns='${xmlns}' width='120' height='120'><g fill='#ffffff' opacity='0.08'><circle cx='22' cy='30' r='1.6'/><circle cx='78' cy='58' r='1.6'/><circle cx='48' cy='92' r='1.2'/><circle cx='100' cy='20' r='1.2'/><circle cx='14' cy='104' r='1'/></g></svg>`;

// Gentle 8-point "islamic" star lattice, soft gold on warm cream.
const ISLAMIC = `<svg xmlns='${xmlns}' width='64' height='64'><g fill='none' stroke='#d8c48a' stroke-width='1.2' opacity='0.5'><rect x='17' y='17' width='30' height='30'/><rect x='17' y='17' width='30' height='30' transform='rotate(45 32 32)'/></g></svg>`;

/**
 * The picker library. Each entry is a plain object:
 *   { key, labelAr, labelEn, emoji, css }
 * `css` is a full CSS `background` shorthand for a full-screen div.
 */
export const BOARD_BACKGROUNDS = [
  // Sky & weather
  {
    key: "sky",
    labelAr: "سماء وسحاب",
    labelEn: "Sky & clouds",
    emoji: "☁️",
    css: `${svgUrl(CLOUDS)} 0 0 / 220px 150px repeat, linear-gradient(180deg, #bce3ff, #eaf7ff)`,
  },
  {
    key: "ocean",
    labelAr: "بحر وأمواج",
    labelEn: "Ocean & waves",
    emoji: "🌊",
    css: `${svgUrl(OCEAN)} 0 0 / 120px 66px repeat, linear-gradient(180deg, #cdeffd, #e8f9ff)`,
  },
  // Night & space
  {
    key: "night",
    labelAr: "ليل ونجوم",
    labelEn: "Night & stars",
    emoji: "🌙",
    css: `${svgUrl(STARS)} 0 0 / 120px 120px repeat, radial-gradient(circle at 85% 16%, #fdf6c9 0 24px, rgba(253,246,201,0.35) 24px 34px, transparent 36px), linear-gradient(180deg, #2b2f6b, #4a4f96)`,
  },
  {
    key: "space",
    labelAr: "فضاء وكواكب",
    labelEn: "Space & planets",
    emoji: "🪐",
    css: `${svgUrl(PLANETS)} 0 0 / 200px 200px repeat, linear-gradient(160deg, #efeaff, #f7f4ff)`,
  },
  // Nature
  {
    key: "meadow",
    labelAr: "مرج أخضر",
    labelEn: "Green meadow",
    emoji: "🌱",
    css: `${svgUrl(GRASS)} 0 0 / 64px 64px repeat, linear-gradient(180deg, #eefbe4, #f4fcec)`,
  },
  {
    key: "jungle",
    labelAr: "غابة وأوراق",
    labelEn: "Jungle leaves",
    emoji: "🌿",
    css: `${svgUrl(LEAVES)} 0 0 / 96px 96px repeat, linear-gradient(180deg, #e4f7d9, #f0fbe8)`,
  },
  {
    key: "flowers",
    labelAr: "زهور",
    labelEn: "Flowers",
    emoji: "🌸",
    css: `${svgUrl(FLOWERS)} 0 0 / 110px 110px repeat, linear-gradient(180deg, #fff5f8, #fdf0ff)`,
  },
  // Fun patterns
  {
    key: "dots",
    labelAr: "نقاط ملونة",
    labelEn: "Polka dots",
    emoji: "🔴",
    css: `${svgUrl(DOTS)} 0 0 / 56px 56px repeat, #fffdf7`,
  },
  {
    key: "rainbow",
    labelAr: "قوس قزح",
    labelEn: "Rainbow",
    emoji: "🌈",
    css: `linear-gradient(120deg, #ffd6e0, #ffe9c7, #fdf6c9, #d6f5d6, #cfeffd, #e0d6ff)`,
  },
  {
    key: "balloons",
    labelAr: "بالونات",
    labelEn: "Balloons",
    emoji: "🎈",
    css: `${svgUrl(BALLOONS)} 0 0 / 150px 195px repeat, linear-gradient(180deg, #fef6fb, #f3f9ff)`,
  },
  // Study surfaces
  {
    key: "paper",
    labelAr: "ورق مسطر",
    labelEn: "Ruled paper",
    emoji: "📝",
    css: `linear-gradient(90deg, transparent 40px, #f6c9c9 40px, #f6c9c9 42px, transparent 42px), repeating-linear-gradient(#fdf9ef, #fdf9ef 27px, #dbe7f4 27px, #dbe7f4 28px)`,
  },
  {
    key: "grid",
    labelAr: "ورق مربعات",
    labelEn: "Grid paper",
    emoji: "🧮",
    css: `linear-gradient(#dbe9f7 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, #dbe9f7 1px, transparent 1px) 0 0 / 24px 24px, #fbfdff`,
  },
  {
    key: "chalkboard",
    labelAr: "سبورة طباشير",
    labelEn: "Chalkboard",
    emoji: "🟩",
    // Dark on purpose — the only dark scene. Pair with LIGHT chalk-colored strokes.
    css: `${svgUrl(CHALK_STARS)} 0 0 / 140px 140px repeat, radial-gradient(circle at 50% 40%, #0e6242, #0b5d3b 70%, #094a30)`,
  },
  {
    key: "islamic",
    labelAr: "زخرفة إسلامية",
    labelEn: "Islamic pattern",
    emoji: "🕌",
    css: `${svgUrl(ISLAMIC)} 0 0 / 72px 72px repeat, linear-gradient(180deg, #fbf7ee, #fdfbf4)`,
  },
];

/** A gentle, distraction-free default that reads well for handwriting. */
export const DEFAULT_BACKGROUND_KEY = "paper";

/** Look up a background entry by key. Returns undefined if not found. */
export function getBackground(key) {
  return BOARD_BACKGROUNDS.find((b) => b.key === key);
}
