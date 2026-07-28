import { notFound } from 'next/navigation';
import { BlogArticle, articleSlugs, getArticle } from '@/features/blog';
import JsonLd from '@/shared/components/seo/JsonLd.jsx';
import {
  buildMetadata,
  articleSchema,
  breadcrumbSchema,
  SITE_URL,
  getSeo,
} from '@/shared/lib/seo';
import { localePath } from '@/i18n/routing.js';

const pickL = (f, lng) => (f ? f[lng] || f.ar : undefined);
const abs = (lng, path) => `${SITE_URL}${localePath(lng, path)}`;

// The set of articles is finite and known at build time (data-driven, no CMS),
// so we pre-render each slug and reject anything else.
export function generateStaticParams() {
  return articleSlugs.map((slug) => ({ slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { lng, slug } = await params;
  const article = getArticle(slug);
  if (!article) return buildMetadata({ lng, page: 'blog', path: '/blog' });

  const metadata = buildMetadata({
    lng,
    page: 'blog',
    path: `/blog/${slug}`,
    title: pickL(article.title, lng),
    description: pickL(article.description, lng),
    image: `/og/blog/${slug}-${lng === 'en' ? 'en' : 'ar'}.png`,
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: 'article',
      publishedTime: article.datePublished,
      modifiedTime: article.dateModified || article.datePublished,
      authors: [lng === 'en' ? 'Ayah Academy' : 'أكاديمية آية'],
    },
  };
}

export default async function BlogArticleRoute({ params }) {
  const { lng, slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const language = lng === 'en' ? 'en' : 'ar';
  const url = abs(lng, `/blog/${slug}`);
  const blogLabel = getSeo('blog', lng)?.title || (lng === 'en' ? 'Blog' : 'المدوّنة');
  const jsonLd = [
    articleSchema({
      lng,
      url,
      title: pickL(article.title, lng),
      description: pickL(article.description, lng),
      datePublished: article.datePublished,
      dateModified: article.dateModified || article.datePublished,
      image: `${SITE_URL}/og/blog/${slug}-${language}.png`,
      keywords: (article.tags || []).map((t) => pickL(t, lng)).filter(Boolean),
    }),
    breadcrumbSchema([
      { name: lng === 'en' ? 'Home' : 'الرئيسية', url: abs(lng, '/') },
      { name: blogLabel, url: abs(lng, '/blog') },
      { name: pickL(article.title, lng), url },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <BlogArticle slug={slug} />
    </>
  );
}
