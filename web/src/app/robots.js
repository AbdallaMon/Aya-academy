import { SITE_URL } from '@/shared/lib/seo';

// /robots.txt — allow crawlable pages through. Private/account areas carry a
// page-level `noindex`, which Google must be able to crawl to read. Blocking
// them here would make that instruction invisible to Googlebot.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
