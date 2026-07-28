import AboutPage from '@/features/about/pages/AboutPage.jsx';
import JsonLd from '@/shared/components/seo/JsonLd.jsx';
import { breadcrumbSchema, buildMetadata, SITE_URL } from '@/shared/lib/seo';
import { localePath } from '@/i18n/routing.js';
import { getAboutContent } from '@/features/about/data.js';

export async function generateMetadata({ params }) {
  const { lng } = await params;
  const content = getAboutContent(lng);
  return buildMetadata({
    lng,
    path: '/about',
    title: content.metaTitle,
    description: content.metaDescription,
    keywords: content.keywords,
  });
}

export default async function AboutRoute({ params }) {
  const { lng } = await params;
  const language = lng === 'en' ? 'en' : 'ar';
  const content = getAboutContent(language);
  const absolute = (path) => `${SITE_URL}${localePath(language, path)}`;

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: language === 'en' ? 'Home' : 'الرئيسية', url: absolute('/') },
        { name: content.title, url: absolute('/about') },
      ])} />
      <AboutPage lng={language} />
    </>
  );
}
