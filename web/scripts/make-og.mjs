// Generates the Open Graph / Twitter share cards (1200×630) for Ayah Academy —
// ONE per locale, each in its own language + reading direction:
//   ar → og.png        + og-share.jpg        (Arabic, RTL — the canonical card)
//   en → og-en.png     + og-en-share.jpg     (English, LTR)
// buildMetadata picks the right pair from the URL locale (/ar vs /en).
//
// Art direction is shared: a warm cream canvas with soft teal + gold blooms, the
// owl-and-kids logo lockup in a gradient-framed panel, and the value proposition
// + a free-trial CTA pill. Rendered with headless Chromium (Cairo font → correct
// Arabic shaping) and downscaled with sharp for crisp text.
//
// The PNG is the canonical card; the lighter JPEG (<300KB) is a fallback for
// scrapers that drop large images (WhatsApp / Facebook).
//
// Engine: playwright-core (already in the workspace) drives a locally-installed
// Chromium/Edge — no bundled browser download. Override the binary with CHROME=.
//
// Run:  npm run og        (from web/)   ·   node scripts/make-og.mjs
// Scope: OG_SCOPE=services renders only program cards (also: brand, blog, all).
// Optional OG_SLUGS=a,b limits detail-card generation to selected slugs.
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sortedArticles } from '../src/features/blog/data/articles.js';
import { programFamilies, services } from '../src/features/services/data.js';

const WEB_ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC = path.join(WEB_ROOT, 'public');
const W = 1200;
const H = 630;

// Optional filename suffix (e.g. OG_SUFFIX=-new) → write og-new.png to preview a
// regen without overwriting the live cards. Empty = write the live names.
const SUFFIX = process.env.OG_SUFFIX || '';
const withSuffix = (f) => (SUFFIX ? f.replace(/\.(png|jpg)$/, `${SUFFIX}.$1`) : f);
const SCOPE = process.env.OG_SCOPE || 'all';
const ONLY_SLUGS = new Set(
  (process.env.OG_SLUGS || '')
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean),
);
if (!['all', 'brand', 'blog', 'services'].includes(SCOPE)) {
  throw new Error(`Unsupported OG_SCOPE "${SCOPE}". Use all, brand, blog or services.`);
}

// Resolve a Chromium/Edge binary from CHROME or a list of common local installs.
function resolveChrome() {
  const candidates = [process.env.CHROME].filter(Boolean);
  const playwrightRoot = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (fs.existsSync(playwrightRoot)) {
    for (const dir of fs.readdirSync(playwrightRoot)) {
      if (dir.startsWith('chromium-')) {
        candidates.push(path.join(playwrightRoot, dir, 'chrome-win64', 'chrome.exe'));
      }
    }
  }
  const puppeteerChrome = path.join(process.env.USERPROFILE || '', '.cache', 'puppeteer', 'chrome');
  if (fs.existsSync(puppeteerChrome)) {
    for (const dir of fs.readdirSync(puppeteerChrome)) {
      candidates.push(path.join(puppeteerChrome, dir, 'chrome-win64', 'chrome.exe'));
    }
  }
  candidates.push(
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  );
  const found = candidates.find((p) => p && fs.existsSync(p));
  if (!found) {
    throw new Error('No Chromium/Edge binary found. Set CHROME=/path/to/chrome.exe');
  }
  return found;
}

const logo = `data:image/png;base64,${fs.readFileSync(path.join(PUBLIC, 'logos', 'logo.png')).toString('base64')}`;

// Brand palette (mirrors THEME_COLOR + the logo's teal/gold/ink).
const C = {
  cream: '#FFFCF5',
  teal: '#1ABC9C',
  tealDeep: '#0E8C74',
  gold: '#F6C453',
  goldDeep: '#C98A1A',
  ink: '#14342E',
  mut: '#4F6058',
  mint: '#E7F6F1',
};

