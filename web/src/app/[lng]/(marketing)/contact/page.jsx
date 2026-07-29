import ContactPage from '@/features/contact/pages/ContactPage.jsx';
import { getContactContent } from '@/features/contact/data.js';
import JsonLd from '@/shared/components/seo/JsonLd.jsx';
import { breadcrumbSchema, buildMetadata, SITE_URL } from '@/shared/lib/seo';
import { localePath } from '@/i18n/routing.js';

export async function generateMetadata({ params }) {
  const { lng } = await params;
  const content = getContactContent(lng);
  return buildMetadata({
    lng,
    path: '/contact',
    title: content.metaTitle,
    description: content.metaDescription,
  });
}

export default async function ContactRoute({ params }) {
  const { lng } = await params;
  const language = lng === 'en' ? 'en' : 'ar';
  const content = getContactContent(language);
  const absolute = (path) => `${SITE_URL}${localePath(language, path)}`;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: language === 'en' ? 'Home' : 'الرئيسية', url: absolute('/') },
          { name: content.eyebrow, url: absolute('/contact') },
        ])}
      />
      <ContactPage lng={language} />
    </>
  );
}
