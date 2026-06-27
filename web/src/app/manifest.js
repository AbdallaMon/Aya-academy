import {
  BRAND,
  THEME_COLOR,
  BACKGROUND_COLOR,
  fallbackLng,
} from '@/shared/lib/seo';

// PWA / web app manifest, served at /manifest.webmanifest (wired in the root
// layout). Arabic is the primary brand identity; the start_url points at the
// default-locale homepage.
export default function manifest() {
  return {
    name: BRAND[fallbackLng],
    short_name: BRAND[fallbackLng],
    description:
      'رحلة مرحة وآمنة لتعليم الأطفال القرآن الكريم والأخلاق الجميلة.',
    start_url: `/${fallbackLng}`,
    display: 'standalone',
    dir: 'rtl',
    lang: fallbackLng,
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