// One entry per locale — same art direction, localized copy + reading direction.
// `pill` starts with "★ "; the star is split into its own gold span at render.
const LOCALES = [
  {
    id: 'ar',
    dir: 'rtl',
    align: 'right',
    png: 'og.png',
    jpg: 'og-share.jpg',
    copy: {
      eyebrow: 'تحفيظ القرآن والعلوم الشرعية أونلاين',
      name: 'أكاديمية آية',
      role: 'تعلّم القرآن والتجويد والعلوم الشرعية:<br>حصص مباشرة تفاعلية للكبار والأطفال.',
      pill: '★ حصة تجريبية مجانية · لكل الأعمار',
      trust: 'محبوبة من الكبار والصغار',
      brand: 'ayah.academy',
    },
  },
  {
    id: 'en',
    dir: 'ltr',
    align: 'left',
    png: 'og-en.png',
    jpg: 'og-en-share.jpg',
    copy: {
      eyebrow: 'Online Quran & Islamic studies',
      name: 'Ayah Academy',
      role: 'Learn the Quran, Tajweed and Islamic studies:<br>live interactive classes for adults and kids.',
      pill: '★ Free trial session · All ages',
      trust: 'Loved by adults & kids',
      brand: 'ayah.academy',
    },
  },
];

const cardHtml = (L) => {
  const t = L.copy;
  return `<!doctype html><html dir="${L.dir}" lang="${L.id}"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${W}px; height:${H}px; }
  body { font-family:'Cairo',sans-serif; -webkit-font-smoothing:antialiased; }
  .card { position:relative; width:${W}px; height:${H}px; overflow:hidden;
    background:
      radial-gradient(54% 58% at 14% 12%, rgba(26,188,156,0.20), transparent 60%),
      radial-gradient(50% 56% at 90% 20%, rgba(246,196,83,0.22), transparent 62%),
      radial-gradient(62% 66% at 70% 116%, rgba(26,188,156,0.16), transparent 64%),
      ${C.cream}; }
  .frame { position:absolute; inset:18px; border:2px solid rgba(14,140,116,0.18); border-radius:34px; }
  .dots { position:absolute; inset:0;
    background-image:radial-gradient(rgba(14,140,116,0.10) 2px, transparent 2px);
    background-size:34px 34px;
    -webkit-mask-image:radial-gradient(120% 120% at 50% 30%, #000 42%, transparent 100%); }
  .emoji { position:absolute; opacity:0.16; filter:saturate(0.9); }
  .e1 { top:42px;  ${L.align === 'right' ? 'left' : 'right'}:62px;  font-size:58px; }
  .e2 { bottom:60px; ${L.align === 'right' ? 'left' : 'right'}:120px; font-size:44px; opacity:0.13; }
  .e3 { top:70px;  ${L.align === 'right' ? 'right' : 'left'}:48%;  font-size:40px; opacity:0.12; }

  .row { position:relative; height:100%; display:flex; align-items:center; gap:30px; padding:0 70px; }

  .text { flex:1.22; text-align:${L.align}; }
  .eyebrow { color:${C.goldDeep}; font-weight:700; font-size:25px; letter-spacing:0.3px; margin-bottom:14px; }
  .name { color:${C.ink}; font-weight:800; font-size:84px; letter-spacing:-1px; line-height:1.05; }
  .role { color:${C.mut}; font-weight:600; font-size:31px; line-height:1.55; margin-top:18px; }
  .pill { margin-top:30px; display:inline-flex; align-items:center; gap:11px; padding:13px 24px; border-radius:999px;
    white-space:nowrap;
    background:linear-gradient(90deg, rgba(26,188,156,0.16), rgba(246,196,83,0.12));
    border:1.5px solid rgba(26,188,156,0.45); }
  .pill .star { color:${C.gold}; font-weight:800; font-size:25px; -webkit-text-stroke:0.5px ${C.goldDeep}; }
  .pill .label { color:${C.ink}; font-weight:700; font-size:23px; white-space:nowrap; }

  .visual { flex:1; display:flex; align-items:center; justify-content:center; position:relative; }
  .glow { position:absolute; width:440px; height:440px; border-radius:50%;
    background:radial-gradient(circle, rgba(26,188,156,0.28), rgba(246,196,83,0.14) 55%, transparent 72%);
    filter:blur(6px); }
  .panel { position:relative; width:452px; border-radius:40px; padding:22px;
    background:linear-gradient(135deg, ${C.teal} 0%, ${C.tealDeep} 48%, ${C.gold} 130%);
    box-shadow:18px 22px 0 -6px rgba(26,188,156,0.16), 0 30px 60px -26px rgba(14,52,46,0.5); }
  .panel .inner { border-radius:28px; padding:26px 22px 20px; display:flex; flex-direction:column; align-items:center; gap:12px;
    background:linear-gradient(160deg, #FFFFFF, ${C.mint}); }
  .panel img { width:100%; height:auto; display:block; filter:drop-shadow(0 10px 18px rgba(14,52,46,0.18)); }
  .panel .trust { display:flex; align-items:center; gap:8px; color:${C.tealDeep}; font-weight:700; font-size:21px; }
  .panel .trust .s { color:${C.gold}; -webkit-text-stroke:0.5px ${C.goldDeep}; letter-spacing:1px; }

  .brand { position:absolute; bottom:30px; ${L.align === 'right' ? 'left' : 'right'}:84px; color:${C.tealDeep}; font-weight:700; font-size:21px; letter-spacing:0.4px; }
</style></head>
<body><div class="card">
  <div class="dots"></div>
  <div class="emoji e1">📖</div>
  <div class="emoji e2">🌙</div>
  <div class="emoji e3">✨</div>
  <div class="frame"></div>
  <div class="row">
    <div class="text">
      <div class="eyebrow">${t.eyebrow}</div>
      <div class="name">${t.name}</div>
      <div class="role">${t.role}</div>
      <div class="pill"><span class="star">★</span><span class="label">${t.pill.replace('★ ', '')}</span></div>
    </div>
    <div class="visual">
      <div class="glow"></div>
      <div class="panel"><div class="inner">
        <img src="${logo}" alt="">
        <div class="trust"><span class="s">★★★★★</span><span>${t.trust}</span></div>
      </div></div>
    </div>
  </div>
  <div class="brand">${t.brand}</div>
</div></body></html>`;
};

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Unique, text-led cards for pages that people share individually. These use the
// same browser-rendered Cairo setup as the brand card, so Arabic shaping stays
// correct and no server-time image generation is required.
function detailCardHtml({ lng, kind, title, description }) {
  const isAr = lng === 'ar';
  const eyebrow = kind === 'blog'
    ? (isAr ? 'مدوّنة أكاديمية آية' : 'Ayah Academy Blog')
    : (isAr ? 'برنامج من أكاديمية آية' : 'Ayah Academy Program');
  const label = kind === 'blog'
    ? (isAr ? 'اقرأ المقال' : 'Read the article')
    : (isAr ? 'احجز حصة مجانية' : 'Book a free session');

  return `<!doctype html><html dir="${isAr ? 'rtl' : 'ltr'}" lang="${lng}"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0} html,body{width:${W}px;height:${H}px} body{font-family:Cairo,sans-serif;-webkit-font-smoothing:antialiased}
.card{position:relative;width:${W}px;height:${H}px;overflow:hidden;padding:68px 76px;background:radial-gradient(56% 80% at 0% 0%,rgba(26,188,156,.23),transparent 64%),radial-gradient(58% 80% at 100% 100%,rgba(246,196,83,.27),transparent 64%),${C.cream};color:${C.ink}}
.frame{position:absolute;inset:18px;border:2px solid rgba(14,140,116,.2);border-radius:34px}.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(14,140,116,.11) 2px,transparent 2px);background-size:34px 34px;opacity:.85}
.copy{position:relative;width:72%;height:100%;display:flex;flex-direction:column;justify-content:center}.eyebrow{color:${C.goldDeep};font-size:24px;font-weight:800;letter-spacing:.3px;margin-bottom:20px}.title{font-size:54px;font-weight:800;line-height:1.28;letter-spacing:-.7px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.description{font-size:24px;font-weight:600;line-height:1.6;color:${C.mut};margin-top:20px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.pill{margin-top:30px;align-self:flex-start;padding:12px 22px;border-radius:999px;background:rgba(26,188,156,.13);border:1.5px solid rgba(14,140,116,.4);font-size:20px;font-weight:800}.mark{position:absolute;${isAr ? 'left' : 'right'}:76px;top:72px;width:190px;height:190px;border-radius:42px;display:grid;place-items:center;background:linear-gradient(135deg,${C.teal},${C.tealDeep});box-shadow:0 24px 50px rgba(14,52,46,.22)}.mark img{width:142px;filter:drop-shadow(0 10px 16px rgba(14,52,46,.2))}.brand{position:absolute;bottom:48px;${isAr ? 'left' : 'right'}:82px;color:${C.tealDeep};font-size:20px;font-weight:800;letter-spacing:.5px}
</style></head><body><div class="card"><div class="dots"></div><div class="frame"></div><div class="mark"><img src="${logo}" alt=""></div><div class="copy"><div class="eyebrow">${escapeHtml(eyebrow)}</div><div class="title">${escapeHtml(title)}</div><div class="description">${escapeHtml(description)}</div><div class="pill">${escapeHtml(label)}</div></div><div class="brand">ayah.academy</div></div></body></html>`;
}

