import { BlogList } from '@/features/blog';
import { buildMetadata, SITE_URL } from '@/shared/lib/seo';

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

export default function BlogIndexRoute() {
  return <BlogList />;
}
