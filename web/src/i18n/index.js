// Server-side translation helpers (React Server Components / layouts).
//
// Self-contained: no i18next runtime. The translation bundle is plain data
// (`{ section: { ar, en } }`); we flatten it to the active language and expose a
// `t(section, { returnObjects })` accessor with the same shape the client hook
// uses, so server and client components read translations identically.
//
// NOTE: this module imports `next/headers` and is therefore SERVER-ONLY. The
// pure flatten/accessor helpers live in ./resources.js so client code can reuse
// them without pulling in server-only APIs.

import { cookies } from "next/headers";
import { cookieName, fallbackLng, languages } from "./settings.js";
import translation from "./locales/translation.js";
import { getLanguageResources, makeT } from "./resources.js";

export { getLanguageResources, makeT };

export async function getTranslation() {
  const cookieStore = await cookies();
  const cookieLng = cookieStore.get(cookieName)?.value;
  const lng = languages.includes(cookieLng) ? cookieLng : fallbackLng;

  const resources = getLanguageResources(translation, lng);

  return {
    t: makeT(resources),
    lng,
  };
}
