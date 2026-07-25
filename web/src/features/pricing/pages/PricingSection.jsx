import Section from '@/shared/ui/sections/Section.jsx';
import { pricingText } from '../config/pricingText.js';
import PricingPlansClient from '../components/PricingPlansClient.jsx';

// The SEO-visible heading and section shell render on the server. Fetching live
// plan prices and retrying failed requests stay in a focused client island.
export default function PricingSection({ lng = 'en' }) {
  const language = lng === 'en' ? 'en' : 'ar';
  const text = pricingText[language];

  return (
    <Section
      id="pricing"
      alt
      eyebrow={text.eyebrow}
      title={text.title}
      subtitle={text.subtitle}
    >
      <PricingPlansClient lng={language} />
    </Section>
  );
}
