import { notFound } from 'next/navigation';
import ServiceDetailsPage from '@/features/services/pages/ServiceDetailsPage.jsx';
import ProgramFamilyPage from '@/features/services/pages/ProgramFamilyPage.jsx';
import JsonLd from '@/shared/components/seo/JsonLd.jsx';
import {
  breadcrumbSchema,
  buildMetadata,
  faqSchema,
  programFamilyCollectionSchema,
  serviceCourseSchema,
  SITE_URL,
} from '@/shared/lib/seo';
import {
  getProgramFamily,
  getService,
  getServicePageText,
  programFamilies,
  programFamilyText,
  services,
  serviceText,
} from '@/features/services/data.js';
import { localePath } from '@/i18n/routing.js';

export function generateStaticParams() {
  return [
    ...programFamilies.map((family) => ({ slug: family.slug })),
    ...services.map((service) => ({ slug: service.slug })),
  ];
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { lng, slug } = await params;
  const language = lng === 'en' ? 'en' : 'ar';
  const family = getProgramFamily(slug);
  if (family) {
    const copy = programFamilyText(family, language);
    return buildMetadata({
      lng: language,
      path: `/services/${family.slug}`,
      title: copy.metaTitle,
      description: copy.metaDescription,
      image: `/og/services/${family.slug}-${language}.png`,
    });
  }

  const service = getService(slug);
  if (!service) return buildMetadata({ lng, path: '/services', index: false });
  const copy = serviceText(service, language);
  return buildMetadata({
    lng: language,
    path: `/services/${slug}`,
    title: copy.title,
    description: copy.description,
    image: `/og/services/${slug}-${language}.png`,
  });
}

export default async function ServiceDetailsRoute({ params }) {
  const { lng, slug } = await params;
  const language = lng === 'en' ? 'en' : 'ar';
  const text = getServicePageText(language);
  const absolute = (path) => `${SITE_URL}${localePath(language, path)}`;

  const family = getProgramFamily(slug);
  if (family) {
    const copy = programFamilyText(family, language);
    const familyServices = services.filter((service) => family.serviceKeys.includes(service.key));
    const structuredData = [
      breadcrumbSchema([
        { name: language === 'en' ? 'Home' : 'الرئيسية', url: absolute('/') },
        { name: text.backToServices, url: absolute('/services') },
        { name: copy.title, url: absolute(`/services/${family.slug}`) },
      ]),
      programFamilyCollectionSchema({ family, services: familyServices, lng: language }),
      faqSchema(copy.faqs),
    ];

    return (
      <>
        <JsonLd data={structuredData} />
        <ProgramFamilyPage lng={language} family={family} services={familyServices} />
      </>
    );
  }

  const service = getService(slug);
  if (!service) notFound();
  const copy = serviceText(service, language);
  const structuredData = [
    breadcrumbSchema([
      { name: language === 'en' ? 'Home' : 'الرئيسية', url: absolute('/') },
      { name: text.backToServices, url: absolute('/services') },
      { name: copy.title, url: absolute(`/services/${slug}`) },
    ]),
    serviceCourseSchema({ service, lng: language }),
    ...(copy.faqs?.length ? [faqSchema(copy.faqs)] : []),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <ServiceDetailsPage lng={language} service={service} />
    </>
  );
}