async function renderPng(browser, html) {
  const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(async () => { await document.fonts.ready; });
  const shot = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
  await context.close();
  return sharp(shot).resize(W, H).png({ compressionLevel: 9 }).toBuffer();
}

const EXE = resolveChrome();
console.log(`engine → ${EXE}`);
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });
try {
  if (SCOPE === 'all' || SCOPE === 'brand') {
    for (const L of LOCALES) {
      // deviceScaleFactor 2 → render at 2× then downscale with sharp for crisp text.
      const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
      const page = await context.newPage();
      await page.setContent(cardHtml(L), { waitUntil: 'load', timeout: 60000 });
      await page.evaluate(async () => { await document.fonts.ready; });
      const shot = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
      await context.close();

      const png = await sharp(shot).resize(W, H).png({ compressionLevel: 9 }).toBuffer();
      const pngName = withSuffix(L.png);
      fs.writeFileSync(path.join(PUBLIC, pngName), png);

      const jpg = await sharp(shot).resize(W, H).jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
      const jpgName = withSuffix(L.jpg);
      fs.writeFileSync(path.join(PUBLIC, jpgName), jpg);

      console.log(`${L.id} → public/${pngName} (${Math.round(png.length / 1024)}KB) + public/${jpgName} (${Math.round(jpg.length / 1024)}KB)`);
    }
  }
  const detailCards = [
    ...(SCOPE === 'all' || SCOPE === 'blog' ? sortedArticles : []).flatMap((article) => LOCALES.map((locale) => ({
      kind: 'blog',
      slug: article.slug,
      lng: locale.id,
      title: article.title[locale.id],
      description: article.description[locale.id],
    }))),
    ...(SCOPE === 'all' || SCOPE === 'services' ? services : []).flatMap((service) => LOCALES.map((locale) => ({
      kind: 'services',
      slug: service.slug,
      lng: locale.id,
      title: service[locale.id].title,
      description: service[locale.id].description,
    }))),
    ...(SCOPE === 'all' || SCOPE === 'services' ? programFamilies : []).flatMap((family) => LOCALES.map((locale) => ({
      kind: 'services',
      slug: family.slug,
      lng: locale.id,
      title: family[locale.id].title,
      description: family[locale.id].metaDescription,
    }))),
  ].filter((card) => ONLY_SLUGS.size === 0 || ONLY_SLUGS.has(card.slug));

  for (const card of detailCards) {
    const dir = path.join(PUBLIC, 'og', card.kind);
    fs.mkdirSync(dir, { recursive: true });
    const png = await renderPng(browser, detailCardHtml(card));
    const file = path.join(dir, `${card.slug}-${card.lng}.png`);
    fs.writeFileSync(file, png);
    console.log(`${card.kind}/${card.slug}-${card.lng}.png (${Math.round(png.length / 1024)}KB)`);
  }
} finally {
  await browser.close();
}
