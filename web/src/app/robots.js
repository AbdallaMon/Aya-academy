import { SITE_URL } from '@/shared/lib/seo';

// /robots.txt — allow everything public, keep the private dashboard out of the
// index (matches the noindex set in the dashboard layout), and advertise the
// sitemap.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/ar/dashboard/', '/en/dashboard/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
