// Bilingual navigation data for the marketing site. Section links point at
// anchors on the homepage; the actual hrefs are locale-prefixed at render time.

export const navSections = [
  { id: 'home', ar: 'الرئيسية', en: 'Home' },
  { id: 'how-it-works', ar: 'كيف نتعلّم', en: 'How it works' },
  { id: 'levels', ar: 'المستويات', en: 'Levels' },
  { id: 'why-ayah', ar: 'لماذا آية', en: 'Why Aya' },
  { id: 'pricing', ar: 'الباقات', en: 'Pricing' },
];

export const navText = {
  ar: {
    brand: 'أكاديمية آية',
    dashboard: 'لوحتي',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    playFree: 'جرّب مجانًا 🎮',
    menu: 'القائمة',
  },
  en: {
    brand: 'Aya Academy',
    dashboard: 'Dashboard',
    login: 'Login',
    signup: 'Sign up',
    playFree: 'Play free',
    menu: 'Menu',
  },
};

export function pickNav(lng) {
  return navText[lng === 'en' ? 'en' : 'ar'];
}
