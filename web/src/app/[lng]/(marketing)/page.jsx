import { Suspense } from 'react';
import { cookies } from 'next/headers';
import Hero from '@/features/hero/pages/HeroPage.jsx';
import HeroReviews from '@/features/reviews/pages/HeroReviews';
import { WhyAya } from '@/features/whyAya/pages/WhyAyaPage.jsx';
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
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme');
  const pageTheme = themeCookie?.value === 'dark' ? 'dark' : 'light';
  // FAQPage structured data — mirrors the visible FAQ accordion (same source).
  const faq = getFaq(lng);
  return (
    <>
      {/* FAQPage mirrors the visible accordion; Course describes the program. */}
      <JsonLd data={[faqSchema(faq.items), courseSchema(lng)]} />
      <Hero pageTheme={pageTheme} />
      <HeroReviews pageTheme={pageTheme} />
      <WhyAya />
      <Programs />
      <ChildDashboardHome />
      <Testimonials />
      <SafetyStrip />
      <Suspense>
        <PricingSection />
      </Suspense>
      <FAQ pageTheme={pageTheme} />
      <FreeSessionPromo />
    </>
  );
}
