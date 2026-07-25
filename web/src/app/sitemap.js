import { SITE_URL, languages, fallbackLng } from '@/shared/lib/seo';
import { localePath } from '@/i18n/routing.js';
import { sortedArticles } from '@/features/blog';
import { services } from '@/features/services/data.js';

// PUBLIC, indexable routes only (the dashboard is auth-gated + noindex). Each
// entry is emitted once per locale and cross-links its other-language variants
// via hreflang `alternates.languages`, so Google understands the ar/en pairing.
const PUBLIC_PATHS = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/services', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/free-game', priority: 0.8, changeFrequency: 'monthly' },
  ...services.map((service) => ({
    path: `/services/${service.slug}`,
    priority: 0.8,
    changeFrequency: 'monthly',
  })),
  // Every blog article (data-driven — new posts appear automatically). Each
  // carries its publish date as lastModified so crawlers schedule sensibly.
  ...sortedArticles.map((a) => ({
    path: `/blog/${a.slug}`,
    priority: 0.6,
    changeFrequency: 'monthly',
    lastModified: a.dateModified || a.datePublished,
  })),
];

export default function sitemap() {
  const entries = [];
  for (const { path, priority, changeFrequency, lastModified } of PUBLIC_PATHS) {
    const languagesMap = {};
    for (const lng of languages) {
      languagesMap[lng] = `${SITE_URL}${localePath(lng, path)}`;
    }
    languagesMap['x-default'] = `${SITE_URL}${localePath(fallbackLng, path)}`;

    for (const lng of languages) {
      entries.push({
        url: `${SITE_URL}${localePath(lng, path)}`,
        changeFrequency,
        priority,
        ...(lastModified ? { lastModified } : {}),
        alternates: { languages: languagesMap },
      });
    }
  }
  return entries;
}
