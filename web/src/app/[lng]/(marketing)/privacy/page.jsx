import LegalPage from '@/features/legal/pages/LegalPage.jsx';
import { getLegalContent } from '@/features/legal/data.js';
import JsonLd from '@/shared/components/seo/JsonLd.jsx';
import { breadcrumbSchema, buildMetadata, SITE_URL } from '@/shared/lib/seo';
import { localePath } from '@/i18n/routing.js';

export async function generateMetadata({ params }) {
  const { lng } = await params;
  const content = getLegalContent('privacy', lng);
  return buildMetadata({
    lng,
    path: '/privacy',
    title: content.metaTitle,
    description: content.metaDescription,
  });
}

export default async function PrivacyRoute({ params }) {
  const { lng } = await params;
  const language = lng === 'en' ? 'en' : 'ar';
  const content = getLegalContent('privacy', language);
  const absolute = (path) => `${SITE_URL}${localePath(language, path)}`;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: language === 'en' ? 'Home' : 'الرئيسية', url: absolute('/') },
          { name: content.title, url: absolute('/privacy') },
        ])}
      />
      <LegalPage type="privacy" lng={language} />
    </>
  );
}
