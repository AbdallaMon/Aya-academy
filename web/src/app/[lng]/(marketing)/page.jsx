import { Suspense } from 'react';
import Hero from '@/features/hero/pages/HeroPage.jsx';
import HeroReviews from '@/features/reviews/pages/HeroReviews';
import { WhyAyah } from '@/features/whyAyah/pages/WhyAyahPage.jsx';
import { Programs } from '@/features/programs/pages/ProgramsPage.jsx';
import { ChildDashboardHome } from '@/features/childDashboard/pages/ChildDashboardPage.jsx';
import PricingSection from '@/features/pricing/pages/PricingSection.jsx';
import Testimonials from '@/features/reviews/pages/Testimonials.jsx';
import SafetyStrip from '@/features/trust/pages/SafetyStrip.jsx';
import FAQ from '@/features/faq/pages/FAQ.jsx';
import FreeSessionPromo from '@/features/promo/pages/FreeSessionPromo.jsx';
import JsonLd from '@/shared/components/seo/JsonLd.jsx';
import { buildMetadata, faqSchema, courseSchema } from '@/shared/lib/seo';
import { getFaq } from '@/features/faq/faqData.js';

export async function generateMetadata({ params }) {
  const { lng } = await params;
  return buildMetadata({ lng, page: 'home', path: '/' });
}

// Lean funnel ordered for the PARENT (the decision-maker):
// hook (hero) → instant trust → who we are / how / levels (one merged section) →
// honest product preview → social proof (real student video + reviews) →
// safety reassurance (who teaches / is it safe) → plans → objections (FAQ) →
// closing free-trial CTA.
// Proof sits BEFORE pricing on purpose (the real student video is the emotional
// peak), and the safety strip lands right before the price to clear the parent's
// biggest objection at the moment of decision.
export default async function Home({ params }) {
  const { lng } = await params;
  // FAQPage structured data — mirrors the visible FAQ accordion (same source).
  const faq = getFaq(lng);
  return (
    <>
      {/* FAQPage mirrors the visible accordion; Course describes the program. */}
      <JsonLd data={[faqSchema(faq.items), courseSchema(lng)]} />
      <Hero lng={lng} />
      <HeroReviews lng={lng} />
      <WhyAyah lng={lng} />
      <Programs lng={lng} />
      <ChildDashboardHome lng={lng} />
      <Testimonials lng={lng} />
      <SafetyStrip lng={lng} />
      <Suspense>
        <PricingSection lng={lng} />
      </Suspense>
      <FAQ lng={lng} />
      <FreeSessionPromo lng={lng} />
    </>
  );
}
