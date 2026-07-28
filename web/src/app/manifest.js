import {
  BRAND,
  THEME_COLOR,
  BACKGROUND_COLOR,
  defaultLng,
} from '@/shared/lib/seo';

// PWA / web app manifest, served at /manifest.webmanifest (wired in the root
// layout). English is the default identity; Arabic remains available in-app.
export default function manifest() {
  return {
    name: BRAND[defaultLng],
    short_name: BRAND[defaultLng],
    description:
      'Online Quran memorization, Tajweed, Arabic, and Islamic studies for adults and children.',
    start_url: `/${defaultLng}`,
    scope: '/',
    display: 'standalone',
    dir: 'ltr',
    lang: defaultLng,
    categories: ['education', 'kids', 'books'],
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
