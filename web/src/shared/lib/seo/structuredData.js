// JSON-LD structured data builders. Pure + isomorphic (no React) so they can be
// called from server components (layout/page) and serialized into a
// <script type="application/ld+json"> tag via the <JsonLd> component.
//
// We emit ONLY data that is true and visible on the page:
//   - EducationalOrganization : who Aya Academy is (site-wide)
//   - WebSite                 : the site itself + its languages (site-wide)
//   - FAQPage                 : mirrors the visible FAQ accordion on the homepage
// We deliberately do NOT emit Review/AggregateRating — the on-page reviews are
// illustrative marketing copy, and fabricated review markup violates Google's
// guidelines. Add it later only when backed by real, verifiable reviews.

import { localePath } from "@/i18n/routing.js";
import { languages } from "@/i18n/settings.js";
import { SITE_URL, brand } from "./config.js";

const DESCRIPTION = {
  ar: "أكاديمية آية — رحلة مرحة وآمنة لتعليم الأطفال (٥–١٤ سنة) القرآن الكريم والأخلاق الجميلة عبر حصص تفاعلية وألعاب تعليمية ومتابعة لولي الأمر.",
  en: "Aya Academy — a joyful, safe journey for kids (ages 5–14) to learn the Quran and beautiful manners through interactive sessions, educational games and parent tracking.",
};

// A stable @id for the organization so other nodes can reference it.
const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationSchema(lng) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": ORG_ID,
    name: brand(lng),
    alternateName: lng === "en" ? "أكاديمية آية" : "Aya Academy",
    url: `${SITE_URL}${localePath(lng, "/")}`,
    logo: `${SITE_URL}/logos/logo.png`,
    image: `${SITE_URL}/og.png`,
    description: DESCRIPTION[lng === "en" ? "en" : "ar"],
    email: "hello@aya.academy",
    inLanguage: languages,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "hello@aya.academy",
      availableLanguage: ["Arabic", "English"],
    },
  };
}

export function websiteSchema(lng) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: brand(lng),
    url: `${SITE_URL}${localePath(lng, "/")}`,
    inLanguage: languages,
    publisher: { "@id": ORG_ID },
  };
}

// Build a FAQPage node from the SAME { items: [{ q, a }] } the visible FAQ renders.
export function faqSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}
