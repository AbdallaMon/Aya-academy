'use client';

// Language switch — minimal text button (portfolio style). Shows the language
// you'll switch TO and navigates to the same page under the other locale prefix
// (/ar ↔ /en). The cookie + i18n context flip immediately so direction updates
// without a full reload.

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@mui/material';
import { TbWorld } from 'react-icons/tb';
import { useTranslation } from '@/i18n/client.js';
import { swapLocale } from '@/i18n/routing.js';

// The label is the TARGET language's native name.
const TARGET_LABEL = { ar: 'العربية', en: 'English' };

export function LanguageSwitch({ size = 'small' }) {
  const router = useRouter();
  const pathname = usePathname();
  const { lng, changeLanguage } = useTranslation();

  const other = lng === 'ar' ? 'en' : 'ar';
  const href = swapLocale(pathname, other);

  const go = (event) => {
    changeLanguage(other); // flips dir + cookie immediately
    // Read the query only inside the click handler. `useSearchParams` would make
    // every public page bail out of static rendering merely because the switch
    // appears in the shared navbar/footer.
    const query = typeof window === 'undefined' ? '' : window.location.search;
    if (query) {
      event.preventDefault();
      router.push(`${href}${query}`);
    }
  };

  return (
    <Button
      component={Link}
      href={href}
      onClick={go}
      size={size}
      color="inherit"
      startIcon={<TbWorld size={16} />}
      aria-label={`Switch language to ${TARGET_LABEL[other]}`}
      sx={{ minWidth: 0, fontWeight: 700, color: 'text.primary' }}
    >
      {TARGET_LABEL[other]}
    </Button>
  );
}

export default LanguageSwitch;
