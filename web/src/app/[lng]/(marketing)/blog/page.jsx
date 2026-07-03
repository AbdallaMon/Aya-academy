import { BlogList } from '@/features/blog';
import JsonLd from '@/shared/components/seo/JsonLd.jsx';
import { buildMetadata, breadcrumbSchema, SITE_URL, getSeo } from '@/shared/lib/seo';
import { localePath } from '@/i18n/routing.js';

export async function generateMetadata({ params }) {
  const { lng } = await params;
  const meta = buildMetadata({ lng, page: 'blog', path: '/blog' });
  // Advertise the RSS feed so readers/browsers can auto-discover it.
  return {
    ...meta,
    alternates: {
      ...meta.alternates,
      types: { 'application/rss+xml': `${SITE_URL}/rss.xml` },
    },
  };
}

export default async function BlogIndexRoute({ params }) {
  const { lng } = await params;
  const abs = (path) => `${SITE_URL}${localePath(lng, path)}`;
  const breadcrumb = breadcrumbSchema([
    { name: lng === 'en' ? 'Home' : 'الرئيسية', url: abs('/') },
    { name: getSeo('blog', lng)?.title || (lng === 'en' ? 'Blog' : 'المدوّنة'), url: abs('/blog') },
  ]);
  return (
    <>
      <JsonLd data={breadcrumb} />
      <BlogList />
    </>
  );
}
