import { notFound } from 'next/navigation';
import { BlogArticle, articleSlugs, getArticle } from '@/features/blog';
import { buildMetadata } from '@/shared/lib/seo';

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

  const pickL = (f) => (f ? f[lng] || f.ar : undefined);
  return buildMetadata({
    lng,
    page: 'blog',
    path: `/blog/${slug}`,
    title: pickL(article.title),
    description: pickL(article.description),
    keywords: (article.tags || []).map((t) => pickL(t)).filter(Boolean),
  });
}

export default async function BlogArticleRoute({ params }) {
  const { slug } = await params;
  if (!getArticle(slug)) notFound();
  return <BlogArticle slug={slug} />;
}
