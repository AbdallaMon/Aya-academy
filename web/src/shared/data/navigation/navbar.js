// Bilingual navigation data for the marketing site. Items without `href` are
// homepage anchors (rendered as /#<id>); items WITH `href` are real pages
// (rendered as that locale-prefixed path). Hrefs are resolved at render time via
// navHref() so the navbar/drawer/footer stay in sync.

// Order matches the homepage scroll order: #why-ayah is the merged section's
// wrapper (it appears first), with #how-it-works and #levels as bands inside it.
export const navSections = [
  { id: 'home', ar: 'الرئيسية', en: 'Home' },
  { id: 'about', href: '/about', ar: 'من نحن', en: 'About' },
  { id: 'why-ayah', ar: 'لماذا آية', en: 'Why Ayah' },
  { id: 'how-it-works', ar: 'كيف نتعلّم', en: 'How it works' },
  { id: 'levels', ar: 'المستويات', en: 'Levels' },
  { id: 'services', href: '/services', ar: 'البرامج', en: 'Programs' },
  { id: 'pricing', ar: 'الباقات', en: 'Pricing' },
  { id: 'faq', ar: 'الأسئلة الشائعة', en: 'FAQ' },
  { id: 'blog', href: '/blog', ar: 'المدوّنة', en: 'Blog' },
];

// The logo is the home link in both desktop and mobile navigation, so the
// explicit Home item is only needed in the footer.
export const navbarSections = navSections.filter((section) => section.id !== 'home');

// Resolve a nav item to its locale-prefixed href: a real page when `href` is
// set, otherwise a homepage anchor.
export function navHref(localePath, lng, section) {
  return section.href
    ? localePath(lng, section.href)
    : localePath(lng, `/#${section.id}`);
}

export const navText = {
  ar: {
    brand: 'أكاديمية آية',
    dashboard: 'لوحتي',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    // The always-visible navbar CTA leads with the free-trial hook (the whole
    // page's strongest lever), while `signup` stays generic for the footer link.
    ctaFree: 'احجز حصة مجانية',
    playFree: 'جرّب مجانًا 🎮',
    menu: 'القائمة',
  },
  en: {
    brand: 'Ayah Academy',
    dashboard: 'Dashboard',
    login: 'Login',
    signup: 'Sign up',
    ctaFree: 'Book a free session',
    playFree: 'Play free',
    menu: 'Menu',
  },
};

export function pickNav(lng) {
  return navText[lng === 'en' ? 'en' : 'ar'];
}
