import { permanentRedirect } from 'next/navigation';
import { defaultLng } from '@/i18n/settings.js';

// The real site is locale-prefixed under /[lng]. Send the bare "/" route to the
// default locale (English). All page content lives in app/[lng]/(marketing).
export default function RootIndex() {
  permanentRedirect(`/${defaultLng}`);
}
