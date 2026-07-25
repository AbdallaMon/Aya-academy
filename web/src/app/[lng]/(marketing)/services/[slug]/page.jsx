import { notFound } from 'next/navigation';
import ServiceDetailsPage from '@/features/services/pages/ServiceDetailsPage.jsx';
import JsonLd from '@/shared/components/seo/JsonLd.jsx';
import { breadcrumbSchema, buildMetadata, SITE_URL } from '@/shared/lib/seo';
import { getService, getServicePageText, services, serviceText } from '@/features/services/data.js';
import { localePath } from '@/i18n/routing.js';

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { lng, slug } = await params;
  const service = getService(slug);
  if (!service) return buildMetadata({ lng, path: '/services', index: false });
  const copy = serviceText(service, lng);
  return buildMetadata({
    lng,
    path: `/services/${slug}`,
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
    image: `/og/services/${slug}-${lng === 'en' ? 'en' : 'ar'}.png`,
  });
}

export default async function ServiceDetailsRoute({ params }) {
  const { lng, slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const language = lng === 'en' ? 'en' : 'ar';
  const text = getServicePageText(language);
  const copy = serviceText(service, language);
  const absolute = (path) => `${SITE_URL}${localePath(language, path)}`;

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: language === 'en' ? 'Home' : 'الرئيسية', url: absolute('/') },
        { name: text.backToServices, url: absolute('/services') },
        { name: copy.title, url: absolute(`/services/${slug}`) },
      ])} />
      <ServiceDetailsPage lng={language} service={service} />
    </>
  );
}
