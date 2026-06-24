import { NavAction, NavLink } from '../../ui/navigation/navbar/types';

export const navLinks: NavLink[] = [
  { text: 'Home', href: '/#home' },
  { text: 'How it works', href: '#how-it-works' },
  { text: 'Levels', href: '#levels' },
  { text: 'About', href: '#about' },
  { text: 'Pricing', href: '#pricing' },
];

// Section anchors used by the marketing footer (bilingual labels).
export const navSections: { id: string; ar: string; en: string }[] = [
  { id: 'home', ar: 'الرئيسية', en: 'Home' },
  { id: 'how-it-works', ar: 'كيف يعمل', en: 'How it works' },
  { id: 'levels', ar: 'المستويات', en: 'Levels' },
  { id: 'about', ar: 'من نحن', en: 'About' },
  { id: 'pricing', ar: 'الأسعار', en: 'Pricing' },
];

// Bilingual chrome labels for the navbar / mobile drawer.
const NAV_TEXT = {
  ar: { brand: 'أكاديمية آية', menu: 'القائمة', login: 'تسجيل الدخول', signup: 'تسجيل', dashboard: 'لوحتي' },
  en: { brand: 'Aya Academy', menu: 'Menu', login: 'Login', signup: 'Sign up', dashboard: 'Dashboard' },
};

export function pickNav(lng: string) {
  return NAV_TEXT[lng === 'en' ? 'en' : 'ar'];
}

export const navActions: NavAction[] = [
  {
    text: 'Login',
    href: '/login',
    type: 'link',
  },
  {
    text: 'Sign Up',
    href: '/signup',
    type: 'button',
  },
];
