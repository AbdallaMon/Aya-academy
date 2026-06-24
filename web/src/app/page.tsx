import { redirect } from 'next/navigation';
import { fallbackLng } from '@/i18n/settings.js';

// The real site is locale-prefixed under /[lng]. Send the bare "/" route to the
// default locale (Arabic). All page content lives in app/[lng]/(marketing).
export default function RootIndex() {
  redirect(`/${fallbackLng}`);
}
