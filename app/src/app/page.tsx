import Hero from '@/features/hero';
import HowItWorks from '@/features/howItWorks';
import { Levels } from '@/features/Levels';
import HeroReviews from '@/features/reviews/HeroReviews';
import { PageTheme } from '@/shared/types/general';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme');
  const pageTheme: PageTheme = themeCookie?.value === 'dark' ? 'dark' : 'light';
  return (
    <>
      <Hero pageTheme={pageTheme} />
      <HeroReviews pageTheme={pageTheme} />
      <HowItWorks pageTheme={pageTheme} />
      <Levels pageTheme={pageTheme} />
    </>
  );
}
