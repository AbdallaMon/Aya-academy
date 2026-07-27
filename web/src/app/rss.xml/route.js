import { SITE_URL, brand, defaultLng } from '@/shared/lib/seo';
import { seoContent } from '@/shared/lib/seo';
import { localePath } from '@/i18n/routing.js';
import { sortedArticles, blogCategories } from '@/features/blog';

// RSS 2.0 feed for the blog, in the default locale (English). Linked from the
// blog page <head> via alternates.types. Data-driven: every article in
// features/blog/data/articles.js appears automatically, newest first.

const CONTACT_EMAIL = 'info@ayah.academy';

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const abs = (lng, path) => `${SITE_URL}${localePath(lng, path)}`;

export async function GET() {
  const lng = defaultLng;
  const self = `${SITE_URL}/rss.xml`;
  const blogUrl = abs(lng, '/blog');
  const channel = seoContent.blog[lng];

  const items = sortedArticles
    .map((a) => {
      const url = abs(lng, `/blog/${a.slug}`);
      const pubDate = new Date(`${a.datePublished}T00:00:00Z`).toUTCString();
      const categories = (a.categories || [])
        .map((key) => blogCategories[key]?.[lng])
        .filter(Boolean)
        .map((c) => `      <category>${esc(c)}</category>`)
        .join('\n');
      return `    <item>
      <title>${esc(a.title[lng])}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${esc(a.description[lng])}</description>
${categories}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(brand(lng))} — ${esc(channel.title)}</title>
    <link>${blogUrl}</link>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
    <description>${esc(channel.description)}</description>
    <language>${lng}</language>
    <managingEditor>${CONTACT_EMAIL} (${esc(brand(lng))})</managingEditor>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
