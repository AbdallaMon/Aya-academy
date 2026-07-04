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
  ar: "أكاديمية آية — رحلة مرحة وآمنة لتعليم الأطفال (من ٥ سنوات فأكثر) القرآن الكريم والأخلاق الجميلة عبر حصص تفاعلية وألعاب تعليمية ومتابعة لولي الأمر.",
  en: "Aya Academy — a joyful, safe journey for kids (ages 5 and up) to learn the Quran and beautiful manners through interactive sessions, educational games and parent tracking.",
};

// A stable @id for the organization so other nodes can reference it.
const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const COURSE_ID = `${SITE_URL}/#course`;

const CONTACT_EMAIL = "info@ayah.academy";
// The same WhatsApp line the site exposes (see WhatsAppButton) — a verifiable
// contact number strengthens the entity in Google's Knowledge Graph.
const CONTACT_PHONE = "+966582509655";

// Topics the academy is authoritative about — reinforces the site's subject to
// search engines (semantic keywords, not stuffing). Bilingual so each locale's
// graph reads naturally.
const KNOWS_ABOUT = {
  ar: [
    "تعليم القرآن الكريم للأطفال",
    "تحفيظ القرآن",
    "التجويد",
    "اللغة العربية للأطفال",
    "الدراسات الإسلامية للأطفال",
    "الأخلاق الإسلامية",
    "الأدعية والأذكار",
    "التربية الإسلامية للأطفال",
  ],
  en: [
    "Quran education for children",
    "Quran memorization",
    "Tajweed",
    "Arabic language for children",
    "Islamic studies for children",
    "Islamic manners",
    "Duas and dhikr",
    "Islamic parenting",
  ],
};

export function organizationSchema(lng) {
  const isEn = lng === "en";
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": ORG_ID,
    name: brand(lng),
    alternateName: isEn ? "أكاديمية آية" : "Aya Academy",
    url: `${SITE_URL}${localePath(lng, "/")}`,
    logo: `${SITE_URL}/logos/logo.png`,
    image: `${SITE_URL}/og.png`,
    description: DESCRIPTION[isEn ? "en" : "ar"],
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE,
    inLanguage: languages,
    // Online academy — serves Arabic/English-speaking families anywhere.
    areaServed: "Worldwide",
    knowsAbout: KNOWS_ABOUT[isEn ? "en" : "ar"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTACT_EMAIL,
      telephone: CONTACT_PHONE,
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

const COURSE = {
  ar: {
    name: "برنامج تعليم القرآن والأخلاق للأطفال أونلاين",
    teaches: [
      "حفظ القرآن الكريم",
      "التلاوة والتجويد",
      "اللغة العربية",
      "الدراسات الإسلامية",
      "الأخلاق والآداب الإسلامية",
      "الأدعية والأذكار",
    ],
    audience: "الأطفال من ٥ سنوات فأكثر",
  },
  en: {
    name: "Online Quran & Manners Program for Kids",
    teaches: [
      "Quran memorization",
      "Recitation & Tajweed",
      "Arabic language",
      "Islamic studies",
      "Islamic manners & etiquette",
      "Duas & dhikr",
    ],
    audience: "Children aged 5 and up",
  },
};

// Course node — describes the academy's core offering (a real, on-page program:
// interactive Quran + manners classes for kids). Reinforces topical relevance and
// makes the site eligible for Course understanding. We deliberately omit priced
// `offers` (plan prices are dynamic) — the free trial is signalled instead.
export function courseSchema(lng) {
  const c = COURSE[lng === "en" ? "en" : "ar"];
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": COURSE_ID,
    name: c.name,
    description: DESCRIPTION[lng === "en" ? "en" : "ar"],
    url: `${SITE_URL}${localePath(lng, "/")}`,
    inLanguage: languages,
    provider: { "@id": ORG_ID },
    teaches: c.teaches,
    educationalLevel: "beginner",
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
      audienceType: c.audience,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      // One-hour live sessions (matches the FAQ answer).
      courseWorkload: "PT1H",
      inLanguage: languages,
    },
  };
}

// BreadcrumbList from an ordered [{ name, url }]. `url` should be absolute.
export function breadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.url ? { item: it.url } : {}),
    })),
  };
}

// BlogPosting for a single article. Authored + published by the academy itself
// (the blog has no per-author byline). `url` must be the absolute canonical URL;
// `image` the absolute cover/share image.
export function articleSchema({
  lng,
  url,
  title,
  description,
  datePublished,
  dateModified,
  image,
  keywords,
} = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: title,
    description,
    inLanguage: lng === "en" ? "en" : "ar",
    ...(datePublished ? { datePublished } : {}),
    dateModified: dateModified || datePublished,
    image: image ? [image] : [`${SITE_URL}/og.png`],
    ...(keywords && keywords.length ? { keywords: keywords.join(", ") } : {}),
    author: { "@type": "Organization", "@id": ORG_ID, name: brand(lng) },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
  };
}
