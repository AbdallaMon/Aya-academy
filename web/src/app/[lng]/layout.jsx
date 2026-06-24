import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import '../globals.css';
import 'react-toastify/dist/ReactToastify.css';
import ThemeTogglerProvider from '@/providers/ThemeToggler';
import AppProviders from '@/providers/AppProviders.jsx';
import WhatsAppButton from '@/shared/components/feedback/WhatsAppButton.jsx';
import { languages, getDirection } from '@/i18n/settings.js';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Aya Academy',
  description: 'Quran learning platform for kids',
};

export function generateStaticParams() {
  return languages.map((lng) => ({ lng }));
}

// Root layout for every page. The active locale comes from the [lng] URL
// segment (Arabic default, RTL). Light/dark mode is read from the cookie for a
// flash-free first paint; the client ThemeToggler takes over after hydration.
export default async function LocaleLayout({ children, params }) {
  const { lng } = await params;
  if (!languages.includes(lng)) notFound();

  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme');
  const pageTheme = themeCookie?.value === 'dark' ? 'dark' : 'light';
  const dir = getDirection(lng);

  return (
    <html lang={lng} dir={dir} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeTogglerProvider defaultTheme={pageTheme}>
          {/* AppProviders: i18n -> theme(RTL cache) -> dates -> auth -> toast */}
          <AppProviders lng={lng} mode={pageTheme}>
            {children}
            <WhatsAppButton />
          </AppProviders>
        </ThemeTogglerProvider>
      </body>
    </html>
  );
}
