import ServicesPage from '@/features/services/pages/ServicesPage.jsx';
import JsonLd from '@/shared/components/seo/JsonLd.jsx';
import { buildMetadata, serviceCourseListSchema } from '@/shared/lib/seo';
import { getServicePageText, services } from '@/features/services/data.js';

export async function generateMetadata({ params }) {
  const { lng } = await params;
  const text = getServicePageText(lng);
  return buildMetadata({
    lng,
    path: '/services',
    title: text.indexTitle,
    description: text.indexDescription,
  });
}

export default async function ServicesRoute({ params }) {
  const { lng } = await params;
  const language = lng === 'en' ? 'en' : 'ar';
  return (
    <>
      <JsonLd data={serviceCourseListSchema({ services, lng: language })} />
      <ServicesPage lng={language} />
    </>
  );
}
