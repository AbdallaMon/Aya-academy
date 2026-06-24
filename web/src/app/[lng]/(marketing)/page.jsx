import { Suspense } from 'react';
import { cookies } from 'next/headers';
import Hero from '@/features/hero';
import HowItWorks from '@/features/howItWorks';
import { Levels } from '@/features/Levels';
import { WhyAyah } from '@/features/whyAyah/WhyAyah';
import { ChildDashboardHome } from '@/features/childDashboard';
import HeroReviews from '@/features/reviews/HeroReviews';
import Testimonials from '@/features/reviews/Testimonials.jsx';
import Teachers from '@/features/teachers/Teachers.jsx';
import FAQ from '@/features/faq/FAQ.jsx';
import FreeSessionPromo from '@/features/promo/FreeSessionPromo.jsx';
import { About } from '@/features/about';
import PricingSection from '@/features/pricing/PricingSection.jsx';

// Homepage funnel ordered for the PARENT (the decision-maker):
// hook → instant trust → who we are → how/levels/why → parent value →
// teachers & social proof → objections (FAQ) → price → closing free-trial CTA.
export default async function Home() {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme');
  const pageTheme = themeCookie?.value === 'dark' ? 'dark' : 'light';
  return (
    <>
      <Hero pageTheme={pageTheme} />
      <HeroReviews pageTheme={pageTheme} />
      <About pageTheme={pageTheme} />
      <HowItWorks pageTheme={pageTheme} />
      <Levels pageTheme={pageTheme} />
      <WhyAyah pageTheme={pageTheme} />
      <ChildDashboardHome pageTheme={pageTheme} />
      <Teachers pageTheme={pageTheme} />
      <Testimonials />
      <FAQ pageTheme={pageTheme} />
      <Suspense>
        <PricingSection />
      </Suspense>
      <FreeSessionPromo />
    </>
  );
}
