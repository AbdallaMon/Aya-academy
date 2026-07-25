import { SITE_URL, languages, fallbackLng } from '@/shared/lib/seo';
import { localePath } from '@/i18n/routing.js';
import { sortedArticles } from '@/features/blog';
import { services } from '@/features/services/data.js';

// PUBLIC, canonical, indexable routes only (the dashboard is auth-gated +
// noindex). Service records are the source of truth, so every new public program
// is included automatically on the very next deployment.
const MARKETING_LAST_MODIFIED = '2026-07-25';
const latestArticleDate = sortedArticles[0]?.dateModified
  || sortedArticles[0]?.datePublished;

const PUBLIC_PATHS = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly', lastModified: MARKETING_LAST_MODIFIED },
  { path: '/services', priority: 0.9, changeFrequency: 'monthly', lastModified: MARKETING_LAST_MODIFIED },
  { path: '/blog', priority: 0.8, changeFrequency: 'weekly', lastModified: latestArticleDate },
  { path: '/free-game', priority: 0.8, changeFrequency: 'monthly' },
  ...services.map((service) => ({
    path: `/services/${service.slug}`,
    priority: 0.8,
    changeFrequency: 'monthly',
    lastModified: service.dateModified,
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
