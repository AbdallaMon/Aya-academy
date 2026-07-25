import ServicesPage from '@/features/services/pages/ServicesPage.jsx';
import { buildMetadata } from '@/shared/lib/seo';
import { getServicePageText } from '@/features/services/data.js';

export async function generateMetadata({ params }) {
  const { lng } = await params;
  const text = getServicePageText(lng);
  return buildMetadata({
    lng,
    path: '/services',
    title: text.indexTitle,
    description: text.indexDescription,
    keywords: lng === 'en'
      ? ['online Quran classes', 'online Arabic classes', 'Islamic studies online']
      : ['تعليم القرآن أونلاين', 'تعليم العربية أونلاين', 'الدراسات الإسلامية أونلاين'],
  });
}

export default async function ServicesRoute({ params }) {
  const { lng } = await params;
  return <ServicesPage lng={lng} />;
}
